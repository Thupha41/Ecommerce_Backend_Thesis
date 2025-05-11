import { cartRepository } from '~/models/repositories/cart.repo'
import discountService from '~/services/discounts.services'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { CheckoutReviewReqBody } from '~/models/requests/checkout.requests'
import DeliveryInfoService from './deliveryInfo.services'
import { USERS_MESSAGES, CARTS_MESSAGES, DELIVERY_INFO_MESSAGES } from '~/constants/messages'
import { ObjectId } from 'mongodb'
import { orderRepository } from '~/models/repositories/order.repo'
class CheckoutService {
  // async createOrder(orderData) {
  //     const order = await Order.create(orderData);
  //     return order;
  // }

  /*
        {
            cartId,
            userId,
            shop_order_ids: [
                {
                    shopId,
                    shop_discounts: [],
                    item_products: {
                        price,
                        quantity,
                        productId,
                        product_thumb
                    }
                },
                {
                    shopId,
                    shop_discounts: [
                        {
                            discount_id,
                            discount_type,
                            discount_value,
                            discount_code,
                            shopId
                        }
                    ],
                    item_products: {
                        price,
                        quantity,
                        productId,
                        product_thumb
                    }
                },
            ]
        }

    */

  /**
   * Kiểm tra đơn hàng trước khi thanh toán
   * @param userId - ID của người dùng
   * @param cartId - ID của giỏ hàng
   * @param shop_order_ids - Danh sách các shop và sản phẩm trong giỏ hàng
   * @param orderStatus - Trạng thái đơn hàng
   * @param orderTotal - Tổng tiền đơn hàng
   * @param orderItems - Danh sách sản phẩm trong đơn hàng
   * @param orderAddress - Địa chỉ giao hàng
   * @returns
   */
  /*
  Tất cả các step đều được thực hiện trong service này
  - Kiểm tra user
  - Kiểm tra cart
  - Kiểm tra đơn hàng
  - Tính toán tổng tiền
  - Tính toán tổng tiền sau khi giảm giá
  - Tính toán tổng tiền sau khi tính phí vận chuyển
  - Tính toán tổng tiền sau khi thanh toán
  */
  async checkoutReview({ userId, cartId, shop_order_ids, orderStatus, orderTotal }: CheckoutReviewReqBody) {
    //STEP 1: check user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(userId)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //STEP 2: check cart id exist
    const foundCart = await cartRepository.findCartById(cartId)
    if (!foundCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    //STEP 3: init checkout order
    const checkout_order = {
      totalPrice: 0, //tong tien hang
      feeShip: 0,
      totalDiscount: 0,
      totalCheckout: 0 //tong thanh toan
    }

    //check item order exist in cart and get validated products with complete information
    const validatedOrderItems = await orderRepository.checkItemOrderExistInCart(shop_order_ids, cartId)
    console.log('>>> validatedOrderItems', validatedOrderItems)

    // Update shop_order_ids with validated items that include product_thumb
    const updatedShopOrderIds = await Promise.all(validatedOrderItems.map(async (shop, index) => {
      const originalShop = shop_order_ids[index];
      const updatedItems = await Promise.all(shop.item_products.map(async (item) => {
        // Lấy thông tin sản phẩm gốc để lấy name, product_thumb mặc định
        const product = await databaseService.productSPUs.findOne({ _id: new ObjectId(item.productId) });
        let baseProductThumb = product?.product_thumb || '';
        let baseName = product?.product_name || '';
        if (item && typeof item === 'object' && 'sku_id' in item && item.sku_id && typeof item.sku_id === 'string') {
          // Lấy thông tin SKU
          const sku = await databaseService.productSKUs.findOne({ _id: new ObjectId(item.sku_id) });
          let variants = undefined;
          let product_thumb = baseProductThumb;
          if (sku) {
            // Lấy variant
            if (sku.sku_tier_idx && product && product.product_variations) {
              variants = sku.sku_tier_idx.map((idx, i) => {
                const variation = product.product_variations[i];
                return {
                  name: variation.name,
                  value: variation.options[idx]
                };
              });
            }
            // Nếu có sku_image thì dùng làm product_thumb
            if (sku.sku_image) {
              product_thumb = sku.sku_image;
            }
            return {
              price: item.price,
              quantity: item.quantity,
              productId: item.productId,
              product_thumb: product_thumb,
              name: baseName,
              sku_id: item.sku_id,
              variants: variants
            };
          }
        }
        // Không có sku_id, trả về định dạng chuẩn
        return {
          price: item.price,
          quantity: item.quantity,
          productId: item.productId,
          product_thumb: baseProductThumb,
          name: baseName
        };
      }));
      return {
        ...originalShop,
        item_products: updatedItems
      };
    }));

    //STEP 4: tinh tong tien bill
    const shop_order_ids_new = []
    //tinh tong tien bill
    for (let i = 0; i < updatedShopOrderIds.length; i++) {
      const { shopId, shop_discounts = [], item_products = [] } = updatedShopOrderIds[i]

      //tong tien don hang - we can use the validated products directly since price was verified in checkItemOrderExistInCart
      const totalProductsPrice = item_products.reduce((total, current) => {
        return total + (current?.price || 0) * (current?.quantity || 0)
      }, 0)

      //tong tien trc khi xu ly
      checkout_order.totalPrice += totalProductsPrice

      const checkout_order_detail = {
        shopId,
        shop_discounts,
        priceRaw: totalProductsPrice, //tien truoc khi giam gia
        priceApplyDiscount: totalProductsPrice, //tien sau khi giam gia
        item_products
      }

      //STEP 5: neu shop_discounts ton tai  > 0 thi check xem co hop le hay khong
      if (shop_discounts.length > 0) {
        const { totalPrice = 0, discount_amount = 0 } = await discountService.getDiscountAmount({
          products: item_products.filter(Boolean) as any,
          userId,
          shopId,
          code: shop_discounts[0].discount_code
        })
        checkout_order.totalDiscount += discount_amount
        //Neu tien giam gia > 0
        if (discount_amount > 0) {
          checkout_order_detail.priceApplyDiscount = totalProductsPrice - discount_amount
        }
      }
      //STEP 6: tong thanh toan cuoi cung
      checkout_order.totalCheckout += checkout_order_detail.priceApplyDiscount
      shop_order_ids_new.push(checkout_order_detail)

      //STEP 7: Kiểm tra thông tin giao hàng
      const delivery_info = await this.checkOutDeliveryInformation(userId)
      const shipping_information = {
        personal_detail: {
          name: delivery_info.personal_detail.name,
          phone: delivery_info.personal_detail.phone
        },
        shipping_address: delivery_info.shipping_address
      }

      return {
        shop_order_ids: updatedShopOrderIds,
        shop_order_ids_new,
        checkout_order,
        shipping_information: shipping_information,
        orderStatus,
        orderTotal
      }
    }
  }
  async checkOutDeliveryInformation(user_id: string) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const shipping_address = await DeliveryInfoService.getDeliveryDefault(user_id)
    return shipping_address
  }
}

const checkoutService = new CheckoutService()
export default checkoutService
