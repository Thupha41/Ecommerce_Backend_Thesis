import { NextFunction, Request, Response } from "express";
import { handleUploadImage } from "~/utils/file";
import { UPLOAD_CATEGORY_MEDIA_DIR } from "~/constants/dir";
import { uploadFileToS3 } from "~/utils/s3";
import { ParamSchema } from "express-validator";
import { CATEGORIES_MESSAGES } from "~/constants/messages";
import { ObjectId } from "mongodb";
import { validate } from "~/utils/validation";
import { checkSchema } from "express-validator";
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';
import path from "path";
import sharp from "sharp";
import fsPromise from "fs/promises";
import fs from "fs";
import { generateSlug } from "~/utils";
// Process the uploaded media
export const handleCategoryMediaUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Only process if it's a multipart form
        if (req.headers['content-type']?.includes('multipart/form-data')) {
            const result = await handleUploadImage(req, {
                uploadDir: UPLOAD_CATEGORY_MEDIA_DIR,
                fieldName: 'image',
                maxFiles: 1,
                maxFileSize: 1024 * 1024 * 5, // 5MB
                maxTotalFileSize: 1024 * 1024 * 5, // 5MB
            });

            const { fields, files } = result;

            // Parse form fields into req.body
            for (const [key, value] of Object.entries(fields)) {
                if (Array.isArray(value)) {
                    // Chuyển đổi các trường cần thiết sang dạng số
                    if (key === 'level') {
                        req.body[key] = value[0] !== undefined ? parseInt(value[0], 10) : 1;
                    } else {
                        req.body[key] = value[0];
                    }
                } else {
                    // Chuyển đổi các trường cần thiết sang dạng số
                    if (key === 'level') {
                        req.body[key] = value !== undefined ? parseInt(value as string, 10) : 1;
                    } else {
                        req.body[key] = value;
                    }
                }
            }

            // Process single image file
            if (files && files.length > 0) {
                const file = files[0];
                const newName = `${Date.now()}_${generateSlug(req.body.category_name) || 'unnamed'}`;
                const newFullFilename = `${newName}.jpg`;

                // Get level value with default of 1
                const level = (req.body.level !== undefined) ? req.body.level.toString() : '1';

                // Create the level_underscore format directory structure
                const levelDirName = `level_${level}`;

                // Create level directories in local path structure if they don't exist
                const categoryLevelDir = path.resolve(UPLOAD_CATEGORY_MEDIA_DIR, levelDirName);
                if (!fs.existsSync(categoryLevelDir)) {
                    fs.mkdirSync(categoryLevelDir, { recursive: true });
                }

                // Path for the processed image in both temp and level-specific locations
                const tempPath = path.resolve(UPLOAD_CATEGORY_MEDIA_DIR, newFullFilename);
                const finalLocalPath = path.resolve(categoryLevelDir, newFullFilename);

                // S3 path with the new structure
                const s3Path = `images/categories/${levelDirName}/${newFullFilename}`;

                // Process image with sharp
                await sharp(file.filepath).jpeg().toFile(tempPath);
                await fsPromise.unlink(file.filepath); // Delete original temp file

                // Copy the file to its final local destination
                await fsPromise.copyFile(tempPath, finalLocalPath);
                await fsPromise.unlink(tempPath); // Delete the temp file after copying

                // Upload to S3
                try {
                    const mimeModule = await import('mime');
                    const contentType = mimeModule.default.getType(finalLocalPath) as string;

                    const s3Result = await uploadFileToS3({
                        filename: s3Path,
                        filepath: finalLocalPath,
                        contentType
                    });

                    const s3Url = (s3Result as CompleteMultipartUploadCommandOutput).Location as string;

                    // Add image URL to req.body
                    req.body.image = s3Url;

                    // Keep the local file for backup/direct access
                } catch (s3Error) {
                    console.error('S3 upload error:', s3Error);
                    // Still keep the local file even if S3 upload fails
                }
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

const categoryNameSchema: ParamSchema = {

    notEmpty: {
        errorMessage: CATEGORIES_MESSAGES.CATEGORY_NAME_IS_REQUIRED
    },
    isString: {
        errorMessage: CATEGORIES_MESSAGES.CATEGORY_NAME_MUST_BE_A_STRING
    },
    isLength: {
        options: {
            min: 1,
            max: 100
        },
        errorMessage: CATEGORIES_MESSAGES.CATEGORY_NAME_LENGTH_MUST_BE_FROM_1_TO_100
    }
}

const categoryImageSchema: ParamSchema = {
    optional: true,
    isString: {
        errorMessage: CATEGORIES_MESSAGES.CATEGORY_IMAGE_MUST_BE_A_STRING
    }
}

const parentIdSchema: ParamSchema = {
    optional: true,
    isString: {
        errorMessage: CATEGORIES_MESSAGES.PARENT_ID_MUST_BE_A_STRING
    },
    custom: {
        options: (value) => {
            if (!ObjectId.isValid(value)) {
                throw new Error(CATEGORIES_MESSAGES.PARENT_ID_IS_INVALID);
            }
            return true;
        }
    }
}

const levelSchema: ParamSchema = {
    optional: true,
    toInt: true,
    isInt: {
        errorMessage: CATEGORIES_MESSAGES.LEVEL_MUST_BE_AN_INTEGER
    },
    custom: {
        options: (value) => {
            const level = Number(value);
            if (level < 1 || level > 4) {
                throw new Error(CATEGORIES_MESSAGES.LEVEL_MUST_BE_1_TO_4);
            }
            return true;
        }
    }
}

export const createCategoryValidator = validate(
    checkSchema({
        category_name: categoryNameSchema,
        image: categoryImageSchema,
        parent_id: parentIdSchema,
        level: levelSchema,
    }, ['body'])
);