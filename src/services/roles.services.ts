import { RoleStatus } from '~/constants/enums'
import { ROLES_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Role from '~/models/schemas/Role.schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId } from 'mongodb'
import { rbacRepository } from '~/models/repositories/rbac.repo'
import databaseService from './database.services'

class RoleService {
  // Lấy tất cả role
  async getAllRoles({ limit = 50, sort = 'ctime', page = 1 }) {
    const roles = await rbacRepository.findAll({
      collection: databaseService.roles,
      limit,
      sort,
      page
    })
    return roles
  }

  // Lấy một role theo ID
  async getRoleById(role_id: string) {
    return await rbacRepository.findById({
      collection: databaseService.roles,
      id: role_id,
      errorMessage: ROLES_MESSAGES.ROLE_NOT_FOUND
    })
  }

  // Tạo role mới
  async createRole({
    role_name,
    role_description,
    role_grant
  }: {
    role_name: string
    role_description: string
    role_grant: Array<{
      resources: string
      actions: string
      attributes: string
    }>
  }) {
    // Kiểm tra xem role_name đã tồn tại chưa
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
        actions: grant.actions,
        attributes: grant.attributes
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
    role_id: string,
    {
      role_name,
      role_description,
      role_grant,
      role_status
    }: {
      role_name?: string
      role_description?: string
      role_grant?: Array<{
        resources: string
        actions: string
        attributes: string
      }>
      role_status?: RoleStatus
    }
  ) {
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
        actions: grant.actions,
        attributes: grant.attributes
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
  async deleteRole(role_id: string) {
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
}

const roleService = new RoleService()
export default roleService
