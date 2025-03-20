import { Request } from 'express'
import { getNameFromFullname, handleUploadImage } from '~/utils/file'
import sharp from 'sharp'
import { Media } from '~/models/Other'
import path from 'path'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { MediaType } from '~/constants/enums'
import { envConfig } from '~/constants/config'
class UploadService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        const newFullFilename = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFilename)
        await sharp(file.filepath).jpeg().toFile(newPath)
        // const s3Result = await uploadFileToS3({
        //   filename: 'images/' + newFullFilename,
        //   filepath: newPath,
        //   contentType: mime.getType(newPath) as string
        // })
        return {
          url: `http://localhost:${envConfig.port}/api/v1/products/image/${newFullFilename}`,
          type: MediaType.Image
        } as Media
      })
    )
    return result
  }

  async updateProductThumb(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        const newFullFilename = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFilename)
        await sharp(file.filepath).jpeg().toFile(newPath)
        // const s3Result = await uploadFileToS3({
        //   filename: 'images/' + newFullFilename,
        //   filepath: newPath,
        //   contentType: mime.getType(newPath) as string
        // })
        return {
          url: `http://localhost:${envConfig.port}/api/v1/products/image/${newFullFilename}`,
          type: MediaType.Image
        } as Media
      })
    )
    return result
  }
}

const generatePromise = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('ok')
    }, delay)
  })
}

async function main() {
  console.time('await tung cai')
  await generatePromise(3000)
  await generatePromise(3000)
  await generatePromise(3000)
  console.timeEnd('await tung cai')
}

main()

console.time('Promise all')
Promise.all(
  [1, 2, 3].map(async (item) => {
    const result = await generatePromise(3000)
    return result
  })
).then((result) => {
  console.timeEnd('Promise all')
})

const uploadService = new UploadService()
export default uploadService
