import { ObjectId } from 'mongodb'
import { generateSlug } from '~/utils'

export interface ISKUType {
    _id?: ObjectId
    sku_no: string //string "{spu_no}_{shop_id}_{sku_tier_idx}"
    sku_tier_idx: Array<number> //[0,1], [1,1]
    /* sku_tier_idx
        color = [red,green] = [0,1]
        size = [X,L,M,S] = [0,1,2,3]
        => red + X = [0,0]
        => red + L = [0,1]
        => red + M = [0,2]
        => red + S = [0,3]
        => green + X = [1,0]
        => green + L = [1,1]
        => green + M = [1,2]
        => green + S = [1,3]
    */
    sku_slug?: string
    sku_default?: boolean
    sku_sort?: number
    sku_price: number
    sku_stock: number //array in of stock
    sku_image?: string // URL to the image for this specific variant
    product_id: ObjectId //ref to product_spu
    isPublished?: boolean
    isDeleted?: boolean
    created_at?: Date
    updated_at?: Date
}

export default class SKU {
    _id?: ObjectId
    sku_no: string
    sku_tier_idx: Array<number>
    sku_slug?: string
    sku_default?: boolean
    sku_sort?: number
    sku_price: number
    sku_stock: number //array in of stock
    sku_image?: string // URL to the image for this specific variant
    product_id: ObjectId //ref to product_spu
    isPublished?: boolean
    isDeleted?: boolean
    created_at?: Date
    updated_at?: Date
    constructor({
        _id,
        sku_no,
        sku_tier_idx,
        sku_slug,
        sku_default,
        sku_sort,
        sku_price,
        sku_stock,
        sku_image,
        product_id,
        isPublished,
        isDeleted,
        created_at,
        updated_at
    }: ISKUType) {
        const date = new Date()
        this._id = _id
        this.sku_no = sku_no
        this.sku_tier_idx = sku_tier_idx
        this.sku_slug = sku_slug || generateSlug(sku_no)
        this.sku_default = sku_default || false
        this.sku_sort = sku_sort || 0
        this.sku_price = sku_price || 0
        this.sku_stock = sku_stock || 0
        this.sku_image = sku_image
        this.product_id = product_id
        this.isPublished = isPublished || false
        this.isDeleted = isDeleted || false
        this.created_at = created_at || date
        this.updated_at = updated_at || date
    }
}
