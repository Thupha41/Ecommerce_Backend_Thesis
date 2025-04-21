import { ObjectId } from 'mongodb'

interface DeliveryInfoType {
  _id?: ObjectId
  //người nhận hàng
  personal_detail: {
    name: string
    phone: string
  }
  //địa chỉ giao hàng
  shipping_address: {
    province_city: string
    district: string
    ward: string
    street: string
  }
  is_default: boolean
  user_id: ObjectId
}
export default class DeliveryInfo {
  _id?: ObjectId
  personal_detail: {
    name: string
    phone: string
  }
  shipping_address: {
    province_city: string
    district: string
    ward: string
    street: string
  }
  is_default: boolean
  user_id: ObjectId
  constructor({ _id, personal_detail, shipping_address, is_default, user_id }: DeliveryInfoType) {
    this._id = _id
    this.personal_detail = personal_detail
    this.shipping_address = shipping_address
    this.is_default = is_default
    this.user_id = user_id
  }
}
