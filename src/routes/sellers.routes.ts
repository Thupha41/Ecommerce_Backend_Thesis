import { Router } from 'express'
import {
  createSeller,
  updateSeller,
  getAllSeller,
  deleteSeller,
  getAllRestaurantByUserId
} from '~/controllers/selllers.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { sellerValidator, isSellerExist } from '~/middlewares/seller.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const sellerRouter = Router()

sellerRouter.use(accessTokenValidator)
/**
 * Description: Create a new seller
 * Path: /
 * method: POST
 * Body: {name: string, phone: string, address: string, email: string, rating: number, image: string, isActive: boolean}
 */
sellerRouter.post('/', sellerValidator, wrapRequestHandler(createSeller))
/**
 * Description: Update a seller
 * Path: /:seller_id
 * method: PUT
 * Body: {name: string, phone: string, address: string, email: string, rating: number, image: string, isActive: boolean}
 */
sellerRouter.put('/:seller_id', isSellerExist, sellerValidator, wrapRequestHandler(updateSeller))
/**
 * Description: Get all sellers
 * Path: /
 * method: GET
 */
sellerRouter.get('/all', wrapRequestHandler(getAllSeller))
/**
 * Description: Get all seller by user id
 * Path: /:user_id
 * method: GET
 */
sellerRouter.get('/', wrapRequestHandler(getAllRestaurantByUserId))
/**
 * Description: Delete a seller
 * Path: /:seller_id
 * method: DELETE
 */
sellerRouter.delete('/:seller_id', isSellerExist, wrapRequestHandler(deleteSeller))

export default sellerRouter
