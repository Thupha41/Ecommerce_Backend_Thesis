import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ROLES_MESSAGES } from '~/constants/messages'
import roleService from '~/services/roles.services.lv2'
import { IUpsertRole } from '~/models/requests/role.requests'
import { TokenPayload } from '~/models/requests/users.requests'


export const createRoleController = async (
    req: Request<ParamsDictionary, any, IUpsertRole>,
    res: Response
) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await roleService.createRole(user_id, req.body)
    res.json({
        message: ROLES_MESSAGES.CREATE_ROLE_SUCCESS,
        result
    })
    return
}
export const getAllRolesController = async (
    req: Request,
    res: Response
) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await roleService.getAllRoles(user_id, req.query)
    res.json({
        message: ROLES_MESSAGES.GET_ALL_ROLES_SUCCESS,
        result
    })
    return
}

export const getRoleByIdController = async (
    req: Request<ParamsDictionary & { role_id: string }>,
    res: Response
) => {
    const { role_id } = req.params
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await roleService.getRoleById(user_id, role_id)
    res.json({
        message: ROLES_MESSAGES.GET_ROLE_SUCCESS,
        result
    })
    return
}

export const deleteRoleController = async (
    req: Request<ParamsDictionary & { resource_id: string }>,
    res: Response
) => {
    const { role_id } = req.params
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await roleService.deleteRole(user_id, role_id)
    res.json({
        message: ROLES_MESSAGES.DELETE_ROLE_SUCCESS,
        result
    })
    return
}

export const updateRoleController = async (
    req: Request<ParamsDictionary & { role_id: string }>,
    res: Response
) => {
    const { role_id } = req.params
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await roleService.updateRole(user_id, role_id, req.body)
    res.json({
        message: ROLES_MESSAGES.UPDATE_ROLE_SUCCESS,
        result
    })
    return
}

export const getRoleListRBACController = async (
    req: Request,
    res: Response
) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await roleService.roleListRBAC(user_id)
    res.json({
        message: ROLES_MESSAGES.GET_ROLE_LIST_RBAC_SUCCESS,
        result
    })
    return
}