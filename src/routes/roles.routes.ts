import express from 'express'
import {
  createRoleController,
  getAllRolesController,
  getRoleByIdController,
  updateRoleController,
  deleteRoleController,
  getRoleListRBACController
} from '~/controllers/roles.controllers'
import { createRoleValidator, roleIdValidator, updateRoleValidator } from '~/middlewares/roles.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
const rolesRouter = express.Router()

rolesRouter.use(accessTokenValidator)
/*
 * Description: Create role
 * Path: /roles
 * Method: POST
 */

rolesRouter.post('/', createRoleValidator, wrapRequestHandler(createRoleController))

/*
 * Description: Get all roles
 * Path: /roles
 * Method: GET
 */

rolesRouter.get('/', wrapRequestHandler(getAllRolesController))

/*
 * Description: Get role list RBAC
 * Path: /roles/rbac
 * Method: GET
 */

rolesRouter.get('/rbac', wrapRequestHandler(getRoleListRBACController))
/*
 * Description: Get role by id
 * Path: /roles/:role_id
 * Method: GET
 */

rolesRouter.get('/:role_id', roleIdValidator, wrapRequestHandler(getRoleByIdController))

/*
 * Description: Update role
 * Path: /roles/:role_id
 * Method: PATCH
 */

rolesRouter.patch('/:role_id', roleIdValidator, updateRoleValidator, wrapRequestHandler(updateRoleController))

/*
 * Description: Delete role
 * Path: /roles/:role_id
 * Method: DELETE
 */

rolesRouter.delete('/:role_id', roleIdValidator, wrapRequestHandler(deleteRoleController))

export default rolesRouter
