// import { removeNull } from '~/utils'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import { sellerRepository } from '~/models/repositories/seller.repo'
import Seller from '~/models/schemas/Seller.schema'

class SellerService {
  async createSeller(user_id: string, { name, phone, address, email, rating, image, isActive }: Seller) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    console.log('>>> check user', user)
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: 404
      })
    }

    const newSeller = await databaseService.sellers.insertOne({
      name,
      phone,
      address,
      email,
      rating,
      image,
      isActive,
      created_at: new Date(),
      updated_at: new Date()
    })

    return {
      _id: newSeller.insertedId,
      name,
      phone,
      address,
      email,
      rating,
      image,
      isActive
    }
  }

  async updateSeller(user_id: string, seller_id: string, updateBody: Seller) {
    // updateBody = removeNull(updateBody) as UpsertRestaurantReqBody
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: 404
      })
    }

    const seller = await databaseService.sellers.updateOne({ _id: new ObjectId(seller_id) }, { $set: updateBody })
    return seller
  }

  async getAllSellerByUserId(user_id: string) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: 404
      })
    }
    const sellers = await databaseService.sellers
      .find({
        user_id: new ObjectId(user_id)
      })
      .toArray()
    return sellers
  }

  async getAll({ limit = 50, sort = 'ctime', page = 1 }) {
    const sellers = await sellerRepository.findAll({ limit, sort, page })
    return sellers
  }

  async deleteSeller(user_id: string, restaurant_id: string) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: 404
      })
    }
    const restaurant = await databaseService.sellers.deleteOne({
      _id: new ObjectId(restaurant_id)
    })
    return restaurant
  }
}

export default new SellerService()
