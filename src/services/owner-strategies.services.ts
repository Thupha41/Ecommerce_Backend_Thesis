import { ObjectId } from 'mongodb';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import databaseService from '~/services/database.services';
import { SHOP_MESSAGES, PRODUCTS_MESSAGES } from '~/constants/messages';

// Interface chung cho tất cả các strategy
export interface OwnershipStrategy {
    checkOwnership(userId: string | ObjectId, resourceId: string | ObjectId, additionalData?: any): Promise<boolean>;
}

// Utility để kiểm tra quyền sở hữu dựa trên shop_owner
const checkShopOwnership = async (userId: string | ObjectId, shopId: string | ObjectId): Promise<boolean> => {
    const shop = await databaseService.shops.findOne({ _id: new ObjectId(shopId.toString()) });
    if (!shop) {
        throw new ErrorWithStatus({
            message: SHOP_MESSAGES.SHOP_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND,
        });
    }
    return shop.shop_owner.toString() === userId.toString();
};

// Strategy cho Products
export class ProductOwnershipStrategy implements OwnershipStrategy {
    async checkOwnership(
        userId: string | ObjectId,
        resourceId: string | ObjectId,
        additionalData?: any
    ): Promise<boolean> {
        // Trong trường hợp tạo mới (POST), resourceId có thể là shop_id từ body
        if (additionalData?.isCreate && additionalData?.shop_id) {
            return checkShopOwnership(userId, additionalData.shop_id);
        }

        // Trong trường hợp chỉnh sửa/xóa (PUT, DELETE), resourceId là product_id
        if (!ObjectId.isValid(resourceId.toString())) {
            throw new ErrorWithStatus({
                message: PRODUCTS_MESSAGES.INVALID_PRODUCT_ID || 'Invalid product ID',
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        const product = await databaseService.products.findOne({ _id: new ObjectId(resourceId.toString()) });
        if (!product) {
            throw new ErrorWithStatus({
                message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND || 'Product not found',
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Lấy product_shop từ product (dựa trên Product schema)
        const shopId = product.product_shop;
        if (!shopId) {
            throw new ErrorWithStatus({
                message: 'Product does not have a shop association',
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }

        return checkShopOwnership(userId, shopId);
    }
}

// Strategy cho Shops
export class ShopOwnershipStrategy implements OwnershipStrategy {
    async checkOwnership(
        userId: string | ObjectId,
        resourceId: string | ObjectId,
        additionalData?: any
    ): Promise<boolean> {
        if (!ObjectId.isValid(resourceId.toString())) {
            throw new ErrorWithStatus({
                message: SHOP_MESSAGES.INVALID_SHOP_ID,
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        return checkShopOwnership(userId, resourceId);
    }
}

// Factory để quản lý và truy xuất các strategy
export class OwnershipStrategyFactory {
    private strategies: Record<string, OwnershipStrategy> = {};

    registerStrategy(resource: string, strategy: OwnershipStrategy): void {
        if (this.strategies[resource]) {
            throw new Error(`Strategy for resource '${resource}' is already registered`);
        }
        this.strategies[resource] = strategy;
    }

    getStrategy(resource: string): OwnershipStrategy {
        const strategy = this.strategies[resource];
        if (!strategy) {
            throw new ErrorWithStatus({
                message: `No ownership strategy found for resource: ${resource}`,
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
        return strategy;
    }
}

// Singleton instance
export const ownershipFactory = new OwnershipStrategyFactory();

// Đăng ký các strategy
ownershipFactory.registerStrategy('products', new ProductOwnershipStrategy());
ownershipFactory.registerStrategy('shops', new ShopOwnershipStrategy());