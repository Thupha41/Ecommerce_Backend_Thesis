import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { checkOutDeliveryInformation, checkOutReviewOrder, placeOrder } from '~/controllers/orders.controllers'
const ordersRouter = Router()

//authentication
ordersRouter.use(accessTokenValidator)

/**
 * Description: Checkout review order
 * Path: /orders/checkout-review
 * Method: POST
 * Body: {
 *  cartId: string,
    shop_order_ids: [
        {
            shopId: string,
            shop_discounts: [],
            item_products: [
                {
                    productId: string,
                    price: number,
                    quantity: number
                }
            ]
        }
    ]
 * }
 */
ordersRouter.post('/checkout/checkout-review', wrapRequestHandler(checkOutReviewOrder))

/**
 * Description: Checkout delivery information
 * Path: /orders/checkout/delivery-information
 * Method: POST
 */
ordersRouter.post('/checkout/delivery-information', wrapRequestHandler(checkOutDeliveryInformation))

/**
 * Description: Place order
 * Path: /orders/place-order
 * Method: POST
 */
ordersRouter.post('/', wrapRequestHandler(placeOrder))
export default ordersRouter
