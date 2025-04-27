import express from 'express'
import {
    createResourceController,
    getAllResourcesController,
    getResourceByIdController,
    updateResourceController,
    deleteResourceController
} from '~/controllers/resources.controllers'
import {
    createResourceValidator,
    resourceIdValidator,
    updateResourceValidator
} from '~/middlewares/resources.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
const resourcesRouter = express.Router()

resourcesRouter.use(accessTokenValidator)
/*
* Description: Create resource
* Path: /resources
* Method: POST
*/

resourcesRouter.post(
    '/',
    createResourceValidator,
    wrapRequestHandler(createResourceController)
)

/*
* Description: Get all resources
* Path: /resources
* Method: GET
*/

resourcesRouter.get(
    '/',
    wrapRequestHandler(getAllResourcesController)
)

/*
* Description: Get resource by id
* Path: /resources/:resource_id
* Method: GET
*/

resourcesRouter.get(
    '/:resource_id',
    resourceIdValidator,
    wrapRequestHandler(getResourceByIdController)
)

/*
* Description: Update resource
* Path: /resources/:resource_id
* Method: PATCH
*/

resourcesRouter.patch(
    '/:resource_id',
    resourceIdValidator,
    updateResourceValidator,
    wrapRequestHandler(updateResourceController)
)

/*
* Description: Delete resource
* Path: /resources/:resource_id
* Method: DELETE
*/

resourcesRouter.delete(
    '/:resource_id',
    resourceIdValidator,
    wrapRequestHandler(deleteResourceController)
)

export default resourcesRouter 