import { Request, Response, NextFunction } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { validate } from '~/utils/validation'
import { ObjectId } from 'mongodb'
import { PRODUCTS_MESSAGES, REVIEWS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import { ReviewStatus } from '~/constants/enums'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { uploadFileToS3 } from '~/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import fsPromise from 'fs/promises'
import { ErrorWithStatus } from '~/models/Errors'
import { UPLOAD_REVIEW_MEDIA_DIR } from '~/constants/dir'
import databaseService from '~/services/database.services'

// Make sure the directory exists
fs.mkdirSync(UPLOAD_REVIEW_MEDIA_DIR, { recursive: true })

const orderIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: REVIEWS_MESSAGES.ORDER_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: REVIEWS_MESSAGES.ORDER_ID_MUST_BE_STRING
  },
  custom: {
    options: (value) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(REVIEWS_MESSAGES.ORDER_ID_IS_INVALID)
      }
      return true
    }
  }
}

const productIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: REVIEWS_MESSAGES.PRODUCT_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: REVIEWS_MESSAGES.PRODUCT_ID_MUST_BE_STRING
  },
  custom: {
    options: (value) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(REVIEWS_MESSAGES.PRODUCT_ID_IS_INVALID)
      }
      return true
    }
  }
}

const ratingSchema: ParamSchema = {
  notEmpty: {
    errorMessage: REVIEWS_MESSAGES.RATING_IS_REQUIRED
  },
  isInt: {
    options: {
      min: 1,
      max: 5
    },
    errorMessage: REVIEWS_MESSAGES.RATING_MUST_BE_FROM_1_TO_5
  }
}

const commentSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: REVIEWS_MESSAGES.COMMENT_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 1000
    },
    errorMessage: REVIEWS_MESSAGES.COMMENT_LENGTH_MUST_BE_FROM_1_TO_1000
  }
}

const mediaSchema: ParamSchema = {
  optional: true,
  isArray: {
    errorMessage: REVIEWS_MESSAGES.MEDIA_MUST_BE_AN_ARRAY
  },
  custom: {
    options: (value) => {
      if (value && !Array.isArray(value)) {
        throw new Error(REVIEWS_MESSAGES.MEDIA_MUST_BE_AN_ARRAY)
      }
      if (value && Array.isArray(value)) {
        if (value.length > 5) {
          throw new Error(REVIEWS_MESSAGES.MEDIA_LENGTH_MUST_BE_LESS_THAN_5)
        }
        for (const item of value) {
          if (typeof item !== 'string') {
            throw new Error(REVIEWS_MESSAGES.MEDIA_ITEM_MUST_BE_A_STRING)
          }
          // Validate URL format if needed
        }
      }
      return true
    }
  }
}

const isAnonymousSchema: ParamSchema = {
  optional: true,
  isBoolean: {
    errorMessage: REVIEWS_MESSAGES.IS_ANONYMOUS_MUST_BE_A_BOOLEAN
  }
}

const reviewIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: REVIEWS_MESSAGES.REVIEW_ID_IS_REQUIRED
  },
  custom: {
    options: async (value) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.BAD_REQUEST,
          message: REVIEWS_MESSAGES.REVIEW_ID_IS_INVALID
        })
      }
      const foundReview = await databaseService.reviews.findOne({
        _id: new ObjectId(value)
      })

      if (foundReview === null) {
        throw new ErrorWithStatus({
          message: REVIEWS_MESSAGES.REVIEW_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      return true
    }
  }
}

const handleFormData = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_REVIEW_MEDIA_DIR,
    keepExtensions: true,
    maxFiles: 6, // 5 images + 1 video max
    maxFileSize: 30 * 1024 * 1024, // 30MB max for video
    maxTotalFileSize: 50 * 1024 * 1024, // 50MB max total
    filter: ({ mimetype }) => {
      // Accept only images and MP4 videos
      if (!mimetype) return false
      return mimetype.includes('image') || mimetype === 'video/mp4'
    }
  })

  return new Promise<{
    fields: formidable.Fields
    files: formidable.Files
  }>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error)
        return
      }
      resolve({ fields, files })
    })
  })
}

// Process the uploaded media
export const handleReviewMediaUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only process if it's a multipart form
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      const { fields, files } = await handleFormData(req)

      // Parse form fields into req.body
      for (const [key, value] of Object.entries(fields)) {
        if (Array.isArray(value)) {
          req.body[key] = value[0]
        } else {
          req.body[key] = value
        }
      }

      // Handle special fields like rating (convert to number) and is_anonymous (convert to boolean)
      if (req.body.rating) req.body.rating = parseInt(req.body.rating as string)
      if (req.body.is_anonymous) req.body.is_anonymous = req.body.is_anonymous === 'true'

      // Process files
      const mediaUrls: string[] = []
      let imageCount = 0
      let videoCount = 0

      // Convert files to array format
      const fileArray = Array.isArray(files.media) ? files.media : files.media ? [files.media] : []

      for (const file of fileArray) {
        const mimeType = file.mimetype || ''
        const isImage = mimeType.includes('image')
        const isVideo = mimeType === 'video/mp4'

        // Check file type and limits
        if (isImage && imageCount >= 5) {
          await fsPromise.unlink(file.filepath)
          throw new ErrorWithStatus({
            status: HTTP_STATUS.BAD_REQUEST,
            message: REVIEWS_MESSAGES.MEDIA_LENGTH_MUST_BE_LESS_THAN_5
          })
          continue // Skip if we already have 5 images
        }
        if (isVideo && videoCount >= 1) {
          await fsPromise.unlink(file.filepath)
          throw new ErrorWithStatus({
            status: HTTP_STATUS.BAD_REQUEST,
            message: REVIEWS_MESSAGES.MEDIA_LENGTH_MUST_BE_LESS_THAN_5
          })
          continue // Skip if we already have 1 video
        }
        //Tìm sản phẩm
        const product = await databaseService.products.findOne({
          _id: new ObjectId(req.body.product_id)
        })
        if (!product) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.BAD_REQUEST,
            message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND
          })
        }
        const { product_slug } = product
        // Process file based on type
        let s3Path: string
        let finalPath: string

        if (isImage) {
          // Process image with sharp
          const newName = `review_img_${Date.now()}_${imageCount}`
          const newFullFilename = `${newName}.jpg`
          finalPath = path.resolve(UPLOAD_REVIEW_MEDIA_DIR, newFullFilename)

          await sharp(file.filepath).jpeg().toFile(finalPath)
          await fsPromise.unlink(file.filepath) // Delete original

          s3Path = `images/reviews/${req.decoded_authorization?.user_id}/${product_slug}/${newFullFilename}`
          imageCount++
        } else if (isVideo) {
          // Handle video
          const newName = `review_video_${Date.now()}_${videoCount}`
          const newFullFilename = `${newName}.mp4`
          finalPath = file.filepath
          s3Path = `videos/reviews/${req.decoded_authorization?.user_id}/${product_slug}/${newFullFilename}`
          videoCount++
        } else {
          // Skip unsupported file type
          await fsPromise.unlink(file.filepath)
          continue
        }

        // Upload to S3
        try {
          const mimeModule = await import('mime')
          const contentType = mimeModule.default.getType(finalPath) as string

          const s3Result = await uploadFileToS3({
            filename: s3Path,
            filepath: finalPath,
            contentType
          })

          const s3Url = (s3Result as CompleteMultipartUploadCommandOutput).Location as string
          mediaUrls.push(s3Url)

          // Delete local file after upload
          if (isVideo) {
            await fsPromise.unlink(finalPath)
          }
        } catch (s3Error) {
          console.error('S3 upload error:', s3Error)
          // Clean up file if S3 upload fails
          try {
            await fsPromise.unlink(finalPath)
          } catch (unlinkError) {
            console.error('Error deleting file after S3 upload failure:', unlinkError)
          }
        }
      }

      // Add media URLs to req.body
      if (mediaUrls.length > 0) {
        req.body.media = mediaUrls
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

export const createReviewValidator = validate(
  checkSchema(
    {
      order_id: orderIdSchema,
      product_id: productIdSchema,
      rating: ratingSchema,
      comment: commentSchema,
      media: mediaSchema,
      is_anonymous: isAnonymousSchema
    },
    ['body']
  )
)

export const updateReviewValidator = validate(
  checkSchema(
    {
      rating: ratingSchema,
      comment: commentSchema,
      media: mediaSchema,
      is_anonymous: isAnonymousSchema,
      status: {
        optional: true,
        isIn: {
          options: [[ReviewStatus.Pending, ReviewStatus.Approved, ReviewStatus.Rejected]],
          errorMessage: REVIEWS_MESSAGES.STATUS_MUST_BE_VALID
        }
      }
    },
    ['body']
  )
)

export const validateReviewIdParam = validate(
  checkSchema(
    {
      reviewId: reviewIdSchema
    },
    ['params']
  )
)
