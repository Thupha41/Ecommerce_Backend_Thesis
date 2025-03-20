import { ParamSchema, checkSchema } from 'express-validator'
import HTTP_STATUS from '~/constants/httpStatus'
import { SELLER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { validate } from '~/utils/validation'

const sellerIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: SELLER_MESSAGES.INVALID_SELLER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const seller = await databaseService.sellers.findOne({
        _id: new ObjectId(value)
      })

      if (seller === null) {
        throw new ErrorWithStatus({
          message: SELLER_MESSAGES.SELLER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}

export const sellerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: SELLER_MESSAGES.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: SELLER_MESSAGES.NAME_MUST_BE_A_STRING
      }
    },
    phone: {
      notEmpty: {
        errorMessage: SELLER_MESSAGES.PHONE_IS_REQUIRED
      },
      isString: {
        errorMessage: SELLER_MESSAGES.PHONE_MUST_BE_A_STRING
      }
    },
    address: {
      notEmpty: {
        errorMessage: SELLER_MESSAGES.ADDRESS_IS_REQUIRED
      },
      isString: {
        errorMessage: SELLER_MESSAGES.ADDRESS_MUST_BE_A_STRING
      }
    },
    email: {
      notEmpty: {
        errorMessage: SELLER_MESSAGES.EMAIL_IS_REQUIRED
      },
      isString: {
        errorMessage: SELLER_MESSAGES.EMAIL_MUST_BE_A_STRING
      }
    },
    rating: {
      isFloat: {
        errorMessage: SELLER_MESSAGES.RATING_MUST_BE_A_FLOAT
      }
    },
    image: {
      isString: {
        errorMessage: SELLER_MESSAGES.IMAGE_MUST_BE_A_STRING
      }
    },
    isActive: {
      isBoolean: {
        errorMessage: SELLER_MESSAGES.ISACTIVE_MUST_BE_A_BOOLEAN
      }
    }
  })
)

export const isSellerExist = validate(
  checkSchema(
    {
      seller_id: sellerIdSchema
    },
    ['params']
  )
)
