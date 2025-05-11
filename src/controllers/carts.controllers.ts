import cartService from '~/services/carts.services'
import { Request, Response, NextFunction } from 'express'
import { CARTS_MESSAGES } from '~/constants/messages'
import { ParamsDictionary } from 'express-serve-static-core'
import { AddToCartReqBody, GetListCartReqQuery, UpdateCartReqBody } from '~/models/requests/carts.requests'
import { TokenPayload } from '~/models/requests/users.requests'

export const addToCartController = async (
  req: Request<ParamsDictionary, any, AddToCartReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  res.json({
    message: CARTS_MESSAGES.ADD_TO_CART_SUCCESS,
    result: await cartService.addToCart(user_id, {
      ...req.body
    })
  })
  return
}

export const deleteUserCart = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.decoded_authorization?.user_id as string
  const { productId, sku_id } = req.body

  res.json({
    message: CARTS_MESSAGES.DELETE_CART_SUCCESS,
    result: await cartService.deleteUserCart(userId, productId, sku_id)
  })
  return
}

export const getListCart = async (
  req: Request<ParamsDictionary, any, any, GetListCartReqQuery>,
  res: Response,
  next: NextFunction
) => {
  res.json({
    message: CARTS_MESSAGES.GET_CART_SUCCESS,
    result: await cartService.getListCart(req.query)
  })
  return
}

export const increaseCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.decoded_authorization?.user_id as string
  const { productId } = req.params
  const { sku_id } = req.query

  res.json({
    message: CARTS_MESSAGES.UPDATE_CART_SUCCESS,
    result: await cartService.increaseCartItemQuantity(userId, productId, sku_id as string | undefined)
  })
  return
}

export const decreaseCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { productId } = req.params
  const { sku_id } = req.query

  res.json({
    message: CARTS_MESSAGES.UPDATE_CART_SUCCESS,
    result: await cartService.decreaseCartItemQuantity(user_id, productId, sku_id as string | undefined)
  })
  return
}

export const updateCartController = async (
  req: Request<ParamsDictionary, any, UpdateCartReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  res.json({
    message: CARTS_MESSAGES.UPDATE_CART_SUCCESS,
    result: await cartService.updateCartQuantity(user_id, {
      ...req.body
    })
  })
  return
}
