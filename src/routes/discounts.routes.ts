import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  createDiscountCode,
  getAllDiscountCodes,
  getAllDiscountCodesWithProducts,
  getDiscountAmount
} from '~/controllers/discounts.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { createDiscountValidator, getAmountDiscountValidator } from '~/middlewares/discounts.middleware'
const discountRouter = Router()

//get amount of discount
/**
 * Description: Get the amount of discount for a product
 * Path: /discounts/amount
 * Method: POST
 * Body: {products: Product[], userId: string, shopId: string, code: string}
 */
discountRouter.post('/amount', getAmountDiscountValidator, wrapRequestHandler(getDiscountAmount))

/**
 * Description: Get all discount codes with products
 * Path: /discounts/list-product-code
 * Method: GET
 * Query: limit, page, discount_shopId, discount_code
 */
discountRouter.get('/list-product-code', wrapRequestHandler(getAllDiscountCodesWithProducts))

//authentication
discountRouter.use(accessTokenValidator)

/**
 * Description: Create a new discount code
 * Path: /discounts
 * Method: POST
 * Body: {discount_name: string, discount_description: string, discount_type: string, discount_value: number, discount_code: string, discount_max_uses: number, discount_max_uses_per_user: number, discount_min_order_value: number, discount_start_date: Date, discount_end_date: Date, discount_apply_to: string, discount_product_ids: ObjectId[], discount_shopId: ObjectId}
 */
discountRouter.post('/', createDiscountValidator, wrapRequestHandler(createDiscountCode))

/**
 * Description: Get all discount codes
 * Path: /discounts
 * Method: GET
 * Query: limit, page, discount_shopId
 */
discountRouter.get('/', wrapRequestHandler(getAllDiscountCodes))

export default discountRouter
