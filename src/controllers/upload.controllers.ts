import { NextFunction, Request, Response } from 'express'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import path from 'path'
import { USERS_MESSAGES } from '~/constants/messages'
import uploadService from '~/services/upload.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await uploadService.uploadImage(req)
  res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result
  })
  return
}
export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send('Not found')
    }
  })
  return
}
