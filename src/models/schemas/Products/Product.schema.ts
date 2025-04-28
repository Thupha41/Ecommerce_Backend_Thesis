import { ObjectId } from 'mongodb'
import { ProductType } from '~/constants/enums'

export interface IProductType {
  _id?: ObjectId
  product_name: string
  product_thumb: string
  product_price: number
  product_quantity: number
  product_slug?: string
  product_type: ProductType
  product_description: string
  product_shop: string | ObjectId
  product_attributes: any
  product_ratingsAverage?: number
  product_variations?: Array<any>
  isDraft?: boolean
  isPublished?: boolean
  created_at?: Date
  updated_at?: Date
  total_reviews?: number // Tổng số đánh giá
  reviews_by_rating?: { [key: number]: number } // Số lượng đánh giá theo sao
  reviews_with_media?: number // Số đánh giá có ảnh/video
  total_media_count?: number // Tổng số ảnh/video
}

export default class Product {
  _id?: ObjectId
  product_name: string
  product_thumb: string
  product_price: number
  product_quantity: number
  product_slug: string
  product_type: ProductType
  product_description: string
  product_shop: ObjectId
  product_attributes: any
  product_ratingsAverage: number
  product_variations: Array<any>
  isDraft: boolean
  isPublished: boolean
  created_at: Date
  updated_at: Date
  total_reviews: number
  reviews_by_rating: { [key: number]: number }
  reviews_with_media: number
  total_media_count: number

  constructor({
    _id,
    product_name,
    product_thumb,
    product_price,
    product_quantity,
    product_slug,
    product_type,
    product_description,
    product_shop,
    product_attributes,
    product_ratingsAverage,
    product_variations,
    isDraft,
    isPublished,
    created_at,
    updated_at,
    total_reviews,
    reviews_by_rating,
    reviews_with_media,
    total_media_count
  }: IProductType) {
    const date = new Date()
    this._id = _id
    this.product_name = product_name
    this.product_thumb = product_thumb
    this.product_price = product_price
    this.product_quantity = product_quantity
    this.product_slug = product_slug || this.generateSlug(product_name)
    this.product_type = product_type
    this.product_description = product_description
    this.product_shop = typeof product_shop === 'string' ? new ObjectId(product_shop) : product_shop
    this.product_attributes = product_attributes
    this.product_ratingsAverage = product_ratingsAverage || 4.5
    this.product_variations = product_variations || []
    this.isDraft = isDraft || true
    this.isPublished = isPublished || false
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.total_reviews = total_reviews || 0
    this.reviews_by_rating = reviews_by_rating || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    this.reviews_with_media = reviews_with_media || 0
    this.total_media_count = total_media_count || 0
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}
