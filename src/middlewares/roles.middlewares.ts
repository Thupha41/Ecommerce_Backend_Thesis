import { ROLES_MESSAGES } from '~/constants/messages'
import { ParamSchema, checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { validate } from '~/utils/validation'

const roleNameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: ROLES_MESSAGES.ROLE_NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: ROLES_MESSAGES.ROLE_NAME_MUST_BE_A_STRING
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: ROLES_MESSAGES.ROLE_NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const roleDescriptionSchema: ParamSchema = {
  notEmpty: {
    errorMessage: ROLES_MESSAGES.ROLE_DESCRIPTION_IS_REQUIRED
  },
  isString: {
    errorMessage: ROLES_MESSAGES.ROLE_DESCRIPTION_MUST_BE_A_STRING
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 1000
    },
    errorMessage: ROLES_MESSAGES.ROLE_DESCRIPTION_LENGTH_MUST_BE_FROM_1_TO_1000
  }
}

const roleGrantSchema: ParamSchema = {
  notEmpty: {
    errorMessage: ROLES_MESSAGES.ROLE_GRANT_IS_REQUIRED
  },
  isArray: {
    errorMessage: ROLES_MESSAGES.ROLE_GRANT_MUST_BE_AN_ARRAY
  },
  custom: {
    options: async (value: any) => {
      if (!Array.isArray(value)) {
        throw new Error('Role grant must be an array')
      }

      // Validate each item in the array
      for (let i = 0; i < value.length; i++) {
        const grant = value[i]

        if (!grant.resources) {
          throw new ErrorWithStatus({
            message: ROLES_MESSAGES.ROLE_GRANT_RESOURCES_IS_REQUIRED + ' at index ' + i,
            status: HTTP_STATUS.UNPROCESSABLE_ENTITY
          })
        }

        // if (!ObjectId.isValid(grant.resources)) {
        //   throw new ErrorWithStatus({
        //     message: ROLES_MESSAGES.ROLE_GRANT_RESOURCES_MUST_BE_A_VALID_OBJECT_ID + ' at index ' + i,
        //     status: HTTP_STATUS.BAD_REQUEST
        //   })
        // }

        // Check if the resource exists in the database
        const resource = await databaseService.resources.findOne({
          _id: new ObjectId(grant.resources)
        })

        if (!resource) {
          throw new ErrorWithStatus({
            message: ROLES_MESSAGES.ROLE_GRANT_RESOURCES_DOES_NOT_EXIST,
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        if (!grant.actions || typeof grant.actions !== 'string') {
          throw new ErrorWithStatus({
            message:
              ROLES_MESSAGES.ROLE_GRANT_ACTIONS_IS_REQUIRED +
              ' or ' +
              ROLES_MESSAGES.ROLE_GRANT_ACTIONS_MUST_BE_A_VALID_STRING +
              ' at index ' +
              i,
            status: HTTP_STATUS.UNPROCESSABLE_ENTITY
          })
        }
      }

      return true
    }
  }
}

const roleIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: ROLES_MESSAGES.INVALID_ROLE_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const foundRole = await databaseService.roles.findOne({
        _id: new ObjectId(value)
      })

      if (foundRole === null) {
        throw new ErrorWithStatus({
          message: ROLES_MESSAGES.ROLE_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}

export const createRoleValidator = validate(
  checkSchema(
    {
      role_name: roleNameSchema,
      role_description: roleDescriptionSchema,
      role_grant: roleGrantSchema
    },
    ['body']
  )
)

export const updateRoleValidator = validate(
  checkSchema(
    {
      role_name: {
        isString: {
          errorMessage: ROLES_MESSAGES.ROLE_NAME_MUST_BE_A_STRING
        },
        trim: true,
        optional: true
      },
      role_description: {
        isString: {
          errorMessage: ROLES_MESSAGES.ROLE_DESCRIPTION_MUST_BE_A_STRING
        },
        trim: true,
        optional: true
      },
      role_grant: {
        ...roleGrantSchema,
        optional: true
      }
    },
    ['body', 'params']
  )
)

export const roleIdValidator = validate(
  checkSchema(
    {
      role_id: roleIdSchema
    },
    ['params']
  )
)
