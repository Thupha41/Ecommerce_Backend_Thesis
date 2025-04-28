import { RoleStatus } from '~/constants/enums'
import { ROLES_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Role from '~/models/schemas/Role.schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId, Sort, SortDirection } from 'mongodb'
import { rbacRepository } from '~/models/repositories/rbac.repo'
import databaseService from './database.services'
import { IUpsertRole } from '~/models/requests/role.requests'
class RoleService {
  // Lấy tất cả role
  async getAllRoles(user_id: string, { limit = 50, sort = 'ctime', page = 1 }) {
    //check user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //get roles
    const roles = await rbacRepository.findAll({
      collection: databaseService.roles,
      limit,
      sort,
      page
    })
    return roles
  }

  // Lấy một role theo ID
  async getRoleById(user_id: string, role_id: string) {
    //check user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return await rbacRepository.findById({
      collection: databaseService.roles,
      id: role_id,
      errorMessage: ROLES_MESSAGES.ROLE_NOT_FOUND
    })
  }
  // Tạo role mới
  async createRole(user_id: string, { role_name, role_description, role_grant }: IUpsertRole) {
    //check user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //check role_name
    const exists = await rbacRepository.exists({
      collection: databaseService.roles,
      filter: { role_name }
    })

    if (exists) {
      throw new ErrorWithStatus({
        message: ROLES_MESSAGES.ROLE_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT
      })
    }

    // Tạo dữ liệu role mới
    const roleData = new Role({
      role_name,
      role_description,
      role_status: RoleStatus.Active,
      role_grant: role_grant.map((grant) => ({
        resources: new ObjectId(grant.resources),
        actions: grant.actions
      }))
    })

    // Lưu vào database
    return await rbacRepository.create({
      collection: databaseService.roles,
      data: roleData
    })
  }

  // Cập nhật role
  async updateRole(
    user_id: string,
    role_id: string,
    { role_name, role_description, role_grant, role_status }: IUpsertRole
  ) {
    //check user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    // Nếu role_name được cập nhật, kiểm tra xem có trùng không
    if (role_name) {
      const exists = await rbacRepository.exists({
        collection: databaseService.roles,
        filter: {
          role_name,
          _id: { $ne: new ObjectId(role_id) }
        }
      })

      if (exists) {
        throw new ErrorWithStatus({
          message: ROLES_MESSAGES.ROLE_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT
        })
      }
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = {}

    if (role_name) updateData.role_name = role_name
    if (role_description) updateData.role_description = role_description
    if (role_status) updateData.role_status = role_status

    if (role_grant) {
      updateData.role_grant = role_grant.map((grant) => ({
        resources: new ObjectId(grant.resources),
        actions: grant.actions
      }))
    }

    // Cập nhật role
    return await rbacRepository.update({
      collection: databaseService.roles,
      id: role_id,
      data: updateData,
      errorMessage: ROLES_MESSAGES.ROLE_NOT_FOUND
    })
  }

  // Xóa role
  async deleteRole(user_id: string, role_id: string) {
    //check user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return await rbacRepository.delete({
      collection: databaseService.roles,
      id: role_id,
      errorMessage: ROLES_MESSAGES.ROLE_NOT_FOUND
    })
  }

  // Xóa resource từ tất cả các role (được gọi trước khi xóa resource)
  async removeResourceFromRoles(resource_id: string) {
    const objectId = new ObjectId(resource_id)

    // Cập nhật tất cả role bằng cách loại bỏ resource_id khỏi role_grant
    const result = await databaseService.roles.updateMany(
      { 'role_grant.resources': objectId },
      { $pull: { role_grant: { resources: objectId } } }
    )

    return result.modifiedCount
  }

  async roleListRBAC(user_id: string) {
    //check user
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //1. check admin or not ? middleware function
    //2. get list role
    const roles = await databaseService.roles
      .aggregate([
        {
          $unwind: '$role_grant'
        },
        {
          $lookup: {
            from: 'resources',
            localField: 'role_grant.resources',
            foreignField: '_id',
            as: 'resource'
          }
        },
        {
          $unwind: '$resource'
        },
        {
          $project: {
            role: '$role_name',
            resource: '$resource.resource_url',
            action: '$role_grant.actions'
          }
        },
        {
          $unwind: '$action'
        },
        {
          $project: {
            _id: 0,
            role: 1,
            resource: 1,
            action: 1
          }
        }
      ])
      .toArray()
    return roles
  }
}

export default new RoleService()
