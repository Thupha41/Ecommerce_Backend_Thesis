import { ObjectId } from 'mongodb';
import databaseService from './database.services';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { OrderStatus, ReviewStatus } from '~/constants/enums';
import Review from '~/models/schemas/Review.schema';
import { setProductStats, getProductStats, setShopStats, getShopStats, redisConnected } from './redis.services';
import { IUpsertReview } from '~/models/requests/reviews.requests';
import { ORDERS_MESSAGES, PRODUCTS_MESSAGES, REVIEWS_MESSAGES, SHOP_MESSAGES, USERS_MESSAGES } from '~/constants/messages';

class ReviewService {

    private async calculateProductStats(productId: ObjectId) {
        const stats = await databaseService.reviews
            .aggregate([
                { $match: { product_id: productId, status: ReviewStatus.Approved } },
                {
                    $group: {
                        _id: null,
                        total_reviews: { $sum: 1 },
                        average_rating: { $avg: '$rating' },
                        reviews_with_media: {
                            $sum: {
                                $cond: [
                                    { $gt: [{ $size: { $ifNull: ['$media', []] } }, 0] },
                                    1,
                                    0
                                ]
                            }
                        },
                        total_media_count: { $sum: { $size: { $ifNull: ['$media', []] } } },
                        reviews_by_rating: {
                            $push: {
                                $cond: [
                                    { $and: [{ $gte: ['$rating', 1] }, { $lte: ['$rating', 5] }] },
                                    '$rating',
                                    null,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total_reviews: 1,
                        average_rating: 1,
                        reviews_with_media: 1,
                        total_media_count: 1,
                        reviews_by_rating: {
                            $arrayToObject: {
                                $map: {
                                    input: [1, 2, 3, 4, 5],
                                    as: 'rating',
                                    in: {
                                        k: { $toString: '$$rating' },
                                        v: {
                                            $size: {
                                                $filter: {
                                                    input: '$reviews_by_rating',
                                                    as: 'r',
                                                    cond: { $eq: ['$$r', '$$rating'] },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ])
            .toArray();

        return (
            stats[0] || {
                total_reviews: 0,
                average_rating: 0,
                reviews_by_rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                reviews_with_media: 0,
                total_media_count: 0,
            }
        );
    }

    private async calculateShopStats(shopProductIds: ObjectId[]) {
        const stats = await databaseService.reviews
            .aggregate([
                { $match: { product_id: { $in: shopProductIds }, status: ReviewStatus.Approved } },
                {
                    $group: {
                        _id: null,
                        total_reviews: { $sum: 1 },
                        shop_rating: { $avg: '$rating' },
                        reviews_with_media: {
                            $sum: {
                                $cond: [
                                    { $gt: [{ $size: { $ifNull: ['$media', []] } }, 0] },
                                    1,
                                    0
                                ]
                            }
                        },
                        total_media_count: { $sum: { $size: { $ifNull: ['$media', []] } } },
                        reviews_by_rating: {
                            $push: {
                                $cond: [
                                    { $and: [{ $gte: ['$rating', 1] }, { $lte: ['$rating', 5] }] },
                                    '$rating',
                                    null,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total_reviews: 1,
                        shop_rating: 1,
                        reviews_with_media: 1,
                        total_media_count: 1,
                        reviews_by_rating: {
                            $arrayToObject: {
                                $map: {
                                    input: [1, 2, 3, 4, 5],
                                    as: 'rating',
                                    in: {
                                        k: { $toString: '$$rating' },
                                        v: {
                                            $size: {
                                                $filter: {
                                                    input: '$reviews_by_rating',
                                                    as: 'r',
                                                    cond: { $eq: ['$$r', '$$rating'] },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ])
            .toArray();

        return (
            stats[0] || {
                total_reviews: 0,
                shop_rating: 0,
                reviews_by_rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                reviews_with_media: 0,
                total_media_count: 0,
            }
        );
    }

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
        if (!order.order_products || !Array.isArray(order.order_products)) {
            throw new ErrorWithStatus({
                message: 'Invalid order products structure',
                status: HTTP_STATUS.BAD_REQUEST,
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

        // Kiểm tra sản phẩm trong đơn hàng
        const productExists = order.order_products.some((shop: any) =>
            shop.item_products.some((item: any) => item.productId.toString() === product_id)
        );
        if (!productExists) {
            throw new ErrorWithStatus({
                message: 'Product not found in this order',
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        // Kiểm tra review trùng lặp
        const existingReview = await databaseService.reviews.findOne({
            user_id: new ObjectId(userId),
            product_id: new ObjectId(product_id),
            order_id: new ObjectId(order_id),
        });
        if (existingReview) {
            throw new ErrorWithStatus({
                message: REVIEWS_MESSAGES.REVIEW_ALREADY_EXISTS,
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        // Tạo review mới
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
        const session = databaseService.getMongoClient().startSession();
        try {
            session.startTransaction();
            const newReview = await databaseService.reviews.insertOne(
                new Review({
                    user_id: new ObjectId(userId),
                    product_id: new ObjectId(product_id),
                    order_id: new ObjectId(order_id),
                    shop_id: new ObjectId(product.product_shop),
                    rating,
                    comment,
                    media: media?.map((url) => ({
                        type: videoExtensions.some((ext) => url.toLowerCase().endsWith(ext)) ? 'video' : 'image',
                        url,
                    })) || [],
                    is_anonymous,
                    status: ReviewStatus.Pending,
                }),
                { session }
            );
            await session.commitTransaction();
            return {
                _id: newReview.insertedId,
                ...reviewData,
            };
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    async updateStatsAfterReview(reviewId: string) {
        const review = await databaseService.reviews.findOne({ _id: new ObjectId(reviewId) });
        if (!review || review.status !== ReviewStatus.Approved) return;

        const productId = review.product_id;

        // Lấy thông tin sản phẩm để lấy shop_id
        const product = await databaseService.products.findOne({ _id: productId });
        if (!product) {
            console.error(`Product ${productId} not found`);
            return;
        }
        const shopId = product.product_shop;

        const session = databaseService.getMongoClient().startSession();
        try {
            session.startTransaction();

            // Cập nhật thống kê cho Product
            const productStats = await this.calculateProductStats(productId);
            await databaseService.products.updateOne(
                { _id: productId },
                {
                    $set: {
                        product_ratingsAverage: productStats.average_rating,
                    },
                },
                { session }
            );

            // Cập nhật thống kê cho Shop
            const shopProducts = await databaseService.products
                .find({ product_shop: shopId, isPublished: true })
                .toArray();
            const shopProductIds = shopProducts.map((p) => p._id);
            const shopStats = await this.calculateShopStats(shopProductIds);
            await databaseService.shops.updateOne(
                { _id: shopId },
                {
                    $set: {
                        shop_rating: shopStats.shop_rating,
                    },
                },
                { session }
            );


            await session.commitTransaction();

            // Sau khi commit thành công, mới cập nhật Redis
            if (redisConnected) {
                await setProductStats(productId.toString(), {
                    total_reviews: productStats.total_reviews.toString(),
                    'reviews_by_rating:5': productStats.reviews_by_rating[5].toString(),
                    'reviews_by_rating:4': productStats.reviews_by_rating[4].toString(),
                    'reviews_by_rating:3': productStats.reviews_by_rating[3].toString(),
                    'reviews_by_rating:2': productStats.reviews_by_rating[2].toString(),
                    'reviews_by_rating:1': productStats.reviews_by_rating[1].toString(),
                    reviews_with_media: productStats.reviews_with_media.toString(),
                    total_media_count: productStats.total_media_count.toString(),
                });

                await setShopStats(shopId.toString(), {
                    total_reviews: shopStats.total_reviews.toString(),
                    shop_rating: shopStats.shop_rating.toString(),
                    'reviews_by_rating:5': shopStats.reviews_by_rating[5].toString(),
                    'reviews_by_rating:4': shopStats.reviews_by_rating[4].toString(),
                    'reviews_by_rating:3': shopStats.reviews_by_rating[3].toString(),
                    'reviews_by_rating:2': shopStats.reviews_by_rating[2].toString(),
                    'reviews_by_rating:1': shopStats.reviews_by_rating[1].toString(),
                    reviews_with_media: shopStats.reviews_with_media.toString(),
                    total_media_count: shopStats.total_media_count.toString(),
                });
            }
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    async getProductReviews(productId: string, query: any) {
        const { rating, hasMedia, page = 1, limit = 10 } = query;

        // Kiểm tra sản phẩm
        const product = await databaseService.products.findOne({ _id: new ObjectId(productId) });
        if (!product) {
            throw new ErrorWithStatus({
                message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Lấy thống kê
        let stats;
        if (redisConnected) {
            stats = await getProductStats(productId);
            if (!stats || !stats.total_reviews) {
                stats = await this.calculateProductStats(new ObjectId(productId));
            }
        } else {
            stats = await this.calculateProductStats(new ObjectId(productId));
        }

        // Lọc danh sách đánh giá
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

        // Kiểm tra shop
        const shop = await databaseService.shops.findOne({ _id: new ObjectId(shopId) });
        if (!shop) {
            throw new ErrorWithStatus({
                message: SHOP_MESSAGES.SHOP_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Lấy sản phẩm của shop
        const shopProducts = await databaseService.products
            .find({ product_shop: new ObjectId(shopId), isPublished: true })
            .toArray();
        const shopProductIds = shopProducts.map((p) => p._id);

        // Nếu shop không có sản phẩm
        if (shopProductIds.length === 0) {
            return {
                reviews: [],
                stats: {
                    total_reviews: 0,
                    shop_rating: 0,
                    reviews_by_rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    reviews_with_media: 0,
                    total_media_count: 0,
                },
            };
        }

        // Lấy thống kê
        let stats;
        if (redisConnected) {
            stats = await getShopStats(shopId);
            if (!stats || !stats.total_reviews) {
                stats = await this.calculateShopStats(shopProductIds);
            }
        } else {
            stats = await this.calculateShopStats(shopProductIds);
        }

        // Lọc danh sách đánh giá
        const filter: any = {
            product_id: { $in: shopProductIds },
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
        // Tìm review
        const review = await databaseService.reviews.findOne({ _id: new ObjectId(reviewId) });
        if (!review) {
            throw new ErrorWithStatus({
                message: REVIEWS_MESSAGES.REVIEW_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Kiểm tra người dùng
        const user = await databaseService.users.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Kiểm tra quyền admin
        let isAdmin = false;
        if (user.role_ids && user.role_ids.length > 0) {
            const userRoles = await databaseService.roles
                .find({ _id: { $in: user.role_ids } })
                .toArray();
            isAdmin = userRoles.some((role) => role.role_name.toLowerCase() === 'admin');
        }

        // Non-admin chỉ có thể cập nhật review của chính mình
        if (!isAdmin && review.user_id.toString() !== userId) {
            throw new ErrorWithStatus({
                message: 'You are not authorized to update this review',
                status: HTTP_STATUS.FORBIDDEN,
            });
        }

        // Regular users không thể cập nhật status
        if (!isAdmin && updateData.status !== undefined) {
            throw new ErrorWithStatus({
                message: 'Regular users cannot update review status',
                status: HTTP_STATUS.FORBIDDEN,
            });
        }

        // Validate dữ liệu
        if (updateData.rating !== undefined) {
            if (updateData.rating < 1 || updateData.rating > 5) {
                throw new ErrorWithStatus({
                    message: 'Rating must be between 1 and 5',
                    status: HTTP_STATUS.BAD_REQUEST,
                });
            }
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateObject: any = {};
        if (updateData.rating !== undefined) updateObject.rating = updateData.rating;
        if (updateData.comment !== undefined) updateObject.comment = updateData.comment;
        if (updateData.media !== undefined) {
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
            updateObject.media = updateData.media.map((url) => ({
                type: videoExtensions.some((ext) => url.toLowerCase().endsWith(ext)) ? 'video' : 'image',
                url,
            }));
        }
        if (updateData.is_anonymous !== undefined) updateObject.is_anonymous = updateData.is_anonymous;
        if (isAdmin && updateData.status !== undefined) updateObject.status = updateData.status;

        if (Object.keys(updateObject).length === 0) {
            throw new ErrorWithStatus({
                message: 'No valid update data provided',
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        updateObject.updated_at = new Date();

        const session = databaseService.getMongoClient().startSession();
        try {
            session.startTransaction();
            const result = await databaseService.reviews.findOneAndUpdate(
                { _id: new ObjectId(reviewId) },
                { $set: updateObject },
                { returnDocument: 'after', session }
            );

            // Nếu trạng thái chuyển sang Approved, cập nhật thống kê
            if (isAdmin && updateData.status === ReviewStatus.Approved) {
                await this.updateStatsAfterReview(reviewId);
            }

            await session.commitTransaction();
            return result ? result : review;
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    async deleteReview(userId: string, reviewId: string) {
        // Kiểm tra người dùng
        const foundUser = await databaseService.users.findOne({ _id: new ObjectId(userId) });
        if (!foundUser) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Kiểm tra quyền admin
        let isAdmin = false;
        if (foundUser.role_ids && foundUser.role_ids.length > 0) {
            const userRoles = await databaseService.roles
                .find({ _id: { $in: foundUser.role_ids } })
                .toArray();
            isAdmin = userRoles.some((role) => role.role_name.toLowerCase() === 'admin');
        }
        if (!isAdmin) {
            throw new ErrorWithStatus({
                message: 'You are not authorized to delete this review',
                status: HTTP_STATUS.FORBIDDEN,
            });
        }

        // Kiểm tra review
        const review = await databaseService.reviews.findOne({ _id: new ObjectId(reviewId) });
        if (!review) {
            throw new ErrorWithStatus({
                message: REVIEWS_MESSAGES.REVIEW_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        const session = databaseService.getMongoClient().startSession();
        try {
            session.startTransaction();
            const result = await databaseService.reviews.deleteOne({ _id: new ObjectId(reviewId) }, { session });
            if (result.deletedCount === 0) {
                throw new ErrorWithStatus({
                    message: REVIEWS_MESSAGES.REVIEW_NOT_FOUND,
                    status: HTTP_STATUS.NOT_FOUND,
                });
            }

            // Nếu review bị xóa ở trạng thái Approved, cập nhật thống kê
            if (review.status === ReviewStatus.Approved) {
                await this.updateStatsAfterReview(reviewId);
            }

            await session.commitTransaction();
            return { success: true };
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }
}

const reviewService = new ReviewService();
export default reviewService;