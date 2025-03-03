import { ObjectId } from 'mongodb'

// Specific Product Type Interfaces

export interface IElectronicType {
  _id?: ObjectId
  manufacturer: string
  model: string
  color: string
  product_shop: ObjectId
  created_at?: Date
  updated_at?: Date
}
// Specific Product Type Classes
export default class Electronics {
  _id?: ObjectId
  manufacturer: string
  model: string
  color: string
  product_shop: ObjectId
  created_at: Date
  updated_at: Date

  constructor({ _id, manufacturer, model, color, product_shop, created_at, updated_at }: IElectronicType) {
    const date = new Date()
    this._id = _id
    this.manufacturer = manufacturer
    this.model = model
    this.color = color
    this.product_shop = product_shop
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
