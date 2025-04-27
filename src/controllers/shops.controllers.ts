import { Request, Response } from "express"
import { SHOP_MESSAGES } from "~/constants/messages"
import { IUpsertShopReqBody } from "~/models/requests/shops.requests"
import { TokenPayload } from "~/models/requests/users.requests"
import shopService from "~/services/shops.services"

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