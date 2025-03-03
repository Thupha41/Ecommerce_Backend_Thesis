import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { PRODUCTS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'
import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'

export const createProductValidator = validate(
  checkSchema({
    product_name: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_NAME_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    product_thumb: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_THUMB_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    product_price: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_PRICE_IS_REQUIRED
      },
      isNumeric: true
    },
    product_quantity: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_QUANTITY_IS_REQUIRED
      },
      isNumeric: true
    },
    product_type: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_TYPE_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    product_description: {
      optional: true,
      isString: true,
      trim: true
    }
  })
)

export const productIdValidator = (req: Request<ParamsDictionary>, res: Response, next: NextFunction): void => {
  const product_id = req.params.id || req.params.product_id || req.params.productId

  if (!ObjectId.isValid(product_id)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: PRODUCTS_MESSAGES.INVALID_PRODUCT_ID
    })
    return
  }

  next()
}

export const searchProductValidator = validate(
  checkSchema({
    keySearch: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          const results = await databaseService.products
            .find(
              {
                isPublished: true,
                $text: { $search: value }
              },
              {
                projection: { score: { $meta: 'textScore' } }
              }
            )
            .sort({ score: { $meta: 'textScore' } })
            .toArray()

          if (results.length === 0) {
            throw new ErrorWithStatus({
              message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          return true // Need to return true if validation passes
        }
      }
    }
  })
)

export const updateProductValidator = validate(
  checkSchema({
    product_attributes: {
      optional: true,
      isObject: true,
      custom: {
        options: (value) => {
          if (!value) return true

          // Check if any value in product_attributes is null
          const hasNullValue = Object.values(value).some((attrValue) => attrValue === null || attrValue === undefined)

          if (hasNullValue) {
            throw new ErrorWithStatus({
              message: PRODUCTS_MESSAGES.PRODUCT_ATTRIBUTES_VALUES_CANNOT_BE_NULL,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          return true
        }
      }
    },
    product_name: {
      optional: true,
      isString: true,
      trim: true
    },
    product_price: {
      optional: true,
      isNumeric: true
    },
    product_type: {
      optional: true,
      isString: true,
      trim: true
    },
    product_description: {
      optional: true,
      isString: true,
      trim: true
    }
  })
)
