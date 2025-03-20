import { NextFunction, Request, Response } from 'express'
import sellerService from '~/services/sellers.services'
import { SELLER_MESSAGES } from '~/constants/messages'
import Seller from '~/models/schemas/Seller.schema'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/users.requests'
export const createSeller = async (req: Request<ParamsDictionary, any, Seller>, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await sellerService.createSeller(user_id.toString(), req.body)
  res.json({
    message: SELLER_MESSAGES.CREATE_SELLER_SUCCESS,
    result
  })
  return
}

export const updateSeller = async (req: Request<ParamsDictionary, any, Seller>, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await sellerService.updateSeller(user_id.toString(), req.params.seller_id, req.body)
  res.json({
    message: SELLER_MESSAGES.UPDATE_SELLER_SUCCESS,
    result
  })
  return
}

export const getAllRestaurantByUserId = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await sellerService.getAllSellerByUserId(user_id.toString())
  res.json({
    message: SELLER_MESSAGES.GET_ALL_SELLER_SUCCESS,
    result
  })
  return
}

export const getAllSeller = async (req: Request, res: Response, next: NextFunction) => {
  const result = await sellerService.getAll(req.query)
  res.json({
    message: SELLER_MESSAGES.GET_ALL_SELLER_SUCCESS,
    result
  })
  return
}
export const deleteSeller = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload
  const user_id = user.user_id
  const result = await sellerService.deleteSeller(user_id.toString(), req.params.seller_id)
  res.json({
    message: SELLER_MESSAGES.DELETE_SELLER_SUCCESS,
    result
  })
  return
}
