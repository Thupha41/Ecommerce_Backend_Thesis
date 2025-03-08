import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { DISCOUNTS_MESSAGES, PRODUCTS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'
import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'

const dateSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_DATE_MUST_BE_ISO8601
  }
}

export const createDiscountValidator = validate(
  checkSchema({
    discount_name: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_NAME_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    discount_description: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_DESCRIPTION_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    discount_value: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_VALUE_IS_REQUIRED
      },
      isNumeric: true
    },
    discount_type: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_TYPE_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    discount_code: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_CODE_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    discount_max_uses: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_MAX_USES_IS_REQUIRED
      },
      isNumeric: true
    },
    discount_max_uses_per_user: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_MAX_USES_PER_USER_IS_REQUIRED
      },
      isNumeric: true
    },
    discount_min_order_value: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_MIN_ORDER_VALUE_IS_REQUIRED
      },
      isNumeric: true
    },
    discount_start_date: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_START_DATE_IS_REQUIRED
      },
      ...dateSchema
    },
    discount_end_date: {
      notEmpty: {
        errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_END_DATE_IS_REQUIRED
      },
      ...dateSchema
    }
  })
)

export const getAmountDiscountValidator = validate(
  checkSchema({
    products: {
      notEmpty: { errorMessage: DISCOUNTS_MESSAGES.PRODUCTS_IS_REQUIRED }
    },
    userId: {
      notEmpty: { errorMessage: DISCOUNTS_MESSAGES.USER_ID_IS_REQUIRED }
    },
    shopId: {
      notEmpty: { errorMessage: DISCOUNTS_MESSAGES.SHOP_ID_IS_REQUIRED }
    },
    code: {
      notEmpty: { errorMessage: DISCOUNTS_MESSAGES.DISCOUNT_CODE_IS_REQUIRED },
      isString: true,
      trim: true
    }
  })
)
