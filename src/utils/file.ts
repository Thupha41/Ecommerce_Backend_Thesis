import { Request } from 'express'
import { File, Fields } from 'formidable'
import fs from 'fs'
import path from 'path'
import formidable from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR, UPLOAD_CATEGORY_MEDIA_DIR, UPLOAD_PRODUCT_MEDIA_DIR } from '~/constants/dir'

interface UploadImageOptions {
  uploadDir?: string
  fieldName?: string
  maxFiles?: number
  maxFileSize?: number
  maxTotalFileSize?: number
}

// Return type for handleUploadImage
interface UploadImageResult {
  fields: Fields
  files: File[]
}

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR, UPLOAD_CATEGORY_MEDIA_DIR, UPLOAD_PRODUCT_MEDIA_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // mục đích là để tạo folder nested
      })
    }
  })

  // Create level subdirectories for categories (1-4)
  for (let i = 1; i <= 4; i++) {
    const levelDir = path.resolve(UPLOAD_CATEGORY_MEDIA_DIR, `level_${i}`);
    if (!fs.existsSync(levelDir)) {
      fs.mkdirSync(levelDir, { recursive: true });
    }
  }

  // Create product image subdirectories
  const productDirs = [
    path.resolve(UPLOAD_PRODUCT_MEDIA_DIR, 'product_thumb'),
    path.resolve(UPLOAD_PRODUCT_MEDIA_DIR, 'product_media'),
    path.resolve(UPLOAD_PRODUCT_MEDIA_DIR, 'variants')
  ];

  productDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export const handleUploadImage = async (req: Request, options: UploadImageOptions = {}) => {
  const formidable = (await import('formidable')).default
  const {
    uploadDir = UPLOAD_IMAGE_TEMP_DIR,
    fieldName = 'image',
    maxFiles = 4,
    maxFileSize = 300 * 1024, // 300KB
    maxTotalFileSize = 300 * 1024 * 4
  } = options

  const form = formidable({
    uploadDir,
    maxFiles,
    keepExtensions: true,
    maxFileSize,
    maxTotalFileSize,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  return new Promise<UploadImageResult>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      if (!Boolean(files[fieldName])) {
        return reject(new Error('File is empty'))
      }
      resolve({
        fields,
        files: files[fieldName] as File[]
      })
    })
  })
}

// Cách xử lý khi upload video và encode
// Có 2 giai đoạn
// Upload video: Upload video thành công thì resolve về cho người dùng
// Encode video: Khai báo thêm 1 url endpoint để check xem cái video đó đã encode xong chưa

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  // Cách để có được định dạng idname/idname.mp4
  // ✅Cách 1: Tạo unique id cho video ngay từ đầu
  // ❌Cách 2: Đợi video upload xong rồi tạo folder, move video vào

  const nanoId = (await import('nanoid')).nanoid
  const idName = nanoId()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename: function () {
      return idName
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })
      resolve(files.video as File[])
    })
  })
}

export const getNameFromFullname = (fullname: string) => {
  const nameArr = fullname.split('.')
  nameArr.pop()
  return nameArr.join('')
}

export const getExtension = (fullname: string) => {
  const nameArr = fullname.split('.')
  return nameArr[nameArr.length - 1]
}

export const getFiles = (dir: string, files: string[] = []) => {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir)
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFiles(name, files)
    } else {
      // If it is a file, push the full path to the files array
      files.push(name)
    }
  }
  return files
}

export const handleUploadProductThumb = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_PRODUCT_MEDIA_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 3000 * 1024, // 3000KB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'product_thumb' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.product_thumb)) {
        return reject(new Error('File is empty'))
      }
      console.log('>>> check files', fields)
      // Parse JSON fields if they exist
      // if (fields.product_data) {
      //   try {
      //     const productData = JSON.parse(fields.product_data as string)
      //     // Merge parsed product data into request body
      //     req.body = { ...req.body, ...productData }
      //   } catch (error) {
      //     return reject(new Error('Invalid product data format'))
      //   }
      // }

      resolve(files.product_thumb as File[])
    })
  })
}

export const handleUploadProductMedia = async (req: Request): Promise<any> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // Increase to 20MB per file
      maxTotalFileSize: 50 * 1024 * 1024 // Add 50MB total file size limit
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      // Convert files to the format expected by the middleware
      const results: any = { fields };

      // Copy all file arrays from 'files' to 'results'
      Object.keys(files).forEach(key => {
        // Check if it's a single file or multiple files
        const file = files[key];
        if (Array.isArray(file)) {
          results[key] = file;
        } else {
          // Wrap single file in an array to maintain consistency
          results[key] = [file];
        }

        // Special handling for SKU images with array notation
        const skuImageMatch = key.match(/^sku_list\[(\d+)\]\[sku_image\]$/);
        if (skuImageMatch) {
          const skuIndex = skuImageMatch[1];
          // Also add entry with simpler key format for easier handling
          results[`sku_image_${skuIndex}`] = results[key];
          console.log(`Mapped ${key} to sku_image_${skuIndex}`);
        }
      });

      // Log the keys in results for debugging
      console.log('Available file keys in handleUploadProductMedia:', Object.keys(results).filter(k => k !== 'fields'));

      resolve(results);
    });
  });
};

export const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export const extractFieldsFromFormidable = (formidableResult: any) => {
  const extractedFields: any = {
    textFields: {},
    fileFields: {}
  };

  if (!formidableResult || typeof formidableResult !== 'object') {
    return extractedFields;
  }

  // Extract all keys that are not fields, product_thumb, or product_media
  for (const key in formidableResult) {
    if (key === 'fields') {
      extractedFields.rawFields = formidableResult[key];
    } else if (key === 'product_thumb' || key === 'product_media') {
      extractedFields.fileFields[key] = formidableResult[key];
    } else {
      // Check if it's a file field for SKU images
      const skuImageMatch = key.match(/^sku_list\[(\d+)\]\[sku_image\]$/);
      if (skuImageMatch) {
        const skuIndex = skuImageMatch[1];
        extractedFields.fileFields[key] = formidableResult[key];
        extractedFields.fileFields[`sku_image_${skuIndex}`] = formidableResult[key];
      } else {
        extractedFields.fileFields[key] = formidableResult[key];
      }
    }
  }

  return extractedFields;
}
