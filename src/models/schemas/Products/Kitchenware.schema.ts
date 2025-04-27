import { ObjectId } from 'mongodb'

// Specific Product Type Interfaces
export interface IKitchenwareType {
  _id?: ObjectId
  product_shop: ObjectId
  created_at?: Date
  updated_at?: Date
}

// Specific Product Type Classes
export default class Kitchenware {
  _id?: ObjectId
  product_shop: ObjectId
  created_at: Date
  updated_at: Date

  constructor({ _id, product_shop, created_at, updated_at }: IKitchenwareType) {
    const date = new Date()
    this._id = _id
    this.product_shop = product_shop
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
