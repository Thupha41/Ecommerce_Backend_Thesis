import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { PRODUCTS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'
import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import { getNameFromFullname, handleUploadProductThumb, handleUploadProductMedia, ensureDirectoryExists } from '~/utils/file'
import { UPLOAD_PRODUCT_MEDIA_DIR } from '~/constants/dir'
import path from 'path'
import sharp from 'sharp'
import fsPromise from 'fs/promises'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { uploadFileToS3 } from '~/utils/s3'
import fs from 'fs'
import { generateSlug } from '~/utils'


// Thêm interfaces cho cấu trúc dữ liệu
interface AttributeItem {
  name: string;
  value: string;
}

interface VariationItem {
  name: string;
  options: string[];
}

interface SkuItem {
  sku_tier_idx: number[];
  sku_price: number;
  sku_stock: number;
  sku_image?: string;
}

interface VariantImageGroup {
  primary_value_index: number;
  secondary_variant_index?: number;
  secondary_value_index?: number;
  image?: string;
}

interface VariantImageMapping {
  primary_variant_index: number;
  variant_image_groups?: VariantImageGroup[];
}

// Kiểu tệp mở rộng từ formidable
interface FormidableFile {
  filepath: string;
  newFilename: string;
  originalFilename?: string;
  mimetype?: string;
  size: number;
}

interface SkuItemCreate {
  sku_tier_idx: any;
  sku_price: any;
  sku_stock: any;
  [key: string]: any;
}

export const createProductValidator = validate(
  checkSchema({
    product_name: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_NAME_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    product_thumb: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_THUMB_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    product_price: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_PRICE_IS_REQUIRED
      },
      isNumeric: true
    },
    product_quantity: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_QUANTITY_IS_REQUIRED
      },
      isNumeric: true
    },
    product_category: {
      notEmpty: {
        errorMessage: PRODUCTS_MESSAGES.PRODUCT_TYPE_IS_REQUIRED
      },
      isString: true,
      trim: true
    },
    product_description: {
      optional: true,
      isString: true,
      trim: true
    }
  })
)

export const productIdValidator = (req: Request<ParamsDictionary>, res: Response, next: NextFunction): void => {
  const product_id = req.params.id || req.params.product_id || req.params.productId

  if (!ObjectId.isValid(product_id)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: PRODUCTS_MESSAGES.INVALID_PRODUCT_ID
    })
    return
  }

  next()
}

export const searchProductValidator = validate(
  checkSchema({
    keySearch: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          const results = await databaseService.products
            .find(
              {
                isPublished: true,
                $text: { $search: value }
              },
              {
                projection: { score: { $meta: 'textScore' } }
              }
            )
            .sort({ score: { $meta: 'textScore' } })
            .toArray()

          if (results.length === 0) {
            throw new ErrorWithStatus({
              message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          return true // Need to return true if validation passes
        }
      }
    }
  })
)

export const updateProductValidator = validate(
  checkSchema({
    product_attributes: {
      optional: true,
      isObject: true,
      custom: {
        options: (value) => {
          if (!value) return true

          // Check if any value in product_attributes is null
          const hasNullValue = Object.values(value).some((attrValue) => attrValue === null || attrValue === undefined)

          if (hasNullValue) {
            throw new ErrorWithStatus({
              message: PRODUCTS_MESSAGES.PRODUCT_ATTRIBUTES_VALUES_CANNOT_BE_NULL,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          return true
        }
      }
    },
    product_name: {
      optional: true,
      isString: true,
      trim: true
    },
    product_price: {
      optional: true,
      isNumeric: true
    },
    product_type: {
      optional: true,
      isString: true,
      trim: true
    },
    product_description: {
      optional: true,
      isString: true,
      trim: true
    }
  })
)

export const handleProductThumbUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only process if it's a multipart form
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      const files = await handleUploadProductThumb(req)

      if (files && files.length > 0) {
        const file = files[0]
        const newName = getNameFromFullname(file.newFilename)
        const newFullFilename = `${newName}.jpg`
        console.log('>>> check new full filename', newFullFilename)

        // Ensure directory exists
        ensureDirectoryExists(UPLOAD_PRODUCT_MEDIA_DIR);
        const newPath = path.resolve(UPLOAD_PRODUCT_MEDIA_DIR, newFullFilename)

        // Process image with sharp
        await sharp(file.filepath).jpeg().toFile(newPath)
        //Delete file in folder
        await fsPromise.unlink(file.filepath)
        // Store just the filename in the database
        req.body.product_thumb = newFullFilename
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

export const handleProductMediaUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only process if it's a multipart form
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      console.log('Raw form fields before processing:', req.body);

      const result = await handleUploadProductMedia(req);
      const { fields, product_thumb, product_media } = result;

      console.log('Raw form fields from formidable:', fields);

      // Parse product_name from request body or form fields
      const productName = req.body.product_name || fields.product_name || 'unnamed-product';
      const productSlug = generateSlug(productName.toString());

      // Import required modules
      const mimeModule = await import('mime');

      // Process thumbnail if present
      if (product_thumb && product_thumb.length > 0) {
        const thumbFile = product_thumb[0];
        const thumbFilename = `${productSlug}.jpg`;

        // Ensure product_thumb directory exists
        const thumbDir = ensureDirectoryExists(path.resolve(UPLOAD_PRODUCT_MEDIA_DIR, 'product_thumb', productSlug));
        const thumbFinalPath = path.resolve(thumbDir, thumbFilename);

        // Process image with sharp
        await sharp(thumbFile.filepath).jpeg().toFile(thumbFinalPath);

        // Upload to S3
        const s3ThumbPath = `images/products/product_thumb/${productSlug}/${thumbFilename}`;
        const contentType = mimeModule.default.getType(thumbFinalPath) as string;

        try {
          const s3Result = await uploadFileToS3({
            filename: s3ThumbPath,
            filepath: thumbFinalPath,
            contentType
          });

          // Add thumbnail URL to req.body
          const s3Url = (s3Result as CompleteMultipartUploadCommandOutput).Location as string;
          req.body.product_thumb = s3Url;

          // Delete temp file
          await fsPromise.unlink(thumbFile.filepath);
        } catch (s3Error) {
          console.error('S3 thumbnail upload error:', s3Error);
          // Use local path as fallback
          req.body.product_thumb = `/images/products/product_thumb/${productSlug}/${thumbFilename}`;
        }
      }

      // Process media files if present
      if (product_media && product_media.length) {
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
        const mediaFiles = [];

        // Ensure product_media directory exists
        const mediaDir = ensureDirectoryExists(path.resolve(UPLOAD_PRODUCT_MEDIA_DIR, 'product_media', productSlug));

        // Process each media file
        for (let i = 0; i < product_media.length; i++) {
          const mediaFile = product_media[i];
          const fileExt = path.extname(mediaFile.originalFilename || '').toLowerCase();
          const isVideo = videoExtensions.includes(fileExt);
          const mediaType = isVideo ? 'video' : 'image';
          const mediaFilename = `${productSlug}_${i + 1}${isVideo ? fileExt : '.jpg'}`;
          const mediaFinalPath = path.resolve(mediaDir, mediaFilename);

          // Process image with sharp or copy video file
          if (isVideo) {
            // For videos, just copy the file
            await fsPromise.copyFile(mediaFile.filepath, mediaFinalPath);
          } else {
            // For images, process with sharp
            await sharp(mediaFile.filepath).jpeg().toFile(mediaFinalPath);
          }

          // Upload to S3
          const s3MediaPath = `images/products/product_media/${productSlug}/${mediaFilename}`;
          const contentType = mimeModule.default.getType(mediaFinalPath) as string;

          try {
            const s3Result = await uploadFileToS3({
              filename: s3MediaPath,
              filepath: mediaFinalPath,
              contentType
            });

            const s3Url = (s3Result as CompleteMultipartUploadCommandOutput).Location as string;
            mediaFiles.push({
              url: s3Url,
              type: mediaType
            });
          } catch (s3Error) {
            console.error(`S3 media upload error for file ${i + 1}:`, s3Error);
            // Use local path as fallback
            mediaFiles.push({
              url: `/images/products/product_media/${productSlug}/${mediaFilename}`,
              type: mediaType
            });
          }

          // Delete temp file
          await fsPromise.unlink(mediaFile.filepath);
        }

        // Add media URLs to req.body
        req.body.product_media = mediaFiles;
      }

      // Handle separate item fields for arrays
      interface IndexedItems {
        [key: string]: any;
      }

      const attributeItems: IndexedItems = {};
      const variationItems: IndexedItems = {};
      const skuItems: IndexedItems = {};

      // First pass: collect array items fields
      for (const [key, value] of Object.entries(fields)) {
        let fieldValue = Array.isArray(value) ? value[0] : value;
        if (typeof fieldValue === 'undefined') {
          fieldValue = '';
        }

        console.log(`Processing field key: ${key}, value: ${fieldValue}`);

        // Handle product_attributes[index][field] format
        if (key.startsWith('product_attributes[')) {
          const matches = key.match(/product_attributes\[(\d+)\]\[(\w+)\]/);
          if (matches) {
            const [_, index, field] = matches;
            if (!attributeItems[index]) attributeItems[index] = {};
            attributeItems[index][field] = fieldValue;
          }
          continue;
        }

        // Handle product_variations[index][field] format
        if (key.startsWith('product_variations[')) {
          const matches = key.match(/product_variations\[(\d+)\]\[(\w+)\]/);
          if (matches) {
            const [_, index, field] = matches;
            if (!variationItems[index]) variationItems[index] = {};

            // Handle options array
            if (field === 'options') {
              try {
                // Check if it's already JSON string
                if (fieldValue && fieldValue.startsWith('[')) {
                  variationItems[index][field] = JSON.parse(fieldValue);
                } else if (fieldValue) {
                  // Split by comma if it's a comma-separated list
                  variationItems[index][field] = fieldValue.split(',').map((o: string) => o.trim());
                } else {
                  variationItems[index][field] = [];
                }
              } catch (e) {
                console.error('Error parsing options:', e);
                variationItems[index][field] = [];
              }
            } else {
              variationItems[index][field] = fieldValue;
            }
          }
          continue;
        }

        // Handle sku_list[index][field] format
        if (key.startsWith('sku_list[')) {
          const matches = key.match(/sku_list\[(\d+)\]\[(\w+)\]/);
          if (matches) {
            const [_, index, field] = matches;
            if (!skuItems[index]) skuItems[index] = {};

            // Handle sku_tier_idx as an array
            if (field === 'sku_tier_idx') {
              try {
                if (fieldValue && fieldValue.startsWith('[')) {
                  skuItems[index][field] = JSON.parse(fieldValue);
                } else if (fieldValue) {
                  skuItems[index][field] = fieldValue.split(',').map((n: string) => parseInt(n.trim()));
                } else {
                  skuItems[index][field] = [];
                }
              } catch (e) {
                console.error('Error parsing sku_tier_idx:', e);
                skuItems[index][field] = [];
              }
            }
            // Handle numeric fields
            else if (field === 'sku_price' || field === 'sku_stock') {
              skuItems[index][field] = Number(fieldValue || 0);
            }
            else {
              skuItems[index][field] = fieldValue;
            }
          }
          continue;
        }

        // Process regular fields
        req.body[key] = fieldValue;

        // Try to parse JSON string for regular fields
        if (typeof fieldValue === 'string') {
          if (fieldValue.startsWith('{') || fieldValue.startsWith('[')) {
            try {
              req.body[key] = JSON.parse(fieldValue);
            } catch (e) {
              console.error(`Error parsing JSON for ${key}:`, e);
              // Keep original value if parsing fails
            }
          }
          else if (key === 'product_price' || key === 'product_quantity') {
            const numValue = Number(fieldValue);
            if (!isNaN(numValue)) {
              req.body[key] = numValue;
            }
          }
        }
      }

      // Convert collected items to arrays
      if (Object.keys(attributeItems).length > 0) {
        req.body.product_attributes = Object.values(attributeItems) as AttributeItem[];
      } else if (req.body.product_attributes && typeof req.body.product_attributes === 'string') {
        try {
          req.body.product_attributes = JSON.parse(req.body.product_attributes);
        } catch (e) {
          console.error('Error parsing product_attributes JSON string:', e);
          req.body.product_attributes = [];
        }
      } else if (!req.body.product_attributes) {
        req.body.product_attributes = [];
      }

      if (Object.keys(variationItems).length > 0) {
        req.body.product_variations = Object.values(variationItems) as VariationItem[];
      } else if (req.body.product_variations && typeof req.body.product_variations === 'string') {
        try {
          req.body.product_variations = JSON.parse(req.body.product_variations);
        } catch (e) {
          console.error('Error parsing product_variations JSON string:', e);
          req.body.product_variations = [];
        }
      } else if (!req.body.product_variations) {
        req.body.product_variations = [];
      }

      if (Object.keys(skuItems).length > 0) {
        req.body.sku_list = Object.values(skuItems) as SkuItem[];
      } else if (req.body.sku_list && typeof req.body.sku_list === 'string') {
        try {
          console.log('Parsing sku_list from JSON string:', req.body.sku_list);
          req.body.sku_list = JSON.parse(req.body.sku_list);
          console.log('Parsed sku_list:', JSON.stringify(req.body.sku_list, null, 2));
        } catch (e) {
          console.error('Error parsing sku_list as JSON:', e);
          req.body.sku_list = [];
        }
      } else if (!req.body.sku_list) {
        req.body.sku_list = [];
      }

      // Ensure numeric values are numbers
      if (req.body.product_price && typeof req.body.product_price === 'string') {
        req.body.product_price = parseFloat(req.body.product_price);
      }

      if (req.body.product_quantity && typeof req.body.product_quantity === 'string') {
        req.body.product_quantity = parseInt(req.body.product_quantity, 10);
      }

      // Đảm bảo sku_tier_idx là mảng số
      if (req.body.sku_list && Array.isArray(req.body.sku_list)) {
        // Đảm bảo sku_tier_idx là mảng số
        req.body.sku_list = req.body.sku_list.map((sku: SkuItemCreate) => {
          if (sku.sku_tier_idx) {
            // Nếu là chuỗi như "[0,0]", chuyển thành mảng [0,0]
            if (typeof sku.sku_tier_idx === 'string') {
              try {
                if (sku.sku_tier_idx.startsWith('[') && sku.sku_tier_idx.endsWith(']')) {
                  sku.sku_tier_idx = JSON.parse(sku.sku_tier_idx);
                } else {
                  // Nếu là chuỗi như "0,0", chuyển thành mảng [0,0]
                  sku.sku_tier_idx = sku.sku_tier_idx.split(',').map((n: string) => parseInt(n.trim(), 10));
                }
              } catch (e) {
                console.error('Error parsing sku_tier_idx:', e, sku.sku_tier_idx);
                sku.sku_tier_idx = [];
              }
            }
          }

          // Đảm bảo sku_price và sku_stock là số
          if (sku.sku_price && typeof sku.sku_price === 'string') {
            sku.sku_price = parseFloat(sku.sku_price);
          }

          if (sku.sku_stock && typeof sku.sku_stock === 'string') {
            sku.sku_stock = parseInt(sku.sku_stock, 10);
          }

          return sku;
        });
      }

      // Thêm log để debug dữ liệu
      console.log('Final processed sku_list:', JSON.stringify(req.body.sku_list, null, 2));

      console.log('Final processed form data:', {
        product_name: req.body.product_name,
        product_attributes: JSON.stringify(req.body.product_attributes).substring(0, 100) + (req.body.product_attributes.length > 3 ? '...' : ''),
        product_variations: JSON.stringify(req.body.product_variations).substring(0, 100) + (req.body.product_variations.length > 3 ? '...' : ''),
        sku_list: JSON.stringify(req.body.sku_list).substring(0, 100) + (req.body.sku_list.length > 3 ? '...' : ''),
        product_price: `${req.body.product_price} (${typeof req.body.product_price})`,
        product_quantity: `${req.body.product_quantity} (${typeof req.body.product_quantity})`
      });

      // Process SKU images if present
      const skuImages: Record<string, string> = {};

      // Check for SKU image files in form data
      // @ts-ignore - Accessing fields in result with string index
      console.log("All available keys in formdata result:", Object.keys(result));

      for (const key in result) {
        // Skip standard fields we already processed
        if (key === 'fields' || key === 'product_thumb' || key === 'product_media') continue;

        // Log tất cả các keys để debug
        console.log(`Processing form-data key: ${key}`);

        // @ts-ignore - Accessing fields in result with string index
        const files = result[key] as FormidableFile[];

        // Check if files is valid
        if (!Array.isArray(files) || files.length === 0) {
          console.log(`No valid files found for key: ${key}`);
          continue;
        }

        // Match pattern for sku_list[idx][sku_image] 
        const skuListImageMatch = key.match(/^sku_list\[(\d+)\]\[sku_image\]$/);

        if (skuListImageMatch && files.length > 0) {
          const skuIndex = parseInt(skuListImageMatch[1]);
          const file = files[0];

          // Kiểm tra xem file có tồn tại không
          if (!file || !file.filepath) {
            console.warn(`File không hợp lệ cho SKU index ${skuIndex}`);
            continue;
          }

          console.log(`Found valid file for SKU ${skuIndex}:`, file.originalFilename);

          // Create directory for variant images if not exists
          const skuDir = ensureDirectoryExists(path.resolve(UPLOAD_PRODUCT_MEDIA_DIR, 'variants', productSlug));

          // Generate unique sku image filename
          const skuFilename = `${productSlug}_sku_${skuIndex}.jpg`;
          const skuFinalPath = path.resolve(skuDir, skuFilename);

          // Process image with sharp
          try {
            await sharp(file.filepath).jpeg().toFile(skuFinalPath);
            console.log(`Successfully processed image to: ${skuFinalPath}`);

            // Upload to S3
            const s3SkuPath = `images/products/variants/${productSlug}/${skuFilename}`;
            const contentType = mimeModule.default.getType(skuFinalPath) as string;

            try {
              const s3Result = await uploadFileToS3({
                filename: s3SkuPath,
                filepath: skuFinalPath,
                contentType
              });

              // Store S3 URL for this SKU
              const s3Url = (s3Result as CompleteMultipartUploadCommandOutput).Location as string;
              skuImages[skuIndex.toString()] = s3Url;
              console.log(`Successfully uploaded to S3 for SKU index ${skuIndex}: ${s3Url}`);

            } catch (s3Error) {
              console.error(`S3 SKU image upload error for SKU ${skuIndex}:`, s3Error);
              // Use local path as fallback
              const localUrl = `/images/products/variants/${productSlug}/${skuFilename}`;
              skuImages[skuIndex.toString()] = localUrl;
              console.log(`Using local path for sku_image at index ${skuIndex}: ${localUrl}`);
            }
          } catch (err) {
            console.error(`Error processing image for SKU ${skuIndex}:`, err);
          }

          // Delete temp file
          try {
            await fsPromise.unlink(file.filepath);
            console.log(`Deleted temp file: ${file.filepath}`);
          } catch (unlinkError) {
            console.error(`Error deleting temp file: ${file.filepath}`, unlinkError);
          }
        }
      }

      // Ensure sku_list is always an array
      if (!Array.isArray(req.body.sku_list)) {
        console.warn('sku_list is not an array, converting to empty array');
        req.body.sku_list = [];
      }

      console.log('sku_list before image assignment:', JSON.stringify(req.body.sku_list, null, 2));
      console.log('SKU images collected:', JSON.stringify(skuImages, null, 2));

      // Assign images to SKUs if any images were collected
      if (Object.keys(skuImages).length > 0 && req.body.sku_list && Array.isArray(req.body.sku_list)) {
        console.log('Assigning images to SKUs...');

        for (const [skuIndex, imageUrl] of Object.entries(skuImages)) {
          const index = parseInt(skuIndex);
          if (index >= 0 && index < req.body.sku_list.length) {
            console.log(`Assigning image to SKU at index ${index}: ${imageUrl}`);
            // Ensure the image URL is properly assigned
            if (!req.body.sku_list[index]) {
              req.body.sku_list[index] = {};
            }
            req.body.sku_list[index].sku_image = imageUrl;
          }
        }

        console.log('Final sku_list with images:', JSON.stringify(req.body.sku_list, null, 2));
      }

      // Also check if any sku already has image in skuItems from form fields
      if (Object.keys(skuItems).length > 0) {
        console.log('SKU items from form fields:', JSON.stringify(skuItems, null, 2));
        for (const [index, sku] of Object.entries(skuItems)) {
          if (sku.sku_image && typeof sku.sku_image === 'string') {
            console.log(`Found sku_image in form field for SKU index ${index}: ${sku.sku_image}`);
            // If we've already converted to sku_list array
            if (Array.isArray(req.body.sku_list) && req.body.sku_list[parseInt(index)]) {
              // Only override if not already set by file upload
              if (!req.body.sku_list[parseInt(index)].sku_image) {
                req.body.sku_list[parseInt(index)].sku_image = sku.sku_image;
              }
            }
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
