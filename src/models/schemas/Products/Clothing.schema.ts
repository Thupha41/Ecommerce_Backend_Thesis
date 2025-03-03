import { ObjectId } from 'mongodb'

// Specific Product Type Interfaces
export interface IClothingType {
  _id?: ObjectId
  brand: string
  size: string
  material: string
  product_shop: ObjectId
  created_at?: Date
  updated_at?: Date
}

// Specific Product Type Classes
export default class Clothing {
  _id?: ObjectId
  brand: string
  size: string
  material: string
  product_shop: ObjectId
  created_at: Date
  updated_at: Date

  constructor({ _id, brand, size, material, product_shop, created_at, updated_at }: IClothingType) {
    const date = new Date()
    this._id = _id
    this.brand = brand
    this.size = size
    this.material = material
    this.product_shop = product_shop
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
