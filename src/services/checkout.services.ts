import { cartRepository } from '~/models/repositories/cart.repo'
import { productRepository } from '~/models/repositories/products.repo'
import discountService from '~/services/discounts.services'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { CheckoutReviewReqBody } from '~/models/requests/checkout.requests'
import DeliveryInfoService from './deliveryInfo.services'
import { USERS_MESSAGES, CARTS_MESSAGES, PRODUCTS_MESSAGES } from '~/constants/messages'
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
                        productId
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
                        productId
                    }
                },
            ]
        }

    */
  async checkoutReview({
    userId,
    cartId,
    shop_order_ids,
    orderStatus,
    orderTotal,
    orderItems,
    orderAddress
  }: CheckoutReviewReqBody) {
    //check user
    const user = await databaseService.users.findOne({
      user_id: new ObjectId(userId)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //check cart id exist
    const foundCart = await cartRepository.findCartById(cartId)
    if (!foundCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const checkout_order = {
      totalPrice: 0, //tong tien hang
      feeShip: 0,
      totalDiscount: 0,
      totalCheckout: 0 //tong thanh toan
    }
    //check item order exist in cart
    const checkItemOrderExistInCart = await orderRepository.checkItemOrderExistInCart(shop_order_ids, cartId)
    console.log('>>> checkItemOrderExistInCart', checkItemOrderExistInCart)
    const shop_order_ids_new = []
    //tinh tong tien bill
    for (let i = 0; i < shop_order_ids.length; i++) {
      const { shopId, shop_discounts = [], item_products = [] } = shop_order_ids[i]
      //check product available
      const checkProductServer = await productRepository.checkProductByServer(item_products)
      console.log('>>> checkProductServer', checkProductServer)
      if (!checkProductServer[0]) {
        throw new ErrorWithStatus({
          message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      //tong tien don hang
      const totalProductsPrice = checkProductServer.reduce((total, current) => {
        return total + (current?.price || 0) * (current?.quantity || 0)
      }, 0)

      //tong tien trc khi xu ly
      checkout_order.totalPrice += totalProductsPrice

      const checkout_order_detail = {
        shopId,
        shop_discounts,
        priceRaw: totalProductsPrice, //tien truoc khi giam gia
        priceApplyDiscount: totalProductsPrice, //tien sau khi giam gia
        item_products: checkProductServer
      }
      //neu shop_discounts ton tai  > 0 thi check xem co hop le hay khong
      if (shop_discounts.length > 0) {
        const { totalPrice = 0, discount_amount = 0 } = await discountService.getDiscountAmount({
          products: checkProductServer.filter(Boolean) as any,
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
      //tong thanh toan cuoi cung
      checkout_order.totalCheckout += checkout_order_detail.priceApplyDiscount
      shop_order_ids_new.push(checkout_order_detail)
    }
    return {
      shop_order_ids,
      shop_order_ids_new,
      checkout_order,
      orderAddress,
      orderStatus,
      orderTotal,
      orderItems
    }
  }

  async checkOutDeliveryInformation(user_id: string) {
    const personal_detail = await databaseService.users.findOne({
      user_id: new ObjectId(user_id)
    })
    if (!personal_detail) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const shipping_address = await DeliveryInfoService.getDeliveryDefault(user_id)
    return {
      personal_detail,
      shipping_address
    }
  }
}

const checkoutService = new CheckoutService()
export default checkoutService
