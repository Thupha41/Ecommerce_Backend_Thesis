import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { CARTS_MESSAGES } from '~/constants/messages'
import { IShopOrderIds } from '~/models/requests/checkout.requests'
import { ICartItemProduct } from '~/models/requests/carts.requests'
class OrderRepository {
  private carts = databaseService.carts

  /**
   * Kiểm tra các sản phẩm trong checkout có tồn tại trong giỏ hàng không
   * @param shop_order_ids Danh sách sản phẩm theo shop
   * @param cartId ID giỏ hàng
   * @returns Danh sách sản phẩm hợp lệ
   */
  async checkItemOrderExistInCart(shop_order_ids: IShopOrderIds[], cartId: string) {
    // Lấy giỏ hàng hiện tại
    const foundCart = await this.carts.findOne({
      _id: new ObjectId(cartId)
    })

    if (!foundCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra mỗi sản phẩm
    return await Promise.all(
      shop_order_ids.map(async (shop: IShopOrderIds) => {
        const { shopId, item_products = [] } = shop

        // Kiểm tra từng sản phẩm trong shop
        const validatedProducts = await Promise.all(
          item_products.map(async (item: { productId: string; quantity: number; price: number }) => {
            // Tìm kiếm sản phẩm trong giỏ hàng
            const cartItem = foundCart.cart_products.find(
              (product) =>
                product.product_id.toString() === item.productId && product.product_shopId?.toString() === shopId
            )

            if (!cartItem) {
              throw new ErrorWithStatus({
                message: `Product ${item.productId} is not in your cart`,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            // Kiểm tra số lượng
            if ((cartItem.product_quantity || 0) < item.quantity) {
              throw new ErrorWithStatus({
                message: `Quantity of product ${item.productId} exceeds what's in your cart`,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            if ((cartItem.product_price || 0) !== item.price) {
              throw new ErrorWithStatus({
                message: `Price of product ${item.productId} has changed`,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return {
              ...item,
              name: cartItem.product_name || ''
            }
          })
        )

        return {
          ...shop,
          item_products: validatedProducts
        }
      })
    )
  }

  /**
   * Kiểm tra tồn kho của sản phẩm
   * @param products Danh sách sản phẩm cần kiểm tra
   * @returns Danh sách sản phẩm đã kiểm tra tồn kho
   */
  // async checkInventoryAvailability(products: any[]) {
  //   return await Promise.all(
  //     products.map(async (item: any) => {
  //       const inventory = await databaseService.inventories.findOne({
  //         inventory_productId: new ObjectId(item.productId)
  //       })

  //       if (!inventory) {
  //         throw new ErrorWithStatus({
  //           message: `Inventory for product ${item.productId} not found`,
  //           status: HTTP_STATUS.NOT_FOUND
  //         })
  //       }

  //       if (inventory.inventory_stock < item.quantity) {
  //         throw new ErrorWithStatus({
  //           message: `Product ${item.productId} is out of stock. Only ${inventory.inventory_stock} available.`,
  //           status: HTTP_STATUS.BAD_REQUEST
  //         })
  //       }

  //       return item
  //     })
  //   )
  // }
}

export const orderRepository = new OrderRepository()
