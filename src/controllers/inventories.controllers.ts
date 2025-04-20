import InventoryService from '~/services/inventories.services'
import { Request, Response, NextFunction } from 'express'
import { INVENTORY_MESSAGES } from '~/constants/messages'
import { IAddToStockRequestBody } from '~/models/requests/checkout.requests'
import { TokenPayload } from '~/models/requests/users.requests'

export const addStockToInventory = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  res.json({
    message: INVENTORY_MESSAGES.ADD_STOCK_TO_INVENTORY_SUCCESS,
    result: await InventoryService.addStockToInventory({
      ...req.body,
      shopId: user_id
    } as IAddToStockRequestBody)
  })
  return
}
