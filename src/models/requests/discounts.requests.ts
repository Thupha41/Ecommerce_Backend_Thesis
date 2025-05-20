import { ObjectId } from 'mongodb'
import { DiscountType, DiscountApplyTo } from '~/constants/enums'

export interface Product {
  productId: string
  shopId: string
  quantity: number
  price: number
}
export interface CreateDiscountCodeReqBody {
  discount_name: string
  discount_description: string
  discount_type: DiscountType
  discount_value: number
  discount_code: string
  discount_max_uses: number
  discount_max_uses_per_user: number
  discount_min_order_value: number
  discount_start_date: Date
  discount_end_date: Date
  discount_apply_to: DiscountApplyTo
  discount_products: Array<{
    product_id: ObjectId
    sku_id?: ObjectId
  }>
  discount_shopId: ObjectId
  discount_used_count: number
  discount_is_active: boolean
}

export interface GetAllDiscountCodesReqQuery {
  limit: number
  page: number
  discount_shopId: string
}

export interface GetAllDiscountCodesWithProductsReqQuery {
  limit: number
  page: number
  discount_shopId: string
  discount_code: string
}

export interface GetDiscountAmountReqBody {
  products: Product[]
  userId: string
  shopId: string
  code: string
}
