import { Router } from 'express'
import { createShopValidator, shopIdValidator, updateShopValidator } from '~/middlewares/shops.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { createShopController, updateShopController, deleteShopController, getShopProductsController } from '~/controllers/shops.controllers'

const shopRouter = Router()

shopRouter.use(accessTokenValidator)

shopRouter.post('/', createShopValidator, wrapRequestHandler(createShopController))
shopRouter.patch('/:shop_id', shopIdValidator, updateShopValidator, wrapRequestHandler(updateShopController))
shopRouter.delete('/:shop_id', shopIdValidator, wrapRequestHandler(deleteShopController))
shopRouter.get('/:shop_id/products', wrapRequestHandler(getShopProductsController))
export default shopRouter
