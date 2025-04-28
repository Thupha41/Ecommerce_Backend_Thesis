import { ObjectId } from 'mongodb'
import { ReviewStatus } from '~/constants/enums'

interface ReviewType {
  _id?: ObjectId
  user_id: ObjectId // Người đánh giá
  product_id: ObjectId // Sản phẩm được đánh giá
  order_id: ObjectId // Đơn hàng liên quan
  shop_id: ObjectId // Shop bán sản phẩm
  rating: number // Điểm đánh giá (1-5)
  comment?: string // Nhận xét
  media?: { type: 'image' | 'video'; url: string }[] // Danh sách media
  is_anonymous?: boolean // Ẩn danh
  status: ReviewStatus // Trạng thái: Pending, Approved, Rejected
  created_at?: Date
  updated_at?: Date
}

export default class Review {
  _id?: ObjectId
  user_id: ObjectId
  product_id: ObjectId
  order_id: ObjectId
  shop_id: ObjectId
  rating: number
  comment: string
  media: { type: 'image' | 'video'; url: string }[]
  is_anonymous: boolean
  status: ReviewStatus
  created_at: Date
  updated_at: Date

  constructor(review: ReviewType) {
    const date = new Date()
    this._id = review._id
    this.user_id = review.user_id
    this.product_id = review.product_id
    this.order_id = review.order_id
    this.shop_id = review.shop_id
    this.rating = review.rating || 0
    this.comment = review.comment || ''
    this.media = review.media || []
    this.is_anonymous = review.is_anonymous || false
    this.status = review.status || ReviewStatus.Pending
    this.created_at = review.created_at || date
    this.updated_at = review.updated_at || date
  }
}
