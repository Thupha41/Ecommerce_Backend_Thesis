import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  addToCart,
  updateCart,
  deleteUserCart,
  getListCart,
  decreaseCartItem,
  increaseCartItem
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
cartRouter.post('/', wrapRequestHandler(addToCart))

/**
 * Description: Update cart
 * Path: /update
 * Method: POST
 * Body: {userId: string, shop_order_ids: {shopId: string, item_products: {productId: string, quantity: number, old_quantity: number}[]}}
 */
cartRouter.post('/update', wrapRequestHandler(updateCart))

//authentication
// cartRouter.use(accessTokenValidator)

/**
 * Description: Delete user cart
 * Path: /
 * Method: DELETE
 * Body: {userId: string, productId: string}
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
 */
cartRouter.put('/increase/:productId', wrapRequestHandler(increaseCartItem))

/**
 * Description: Decrease cart item quantity
 * Path: /decrease/:productId
 * Method: PUT
 * params: productId
 */
cartRouter.put('/decrease/:productId', wrapRequestHandler(decreaseCartItem))
export default cartRouter
