/**
 * Discount services
 * 1/ generator discount shop [shop | admin]
 * 2/ get discount amount || get all discount codes [user]
 * 3/ get all discount codes || get all product by discount code [user | shop | admin]
 * 4/ Verify discount code [user]
 * 5/ delete discount code [Admin | Shop]
 * 6/ Cancel discount code [user]
 */
import databaseService from './database.services'
import { CreateDiscountCodeReqBody, GetDiscountAmountReqBody } from '~/models/requests/discounts.requests'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import { DISCOUNTS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import { checkDiscountExist, findAllDiscountCodeUnselect } from '~/models/repositories/discount.repo'
import { productRepository } from '~/models/repositories/products.repo'

// Add these interfaces at the top
interface DiscountUserUsed {
  userId: string
  count: number
}

interface Product {
  productId: string
  shopId: string
  quantity: number
  name: string
  price: number
}

class DiscountService {
  //1
  static async createDiscountCode(payload: CreateDiscountCodeReqBody) {
    const {
      discount_name,
      discount_description,
      discount_type,
      discount_value,
      discount_code,
      discount_max_uses,
      discount_max_uses_per_user,
      discount_min_order_value,
      discount_start_date,
      discount_end_date,
      discount_is_active,
      discount_apply_to,
      discount_product_ids,
      discount_shopId,
      discount_used_count
    } = payload

    if (new Date(discount_start_date) > new Date(discount_end_date)) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_START_DATE_MUST_BE_BEFORE_END_DATE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    //create index for discount code
    const foundDiscount = await databaseService.discounts.findOne({
      discount_code,
      discount_is_active: true,
      discount_shopId: new ObjectId(discount_shopId)
    })
    if (foundDiscount) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_ALREADY_EXISTS,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    const discount = await databaseService.discounts.insertOne({
      discount_name,
      discount_description,
      discount_type,
      discount_value,
      discount_code,
      discount_max_uses,
      discount_max_uses_per_user,
      discount_min_order_value: discount_min_order_value || 0,
      discount_start_date: new Date(discount_start_date),
      discount_end_date: new Date(discount_end_date),
      discount_is_active: discount_is_active || true,
      discount_apply_to: discount_apply_to || 'all',
      discount_product_ids: discount_apply_to === 'specific' ? discount_product_ids : [],
      discount_shopId: new ObjectId(discount_shopId),
      discount_used_count: discount_used_count || 0
    })
    return {
      discount_name,
      discount_description,
      discount_type,
      discount_value,
      discount_code,
      discount_max_uses,
      discount_max_uses_per_user,
      discount_min_order_value,
      discount_start_date,
      discount_end_date,
      discount_is_active,
      discount_apply_to,
      discount_product_ids,
      discount_shopId,
      discount_used_count
    }
  }
  //Get all discounts codes available with products
  static async getAllDiscountCodesWithProducts({
    discount_code,
    discount_shopId,
    limit,
    page
  }: {
    discount_code: string
    discount_shopId: string
    limit: number
    page: number
  }) {
    const foundDiscount = await databaseService.discounts.findOne({
      discount_code,
      discount_is_active: true,
      discount_shopId: new ObjectId(discount_shopId)
    })

    if (!foundDiscount) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    console.log('>>> check found discount code', foundDiscount)
    const { discount_apply_to, discount_product_ids } = foundDiscount
    let products

    if (discount_apply_to === 'all') {
      products = await productRepository.findAll({
        limit: +limit || 50,
        page: +page || 1,
        sort: 'ctime',
        select: ['product_name'] as string[],
        filter: {
          product_shop: new ObjectId(discount_shopId),
          isPublished: true
        }
      })
    }

    if (discount_apply_to === 'specific') {
      products = await productRepository.findAll({
        limit: +limit || 50,
        page: +page || 1,
        sort: 'ctime',
        select: ['product_name'] as string[],
        filter: {
          _id: { $in: discount_product_ids as ObjectId[] },
          isPublished: true
        }
      })
      console.log('>>> check products', products)
    }

    return products
  }

  // Get all discount code of shop
  static async getAllDiscountCodeOfShop({
    limit,
    page,
    discount_shopId
  }: {
    limit: number
    page: number
    discount_shopId: string
  }) {
    const discounts = await findAllDiscountCodeUnselect({
      limit: +limit || 50,
      page: +page || 1,
      filter: {
        discount_shopId: new ObjectId(discount_shopId),
        discount_is_active: true
      },
      unSelect: ['__v', 'discount_shopId'],
      model: databaseService.discounts,
      sort: 'ctime'
    })
    return discounts
  }

  //Apply discount code
  /*
     products = {
      {
        productId,
        shopId,
        quantity,
        name,
        price
      },
            {
        productId,
        shopId,
        quantity,
        name,
        price
      },
     }
  */
  static async getDiscountAmount({ products, userId, shopId, code }: GetDiscountAmountReqBody) {
    const foundDiscount = await checkDiscountExist({
      model: databaseService.discounts,
      filter: {
        discount_code: code,
        discount_shopId: new ObjectId(shopId),
        discount_is_active: true
      }
    })
    if (!foundDiscount) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const {
      discount_is_active,
      discount_max_uses,
      discount_max_uses_per_user,
      discount_users_used,
      discount_min_order_value,
      discount_value,
      discount_type
    } = foundDiscount

    if (!discount_is_active) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_NOT_ACTIVE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (discount_max_uses === 0) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_MAX_USES_REACHED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (discount_max_uses_per_user === 0) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_MAX_USES_PER_USER_REACHED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // if (
    //   new Date() > new Date(foundDiscount.discount_start_date) ||
    //   new Date() < new Date(foundDiscount.discount_end_date)
    // ) {
    //   throw new BadRequestError("Discount code has expired");
    // }
    // check xem co gia tri toi thieu hay khong
    let totalOrder = 0
    if (discount_min_order_value > totalOrder) {
      totalOrder = products.reduce((total, product) => total + product.price * product.quantity, 0)
    }
    if (totalOrder < discount_min_order_value) {
      throw new ErrorWithStatus({
        message: `Discount requires a minimum order value ${discount_min_order_value}`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (discount_max_uses_per_user > 0) {
      const userUseDiscount = (discount_users_used as DiscountUserUsed[])?.find((user) => user.userId === userId)
      if (userUseDiscount) {
        throw new ErrorWithStatus({
          message: DISCOUNTS_MESSAGES.DISCOUNT_MAX_USES_PER_USER_REACHED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    //check xem discount nay la fixed amount hay percentage
    const discountAmount = discount_type === 'fixed_amount' ? discount_value : (totalOrder * discount_value) / 100
    return {
      discount_amount: discountAmount,
      totalOrder,
      totalPrice: totalOrder - discountAmount
    }
  }

  static deleteDiscountCode = async ({ shopId, discountCode }: { shopId: string; discountCode: string }) => {
    const deleted = await databaseService.discounts.findOneAndDelete({
      discount_code: discountCode,
      discount_shopId: new ObjectId(shopId)
    })
    if (!deleted) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return deleted
  }

  //Cancel discount code ()
  static cancelDiscountCode = async ({
    shopId,
    discountCode,
    userId
  }: {
    shopId: string
    discountCode: string
    userId: string
  }) => {
    const foundDiscount = await checkDiscountExist({
      model: databaseService.discounts,
      filter: {
        discount_code: discountCode,
        discount_shopId: new ObjectId(shopId)
      }
    })
    if (!foundDiscount) {
      throw new ErrorWithStatus({
        message: DISCOUNTS_MESSAGES.DISCOUNT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const result = await databaseService.discounts.findOneAndUpdate(
      { _id: foundDiscount._id },
      {
        $pull: {
          discount_users_used: userId
        },
        $inc: {
          discount_used_count: -1,
          discount_max_uses: 1
        }
      },
      {
        returnDocument: 'after'
      }
    )
    return result
  }
}

export default DiscountService
