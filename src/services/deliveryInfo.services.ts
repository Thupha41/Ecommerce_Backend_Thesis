import DeliveryInfo from '~/models/schemas/DeliveryInfo.schema'
import { removeNull } from '~/utils'
import databaseService from './database.services'
import { UpsertDeliveryInfoReqBody } from '~/models/requests/deliveryInfo.requests'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import { DELIVERY_INFO_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { deliveryInfoRepository } from '~/models/repositories/deliveryInfo.repo'
import HTTP_STATUS from '~/constants/httpStatus'
class DeliveryInfoService {
  async createDeliveryInfo(
    user_id: string,
    { province_city, district, ward, street, is_default }: UpsertDeliveryInfoReqBody
  ) {
    //found user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //check default delivery info
    if (is_default) {
      const deliveryDefault = await databaseService.deliveryInfos.findOne({
        user_id: new ObjectId(user_id),
        is_default: true
      })
      if (deliveryDefault) {
        throw new ErrorWithStatus({
          message: DELIVERY_INFO_MESSAGES.USER_ALREADY_HAVE_DEFAULT_DELIVERY_INFO,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }
    const deliveryInfo = await databaseService.deliveryInfos.insertOne({
      user_id: new ObjectId(user_id),
      province_city,
      district,
      ward,
      street,
      is_default
    })

    return {
      _id: deliveryInfo.insertedId,
      province_city,
      district,
      ward,
      street,
      is_default
    }
  }

  async updateDeliveryInfo(user_id: string, delivery_id: string, updateBody: UpsertDeliveryInfoReqBody) {
    updateBody = removeNull(updateBody) as UpsertDeliveryInfoReqBody
    //found user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //check default delivery info
    if (updateBody.is_default) {
      const deliveryDefault = await databaseService.deliveryInfos.findOne({
        user_id: new ObjectId(user_id),
        is_default: true
      })
      if (deliveryDefault) {
        throw new ErrorWithStatus({
          message: DELIVERY_INFO_MESSAGES.USER_ALREADY_HAVE_DEFAULT_DELIVERY_INFO,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }
    const deliveryInfo = await databaseService.deliveryInfos.updateOne(
      { _id: new ObjectId(delivery_id), user_id: new ObjectId(user_id) },
      { $set: updateBody }
    )
    return deliveryInfo
  }

  async getAllDeliveryInfoByUserId(user_id: string) {
    //found user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const deliveryInfos = await databaseService.deliveryInfos
      .find({
        user_id: new ObjectId(user_id)
      })
      .toArray()
    return deliveryInfos
  }

  async getAllDeliveryInfo({ limit = 50, sort = 'ctime', page = 1 }) {
    const deliveryInfos = await deliveryInfoRepository.findAll({ limit, sort, page })
    return deliveryInfos
  }

  async deleteDeliveryInfo(user_id: string, delivery_id: string) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const deliveryInfo = await databaseService.deliveryInfos.deleteOne({
      _id: new ObjectId(delivery_id),
      user_id: new ObjectId(user_id)
    })
    return deliveryInfo
  }
  async getDeliveryDetail(user_id: string, delivery_id: string) {
    //found user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //found delivery info
    const delivery_info = await databaseService.deliveryInfos.findOne({
      _id: new ObjectId(delivery_id),
      user_id: new ObjectId(user_id)
    })
    if (!delivery_info) {
      throw new ErrorWithStatus({
        message: DELIVERY_INFO_MESSAGES.DELIVERY_INFO_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return delivery_info
  }

  async getDeliveryDefault(user_id: string) {
    //found user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //found delivery info
    const delivery_info = await databaseService.deliveryInfos.findOne({
      user_id: new ObjectId(user_id),
      is_default: true
    })
    if (!delivery_info) {
      throw new ErrorWithStatus({
        message: DELIVERY_INFO_MESSAGES.DELIVERY_INFO_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return delivery_info
  }
}

export default new DeliveryInfoService()
