import { Router } from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import {
  createProductController,
  publishProductController,
  unpublishProductController,
  getAllDraftsForShopController,
  getAllPublishedForShopController,
  getSearchProductsController,
  getAllProductsController,
  getProductDetailController,
  updateProductController,
  updateProductThumbController,
  getTopProductsController,
  getProductDetailByNameController,
  createProductSPUController,
  getProductSPUWithVariantsController
} from '~/controllers/products.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  createProductValidator,
  productIdValidator,
  searchProductValidator,
  updateProductValidator,
  handleProductThumbUpload,
  handleProductMediaUpload
} from '~/middlewares/products.middlewares'

import { serveImageController } from '~/controllers/upload.controllers'
import { Request, Response, NextFunction } from 'express'
import { initFolder, extractFieldsFromFormidable } from '~/utils/file'
import skusService from '~/services/skus.services'
import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import formidable from 'formidable'

// Mở rộng kiểu Request để có thuộc tính files
interface RequestWithFiles extends Request {
  files?: any;
}

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
 * Description: Get top-rated products (rating 5)
 * Path: /top-rating
 * Method: GET
 * Access: Public
 */
productsRouter.get('/top-rating', wrapRequestHandler(getTopProductsController))

/**
 * Description: Serve image
 * Path: /image/:name
 * Method: GET
 * Access: Public
 */
productsRouter.get('/image/:name', serveImageController)
/**
 * Description: Search products
 * Path: /search/:keySearch
 * Method: GET
 * Access: Public
 */
productsRouter.get('/search/:keySearch', searchProductValidator, wrapRequestHandler(getSearchProductsController))

/**
 * Description: Get product detail by name
 * Path: /get-product-by-name
 * Method: GET
 * Access: Public
 */
productsRouter.get('/get-product-by-name', wrapRequestHandler(getProductDetailByNameController))

/**
 * Description: Get product detail with variants and images
 * Path: /spu/:product_id
 * Method: GET
 * Access: Public
 */
productsRouter.get('/spu/:product_id', productIdValidator, wrapRequestHandler(getProductSPUWithVariantsController))

/**
 * Description: Get product detail
 * Path: /:product_id
 * Method: GET
 * Access: Public
 */
productsRouter.get('/:product_id', productIdValidator, wrapRequestHandler(getProductDetailController))

// Authentication required routes
productsRouter.use(accessTokenValidator)

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
 * Description: Create product
 * Path: /
 * Method: POST
 * Body: CreateProductSPUReqBody
 * Access: Private
 */
productsRouter.post('/spu/new', handleProductMediaUpload, wrapRequestHandler(createProductSPUController))

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
 * Description: Get product detail by name
 * Path: /get-product-by-name
 * Method: GET
 * Access: Public
 */
productsRouter.get('/get-product-by-name', wrapRequestHandler(getProductDetailByNameController))
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

/**
 * Description: Handle update product thumb
 * Path: /update-thumb/:productId
 * Method: PATCH
 * Access: Private
 */
productsRouter.patch(
  '/update-thumb/:productId',
  productIdValidator,
  handleProductThumbUpload,
  wrapRequestHandler(updateProductThumbController)
)

// Debug routes
const debugProductDataController = async (req: RequestWithFiles, res: Response, next: NextFunction) => {
  try {
    res.json({
      message: 'Debug data received',
      body: req.body,
      files: req.files || {},
      headers: req.headers,
      content_type: req.headers['content-type']
    });
  } catch (error) {
    next(error);
  }
};

const initFoldersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    initFolder();
    res.json({
      message: 'Upload folders initialized successfully',
      success: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Debug route for product data
 * Path: /debug
 * Method: POST
 * Access: Private
 */
productsRouter.post('/debug', handleProductMediaUpload, debugProductDataController);

/**
 * Debug route to initialize upload folders
 * Path: /init-folders
 * Method: POST
 * Access: Private (requires token)
 */
productsRouter.post('/init-folders', accessTokenValidator, initFoldersController);

const debugSKUImagesController = async (req: RequestWithFiles, res: Response, next: NextFunction) => {
  try {
    res.json({
      message: 'Debug SKU images data',
      body: req.body,
      files: req.files || {},
      headers: req.headers,
      content_type: req.headers['content-type'],
      sku_list: req.body.sku_list ? JSON.stringify(req.body.sku_list) : 'No SKU list',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Debug route for SKU images
 * Path: /debug-sku-images
 * Method: POST
 * Access: Public
 */
productsRouter.post('/debug-sku-images', handleProductMediaUpload, debugSKUImagesController);

const debugProductSKUsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_id } = req.params;

    // Lấy danh sách SKUs từ database
    const skus = await skusService.getSKUsByProductId(product_id);

    res.json({
      message: 'SKUs for product',
      product_id,
      skus,
      skus_count: skus.length,
      has_sku_images: skus.some(sku => sku.sku_image),
      sku_images: skus.map(sku => sku.sku_image)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Debug route to get SKUs directly from database
 * Path: /debug-skus/:product_id
 * Method: GET
 * Access: Public
 */
productsRouter.get('/debug-skus/:product_id', debugProductSKUsController);

const updateSKUImageController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sku_id } = req.params;
    const { sku_image } = req.body;

    if (!sku_id || !ObjectId.isValid(sku_id)) {
      return res.status(400).json({
        message: 'Invalid SKU ID'
      });
    }

    if (!sku_image) {
      return res.status(400).json({
        message: 'sku_image is required'
      });
    }

    // Cập nhật sku_image trực tiếp vào database
    const result = await databaseService.productSKUs.updateOne(
      { _id: new ObjectId(sku_id) },
      { $set: { sku_image } }
    );

    res.json({
      message: 'SKU image updated',
      result,
      sku_id,
      sku_image
    });
  } catch (error) {
    next(error);
  }
};

const debugSKUImageUploadController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sử dụng formidable để parse form-data
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // Increase to 20MB per file
      maxTotalFileSize: 50 * 1024 * 1024 // Add 50MB total file size limit
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          message: 'Error parsing form data',
          error: err.message
        });
      }

      // Convert files object to record format
      const filesRecord: Record<string, any> = {};
      Object.keys(files).forEach(key => {
        filesRecord[key] = files[key];
      });

      // Extract all form fields
      const result = {
        fields,
        ...filesRecord
      };

      // Extract file fields
      const extractedFields = extractFieldsFromFormidable(result);

      // Check for SKU image fields
      const skuImageFields = Object.keys(filesRecord).filter(key =>
        key.match(/^sku_list\[\d+\]\[sku_image\]$/) !== null
      );

      res.json({
        message: 'Debug SKU image upload',
        allFields: fields,
        allFiles: Object.keys(filesRecord),
        filesDetails: Object.keys(filesRecord).map(key => ({
          field: key,
          filename: filesRecord[key].originalFilename,
          size: filesRecord[key].size,
          path: filesRecord[key].filepath
        })),
        skuImageFields,
        extractedFields
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Debug route for SKU image upload
 * Path: /debug-sku-image-upload
 * Method: POST
 * Access: Public
 */
productsRouter.post('/debug-sku-image-upload', debugSKUImageUploadController);

export default productsRouter
