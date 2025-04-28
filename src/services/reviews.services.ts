import { ObjectId } from 'mongodb';
import databaseService from './database.services';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { OrderStatus, ReviewStatus } from '~/constants/enums';
import Review from '~/models/schemas/Review.schema';
import { setProductStats, getProductStats, setShopStats, getShopStats, redisConnected } from './redis.services';
import { IUpsertReview } from '~/models/requests/reviews.requests';
import { ORDERS_MESSAGES, PRODUCTS_MESSAGES, REVIEWS_MESSAGES, SHOP_MESSAGES, USERS_MESSAGES } from '~/constants/messages';

// Define ratings index signature interface
interface RatingCounts {
    [key: number]: number;
}

class ReviewService {
    async createReview(userId: string, reviewData: IUpsertReview) {
        const { order_id, product_id, rating, comment, media, is_anonymous } = reviewData;

        // Kiểm tra đơn hàng
        const order = await databaseService.orders.findOne({ _id: new ObjectId(order_id) });
        if (!order) {
            throw new ErrorWithStatus({
                message: ORDERS_MESSAGES.ORDER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }
        if (order.order_status !== OrderStatus.Delivered) {
            throw new ErrorWithStatus({
                message: ORDERS_MESSAGES.ORDER_NOT_DELIVERED,
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }
        if (order.order_userId.toString() !== userId) {
            throw new ErrorWithStatus({
                message: 'You are not authorized to create review for this order',
                status: HTTP_STATUS.FORBIDDEN,
            });
        }

        // Kiểm tra sản phẩm
        const product = await databaseService.products.findOne({ _id: new ObjectId(product_id) });
        if (!product) {
            throw new ErrorWithStatus({
                message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Kiểm tra xem sản phẩm có trong đơn hàng không
        const productExists = order.order_products.some((shop: any) =>
            shop.item_products.some(
                (item: any) => item.productId.toString() === product_id
            )
        );
        if (!productExists) {
            throw new ErrorWithStatus({
                message: 'Product not found in this order',
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        // Tạo đánh giá mới
        const newReview = await databaseService.reviews.insertOne(
            new Review({
                user_id: new ObjectId(userId),
                product_id: new ObjectId(product_id),
                order_id: new ObjectId(order_id),
                shop_id: product.product_shop,
                rating,
                comment,
                media: media?.map(url => ({ type: url.includes('.mp4') ? 'video' : 'image', url })) || [],
                is_anonymous,
                status: ReviewStatus.Pending,
            })
        );

        return {
            _id: newReview.insertedId,
            ...reviewData,
        };
    }

    async updateStatsAfterReview(reviewId: string) {
        const review = await databaseService.reviews.findOne({ _id: new ObjectId(reviewId) });
        if (!review || review.status !== ReviewStatus.Approved) return;

        const productId = review.product_id;
        const shopId = review.shop_id;

        // Cập nhật thống kê cho Product
        const productReviews = await databaseService.reviews
            .find({ product_id: productId, status: ReviewStatus.Approved })
            .toArray();

        const totalReviews = productReviews.length;
        const averageRating = totalReviews > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
        const reviewsByRating: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        productReviews.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) {
                reviewsByRating[r.rating] = (reviewsByRating[r.rating] || 0) + 1;
            } else {
                console.warn(`Invalid rating value ${r.rating} for review ${r._id}`);
            }
        });
        const reviewsWithMedia = productReviews.filter((r) => r.media && r.media.length > 0).length;
        const totalMediaCount = productReviews.reduce((sum, r) => sum + (r.media ? r.media.length : 0), 0);

        // Cập nhật MongoDB
        await databaseService.products.updateOne(
            { _id: productId },
            {
                $set: {
                    product_ratingsAverage: averageRating,
                    total_reviews: totalReviews,
                    reviews_by_rating: reviewsByRating,
                    reviews_with_media: reviewsWithMedia,
                    total_media_count: totalMediaCount,
                },
            }
        );

        // Cập nhật Redis nếu khả dụng
        if (redisConnected) {
            try {
                await setProductStats(productId.toString(), {
                    total_reviews: totalReviews.toString(),
                    'reviews_by_rating:5': reviewsByRating[5].toString(),
                    'reviews_by_rating:4': reviewsByRating[4].toString(),
                    'reviews_by_rating:3': reviewsByRating[3].toString(),
                    'reviews_by_rating:2': reviewsByRating[2].toString(),
                    'reviews_by_rating:1': reviewsByRating[1].toString(),
                    reviews_with_media: reviewsWithMedia.toString(),
                    total_media_count: totalMediaCount.toString(),
                });
            } catch (err) {
                console.error(`Failed to update Redis stats for product ${productId}:`, err);
            }
        }

        // Cập nhật thống kê cho Shop
        const shopReviews = await databaseService.reviews
            .find({ shop_id: shopId, status: ReviewStatus.Approved })
            .toArray();

        const shopTotalReviews = shopReviews.length;
        const shopAverageRating =
            shopTotalReviews > 0 ? shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopTotalReviews : 0;
        const shopReviewsByRating: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        shopReviews.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) {
                shopReviewsByRating[r.rating] = (shopReviewsByRating[r.rating] || 0) + 1;
            } else {
                console.warn(`Invalid rating value ${r.rating} for review ${r._id}`);
            }
        });
        const shopReviewsWithMedia = shopReviews.filter((r) => r.media && r.media.length > 0).length;
        const shopTotalMediaCount = shopReviews.reduce((sum, r) => sum + (r.media ? r.media.length : 0), 0);

        // Cập nhật MongoDB
        await databaseService.shops.updateOne(
            { _id: shopId },
            {
                $set: {
                    shop_rating: shopAverageRating,
                    total_reviews: shopTotalReviews,
                    reviews_by_rating: shopReviewsByRating,
                    reviews_with_media: shopReviewsWithMedia,
                    total_media_count: shopTotalMediaCount,
                },
            }
        );

        // Cập nhật Redis nếu khả dụng
        if (redisConnected) {
            try {
                await setShopStats(shopId.toString(), {
                    total_reviews: shopTotalReviews.toString(),
                    shop_rating: shopAverageRating.toString(),
                    'reviews_by_rating:5': shopReviewsByRating[5].toString(),
                    'reviews_by_rating:4': shopReviewsByRating[4].toString(),
                    'reviews_by_rating:3': shopReviewsByRating[3].toString(),
                    'reviews_by_rating:2': shopReviewsByRating[2].toString(),
                    'reviews_by_rating:1': shopReviewsByRating[1].toString(),
                    reviews_with_media: shopReviewsWithMedia.toString(),
                    total_media_count: shopTotalMediaCount.toString(),
                });
            } catch (err) {
                console.error(`Failed to update Redis stats for shop ${shopId}:`, err);
            }
        }
    }

    async getReviews(productId: string, query: any) {
        const { rating, hasMedia, page = 1, limit = 10 } = query;

        let stats;
        if (redisConnected) {
            // Trường hợp 1: Redis cache khả dụng
            stats = await getProductStats(productId);
            if (!stats) {
                // Cache miss: Lấy từ MongoDB và cache lại
                const product = await databaseService.products.findOne({ _id: new ObjectId(productId) });
                if (!product) {
                    throw new ErrorWithStatus({
                        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
                        status: HTTP_STATUS.NOT_FOUND,
                    });
                }
                stats = {
                    total_reviews: product.total_reviews || 0,
                    average_rating: product.product_ratingsAverage || 0,
                    reviews_by_rating: product.reviews_by_rating || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    reviews_with_media: product.reviews_with_media || 0,
                    total_media_count: product.total_media_count || 0,
                };
                try {
                    await setProductStats(productId, {
                        total_reviews: stats.total_reviews.toString(),
                        'reviews_by_rating:5': stats.reviews_by_rating[5].toString(),
                        'reviews_by_rating:4': stats.reviews_by_rating[4].toString(),
                        'reviews_by_rating:3': stats.reviews_by_rating[3].toString(),
                        'reviews_by_rating:2': stats.reviews_by_rating[2].toString(),
                        'reviews_by_rating:1': stats.reviews_by_rating[1].toString(),
                        reviews_with_media: stats.reviews_with_media.toString(),
                        total_media_count: stats.total_media_count.toString(),
                    });
                } catch (err) {
                    console.error(`Failed to cache stats for product ${productId}:`, err);
                }
            }
        } else {
            // Trường hợp 2: Redis không khả dụng, fallback về MongoDB
            const productReviews = await databaseService.reviews
                .find({ product_id: new ObjectId(productId), status: ReviewStatus.Approved })
                .toArray();
            const totalReviews = productReviews.length;
            const averageRating = totalReviews > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
            const reviewsByRating: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            productReviews.forEach((r) => {
                if (r.rating >= 1 && r.rating <= 5) {
                    reviewsByRating[r.rating] = (reviewsByRating[r.rating] || 0) + 1;
                } else {
                    console.warn(`Invalid rating value ${r.rating} for review ${r._id}`);
                }
            });
            const reviewsWithMedia = productReviews.filter((r) => r.media && r.media.length > 0).length;
            const totalMediaCount = productReviews.reduce((sum, r) => sum + (r.media ? r.media.length : 0), 0);

            stats = {
                total_reviews: totalReviews,
                average_rating: averageRating,
                reviews_by_rating: reviewsByRating,
                reviews_with_media: reviewsWithMedia,
                total_media_count: totalMediaCount,
            };
        }

        // Lọc danh sách đánh giá từ MongoDB
        const filter: any = {
            product_id: new ObjectId(productId),
            status: ReviewStatus.Approved,
        };
        if (rating) {
            filter.rating = parseInt(rating);
        }
        if (hasMedia === 'true') {
            filter.media = { $exists: true, $ne: [] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const reviews = await databaseService.reviews
            .find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        return {
            reviews,
            stats,
        };
    }

    async getShopReviews(shopId: string, query: any) {
        const { rating, hasMedia, page = 1, limit = 10 } = query;

        let stats;
        if (redisConnected) {
            // Trường hợp 1: Redis cache khả dụng
            stats = await getShopStats(shopId);
            if (!stats) {
                // Cache miss: Lấy từ MongoDB và cache lại
                const shop = await databaseService.shops.findOne({ _id: new ObjectId(shopId) });
                if (!shop) {
                    throw new ErrorWithStatus({
                        message: SHOP_MESSAGES.SHOP_NOT_FOUND,
                        status: HTTP_STATUS.NOT_FOUND,
                    });
                }
                stats = {
                    total_reviews: shop.total_reviews || 0,
                    shop_rating: shop.shop_rating || 0,
                    reviews_by_rating: shop.reviews_by_rating || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    reviews_with_media: shop.reviews_with_media || 0,
                    total_media_count: shop.total_media_count || 0,
                };
                try {
                    await setShopStats(shopId, {
                        total_reviews: stats.total_reviews.toString(),
                        shop_rating: stats.shop_rating.toString(),
                        'reviews_by_rating:5': stats.reviews_by_rating[5].toString(),
                        'reviews_by_rating:4': stats.reviews_by_rating[4].toString(),
                        'reviews_by_rating:3': stats.reviews_by_rating[3].toString(),
                        'reviews_by_rating:2': stats.reviews_by_rating[2].toString(),
                        'reviews_by_rating:1': stats.reviews_by_rating[1].toString(),
                        reviews_with_media: stats.reviews_with_media.toString(),
                        total_media_count: stats.total_media_count.toString(),
                    });
                } catch (err) {
                    console.error(`Failed to cache stats for shop ${shopId}:`, err);
                }
            }
        } else {
            // Trường hợp 2: Redis không khả dụng, fallback về MongoDB
            const shopReviews = await databaseService.reviews
                .find({ shop_id: new ObjectId(shopId), status: ReviewStatus.Approved })
                .toArray();

            const totalReviews = shopReviews.length;
            const shopRating = totalReviews > 0 ? shopReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
            const reviewsByRating: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            shopReviews.forEach((r) => {
                if (r.rating >= 1 && r.rating <= 5) {
                    reviewsByRating[r.rating] = (reviewsByRating[r.rating] || 0) + 1;
                } else {
                    console.warn(`Invalid rating value ${r.rating} for review ${r._id}`);
                }
            });
            const reviewsWithMedia = shopReviews.filter((r) => r.media && r.media.length > 0).length;
            const totalMediaCount = shopReviews.reduce((sum, r) => sum + (r.media ? r.media.length : 0), 0);

            stats = {
                total_reviews: totalReviews,
                shop_rating: shopRating,
                reviews_by_rating: reviewsByRating,
                reviews_with_media: reviewsWithMedia,
                total_media_count: totalMediaCount,
            };
        }

        // Lọc danh sách đánh giá từ MongoDB
        const filter: any = {
            shop_id: new ObjectId(shopId),
            status: ReviewStatus.Approved,
        };
        if (rating) {
            filter.rating = parseInt(rating);
        }
        if (hasMedia === 'true') {
            filter.media = { $exists: true, $ne: [] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const reviews = await databaseService.reviews
            .find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        return {
            reviews,
            stats,
        };
    }

    async updateReview(userId: string, reviewId: string, updateData: Partial<IUpsertReview> & { status?: ReviewStatus }) {
        // Find the review
        const review = await databaseService.reviews.findOne({ _id: new ObjectId(reviewId) });
        if (!review) {
            throw new ErrorWithStatus({
                message: REVIEWS_MESSAGES.REVIEW_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Get user and check permissions
        const user = await databaseService.users.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Check if user is admin by looking up their roles
        let isAdmin = false;
        if (user.role_ids && user.role_ids.length > 0) {
            // Get all roles for this user
            const userRoles = await databaseService.roles.find({
                _id: { $in: user.role_ids }
            }).toArray();

            // Check if any role has role_name "admin" (case insensitive)
            isAdmin = userRoles.some(role =>
                role.role_name.toLowerCase() === 'admin'
            );
        }

        // Non-admin users can only update their own reviews
        if (!isAdmin && review.user_id.toString() !== userId) {
            throw new ErrorWithStatus({
                message: 'You are not authorized to update this review',
                status: HTTP_STATUS.FORBIDDEN,
            });
        }

        // Prepare update data
        const updateObject: any = {};

        // Regular users cannot update status
        if (!isAdmin && updateData.status !== undefined) {
            throw new ErrorWithStatus({
                message: 'Regular users cannot update review status',
                status: HTTP_STATUS.FORBIDDEN,
            });
        }

        // Handle allowed fields
        if (updateData.rating !== undefined) updateObject.rating = updateData.rating;
        if (updateData.comment !== undefined) updateObject.comment = updateData.comment;
        if (updateData.media !== undefined) {
            updateObject.media = updateData.media.map(url => ({
                type: url.includes('.mp4') ? 'video' : 'image',
                url
            }));
        }
        if (updateData.is_anonymous !== undefined) updateObject.is_anonymous = updateData.is_anonymous;

        // Only admin can update status
        if (isAdmin && updateData.status !== undefined) updateObject.status = updateData.status;

        // Update the review
        if (Object.keys(updateObject).length === 0) {
            throw new ErrorWithStatus({
                message: 'No valid update data provided',
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        updateObject.updated_at = new Date();

        const result = await databaseService.reviews.findOneAndUpdate(
            { _id: new ObjectId(reviewId), status: ReviewStatus.Pending },
            { $set: updateObject },
            { returnDocument: 'after' }
        );

        // If status was updated to Approved, update stats
        if (isAdmin && updateData.status === ReviewStatus.Approved) {
            await this.updateStatsAfterReview(reviewId);
        }

        return result ? result : review;
    }

    async deleteReview(userId: string, reviewId: string) {
        // Check user
        const foundUser = await databaseService.users.findOne({ _id: new ObjectId(userId) });
        if (!foundUser) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Check if user is admin by looking up their roles
        let isAdmin = false;
        if (foundUser.role_ids && foundUser.role_ids.length > 0) {
            const userRoles = await databaseService.roles.find({
                _id: { $in: foundUser.role_ids }
            }).toArray();
            isAdmin = userRoles.some(role => role.role_name.toLowerCase() === 'admin');
        }
        if (!isAdmin) {
            throw new ErrorWithStatus({
                message: 'You are not authorized to delete this review',
                status: HTTP_STATUS.FORBIDDEN,
            });
        }

        // Delete the review
        const result = await databaseService.reviews.deleteOne({ _id: new ObjectId(reviewId) });
        if (result.deletedCount === 0) {
            throw new ErrorWithStatus({
                message: REVIEWS_MESSAGES.REVIEW_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }
        return { success: true, result };
    }
}

const reviewService = new ReviewService();
export default reviewService;