import { ObjectId } from 'mongodb'
import { generateSlug } from '~/utils'

export interface IProductType {
    _id?: ObjectId
    product_name: string
    product_thumb: string
    SPU_no: string
    product_price: number
    product_quantity: number
    product_slug?: string
    product_category: ObjectId
    product_description: string
    product_shop: ObjectId
    product_attributes: Array<any>
    product_ratingsAverage?: number
    product_variations?: Array<any>
    isDraft?: boolean
    isPublished?: boolean
    isDeleted?: boolean
    created_at?: Date
    updated_at?: Date
}

export default class Product {
    _id?: ObjectId
    product_name: string
    product_thumb: string
    SPU_no: string
    product_price: number
    product_quantity: number
    product_slug: string
    product_category: ObjectId
    product_description: string
    product_shop: ObjectId
    product_attributes: Array<any>
    product_ratingsAverage: number
    product_variations: Array<any>
    isDraft: boolean
    isPublished: boolean
    isDeleted: boolean
    created_at: Date
    updated_at: Date

    constructor({
        _id,
        product_name,
        product_thumb,
        SPU_no,
        product_price,
        product_quantity,
        product_slug,
        product_category,
        product_description,
        product_shop,
        product_attributes,
        product_ratingsAverage,
        product_variations,
        isDraft,
        isPublished,
        isDeleted,
        created_at,
        updated_at
    }: IProductType) {
        const date = new Date()
        this._id = _id
        this.product_name = product_name
        this.product_thumb = product_thumb
        this.SPU_no = SPU_no
        this.product_price = product_price
        this.product_quantity = product_quantity
        this.product_slug = product_slug || generateSlug(product_name)
        this.product_category = product_category
        this.product_description = product_description
        this.product_shop = product_shop
        this.product_attributes = product_attributes || []
        this.product_ratingsAverage = product_ratingsAverage || 4.5
        this.product_variations = product_variations || []
        this.isDraft = isDraft || true
        this.isPublished = isPublished || false
        this.isDeleted = isDeleted || false
        this.created_at = created_at || date
        this.updated_at = updated_at || date
    }
}
