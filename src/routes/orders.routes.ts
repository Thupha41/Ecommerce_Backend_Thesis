import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import {
    checkOutDeliveryInformation,
    checkOutReviewOrder,
    placeOrder,
    getOrderByUser,
    getAllOrders,
    getOneOrderByUser,
    cancelOrder,
    updateOrderStatus,
    getOrdersByStatusController,
    getOrderDetailController
} from '~/controllers/orders.controllers'

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

/**
 * Description: Get orders by user
 * Path: /orders/user
 * Method: GET
 * Body: { cartId: string, shopId: string }
 */
ordersRouter.get('/user', wrapRequestHandler(getOrderByUser))

/**
 * Description: Get one order by user
 * Path: /orders/user/order
 * Method: GET
 */
ordersRouter.get('/user/order', wrapRequestHandler(getOneOrderByUser))

/**
 * Description: Get all orders (admin/shop)
 * Path: /orders/all
 * Method: GET
 * Query: { limit: number, sort: string, page: number }
 */
ordersRouter.get('/all', wrapRequestHandler(getAllOrders))

/**
 * Description: Cancel order
 * Path: /orders/:order_id/cancel
 * Method: PATCH
 */
ordersRouter.patch('/:order_id/cancel', wrapRequestHandler(cancelOrder))

/**
 * Description: Update order status
 * Path: /orders/:order_id/status
 * Method: PATCH
 * Body: { status: OrderStatus }
 */
ordersRouter.patch('/:order_id/status', wrapRequestHandler(updateOrderStatus))



ordersRouter.get('/', accessTokenValidator, wrapRequestHandler(getOrdersByStatusController));

ordersRouter.get('/:orderId', accessTokenValidator, wrapRequestHandler(getOrderDetailController));

export default ordersRouter
