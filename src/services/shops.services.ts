import databaseService from './database.services'
import { IUpsertShopReqBody } from '../models/requests/shops.requests'
import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import { SHOP_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import Shop from '~/models/schemas/Shop.schema'
import { ShopStatus } from '~/constants/enums'
import { generateSlug } from '~/utils'

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
    const foundShops = await databaseService.shops.find()
    return foundShops
  }
}

const shopService = new ShopService()
export default shopService
