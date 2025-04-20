import { acquiredLock, releaseLock } from '~/services/redis.services'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import checkoutService from './checkout.services'
import { cartRepository } from '~/models/repositories/cart.repo'
import { Sort } from 'mongodb'
import { SortDirection } from 'mongodb'
import { ObjectId } from 'mongodb'
import { OrderStatus, CartStatus } from '~/constants/enums'
import { ORDERS_MESSAGES, CARTS_MESSAGES } from '~/constants/messages'
import { orderByUserRequestBody } from '~/models/requests/order.requests'

class OrderService {
  //order
  static async orderByUser({ shop_order_ids, cartId, userId, user_address, user_payment }: orderByUserRequestBody) {
    const { shop_order_ids_new, checkout_order } = await checkoutService.checkoutReview({
      userId,
      cartId,
      shop_order_ids
    })

    //check mot lan nua xem vuot ton kho hay khong
    //get new array product
    const products = shop_order_ids_new.flatMap((order) => order.item_products).filter(Boolean) as {
      productId: string
      quantity: number
      price: number
    }[]
    console.log('>>> check products', products)
    const acquireProduct = []
    for (let i = 0; i < products.length; i++) {
      const { productId, quantity } = products[i]
      const keyLock = await acquiredLock(productId, quantity, cartId)
      acquireProduct.push(keyLock ? true : false)
      if (keyLock) {
        await releaseLock(keyLock)
      }
    }

    //check nếu có một sản phẩm hết hàng trong kho
    if (acquireProduct.includes(false)) {
      throw new ErrorWithStatus({
        message: 'Một số sản phẩm đã được cập nhật, vui lòng quay lại giỏ hàng...',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    //create new order
    const newOrder = await databaseService.orders.insertOne({
      order_userId: new ObjectId(userId),
      order_checkout: checkout_order,
      order_shipping: user_address,
      order_payment: user_payment,
      order_products: shop_order_ids_new,
      order_status: OrderStatus.Pending,
      order_trackingNumber: `#${Date.now()}`,
      order_createdAt: new Date(),
      order_updatedAt: new Date()
    })

    //Trường hợp nếu insert thành công
    if (newOrder) {
      try {
        // 1. Cập nhật trạng thái giỏ hàng sang Completed
        await databaseService.carts.updateOne(
          { _id: new ObjectId(cartId) },
          {
            $set: {
              cart_status: CartStatus.Completed,
              cart_count_product: 0,
              updated_at: new Date()
            },
            $push: {
              cart_orders: {
                order_id: newOrder.insertedId,
                status: OrderStatus.Pending
              }
            }
          }
        )

        // 2. Cập nhật số lượng trong kho (đã được khóa trước đó)
        const productInventoryUpdates = products.map(async (product: any) => {
          return databaseService.inventories.updateOne(
            { inventory_productId: new ObjectId(product.productId) },
            {
              $inc: { inventory_stock: -product.quantity },
              $set: { updated_at: new Date() }
            }
          )
        })

        await Promise.all(productInventoryUpdates)

        // 3. Thêm thông tin đơn hàng vào lịch sử người dùng (nếu cần)
        await databaseService.users.updateOne(
          { _id: new ObjectId(userId) },
          {
            $push: {
              user_orders: {
                order_id: newOrder.insertedId,
                order_date: new Date(),
                order_status: OrderStatus.Pending
              }
            }
          }
        )

        // 4. Trả về thông tin chi tiết đơn hàng đã tạo
        return {
          order_id: newOrder.insertedId,
          order_number: `#${Date.now()}`,
          order_date: new Date(),
          order_status: OrderStatus.Pending,
          order_total: checkout_order.totalCheckout,
          order_items_count: products.length,
          success: true,
          message: 'Order created successfully'
        }
      } catch (error) {
        console.error('Error in post-order processing:', error)
        throw new ErrorWithStatus({
          message: 'Order was created but post-processing failed',
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR
        })
      }
    }

    return newOrder
  }

  /*
    1> Query orders [Users]
  */
  static async getOrderByUser({ userId, cartId, shopId }: { userId: string; cartId: string; shopId: string }) {
    const foundCart = await cartRepository.findCartById(cartId)
    if (!foundCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const order = await databaseService.orders.findOne({
      order_userId: new ObjectId(userId),
      order_products: {
        $elemMatch: {
          shopId
        }
      }
    })
    return order
  }

  /*
    1> Query orders using ID [Users]
  */
  static async getOneOrderByUser(user_id: string) {
    const order = await databaseService.orders.findOne({
      order_userId: new ObjectId(user_id)
    })

    return order
  }
  /*
    1> Query all orders [Shop | Admin]
  */
  static async getAllOrders({ limit, sort, page }: { limit: number; sort: string; page: number }) {
    const sortBy: Sort = sort === 'ctime' ? { _id: -1 as SortDirection } : { _id: 1 as SortDirection }
    const orders = await databaseService.orders
      .aggregate([
        {
          $lookup: {
            from: 'Users',
            localField: 'order_userId',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $unwind: {
            path: '$user_info',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            order_checkout: 1,
            order_shipping: 1,
            order_payment: 1,
            order_products: 1,
            order_status: 1,
            order_trackingNumber: 1,
            createdAt: 1,
            updatedAt: 1,
            user_info: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1
            }
          }
        }
      ])
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    return orders
  }
  /*
    1> Cancel Order [Users]
  */
  static async cancelOrderByUser(order_id: string, user_id: string) {
    // Find order by ID and check if it exists
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(order_id),
      order_userId: new ObjectId(user_id)
    })

    if (!order) {
      throw new ErrorWithStatus({
        message: ORDERS_MESSAGES.ORDER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if order can be cancelled (only pending or confirmed orders can be cancelled)
    if (order.order_status !== OrderStatus.Pending && order.order_status !== OrderStatus.Confirmed) {
      throw new ErrorWithStatus({
        message: `Cannot cancel order in ${order.order_status} status`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get all products from the order that need to be returned to inventory
    const orderProducts = order.order_products.flatMap((shop: any) => shop.item_products)

    // Begin transaction to update order status and restore inventory
    const session = databaseService.getMongoClient().startSession()

    try {
      await session.withTransaction(async () => {
        // 1. Update order status to cancelled
        const updateResult = await databaseService.orders.findOneAndUpdate(
          { _id: new ObjectId(order_id) },
          {
            $set: {
              order_status: OrderStatus.Cancelled,
              order_updatedAt: new Date()
            }
          },
          { returnDocument: 'after', session }
        )

        if (!updateResult) {
          throw new ErrorWithStatus({
            message: 'Failed to update order status',
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR
          })
        }

        // 2. Return products to inventory
        const inventoryPromises = orderProducts.map(async (product: any) => {
          // For each product in the order, increase the inventory
          return databaseService.inventories.updateOne(
            { inventory_productId: new ObjectId(product.productId) },
            {
              $inc: { inventory_stock: product.quantity },
              $set: { updated_at: new Date() }
            },
            { session }
          )
        })

        await Promise.all(inventoryPromises)
      })
    } finally {
      await session.endSession()
    }
  }
  /*
    1> Update Order Status [Shop | Admin]
  */
  static async updateOrderStatus(order_id: string, shop_id: string, { status }: { status: OrderStatus }) {
    // Kiểm tra đơn hàng tồn tại
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(order_id)
    })

    if (!order) {
      throw new ErrorWithStatus({
        message: ORDERS_MESSAGES.ORDER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra quyền (chỉ shop có sản phẩm trong đơn hàng mới có thể cập nhật)
    // const shopExists = order.order_products.some((shopOrder: any) =>
    //   shopOrder.shopId && shopOrder.shopId.toString() === shop_id
    // )

    // if (!shopExists) {
    //   throw new ErrorWithStatus({
    //     message: 'You do not have permission to update this order',
    //     status: HTTP_STATUS.FORBIDDEN
    //   })
    // }

    // Kiểm tra trạng thái hợp lệ
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
      [OrderStatus.Confirmed]: [OrderStatus.Shipped, OrderStatus.Cancelled],
      [OrderStatus.Shipped]: [OrderStatus.Delivered],
      [OrderStatus.Delivered]: [],
      [OrderStatus.Cancelled]: []
    }

    if (!validTransitions[order.order_status].includes(status)) {
      throw new ErrorWithStatus({
        message: `Cannot update order from ${order.order_status} to ${status}`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Xử lý đặc biệt với trạng thái hủy đơn
    if (status === OrderStatus.Cancelled) {
      return this.cancelOrderByUser(order_id, order.order_userId.toString())
    }

    // Cập nhật trạng thái đơn hàng
    const session = databaseService.getMongoClient().startSession()

    try {
      await session.withTransaction(async () => {
        const updateResult = await databaseService.orders.findOneAndUpdate(
          { _id: new ObjectId(order_id) },
          {
            $set: {
              order_status: status,
              order_updatedAt: new Date()
            }
          },
          { returnDocument: 'after', session }
        )

        if (!updateResult) {
          throw new ErrorWithStatus({
            message: 'Failed to update order status',
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR
          })
        }
      })

      return { success: true, message: `Order status updated to ${status}` }
    } finally {
      await session.endSession()
    }
  }
}

export default OrderService
