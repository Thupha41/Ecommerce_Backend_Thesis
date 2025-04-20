import { ObjectId } from 'mongodb'
import { CartStatus, InventoryStatus } from 'src/constants/enums'
// Specific Cart Type Interfaces
export interface ICartProduct {
  product_id: ObjectId
  product_quantity?: number
  product_price?: number
  product_name?: string
  product_shopId?: ObjectId
}
export interface ICartType {
  _id?: ObjectId
  cart_products: Array<ICartProduct>
  cart_total_price: number
  cart_count_product: number
  cart_userId: ObjectId
  cart_status: CartStatus
  created_at?: Date
  updated_at?: Date
}

// Specific Inventory Type Classes
export default class Cart {
  _id?: ObjectId
  cart_products: Array<ICartProduct>
  cart_total_price: number = 0
  cart_count_product: number = 0
  cart_userId: ObjectId
  cart_status: CartStatus = CartStatus.Active
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    cart_products,
    cart_total_price,
    cart_count_product,
    cart_userId,
    cart_status,
    created_at,
    updated_at
  }: ICartType) {
    const date = new Date()
    this._id = _id
    this.cart_products = cart_products
    this.cart_total_price = cart_total_price
    this.cart_count_product = cart_count_product
    this.cart_userId = cart_userId
    this.cart_status = cart_status
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
