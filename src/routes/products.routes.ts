import { Router } from 'express'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import {
  createProductController,
  publishProductController,
  unpublishProductController,
  getAllDraftsForShopController,
  getAllPublishedForShopController,
  getSearchProductsController,
  getAllProductsController,
  getProductDetailController,
  updateProductController
} from '~/controllers/products.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  createProductValidator,
  productIdValidator,
  searchProductValidator,
  updateProductValidator
} from '~/middlewares/products.middlewares'

const productsRouter = Router()

/**
 * Description: Get all products
 * Path: /
 * Method: GET
 * Query: limit, sort, page, filter
 * Access: Public
 */
productsRouter.get('/', wrapRequestHandler(getAllProductsController))

/**
 * Description: Search products
 * Path: /search/:keySearch
 * Method: GET
 * Access: Public
 */
productsRouter.get('/search/:keySearch', searchProductValidator, wrapRequestHandler(getSearchProductsController))

// Authentication required routes
productsRouter.use(accessTokenValidator, verifiedUserValidator)

/**
 * Description: Get all drafts for shop
 * Path: /drafts
 * Method: GET
 * Access: Private
 */
productsRouter.get('/drafts', wrapRequestHandler(getAllDraftsForShopController))

/**
 * Description: Get all published products for shop
 * Path: /published
 * Method: GET
 * Access: Private
 */
productsRouter.get('/published', wrapRequestHandler(getAllPublishedForShopController))

/**
 * Description: Create product
 * Path: /
 * Method: POST
 * Body: CreateProductReqBody
 * Access: Private
 */
productsRouter.post('/', createProductValidator, wrapRequestHandler(createProductController))

/**
 * Description: Publish product
 * Path: /publish/:id
 * Method: POST
 * Access: Private
 */
productsRouter.post('/publish/:id', productIdValidator, wrapRequestHandler(publishProductController))

/**
 * Description: Unpublish product
 * Path: /unpublish/:id
 * Method: POST
 * Access: Private
 */
productsRouter.post('/unpublish/:id', productIdValidator, wrapRequestHandler(unpublishProductController))

/**
 * Description: Get product detail
 * Path: /:product_id
 * Method: GET
 * Access: Public
 */
productsRouter.get('/:product_id', productIdValidator, wrapRequestHandler(getProductDetailController))

/**
 * Description: Update product
 * Path: /:productId
 * Method: PATCH
 * Access: Private
 */
productsRouter.patch(
  '/:productId',
  productIdValidator,
  updateProductValidator,
  wrapRequestHandler(updateProductController)
)
export default productsRouter
