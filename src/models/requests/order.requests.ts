export interface orderByUserRequestBody {
  shop_order_ids: {
    shopId: string
    shop_discounts: {
      discount_value: number
      discount_type: string
      discount_code: string
    }[]
    item_products: {
      quantity: number
      price: number
      productId: string
    }[]
  }[]
  cartId: string
  userId: string
  delivery_info: {
    personal_detail: {
      name: string
      phone: string
      email: string
    }
    shipping_address: {
      province_city: string
      district: string
      ward: string
      street: string
    }
  }
  user_payment: string
}
