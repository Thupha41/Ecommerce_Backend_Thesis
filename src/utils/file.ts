import { Request } from 'express'
import { File, Fields } from 'formidable'
import fs from 'fs'
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR, UPLOAD_CATEGORY_MEDIA_DIR } from '~/constants/dir'

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
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR, UPLOAD_CATEGORY_MEDIA_DIR].forEach((dir) => {
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
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
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
