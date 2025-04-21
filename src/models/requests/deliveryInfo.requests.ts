export interface UpsertDeliveryInfoReqBody {
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
}
