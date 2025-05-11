import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { REVIEWS_MESSAGES } from '~/constants/messages'
import reviewService from '~/services/reviews.services'
import { IUpsertReview } from '~/models/requests/reviews.requests'
import { TokenPayload } from '~/models/requests/users.requests'

class ReviewsController {
  async createReviewController(req: Request<ParamsDictionary, any, IUpsertReview>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const reviewData = req.body

    const result = await reviewService.createReview(user_id, reviewData)

    res.json({
      message: REVIEWS_MESSAGES.REVIEW_CREATED_SUCCESS,
      result
    })
    return
  }

  async getReviewsController(req: Request<ParamsDictionary & { productId: string }>, res: Response) {
    const { productId } = req.params
    const query = req.query

    const result = await reviewService.getReviews(productId, query)

    res.json({
      message: REVIEWS_MESSAGES.GET_REVIEWS_SUCCESS,
      result
    })
    return
  }

  async getShopReviewsController(req: Request<ParamsDictionary & { shopId: string }>, res: Response) {
    const { shopId } = req.params
    const query = req.query

    const result = await reviewService.getShopReviews(shopId, query)

    res.json({
      message: REVIEWS_MESSAGES.GET_REVIEWS_SUCCESS,
      result
    })
    return
  }

  async updateReviewController(req: Request<ParamsDictionary & { reviewId: string }>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { reviewId } = req.params
    const updateData = req.body

    const result = await reviewService.updateReview(user_id, reviewId, updateData)

    res.json({
      message: REVIEWS_MESSAGES.REVIEW_UPDATED_SUCCESS,
      result
    })
    return
  }

  async deleteReviewController(req: Request<ParamsDictionary & { reviewId: string }>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { reviewId } = req.params

    const result = await reviewService.deleteReview(user_id, reviewId)

    res.json({
      message: REVIEWS_MESSAGES.REVIEW_DELETED_SUCCESS,
      result
    })
    return
  }
}

const reviewsController = new ReviewsController()
export default reviewsController
