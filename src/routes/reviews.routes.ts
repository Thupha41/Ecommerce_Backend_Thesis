import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import reviewsController from '~/controllers/reviews.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import {
  createReviewValidator,
  handleReviewMediaUpload,
  updateReviewValidator,
  validateReviewIdParam
} from '~/middlewares/reviews.middlewares'

const reviewsRouter = Router()

/**
 * Description: Handle create a new review
 * Path: /
 * Method: POST
 * Access: Private
 * Body: {
 *  product_id: string,
 *  order_id: string,
 *  is_anonymous: boolean,
 *  rating: number,
 *  comment: string,
 *  media: string[]
 * }
 */
reviewsRouter.post(
  '/',
  accessTokenValidator,
  handleReviewMediaUpload,
  createReviewValidator,
  wrapRequestHandler(reviewsController.createReviewController)
)

/**
 * Description: Handle get reviews for a product
 * Path: /product/:productId
 * Method: GET
 * Access: Public
 */
reviewsRouter.get('/product/:productId', wrapRequestHandler(reviewsController.getReviewsController))

/**
 * Description: Handle get reviews for a shop
 * Path: /shop/:shopId
 * Method: GET
 * Access: Public
 */
reviewsRouter.get('/shop/:shopId', wrapRequestHandler(reviewsController.getShopReviewsController))

/**
 * Description: Handle update a review
 * Path: /:reviewId
 * Method: PUT
 * Access: Private
 * Body: {
 *  rating: number,
 *  comment: string,
 *  media: string[]
 *  status: string
 *  is_anonymous: boolean
 *  product_id: string
 *  order_id: string
 * }
 */
reviewsRouter.put(
  '/:reviewId',
  accessTokenValidator,
  validateReviewIdParam,
  handleReviewMediaUpload,
  updateReviewValidator,
  wrapRequestHandler(reviewsController.updateReviewController)
)

/**
 * Description: Handle delete a review
 * Path: /:reviewId
 * Method: DELETE
 * Access: Private
 */
reviewsRouter.delete(
  '/:reviewId',
  accessTokenValidator,
  validateReviewIdParam,
  wrapRequestHandler(reviewsController.deleteReviewController)
)
export default reviewsRouter
