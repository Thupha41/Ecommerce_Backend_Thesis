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
