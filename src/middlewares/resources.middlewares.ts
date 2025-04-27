import { RESOURCES_MESSAGES } from '~/constants/messages'
import { ParamSchema, checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { validate } from '~/utils/validation'

const resourceUrlSchema: ParamSchema = {
  notEmpty: {
    errorMessage: RESOURCES_MESSAGES.RESOURCE_URL_IS_REQUIRED
  },
  isString: {
    errorMessage: RESOURCES_MESSAGES.RESOURCE_URL_MUST_BE_A_STRING
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: RESOURCES_MESSAGES.RESOURCE_URL_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const resourceDescriptionSchema: ParamSchema = {
  notEmpty: {
    errorMessage: RESOURCES_MESSAGES.RESOURCE_DESCRIPTION_IS_REQUIRED
  },
  isString: {
    errorMessage: RESOURCES_MESSAGES.RESOURCE_DESCRIPTION_MUST_BE_A_STRING
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 1000
    },
    errorMessage: RESOURCES_MESSAGES.RESOURCE_DESCRIPTION_LENGTH_MUST_BE_FROM_1_TO_1000
  }
}

const resourceIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: RESOURCES_MESSAGES.INVALID_RESOURCE_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const foundResource = await databaseService.resources.findOne({
        _id: new ObjectId(value)
      })

      if (foundResource === null) {
        throw new ErrorWithStatus({
          message: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}

export const createResourceValidator = validate(
  checkSchema(
    {
      resource_url: resourceUrlSchema,
      resource_description: resourceDescriptionSchema
    },
    ['body']
  )
)

export const updateResourceValidator = validate(
  checkSchema(
    {
      resource_url: {
        isString: {
          errorMessage: RESOURCES_MESSAGES.RESOURCE_URL_MUST_BE_A_STRING
        },
        trim: true,
        optional: true
      },
      resource_description: {
        isString: {
          errorMessage: RESOURCES_MESSAGES.RESOURCE_DESCRIPTION_MUST_BE_A_STRING
        },
        trim: true,
        optional: true
      }
    },
    ['body']
  )
)

export const resourceIdValidator = validate(
  checkSchema(
    {
      resource_id: resourceIdSchema
    },
    ['params']
  )
)
