import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import DiscountService from '../services/discounts.services.js'
import { DISCOUNTS_MESSAGES } from '../constants/messages.js'
import { TokenPayload } from '~/models/requests/users.requests.js'
import {
  GetAllDiscountCodesReqQuery,
  GetAllDiscountCodesWithProductsReqQuery
} from '~/models/requests/discounts.requests.js'
export const createDiscountCode = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  res.json({
    message: 'Create discount code success',
    result: await DiscountService.createDiscountCode({
      ...req.body,
      discount_shopId: user_id
    })
  })
  return
}
export const getAllDiscountCodes = async (
  req: Request<ParamsDictionary, any, any, GetAllDiscountCodesReqQuery>,
  res: Response,
  next: NextFunction
) => {
  res.json({
    message: DISCOUNTS_MESSAGES.GET_ALL_DISCOUNT_CODES_SUCCESS,
    result: await DiscountService.getAllDiscountCodeOfShop({
      ...req.query
    })
  })
  return
}
export const getDiscountAmount = async (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: DISCOUNTS_MESSAGES.GET_DISCOUNT_AMOUNT_SUCCESS,
    result: await DiscountService.getDiscountAmount(req.body)
  })
  return
}
export const getAllDiscountCodesWithProducts = async (
  req: Request<ParamsDictionary, any, any, GetAllDiscountCodesWithProductsReqQuery>,
  res: Response,
  next: NextFunction
) => {
  res.json({
    message: DISCOUNTS_MESSAGES.GET_ALL_DISCOUNT_CODES_WITH_PRODUCTS_SUCCESS,
    result: await DiscountService.getAllDiscountCodesWithProducts({
      ...req.query
    })
  })
  return
}
export const cancelDiscountCode = async (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: DISCOUNTS_MESSAGES.CANCEL_DISCOUNT_CODE_SUCCESS,
    result: await DiscountService.cancelDiscountCode(req.body)
  })
  return
}
export const deleteDiscountCode = async (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: DISCOUNTS_MESSAGES.DELETE_DISCOUNT_CODE_SUCCESS,
    result: await DiscountService.deleteDiscountCode(req.body)
  })
  return
}
