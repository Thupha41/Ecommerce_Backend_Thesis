import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { productRepository } from '../models/repositories/products.repo'
import { PRODUCTS_MESSAGES } from '~/constants/messages'
import databaseService from './database.services'
import { IAddToStockRequestBody } from '~/models/requests/checkout.requests'
import { ObjectId } from 'mongodb'
import { InventoryStatus } from '~/constants/enums'
class InventoryService {
  static async addStockToInventory({ stock, productId, shopId, location = 'unknown' }: IAddToStockRequestBody) {
    const foundProduct = await productRepository.getProductById(productId)
    if (!foundProduct)
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })

    const query = {
      inventory_shopId: new ObjectId(shopId),
      inventory_productId: new ObjectId(productId)
    }

    const updateSet = {
      $inc: {
        inventory_stock: stock
      },
      $set: {
        inventory_status: InventoryStatus.InStock,
        inventory_location: location,
        created_at: new Date(),
        updated_at: new Date()
      }
    }
    const option = {
      upsert: true,
      new: true
    }
    return await databaseService.inventories.findOneAndUpdate(query, updateSet, option)
  }
}

export default InventoryService
