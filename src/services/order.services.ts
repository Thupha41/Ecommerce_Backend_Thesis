import { acquiredLock, releaseLock } from '~/services/redis.services'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import checkoutService from './checkout.services'
import { cartRepository } from '~/models/repositories/cart.repo'
import cartService from './carts.services'
import { Sort } from 'mongodb'
import { SortDirection } from 'mongodb'
import { ObjectId } from 'mongodb'
import { OrderStatus, CartStatus } from '~/constants/enums'
import { ORDERS_MESSAGES, CARTS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { orderByUserRequestBody } from '~/models/requests/order.requests'

class OrderService {
  //order
  static async orderByUser(
    userId: string,
    { shop_order_ids, cartId, delivery_info, user_payment }: orderByUserRequestBody
  ) {
    // Khởi tạo mảng để theo dõi khóa đã lấy được, cần giải phóng khi hoàn tất hoặc gặp lỗi
    const acquiredLocks: string[] = [];

    try {
      //check user exist
      const user = await databaseService.users.findOne({
        _id: new ObjectId(userId)
      })
      if (!user) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      const checkoutReviewResult = await checkoutService.checkoutReview({
        userId,
        cartId,
        shop_order_ids
      })
      // Kiểm tra và lấy dữ liệu từ kết quả
      if (!checkoutReviewResult) {
        throw new ErrorWithStatus({
          message: 'Failed to process checkout review',
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR
        })
      }

      const { shop_order_ids_new, checkout_order } = checkoutReviewResult

      //Lấy danh sách sản phẩm từ đơn hàng
      const products = shop_order_ids_new
        .flatMap(
          (order: {
            shopId: string
            shop_discounts: any[]
            item_products: {
              productId: string
              quantity: number
              price: number
              sku_id?: string
            }[]
          }) => order.item_products
        )
        .filter(Boolean) as {
          productId: string
          quantity: number
          price: number
          sku_id?: string
        }[]

      // Kiểm tra tồn kho và lấy khóa cho tất cả sản phẩm trong một vòng lặp duy nhất
      // const outOfStockProducts = [];
      // for (let i = 0; i < products.length; i++) {
      //   const { productId, quantity, sku_id } = products[i];
      //   const keyLock = await acquiredLock(productId, quantity, cartId);

      //   if (!keyLock) {
      //     // Thêm sản phẩm vào danh sách hết hàng
      //     if (sku_id) {
      //       outOfStockProducts.push(`${productId} (SKU: ${sku_id})`);
      //     } else {
      //       outOfStockProducts.push(productId);
      //     }
      //   } else {
      //     // Lưu lại khóa để giải phóng sau khi hoàn tất
      //     acquiredLocks.push(keyLock);
      //   }
      // }

      // // Nếu có sản phẩm hết hàng, giải phóng tất cả khóa và báo lỗi
      // if (outOfStockProducts.length > 0) {
      //   throw new ErrorWithStatus({
      //     message: `Các sản phẩm sau đã hết hàng hoặc không đủ số lượng: ${outOfStockProducts.join(', ')}`,
      //     status: HTTP_STATUS.BAD_REQUEST
      //   });
      // }

      // Khởi tạo session để sử dụng transaction
      const session = databaseService.getMongoClient().startSession();

      try {
        let result;

        // Sử dụng transaction để đảm bảo tính nhất quán
        await session.withTransaction(async () => {
          // 1. Tạo đơn hàng
          const newOrder = await databaseService.orders.insertOne({
            order_userId: new ObjectId(userId),
            order_checkout: checkout_order,
            order_shipping: delivery_info,
            order_payment: user_payment,
            order_products: shop_order_ids_new,
            order_status: OrderStatus.Pending,
            order_trackingNumber: `#${Date.now()}`,
            order_createdAt: new Date(),
            order_updatedAt: new Date()
          }, { session });

          // 2. Cập nhật tồn kho
          const productInventoryUpdates = products.map(async (product: any) => {
            if ('sku_id' in product && product.sku_id) {
              // Với sản phẩm có SKU, cập nhật số lượng ở 3 nơi: SKU, SPU và inventory
              return Promise.all([
                // 1. Cập nhật sku_stock trong bảng productSKUs
                databaseService.productSKUs.updateOne(
                  { _id: new ObjectId(product.sku_id) },
                  {
                    $inc: { sku_stock: -product.quantity },
                    $set: { updated_at: new Date() }
                  },
                  { session }
                ),
                // 2. Cập nhật product_quantity trong bảng productSPUs
                databaseService.productSPUs.updateOne(
                  { _id: new ObjectId(product.productId) },
                  {
                    $inc: { product_quantity: -product.quantity },
                    $set: { updated_at: new Date() }
                  },
                  { session }
                ),
                // 3. Cập nhật inventory_stock trong bảng inventories
                databaseService.inventories.updateOne(
                  { inventory_productId: new ObjectId(product.productId) },
                  {
                    $inc: { inventory_stock: -product.quantity },
                    $set: { updated_at: new Date() }
                  },
                  { session }
                )
              ]);
            } else {
              // Với sản phẩm không có SKU, chỉ cập nhật ở SPU và inventory
              return Promise.all([
                // 1. Cập nhật product_quantity trong bảng productSPUs
                databaseService.productSPUs.updateOne(
                  { _id: new ObjectId(product.productId) },
                  {
                    $inc: { product_quantity: -product.quantity },
                    $set: { updated_at: new Date() }
                  },
                  { session }
                ),
                // 2. Cập nhật inventory_stock trong bảng inventories
                databaseService.inventories.updateOne(
                  { inventory_productId: new ObjectId(product.productId) },
                  {
                    $inc: { inventory_stock: -product.quantity },
                    $set: { updated_at: new Date() }
                  },
                  { session }
                )
              ]);
            }
          });

          await Promise.all(productInventoryUpdates);

          // Lưu lại kết quả để trả về
          result = {
            _id: newOrder.insertedId,
            order_number: `#${Date.now()}`,
            order_date: new Date(),
            order_status: OrderStatus.Pending,
            order_total: checkout_order.totalCheckout,
            order_items_count: products.length,
            order_products: shop_order_ids_new,
            order_checkout: checkout_order,
            order_shipping: delivery_info,
            order_payment: user_payment,
            success: true,
            message: 'Order created successfully'
          };
        });

        // Sau khi transaction thành công, xóa sản phẩm khỏi giỏ hàng
        // Lưu ý: Thao tác này được thực hiện ngoài transaction vì nếu có lỗi,
        // đơn hàng vẫn đã được tạo thành công và không cần rollback
        const deleteCartPromises = products.map(async (product: any) => {
          if ('sku_id' in product && product.sku_id) {
            await cartService.deleteUserCart(userId, product.productId, product.sku_id);
          } else {
            await cartService.deleteUserCart(userId, product.productId);
          }
        });

        await Promise.all(deleteCartPromises);

        return result;
      } finally {
        // Kết thúc session bất kể thành công hay thất bại
        await session.endSession();
      }
    } catch (error) {
      console.error('Error in orderByUser:', error);
      throw error;
    } finally {
      // Giải phóng tất cả khóa đã lấy được
      for (const lock of acquiredLocks) {
        await releaseLock(lock);
      }
    }
  }

  static async getOrdersByUser(userId: string, status: OrderStatus) {
    // Kiểm tra người dùng tồn tại
    const user = await databaseService.users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Truy vấn đơn hàng theo userId và status
    const orders = await databaseService.orders
      .find({
        order_userId: new ObjectId(userId),
        order_status: status,
      })
      .toArray();

    if (!orders || orders.length === 0) {
      return {
        message: `No orders found with status ${status}`,
        orders: [],
      };
    }

    // Trả về danh sách đơn hàng
    return {
      message: `Orders with status ${status} retrieved successfully`,
      result: orders.map((order) => ({
        _id: order._id,
        order_userId: order.order_userId,
        order_trackingNumber: order.order_trackingNumber,
        order_products: order.order_products,
        order_status: order.order_status,
      })),
    };
  }

  static async getOrderDetailByUser(userId: string, orderId: string) {
    // Kiểm tra người dùng tồn tại
    const user = await databaseService.users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Truy vấn chi tiết đơn hàng
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(orderId),
      order_userId: new ObjectId(userId),
    });

    if (!order) {
      throw new ErrorWithStatus({
        message: ORDERS_MESSAGES.ORDER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Xử lý dữ liệu để phù hợp với giao diện
    const orderDetail = {
      _id: order._id.toString(),
      order_userId: order.order_userId.toString(),
      order_trackingNumber: order.order_trackingNumber,
      order_status: order.order_status,
      order_checkout: order.order_checkout,
      order_payment: order.order_payment,
      order_shipping: order.order_shipping,
      order_products: order.order_products,
      order_createdAt: order.order_createdAt,
      order_updatedAt: order.order_updatedAt,
      actions: {
        can_cancel: order.order_status === OrderStatus.Pending || order.order_status === OrderStatus.Confirmed,
        contact_shop: true,
        view_details: true,
      },
    };

    return orderDetail
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
