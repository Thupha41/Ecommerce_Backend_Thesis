import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  addToCartController,
  deleteUserCart,
  getListCart,
  decreaseCartItem,
  increaseCartItem,
  updateCartController
} from '~/controllers/carts.controllers'
const cartRouter = Router()
import { accessTokenValidator } from '~/middlewares/users.middlewares'
cartRouter.use(accessTokenValidator)
//get amount of discount
/**
 * Description: Add to cart
 * Path: /
 * Method: POST
 * Body: {userId: string, product: ICartProduct}
 */
cartRouter.post('/', wrapRequestHandler(addToCartController))

/**
 * Description: Exact update of cart item quantity
 * Path: /exact-update
 * Method: PUT
 * Body: {product: {product_id: string, product_quantity: number, old_quantity: number, shopId: string, sku_id?: string}}
 */
cartRouter.put('/update', wrapRequestHandler(updateCartController))

//authentication
// cartRouter.use(accessTokenValidator)

/**
 * Description: Delete user cart
 * Path: /
 * Method: DELETE
 * Body: {userId: string, productId: string, sku_id?: string}
 * Note: sku_id is required for variant products to delete specific variants
 */
cartRouter.delete('/', wrapRequestHandler(deleteUserCart))

/**
 * Description: Get list cart
 * Path: /
 * Method: GET
 * Query: userId
 */
cartRouter.get('/', wrapRequestHandler(getListCart))

/**
 * Description: Increase cart item quantity
 * Path: /increase/:productId
 * Method: PUT
 * params: productId
 * query: sku_id (optional - for variant products)
 */
cartRouter.put('/increase/:productId', wrapRequestHandler(increaseCartItem))

/**
 * Description: Decrease cart item quantity
 * Path: /decrease/:productId
 * Method: PUT
 * params: productId
 * query: sku_id (optional - for variant products)
 */
cartRouter.put('/decrease/:productId', wrapRequestHandler(decreaseCartItem))
export default cartRouter
