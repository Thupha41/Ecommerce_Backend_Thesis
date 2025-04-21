export interface ICartItemProduct {
  product_id: string
  product_quantity: number
  product_price?: number
  shopId?: string
  name?: string
  product_thumb?: string
}
export interface AddToCartReqBody {
  product: ICartItemProduct
}
// {
//   "userId": 1,
//   "shop_order_ids": [
//       {
//           "shopId": "67c13d710a8c0b6ee3abb032",
//           "item_products": [
//               {
//                   "quantity": 2,
//                   "price": 10,
//                   "shopId": "67c13d710a8c0b6ee3abb032",
//                   "old_quantity": 4,
//                   "productId": "67c2e47428b1594dec0ce6d8"
//               }
//           ],
//           "version": 2000
//       }
//   ]
// }
export interface UpdateCartReqBody {
  shop_order_ids: {
    shopId: string
    item_products: {
      product_quantity: number
      product_price: number
      shopId: string
      old_quantity: number
      productId: string
    }[]
    version: number
  }[]
}

export interface GetListCartReqQuery {
  userId: string
}
