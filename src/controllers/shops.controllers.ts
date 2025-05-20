import { Request, Response } from 'express'
import { SHOP_MESSAGES } from '~/constants/messages'
import { GetProductsByShopOptions, IUpsertShopReqBody } from '~/models/requests/shops.requests'
import { TokenPayload } from '~/models/requests/users.requests'
import shopService from '~/services/shops.services'

export const createShopController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await shopService.createShop(user_id, req.body as IUpsertShopReqBody)
  res.json({
    message: SHOP_MESSAGES.CREATE_SHOP_SUCCESS,
    result
  })
}

export const updateShopController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await shopService.updateShop(user_id, req.params.shop_id as string, req.body as IUpsertShopReqBody)
  res.json({
    message: SHOP_MESSAGES.UPDATE_SHOP_SUCCESS,
    result
  })
}

export const deleteShopController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await shopService.deleteShop(user_id, req.params.shop_id as string)
  res.json({
    message: SHOP_MESSAGES.DELETE_SHOP_SUCCESS,
    result
  })
}

export const getShopProductsController = async (req: Request, res: Response) => {
  const { shop_id } = req.params // Lấy shopId từ URL parameter
  const { sortBy = 'created_at', limit = '20', page = '1' } = req.query // Lấy các tham số từ query string

  // Chuyển đổi các tham số sang kiểu số cho limit và page
  const options: GetProductsByShopOptions = {
    sortBy: sortBy as 'sold_quantity' | 'created_at' | 'price_asc' | 'price_desc',
    limit: parseInt(limit as string) || 20,
    page: parseInt(page as string) || 1
  }

  // Gọi service để lấy danh sách sản phẩm
  const result = await shopService.getProductsByShop(shop_id, options)

  res.json({
    message: SHOP_MESSAGES.GET_SHOP_PRODUCTS_SUCCESS,
    result
  })
  return
}

export const getShopByIdController = async (req: Request, res: Response) => {
  const { shop_id } = req.params
  const result = await shopService.getShopByIdOrSlug(shop_id)
  res.json({
    message: SHOP_MESSAGES.GET_SHOP_SUCCESS,
    result
  })
}

export const getAllShopsController = async (req: Request, res: Response) => {
  const result = await shopService.getAllShops()
  res.json({
    message: SHOP_MESSAGES.GET_ALL_SHOPS_SUCCESS,
    result
  })
}
