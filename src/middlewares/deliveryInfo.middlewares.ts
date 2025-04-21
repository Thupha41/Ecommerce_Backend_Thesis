import { ParamSchema, checkSchema } from 'express-validator'
import HTTP_STATUS from '~/constants/httpStatus'
import { DELIVERY_INFO_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { validate } from '~/utils/validation'
import { Request, Response, NextFunction } from 'express'

const deliveryIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: DELIVERY_INFO_MESSAGES.INVALID_DELIVERY_INFO_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const deliveryInfo = await databaseService.deliveryInfos.findOne({
        _id: new ObjectId(value)
      })

      if (deliveryInfo === null) {
        throw new ErrorWithStatus({
          message: DELIVERY_INFO_MESSAGES.DELIVERY_INFO_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}
export const deliveryInfoValidator = validate(
  checkSchema({
    'personal_detail.name': {
      notEmpty: {
        errorMessage: 'Name is required'
      },
      isString: {
        errorMessage: 'Name must be a string'
      }
    },
    'personal_detail.phone': {
      notEmpty: {
        errorMessage: 'Phone number is required'
      },
      isString: {
        errorMessage: 'Phone number must be a string'
      }
    },
    'shipping_address.province_city': {
      notEmpty: {
        errorMessage: DELIVERY_INFO_MESSAGES.PROVINCE_CITY_IS_REQUIRED
      },
      isString: {
        errorMessage: DELIVERY_INFO_MESSAGES.PROVINCE_CITY_MUST_BE_A_STRING
      }
    },
    'shipping_address.district': {
      notEmpty: {
        errorMessage: DELIVERY_INFO_MESSAGES.DISTRICT_IS_REQUIRED
      },
      isString: {
        errorMessage: DELIVERY_INFO_MESSAGES.DISTRICT_MUST_BE_A_STRING
      }
    },
    'shipping_address.ward': {
      notEmpty: {
        errorMessage: DELIVERY_INFO_MESSAGES.WARD_IS_REQUIRED
      },
      isString: {
        errorMessage: DELIVERY_INFO_MESSAGES.WARD_MUST_BE_A_STRING
      }
    },
    'shipping_address.street': {
      notEmpty: {
        errorMessage: DELIVERY_INFO_MESSAGES.STREET_IS_REQUIRED
      },
      isString: {
        errorMessage: DELIVERY_INFO_MESSAGES.STREET_MUST_BE_A_STRING
      }
    },
    is_default: {
      optional: true,
      isBoolean: {
        errorMessage: DELIVERY_INFO_MESSAGES.IS_DEFAULT_MUST_BE_A_BOOLEAN
      }
    }
  })
)

// Middleware to validate the complete address structure if provided
export const validateOrderAddress = (req: Request, res: Response, next: NextFunction) => {
  // Đảm bảo orderAddress luôn tồn tại trong req.body
  if (!req.body.orderAddress) {
    req.body.orderAddress = {}
  }

  const { orderAddress } = req.body

  // Đảm bảo personal_detail luôn tồn tại
  if (!orderAddress.personal_detail) {
    orderAddress.personal_detail = {
      name: '',
      phone: ''
    }
  }

  // Đảm bảo shipping_address luôn tồn tại
  if (!orderAddress.shipping_address) {
    orderAddress.shipping_address = {
      province_city: '',
      district: '',
      ward: '',
      street: ''
    }
  }

  // Kiểm tra personal_detail có đầy đủ thông tin không
  if (orderAddress.personal_detail) {
    const { name, phone } = orderAddress.personal_detail

    // Đảm bảo các trường không bị undefined
    orderAddress.personal_detail.name = name || ''
    orderAddress.personal_detail.phone = phone || ''
  }

  // Kiểm tra shipping_address có đầy đủ thông tin không
  if (orderAddress.shipping_address) {
    const { province_city, district, ward, street } = orderAddress.shipping_address

    // Đảm bảo các trường không bị undefined
    orderAddress.shipping_address.province_city = province_city || ''
    orderAddress.shipping_address.district = district || ''
    orderAddress.shipping_address.ward = ward || ''
    orderAddress.shipping_address.street = street || ''
  }

  next()
}

export const isDeliveryInfoExist = validate(
  checkSchema(
    {
      delivery_id: deliveryIdSchema
    },
    ['params']
  )
)

// Middleware kiểm tra cấu trúc các đối tượng
export const validateDeliveryInfoStructure = (req: Request, res: Response, next: NextFunction) => {
  const { personal_detail, shipping_address } = req.body

  // Kiểm tra personal_detail
  if (!personal_detail || typeof personal_detail !== 'object') {
    return next(
      new ErrorWithStatus({
        message: 'personal_detail is required and must be an object',
        status: HTTP_STATUS.BAD_REQUEST
      })
    )
  }

  // Kiểm tra shipping_address
  if (!shipping_address || typeof shipping_address !== 'object') {
    return next(
      new ErrorWithStatus({
        message: 'shipping_address is required and must be an object',
        status: HTTP_STATUS.BAD_REQUEST
      })
    )
  }

  next()
}
