import { RESOURCES_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId, SortDirection, Sort } from 'mongodb'
import { rbacRepository } from '~/models/repositories/rbac.repo'
import databaseService from './database.services'
import roleService from './roles.services'
import { IUpsertResource } from '../models/requests/resources.requests'

class ResourceService {
  async createResource({ resource_name, resource_description }: IUpsertResource) {
    //find name exist
    const resource = await databaseService.resources.findOne({ resource_name: resource_name })
    if (resource) {
      throw new ErrorWithStatus({
        message: RESOURCES_MESSAGES.RESOURCE_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT
      })
    }
    //create new resource
    const newResource = await databaseService.resources.insertOne({
      resource_name,
      resource_description,
      created_at: new Date(),
      updated_at: new Date()
    })
    return newResource
  }
  async updateResource(resourceId: string, { resource_name, resource_description }: IUpsertResource) {
    const resource = await databaseService.resources.findOne({ _id: new ObjectId(resourceId) })
    if (!resource) {
      throw new ErrorWithStatus({
        message: RESOURCES_MESSAGES.RESOURCE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //update resource
    const updatedResource = await databaseService.resources.updateOne(
      { _id: new ObjectId(resourceId) },
      { $set: { resource_name, resource_description, updated_at: new Date() } }
    )
    return updatedResource
  }
  async deleteResource(resource_id: string, force = false) {
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
  async getResource(resourceId: string) {
    const resource = await databaseService.resources.findOne({ _id: new ObjectId(resourceId) })
    return resource
  }
  async getAllResources({
    limit,
    sort,
    page,
    filter,
    select
  }: {
    limit: number
    sort: string
    page: number
    filter: any
    select: string[]
  }) {
    const skip = (page - 1) * limit
    const sortBy: Sort = sort === 'ctime' ? { _id: -1 as SortDirection } : { _id: 1 as SortDirection }

    const projection: Record<string, 1 | 0> = {}
    select.forEach((field) => {
      projection[field] = 1
    })
    const resources = await databaseService.resources
      .find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .project(projection)
      .toArray()
    return resources
  }
}

const resourceService = new ResourceService()
export default resourceService
