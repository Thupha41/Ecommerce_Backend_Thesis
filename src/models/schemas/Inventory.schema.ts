import { ObjectId } from 'mongodb'
import { InventoryStatus } from 'src/constants/enums'
// SpeInventory Type Interfaces
export interface IInventoryType {
  _id?: ObjectId
  inventory_productId: ObjectId
  inventory_location: string
  inventory_stock: number
  inventory_shopId: ObjectId
  inventory_status: InventoryStatus
  created_at?: Date
  updated_at?: Date
}

// Specific Inventory Type Classes
export default class Inventory {
  _id?: ObjectId
  inventory_productId: ObjectId
  inventory_location: string
  inventory_stock: number
  inventory_shopId: ObjectId
  inventory_status: InventoryStatus
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    inventory_productId,
    inventory_location,
    inventory_stock,
    inventory_shopId,
    inventory_status,
    created_at,
    updated_at
  }: IInventoryType) {
    const date = new Date()
    this._id = _id
    this.inventory_productId = inventory_productId
    this.inventory_location = inventory_location
    this.inventory_stock = inventory_stock
    this.inventory_shopId = inventory_shopId
    this.inventory_status = inventory_status
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
