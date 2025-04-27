import { Request, Response, NextFunction } from 'express'
import { ORDERS_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/users.requests'
import orderService from '~/services/order.services'
import checkoutService from '~/services/checkout.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { CheckoutReviewReqBody } from '~/models/requests/checkout.requests'
export const checkOutDeliveryInformation = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await checkoutService.checkOutDeliveryInformation(user_id.toString())
  res.json({
    message: ORDERS_MESSAGES.CHECKOUT_DELIVERY_INFORMATION_SUCCESS,
    result
  })
  return
}

export const checkOutReviewOrder = async (
  req: Request<ParamsDictionary, any, CheckoutReviewReqBody>,
  res: Response,
  next: NextFunction
) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await checkoutService.checkoutReview({
    ...req.body,
    userId: user_id.toString()
  })
  res.json({
    message: ORDERS_MESSAGES.CHECKOUT_REVIEW_ORDER_SUCCESS,
    result
  })
  return
}

export const getOrderByUser = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await orderService.getOrderByUser({
    userId: user_id.toString(),
    ...req.body
  })
  res.json({
    message: ORDERS_MESSAGES.GET_ORDER_BY_USER_SUCCESS,
    result
  })
  return
}

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  const result = await orderService.getAllOrders({
    limit: Number(req.query.limit),
    sort: String(req.query.sort),
    page: Number(req.query.page)
  })
  res.json({
    message: ORDERS_MESSAGES.GET_ALL_ORDERS_SUCCESS,
    result
  })
  return
}

export const getOneOrderByUser = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await orderService.getOneOrderByUser(user_id.toString())
  res.json({
    message: ORDERS_MESSAGES.GET_ONE_ORDER_BY_USER_SUCCESS,
    result
  })
  return
}

export const placeOrder = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await orderService.orderByUser(user_id.toString(), {
    ...req.body
  })
  res.json({
    message: ORDERS_MESSAGES.CHECKOUT_REVIEW_ORDER_SUCCESS,
    result
  })
  return
}

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await orderService.cancelOrderByUser(req.params.order_id, user_id.toString())
  res.json({
    message: ORDERS_MESSAGES.CANCEL_ORDER_SUCCESS,
    result
  })
  return
}

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await orderService.updateOrderStatus(req.params.order_id, user_id.toString(), req.body)
  res.json({
    message: ORDERS_MESSAGES.UPDATE_ORDER_STATUS_SUCCESS,
    result
  })
  return
}
