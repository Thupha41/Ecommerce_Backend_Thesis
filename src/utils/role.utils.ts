import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'

/**
 * Hàm thêm resources_url vào role_grant
 * @param roles Mảng role cần xử lý
 * @returns Mảng role đã được thêm resources_url vào role_grant
 */
export const addResourcesUrlToRoles = async (roles: any[]) => {
  // Lấy danh sách tất cả resource IDs từ các role_grant
  const resourceIds: string[] = []
  roles.forEach((role) => {
    if (role.role_grant && Array.isArray(role.role_grant)) {
      role.role_grant.forEach((grant: any) => {
        if (grant.resources && !resourceIds.includes(grant.resources)) {
          resourceIds.push(grant.resources)
        }
      })
    }
  })

  // Query thông tin resources từ database
  const resourcesMap: Record<string, any> = {}
  if (resourceIds.length > 0) {
    const resourcesObjectIds = resourceIds.map((id) => new ObjectId(id))
    const resourcesCursor = databaseService.resources.find({
      _id: { $in: resourcesObjectIds }
    })
    const resources = await resourcesCursor.toArray()

    // Tạo map từ resource ID đến đối tượng resource
    resources.forEach((resource) => {
      resourcesMap[resource._id.toString()] = resource
    })
  }

  // Tạo formatted roles với resources_url
  return roles.map((role) => {
    let formattedGrants = []
    if (role.role_grant && Array.isArray(role.role_grant)) {
      formattedGrants = role.role_grant.map((grant: any) => {
        const resource = resourcesMap[grant.resources]
        return {
          ...grant,
          resources_url: resource?.resource_url || null
        }
      })
    }

    return {
      role_name: role.role_name,
      role_description: role.role_description,
      role_grant: formattedGrants
    }
  })
}

/**
 * Hàm thêm resources_url vào role_grant cho một role duy nhất
 * @param role Role đơn lẻ cần xử lý
 * @returns Role đã được thêm resources_url vào role_grant
 */
export const addResourcesUrlToSingleRole = async (role: any) => {
  const result = await addResourcesUrlToRoles([role])
  return result[0]
}
