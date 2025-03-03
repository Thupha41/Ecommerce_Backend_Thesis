import databaseService from '~/services/database.services'
import { InventoryStatus } from '~/constants/enums'
import { ObjectId } from 'mongodb'
const insertInventory = async ({
  productId,
  shopId,
  stock,
  location = 'unKnow',
  status = InventoryStatus.InStock
}: {
  productId: string
  shopId: string
  stock: number
  location?: string
  status?: InventoryStatus
}) => {
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

export { insertInventory }
