import { RESOURCES_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId } from 'mongodb'
import { rbacRepository } from '~/models/repositories/rbac.repo'
import databaseService from './database.services'
import roleService from './roles.services'

class ResourceService {
    // Lấy tất cả resource
    async getAllResources(user_id: string, { limit = 50, sort = 'ctime', page = 1 }) {
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
        const resources = await rbacRepository.findAll({
            collection: databaseService.resources,
            limit,
            sort,
            page
        })
        return resources
    }

    // Lấy một resource theo ID
    async getResourceById(user_id: string, resource_id: string) {
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
        //check resource
        const resource = await rbacRepository.findById({
            collection: databaseService.resources,
            id: resource_id,
            errorMessage: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND
        })
        if (!resource) {
            throw new ErrorWithStatus({
                message: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
            })
        }
        return resource
    }

    // Tạo resource mới
    async createResource(user_id: string, { resource_url, resource_description }: {
        resource_url: string;
        resource_description: string;
    }) {
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

        // Kiểm tra xem resource_name đã tồn tại chưa
        const exists = await rbacRepository.exists({
            collection: databaseService.resources,
            filter: { resource_url }
        })
        if (exists) {
            throw new ErrorWithStatus({
                message: RESOURCES_MESSAGES.RESOURCE_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
            })
        }

        // Tạo dữ liệu resource mới
        const resourceData = {
            resource_url,
            resource_description,
            created_at: new Date(),
            updated_at: new Date()
        }

        // Lưu vào database
        return await rbacRepository.create({
            collection: databaseService.resources,
            data: resourceData
        })
    }

    // Cập nhật resource
    async updateResource(user_id: string, resource_id: string, { resource_url, resource_description }: {
        resource_url?: string;
        resource_description?: string;
    }) {
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
        // Nếu resource_name được cập nhật, kiểm tra xem có trùng không
        if (resource_url) {
            const exists = await rbacRepository.exists({
                collection: databaseService.resources,
                filter: {
                    resource_url,
                    _id: { $ne: new ObjectId(resource_id) }
                }
            })

            if (exists) {
                throw new ErrorWithStatus({
                    message: RESOURCES_MESSAGES.RESOURCE_ALREADY_EXISTS + ": " + resource_url,
                    status: HTTP_STATUS.CONFLICT
                })
            }
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData: any = {}

        if (resource_url) updateData.resource_url = resource_url
        if (resource_description) updateData.resource_description = resource_description

        // Cập nhật resource
        return await rbacRepository.update({
            collection: databaseService.resources,
            id: resource_id,
            data: {
                ...updateData,
                updated_at: new Date()
            },
            errorMessage: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND
        })
    }

    // Xóa resource
    async deleteResource(user_id: string, resource_id: string, force = false) {
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
        //check resource
        const resource = await rbacRepository.findById({
            collection: databaseService.resources,
            id: resource_id,
            errorMessage: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND
        })
        if (!resource) {
            throw new ErrorWithStatus({
                message: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
            })
        }
        //check used in role
        const usedInRole = await databaseService.roles.findOne({
            'role_grant.resources': new ObjectId(resource_id)
        })

        if (usedInRole && !force) {
            throw new ErrorWithStatus({
                message: RESOURCES_MESSAGES.RESOURCE_IN_USE,
                status: HTTP_STATUS.CONFLICT
            })
        }

        // Nếu force = true, xóa resource khỏi tất cả role
        if (usedInRole && force) {
            await roleService.removeResourceFromRoles(resource_id)
        }

        return await rbacRepository.delete({
            collection: databaseService.resources,
            id: resource_id,
            errorMessage: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND
        })
    }
}

const resourceService = new ResourceService()
export default resourceService 