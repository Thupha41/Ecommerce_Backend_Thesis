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
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import path from 'path'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { MediaType } from '~/constants/enums'
import { envConfig } from '~/constants/config'
import { uploadFileToS3 } from '~/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'


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
    limit: Number(limit),
    sort,
    page: Number(page),
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

export const getProductDetailByNameController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const product_name = req.query.product_name as string

  if (!product_name) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: PRODUCTS_MESSAGES.PRODUCT_NAME_IS_REQUIRED
    })
  }

  // Decode the URL-encoded product name
  const decodedProductName = decodeURIComponent(product_name)

  const result = await ProductFactory.findOneProductByName({ product_name: decodedProductName })

  if (!result) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND
    })
  }

  res.json({
    message: PRODUCTS_MESSAGES.GET_PRODUCT_DETAIL_SUCCESS,
    result
  })
  return;
}

export const updateProductController = async (req: Request<ProductIdReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { productId } = req.params
  const { product_type } = req.body

  const result = await ProductFactory.updateProduct(product_type as ProductType, productId, {
    ...req.body,
    updated_at: new Date(),
    product_shop: user_id
  })

  res.json({
    message: PRODUCTS_MESSAGES.UPDATE_PRODUCT_SUCCESS,
    result
  })
  return
}

/*
  Fix later in next version
*/

export const updateProductThumbController = async (
  req: Request<ProductIdReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { productId } = req.params

  // At this point, handleProductThumbUpload middleware has already processed the file
  // and added product_thumb to req.body if a file was uploaded

  if (!req.body.product_thumb) {
    throw new ErrorWithStatus({
      message: PRODUCTS_MESSAGES.PRODUCT_THUMB_IS_REQUIRED,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  // Get the product to verify ownership and get its type
  const product = await databaseService.products.findOne({
    _id: new ObjectId(productId),
    product_shop: new ObjectId(user_id)
  })

  if (!product) {
    throw new ErrorWithStatus({
      message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  // Get the correct file path
  const filePath = path.resolve(UPLOAD_IMAGE_DIR, req.body.product_thumb)

  // Dynamically import mime
  const mimeModule = await import('mime')
  const contentType = mimeModule.default.getType(filePath) as string

  // Upload image to s3
  const s3Result = await uploadFileToS3({
    filename: 'images/products/' + req.body.product_thumb,
    filepath: filePath,
    contentType: contentType
  })

  const s3Url = (s3Result as CompleteMultipartUploadCommandOutput).Location as string
  const mediaResponse = {
    url: s3Url,
    type: MediaType.Image
  }


  // Update only the product_thumb field
  const result = await databaseService.products.updateOne(
    {
      _id: new ObjectId(productId),
      product_shop: new ObjectId(user_id)
    },
    {
      $set: {
        product_thumb: s3Url,
        updated_at: new Date()
      }
    }
  )

  res.json({
    message: PRODUCTS_MESSAGES.UPDATE_PRODUCT_SUCCESS,
    result: {
      ...result,
      mediaResponse
    }
  })
}

export const getTopProductsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const queryParams: FindAllProductsParams = {
    limit: 50,
    sort: 'product_ratingsAverage',
    page: 1,
    filter: {
      isPublished: true,
      // product_ratingsAverage: { $eq: 4.5 }
    }
  }

  const result = await ProductFactory.findAllProducts(queryParams)

  res.json({
    message: PRODUCTS_MESSAGES.GET_TOP_RATED_PRODUCTS_SUCCESS,
    result
  })
}
