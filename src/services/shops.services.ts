import databaseService from './database.services'
import { GetProductsByShopOptions, IUpsertShopReqBody } from '../models/requests/shops.requests'
import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import { SHOP_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import Shop from '~/models/schemas/Shop.schema'
import { ShopStatus } from '~/constants/enums'
import { generateSlug } from '~/utils'
import { redisConnected, getShopProductsFromCache, setShopProductsToCache } from './redis.services'

interface SortOption {
  [key: string]: 1 | -1
}

const sortMapping: Record<string, SortOption> = {
  sold_quantity: { sold_quantity: -1 },
  created_at: { created_at: -1 },
  price_asc: { product_price: 1 },
  price_desc: { product_price: -1 },
  rating_desc: { product_ratingsAverage: -1 } // Dễ dàng mở rộng
}

class ShopService {
  async createShop(user_id: string, shop: IUpsertShopReqBody) {
    //check user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const { shop_owner, shop_status, ...shopData } = shop

    const newShop = await databaseService.shops.insertOne(
      new Shop({
        shop_owner: new ObjectId(user_id),
        shop_status: ShopStatus.Pending,
        shop_slug: generateSlug(shop.shop_name),
        created_at: new Date(),
        updated_at: new Date(),
        ...shopData
      })
    )
    return {
      _id: newShop.insertedId,
      ...shopData
    }
  }
  async updateShop(user_id: string, shop_id: string, shop: IUpsertShopReqBody) {
    //check user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const { shop_owner, shop_status, ...shopData } = shop
    const updatedShop = await databaseService.shops.updateOne({ _id: new ObjectId(shop_id) }, { $set: shopData })
    return updatedShop
  }

  async deleteShop(user_id: string, shop_id: string) {
    //check user
    const foundUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!foundUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const deletedShop = await databaseService.shops.deleteOne({ _id: new ObjectId(shop_id) })
    return deletedShop
  }

  async getShopByIdOrSlug(shop_id: string, shop_slug: string) {
    const foundShop = await databaseService.shops.findOne({
      $or: [{ _id: new ObjectId(shop_id) }, { shop_slug }]
    })
    return foundShop
  }

  async getShopByOwnerId(user_id: string) {
    const foundShop = await databaseService.shops.findOne({ shop_owner: new ObjectId(user_id) })
    return foundShop
  }

  async getShopByStatus(status: ShopStatus) {
    const foundShop = await databaseService.shops.find({ shop_status: status })
    return foundShop
  }

  async getAllShops() {
    const foundShops = await databaseService.shops.find().toArray()
    return JSON.parse(JSON.stringify(foundShops))
  }

  async getProductsByShop(shopId: string, options: GetProductsByShopOptions) {
    const cacheKey = `products:shop:${shopId}:${options.sortBy}:${options.page || 1}:${options.limit || 20}`
    let cachedResult

    // Kiểm tra và lấy dữ liệu từ Redis
    if (redisConnected) {
      cachedResult = await getShopProductsFromCache(shopId, options.sortBy, options.page, options.limit)
      if (cachedResult) {
        console.log(`Cache hit for key: ${cacheKey}`)
        return cachedResult
      }
    }

    // Nếu không có cache hoặc Redis không kết nối, truy vấn MongoDB
    const shopExists = await databaseService.shops.findOne({ _id: new ObjectId(shopId) })
    if (!shopExists) {
      throw new ErrorWithStatus({
        message: SHOP_MESSAGES.SHOP_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const sortOption = sortMapping[options.sortBy] || sortMapping['created_at']
    const limit = options.limit || 20
    const page = options.page || 1
    const skip = (page - 1) * limit

    const products = await databaseService.productSPUs
      .find({
        product_shop: new ObjectId(shopId),
        isPublished: true,
        isDeleted: false
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .project({
        product_name: 1,
        product_thumb: 1,
        product_price: 1,
        sold_quantity: 1,
        created_at: 1,
        product_category: 1
      })
      .toArray()

    const total = await databaseService.productSPUs.countDocuments({
      product_shop: new ObjectId(shopId),
      isPublished: true,
      isDeleted: false
    })

    const result = {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }

    // Lưu kết quả vào Redis
    if (redisConnected) {
      await setShopProductsToCache(shopId, options.sortBy, result, options.page, options.limit)
    }

    return result
  }
}

const shopService = new ShopService()
export default shopService
