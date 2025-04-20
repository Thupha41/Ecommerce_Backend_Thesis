import { InventoryStatus } from '~/constants/enums'

export interface IInsertInventoryReq {
  productId: string
  shopId: string
  stock: number
  location?: string
  status?: InventoryStatus
}

export interface IReserveInventoryReq {
  productId: string
  quantity: number
  cartId: string
}
