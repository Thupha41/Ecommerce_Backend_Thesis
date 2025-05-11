export interface ICartItemProduct {
  product_id: string
  product_quantity: number
  product_price?: number
  shopId: string
  name?: string
  product_thumb?: string
  sku_id?: string
  attributes?: Array<{ name: string; value: string }>
  variants?: Array<{ name: string; value: string }>
}

export interface IUpdateCartProduct extends ICartItemProduct {
  old_quantity: number
  new_sku_id?: string
}

export interface AddToCartReqBody {
  product: ICartItemProduct
}

export interface UpdateCartReqBody {
  product: IUpdateCartProduct
}

export interface GetListCartReqQuery {
  userId: string
}
