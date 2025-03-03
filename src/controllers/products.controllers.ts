import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import {
  CreateProductReqBody,
  ProductIdReqParams,
  ProductDetailReqParams,
  SearchProductReqParams,
  GetAllProductsReqQuery,
  ShopProductReqBody,
  FindAllProductsParams
} from '~/models/requests/products.requests'
import { TokenPayload } from '~/models/requests/users.requests'
import { PRODUCTS_MESSAGES } from '~/constants/messages'
import ProductFactory from '~/services/products.services'
import { ProductType } from '~/constants/enums'

export const createProductController = async (
  req: Request<ParamsDictionary, any, CreateProductReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { product_type, ...productData } = req.body
  const { user_id } = req.decoded_authorization as TokenPayload

  // Validate product type using string values
  if (!product_type || !Object.values(ProductType).includes(product_type as ProductType)) {
    throw new Error(PRODUCTS_MESSAGES.INVALID_PRODUCT_TYPE)
  }

  const result = await ProductFactory.createProduct(product_type as ProductType, {
    ...productData,
    product_type: product_type as ProductType,
    product_shop: user_id
  })

  res.json({
    message: PRODUCTS_MESSAGES.CREATE_PRODUCT_SUCCESS,
    result
  })
}

export const publishProductController = async (req: Request<ProductIdReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { id } = req.params

  const result = await ProductFactory.publishProductByShop({
    product_shop: user_id,
    product_id: id
  })

  res.json({
    message: PRODUCTS_MESSAGES.PUBLISH_PRODUCT_SUCCESS,
    result
  })
}

export const unpublishProductController = async (
  req: Request<ProductIdReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { id } = req.params

  const result = await ProductFactory.unPublishProductByShop({
    product_shop: user_id,
    product_id: id
  })

  res.json({
    message: PRODUCTS_MESSAGES.UNPUBLISH_PRODUCT_SUCCESS,
    result
  })
}

export const getAllDraftsForShopController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await ProductFactory.findAllDraftsForShop({
    product_shop: user_id
  })

  res.json({
    message: PRODUCTS_MESSAGES.GET_ALL_DRAFTS_SUCCESS,
    result
  })
}

export const getAllPublishedForShopController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await ProductFactory.findAllPublishedForShop({
    product_shop: user_id
  })

  res.json({
    message: PRODUCTS_MESSAGES.GET_ALL_PUBLISHED_SUCCESS,
    result
  })
}

export const getSearchProductsController = async (
  req: Request<SearchProductReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { keySearch } = req.params

  const result = await ProductFactory.searchProductByUser({ keySearch })
  if (result.length === 0) {
    throw new Error(PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND)
  }

  res.json({
    message: PRODUCTS_MESSAGES.SEARCH_PRODUCT_SUCCESS,
    result
  })
}

export const getAllProductsController = async (
  req: Request<ParamsDictionary, any, any, GetAllProductsReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const { limit = 50, sort = 'ctime', page = 1, filter = { isPublished: true } } = req.query

  const queryParams: FindAllProductsParams = {
    limit,
    sort,
    page,
    filter: {
      ...filter,
      isPublished: filter.isPublished ?? true
    }
  }

  const result = await ProductFactory.findAllProducts(queryParams)

  res.json({
    message: PRODUCTS_MESSAGES.GET_ALL_PRODUCTS_SUCCESS,
    result
  })
}

export const getProductDetailController = async (
  req: Request<ProductDetailReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { product_id } = req.params

  const result = await ProductFactory.findOneProduct({ product_id })

  res.json({
    message: PRODUCTS_MESSAGES.GET_PRODUCT_DETAIL_SUCCESS,
    result
  })
}

export const updateProductController = async (req: Request<ProductIdReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { productId } = req.params
  const { product_type } = req.body

  const result = await ProductFactory.updateProduct(product_type as ProductType, productId, {
    ...req.body,
    product_shop: user_id
  })

  res.json({
    message: PRODUCTS_MESSAGES.UPDATE_PRODUCT_SUCCESS,
    result
  })
  return
}
