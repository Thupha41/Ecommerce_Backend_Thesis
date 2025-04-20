import databaseService from '~/services/database.services'
import { InventoryStatus } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import { IInsertInventoryReq, IReserveInventoryReq } from '~/models/requests/inventory.requests'
const insertInventory = async ({
  productId,
  shopId,
  stock,
  location = 'unKnow',
  status = InventoryStatus.InStock
}: IInsertInventoryReq) => {
  return await databaseService.inventories.insertOne({
    inventory_productId: new ObjectId(productId),
    inventory_shopId: new ObjectId(shopId),
    inventory_stock: stock,
    inventory_location: location,
    inventory_status: status,
    created_at: new Date(),
    updated_at: new Date()
  })
}

const reserveInventory = async ({ productId, quantity, cartId }: IReserveInventoryReq) => {
  const query = {
    inventory_productId: new ObjectId(productId),
    inventory_stock: { $gte: quantity }
  }
  const updateSet = {
    $inc: {
      inventory_stock: -quantity
    },
    $push: {
      inventory_reservation: {
        quantity,
        cartId,
        createOn: new Date()
      }
    }
  }
  const option = {
    upsert: true,
    new: true
  }
  return await databaseService.inventories.findOneAndUpdate(query, updateSet, option)
}

export { insertInventory, reserveInventory }
