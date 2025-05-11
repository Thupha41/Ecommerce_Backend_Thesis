import { SHOP_MESSAGES } from '~/constants/messages'
import { ParamSchema, checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { validate } from '~/utils/validation'

const shopNameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: SHOP_MESSAGES.SHOP_NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: SHOP_MESSAGES.SHOP_NAME_MUST_BE_A_STRING
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: SHOP_MESSAGES.SHOP_NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  custom: {
    options: async (value: string) => {
      // Check if shop name already exists in the database
      const existingShop = await databaseService.shops.findOne({ shop_name: value })
      if (existingShop) {
        throw new ErrorWithStatus({
          message: SHOP_MESSAGES.SHOP_NAME_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT
        })
      }
      return true
    }
  }
}

const shopDescriptionSchema: ParamSchema = {
  notEmpty: {
    errorMessage: SHOP_MESSAGES.SHOP_DESCRIPTION_IS_REQUIRED
  },
  isString: {
    errorMessage: SHOP_MESSAGES.SHOP_DESCRIPTION_MUST_BE_A_STRING
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 1000
    },
    errorMessage: SHOP_MESSAGES.SHOP_DESCRIPTION_LENGTH_MUST_BE_FROM_1_TO_1000
  }
}

const shopEmailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: SHOP_MESSAGES.SHOP_EMAIL_IS_REQUIRED
  },
  isString: {
    errorMessage: SHOP_MESSAGES.SHOP_EMAIL_MUST_BE_A_STRING
  },
  isEmail: {
    errorMessage: SHOP_MESSAGES.SHOP_EMAIL_IS_INVALID
  },
  trim: true,
  custom: {
    options: async (value: string) => {
      // Check if shop email already exists in the database
      const existingShop = await databaseService.shops.findOne({ shop_email: value })
      if (existingShop) {
        throw new ErrorWithStatus({
          message: SHOP_MESSAGES.SHOP_EMAIL_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT
        })
      }
      return true
    }
  }
}

const shopHotlinePhoneSchema: ParamSchema = {
  notEmpty: {
    errorMessage: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_IS_REQUIRED
  },
  isString: {
    errorMessage: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 10
    },
    errorMessage: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_LENGTH_MUST_BE_FROM_1_TO_10
  },
  isMobilePhone: {
    errorMessage: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_IS_INVALID
  },
  custom: {
    options: async (value: string) => {
      // Check if shop hotline phone already exists in the database
      const existingShop = await databaseService.shops.findOne({ shop_hotline_phone: value })
      if (existingShop) {
        throw new ErrorWithStatus({
          message: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT
        })
      }
      return true
    }
  }
}

const shopLogoSchema: ParamSchema = {
  // notEmpty: {
  //   errorMessage: SHOP_MESSAGES.SHOP_LOGO_IS_REQUIRED
  // },
  isURL: {
    errorMessage: SHOP_MESSAGES.SHOP_LOGO_IS_INVALID
  }
}

const shopBannerSchema: ParamSchema = {
  // notEmpty: {
  //   errorMessage: SHOP_MESSAGES.SHOP_BANNER_IS_REQUIRED
  // },
  isURL: {
    errorMessage: SHOP_MESSAGES.SHOP_BANNER_IS_INVALID
  }
}

const shopIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: SHOP_MESSAGES.INVALID_SHOP_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const foundShop = await databaseService.shops.findOne({
        _id: new ObjectId(value)
      })

      if (foundShop === null) {
        throw new ErrorWithStatus({
          message: SHOP_MESSAGES.SHOP_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}

export const createShopValidator = validate(
  checkSchema(
    {
      shop_name: shopNameSchema,
      shop_description: shopDescriptionSchema,
      shop_email: shopEmailSchema,
      shop_hotline_phone: shopHotlinePhoneSchema,
      shop_logo: shopLogoSchema,
      shop_banner: shopBannerSchema
    },
    ['body']
  )
)

export const updateShopValidator = validate(
  checkSchema(
    {
      shop_name: {
        isString: {
          errorMessage: SHOP_MESSAGES.SHOP_NAME_MUST_BE_A_STRING
        },
        trim: true,
        optional: true,
        custom: {
          options: async (value: string, { req }) => {
            const shop_id = req.params?.shop_id
            if (!shop_id) {
              throw new ErrorWithStatus({
                message: SHOP_MESSAGES.INVALID_SHOP_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            // Check if shop name already exists in the database (excluding current shop)
            const existingShop = await databaseService.shops.findOne({
              shop_name: value,
              _id: { $ne: new ObjectId(shop_id) }
            })
            if (existingShop) {
              throw new ErrorWithStatus({
                message: SHOP_MESSAGES.SHOP_NAME_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      shop_description: {
        isString: {
          errorMessage: SHOP_MESSAGES.SHOP_DESCRIPTION_MUST_BE_A_STRING
        },
        trim: true,
        optional: true
      },
      shop_email: {
        isString: {
          errorMessage: SHOP_MESSAGES.SHOP_EMAIL_MUST_BE_A_STRING
        },
        isEmail: {
          errorMessage: SHOP_MESSAGES.SHOP_EMAIL_IS_INVALID
        },
        trim: true,
        optional: true,
        custom: {
          options: async (value: string, { req }) => {
            const shop_id = req.params?.shop_id
            if (!shop_id) {
              throw new ErrorWithStatus({
                message: SHOP_MESSAGES.INVALID_SHOP_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            // Check if shop email already exists in the database (excluding current shop)
            const existingShop = await databaseService.shops.findOne({
              shop_email: value,
              _id: { $ne: new ObjectId(shop_id) }
            })
            if (existingShop) {
              throw new ErrorWithStatus({
                message: SHOP_MESSAGES.SHOP_EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      shop_hotline_phone: {
        isString: {
          errorMessage: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 10
          },
          errorMessage: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_LENGTH_MUST_BE_FROM_1_TO_10
        },
        isMobilePhone: {
          errorMessage: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_IS_INVALID
        },
        optional: true,
        custom: {
          options: async (value: string, { req }) => {
            const shop_id = req.params?.shop_id
            if (!shop_id) {
              throw new ErrorWithStatus({
                message: SHOP_MESSAGES.INVALID_SHOP_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            // Check if shop hotline phone already exists in the database (excluding current shop)
            const existingShop = await databaseService.shops.findOne({
              shop_hotline_phone: value,
              _id: { $ne: new ObjectId(shop_id) }
            })
            if (existingShop) {
              throw new ErrorWithStatus({
                message: SHOP_MESSAGES.SHOP_HOTLINE_PHONE_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              })
            }
            return true
          }
        }
      },
      shop_logo: {
        ...shopLogoSchema,
        optional: true
      },
      shop_banner: {
        ...shopBannerSchema,
        optional: true
      }
    },
    ['body', 'params']
  )
)

export const shopIdValidator = validate(
  checkSchema(
    {
      shop_id: shopIdSchema
    },
    ['params']
  )
)
