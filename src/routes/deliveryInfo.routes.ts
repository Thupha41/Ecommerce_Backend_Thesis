import { Router } from 'express'
import {
  createDeliveryInfo,
  updateDeliveryInfo,
  getAllDeliveryInfo,
  deleteDeliveryInfo,
  getAllDeliveryInfoByUserId,
  getDeliveryDetail,
  getDeliveryDefault
} from '~/controllers/deliveryInfo.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import {
  deliveryInfoValidator,
  isDeliveryInfoExist,
  validateDeliveryInfoStructure
} from '~/middlewares/deliveryInfo.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const deliveryInfoRouter = Router()

deliveryInfoRouter.use(accessTokenValidator)
/**
 * Description: Create a new delivery info
 * Path: /
 * method: POST
 * Body: {personal_detail: {name: string, phone: string}, shipping_address: {province_city: string, district: string, ward: string, street: string}, is_default: boolean}
 */
deliveryInfoRouter.post(
  '/',
  validateDeliveryInfoStructure,
  deliveryInfoValidator,
  wrapRequestHandler(createDeliveryInfo)
)
/**
 * Description: Update a delivery info
 * Path: /:delivery_id
 * method: PUT
 * Body: {personal_detail: {name: string, phone: string}, shipping_address: {province_city: string, district: string, ward: string, street: string}, is_default: boolean}
 */
deliveryInfoRouter.put(
  '/:delivery_id',
  isDeliveryInfoExist,
  validateDeliveryInfoStructure,
  deliveryInfoValidator,
  wrapRequestHandler(updateDeliveryInfo)
)
/**
 * Description: Get delivery default by user
 * Path: /default
 * method: GET
 */
deliveryInfoRouter.get('/default', wrapRequestHandler(getDeliveryDefault))
/**
 * Description: Get delivery detail
 * Path: /:delivery_id
 * method: GET
 */
deliveryInfoRouter.get('/:delivery_id', isDeliveryInfoExist, wrapRequestHandler(getDeliveryDetail))
/**
 * Description: Get all delivery info by user id
 * Path: /:user_id
 * method: POST
 */
deliveryInfoRouter.post('/:user_id', wrapRequestHandler(getAllDeliveryInfoByUserId))

/**
 * Description: Get all delivery info
 * Path: /
 * method: GET
 */
deliveryInfoRouter.get('/', wrapRequestHandler(getAllDeliveryInfo))
/**
 * Description: Delete a delivery info
 * Path: /:delivery_id
 * method: DELETE
 */
deliveryInfoRouter.delete('/:delivery_id', isDeliveryInfoExist, wrapRequestHandler(deleteDeliveryInfo))

export default deliveryInfoRouter
