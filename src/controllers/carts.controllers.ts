import cartService from '~/services/carts.services'
import { Request, Response, NextFunction } from 'express'
import { CARTS_MESSAGES } from '~/constants/messages'
import { ParamsDictionary } from 'express-serve-static-core'
import { AddToCartReqBody, UpdateCartReqBody, GetListCartReqQuery } from '~/models/requests/carts.requests'
export const addToCart = async (
  req: Request<ParamsDictionary, any, AddToCartReqBody>,
  res: Response,
  next: NextFunction
) => {
  const userId = req.decoded_authorization?.user_id as string
  res.json({
    message: CARTS_MESSAGES.ADD_TO_CART_SUCCESS,
    result: await cartService.addToCart(userId, {
      ...req.body
    })
  })
  return
}

export const updateCart = async (
  req: Request<ParamsDictionary, any, UpdateCartReqBody>,
  res: Response,
  next: NextFunction
) => {
  const userId = req.decoded_authorization?.user_id as string
  res.json({
    message: CARTS_MESSAGES.UPDATE_CART_SUCCESS,
    result: await cartService.addToCartV2(userId, {
      ...req.body
    })
  })
  return
}

export const deleteUserCart = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.decoded_authorization?.user_id as string
  res.json({
    message: CARTS_MESSAGES.DELETE_CART_SUCCESS,
    result: await cartService.deleteUserCart(userId, req.body.productId)
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

  res.json({
    message: CARTS_MESSAGES.UPDATE_CART_SUCCESS,
    result: await cartService.increaseCartItemQuantity(userId, productId)
  })
  return
}

export const decreaseCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.decoded_authorization?.user_id as string
  const { productId } = req.params

  res.json({
    message: CARTS_MESSAGES.UPDATE_CART_SUCCESS,
    result: await cartService.decreaseCartItemQuantity(userId, productId)
  })
  return
}
