import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RESOURCES_MESSAGES } from '~/constants/messages'
import resourceService from '~/services/resources.services.lv2'
import { IUpsertResource } from '~/models/requests/resources.requests'
import { TokenPayload } from '~/models/requests/users.requests'

export const createResourceController = async (req: Request<ParamsDictionary, any, IUpsertResource>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await resourceService.createResource(user_id, req.body)
  res.json({
    message: RESOURCES_MESSAGES.CREATE_RESOURCE_SUCCESS,
    result
  })
  return
}
export const getAllResourcesController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await resourceService.getAllResources(user_id, req.query)
  res.json({
    message: RESOURCES_MESSAGES.GET_ALL_RESOURCES_SUCCESS,
    result
  })
  return
}

export const getResourceByIdController = async (
  req: Request<ParamsDictionary & { resource_id: string }>,
  res: Response
) => {
  const { resource_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await resourceService.getResourceById(user_id, resource_id)
  res.json({
    message: RESOURCES_MESSAGES.GET_RESOURCE_SUCCESS,
    result
  })
  return
}

export const deleteResourceController = async (
  req: Request<ParamsDictionary & { resource_id: string }>,
  res: Response
) => {
  const { resource_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const force = req.query.force === 'true'
  const result = await resourceService.deleteResource(user_id, resource_id, force)
  res.json({
    message: RESOURCES_MESSAGES.DELETE_RESOURCE_SUCCESS,
    result
  })
  return
}

export const updateResourceController = async (
  req: Request<ParamsDictionary & { resource_id: string }>,
  res: Response
) => {
  const { resource_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await resourceService.updateResource(user_id, resource_id, req.body)
  res.json({
    message: RESOURCES_MESSAGES.UPDATE_RESOURCE_SUCCESS,
    result
  })
  return
}
