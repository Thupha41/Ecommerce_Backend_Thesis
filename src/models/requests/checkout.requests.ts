import { OrderStatus } from '~/constants/enums'
export interface IShopOrderIds {
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
}
export interface CheckoutReviewReqBody {
  userId: string
  cartId: string
  shop_order_ids: IShopOrderIds[]
  orderId?: string
  orderAddress?: {
    province_city: string
    district: string
    ward: string
    street: string
  }
  orderStatus?: OrderStatus
  orderTotal?: number
  orderItems?: {
    productId: string
    quantity: number
  }[]
}

export interface IAddToStockRequestBody {
  stock: number
  productId: string
  location?: string
  shopId?: string
}

export interface ICheckoutProduct {
  price: number
  quantity: number
  productId: string
}
