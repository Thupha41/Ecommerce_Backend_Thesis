import { ObjectId } from 'mongodb'
import { OrderStatus } from 'src/constants/enums'

// Order Type Interface
export interface IOrderType {
  _id?: ObjectId
  order_userId: ObjectId
  order_checkout: object
  order_shipping: object
  order_payment: string
  order_products: Array<any>
  order_status: OrderStatus
  order_trackingNumber: string
  order_createdAt?: Date
  order_updatedAt?: Date
}

// Order Class
export default class Order {
  _id?: ObjectId
  order_userId: ObjectId
  order_checkout: object
  order_shipping: object
  order_payment: string
  order_products: Array<any>
  order_status: OrderStatus
  order_trackingNumber: string
  order_createdAt: Date
  order_updatedAt: Date

  constructor({
    _id,
    order_userId,
    order_checkout,
    order_shipping,
    order_payment,
    order_products,
    order_status,
    order_trackingNumber,
    order_createdAt,
    order_updatedAt
  }: IOrderType) {
    const date = new Date()
    this._id = _id
    this.order_userId = order_userId
    this.order_checkout = order_checkout || {}
    this.order_shipping = order_shipping || {}
    this.order_payment = order_payment || ''
    this.order_products = order_products || []
    this.order_status = order_status
    this.order_trackingNumber = order_trackingNumber || '#00001DD/MM/YYYY'
    this.order_createdAt = order_createdAt || date
    this.order_updatedAt = order_updatedAt || date
  }
}
