import { ParamSchema, checkSchema } from 'express-validator'
import HTTP_STATUS from '~/constants/httpStatus'
import { INVENTORY_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { validate } from '~/utils/validation'

export const inventoryValidator = validate(
  checkSchema({
    stock: {
      notEmpty: {
        errorMessage: INVENTORY_MESSAGES.STOCK_IS_REQUIRED
      },
      isInt: {
        errorMessage: INVENTORY_MESSAGES.STOCK_MUST_BE_A_NUMBER
      }
    },
    location: {
      optional: true,
      isString: {
        errorMessage: INVENTORY_MESSAGES.LOCATION_MUST_BE_A_STRING
      }
    },
    productId: {
      notEmpty: {
        errorMessage: INVENTORY_MESSAGES.PRODUCT_ID_IS_REQUIRED
      },
      isString: {
        errorMessage: INVENTORY_MESSAGES.PRODUCT_ID_MUST_BE_A_STRING
      }
    }
  })
)
