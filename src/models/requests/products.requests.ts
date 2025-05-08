import { ParamsDictionary } from 'express-serve-static-core'
import { ProductType } from '~/constants/enums'
import { ObjectId } from 'mongodb'

export interface CreateProductReqBody {
  product_name: string
  product_thumb: string
  product_price: number
  product_quantity: number
  product_type: ProductType
  product_description: string
  product_attributes: any
}
export interface CreateProductSPUReqBody {
  product_name: string
  product_thumb: string
  product_media: Array<{
    url: string; // URL của ảnh hoặc video
    type: "image" | "video"; // Loại media
  }>
  product_description: string
  product_quantity: number
  product_category: string
  product_attributes: any
  product_price: number
  product_shop: string
  product_variations: any[]
  sku_list: Array<{
    sku_tier_idx: Array<number>; // Chỉ số của biến thể [color_index, size_index, ...]
    sku_price: number;
    sku_stock: number;
    sku_image?: string; // Ảnh đại diện của biến thể
  }>
}
export interface ICreateSKU {
  spu_id: string
  spu_no: string
  sku_list: Array<{
    sku_tier_idx: Array<number>; // Chỉ số của biến thể [color_index, size_index, ...]
    sku_price: number;
    sku_stock: number;
    sku_image?: string; // Ảnh đại diện của biến thể
  }>;
}
export interface ProductIdReqParams extends ParamsDictionary {
  id: string
}

export interface ProductDetailReqParams extends ParamsDictionary {
  product_id: string
}

export interface SearchProductReqParams extends ParamsDictionary {
  keySearch: string
}

export interface GetAllProductsReqQuery {
  limit?: number
  sort?: string
  page?: number
  filter?: {
    isPublished: boolean
    [key: string]: any
  }
}

export interface ShopProductReqBody {
  product_shop: string | ObjectId
  product_id: string
}

export interface ProductQuery {
  query: any
  limit?: number
  skip?: number
}

export interface FindAllProductsOptions {
  limit: number
  sort: string
  page: number
  filter: {
    isPublished?: boolean
    [key: string]: any
  }
  select?: string[]
}

// For repository methods
export interface FindProductOptions {
  product_id: string
  unSelect?: string[]
}

// Add a new interface for the service parameters
export interface FindAllProductsParams {
  limit?: number
  sort?: string
  page?: number
  filter: {
    isPublished: boolean
    [key: string]: any
  }
}

export interface ProductUpdateReqBody {
  product_name?: string
  product_thumb?: string
  product_price?: number
  product_quantity?: number
  product_type?: ProductType
  product_description?: string
  product_attributes?: any
}

export interface ProductUpdateReqParams extends ParamsDictionary {
  product_id: string
}
