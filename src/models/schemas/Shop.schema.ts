import { ShopStatus } from '~/constants/enums'

import { ObjectId } from 'mongodb'

interface ShopType {
  _id?: ObjectId
  shop_owner: ObjectId
  shop_name: string
  shop_description: string
  shop_slug: string
  shop_status: ShopStatus
  created_at?: Date
  updated_at?: Date
  shop_response_rate?: number
  shop_hotline_phone?: string
  shop_email?: string
  shop_logo?: string
  shop_banner?: string
  shop_revenue?: number
  follower_count?: number
  is_followed?: boolean
  shop_rating?: number
  total_reviews?: number // Tổng số đánh giá của shop
  reviews_by_rating?: { [key: number]: number } // Số lượng đánh giá theo sao
  reviews_with_media?: number // Số đánh giá có ảnh/video
  total_media_count?: number // Tổng số ảnh/video
}

export default class Shop {
  _id?: ObjectId
  shop_owner: ObjectId
  shop_name: string
  shop_description: string
  shop_slug: string
  shop_status: ShopStatus
  created_at: Date
  updated_at: Date
  shop_response_rate?: number
  shop_hotline_phone?: string
  shop_email?: string
  shop_logo?: string
  shop_banner?: string
  shop_revenue?: number
  follower_count?: number
  is_followed?: boolean
  shop_rating?: number
  total_reviews?: number
  reviews_by_rating?: { [key: number]: number }
  reviews_with_media?: number
  total_media_count?: number

  constructor(shop: ShopType) {
    const date = new Date()
    this._id = shop._id
    this.shop_owner = shop.shop_owner
    this.shop_name = shop.shop_name || ''
    this.shop_description = shop.shop_description || ''
    this.shop_slug = shop.shop_slug || ''
    this.shop_status = shop.shop_status || ShopStatus.Pending
    this.created_at = shop.created_at || date
    this.updated_at = shop.updated_at || date
    this.shop_response_rate = shop.shop_response_rate || 0
    this.shop_hotline_phone = shop.shop_hotline_phone || ''
    this.shop_email = shop.shop_email || ''
    this.shop_logo = shop.shop_logo || ''
    this.shop_banner = shop.shop_banner || ''
    this.shop_revenue = shop.shop_revenue || 0
    this.follower_count = shop.follower_count || 0
    this.is_followed = shop.is_followed || false
    this.shop_rating = shop.shop_rating || 0
    this.total_reviews = shop.total_reviews || 0
    this.reviews_by_rating = shop.reviews_by_rating || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    this.reviews_with_media = shop.reviews_with_media || 0
    this.total_media_count = shop.total_media_count || 0
  }
}
