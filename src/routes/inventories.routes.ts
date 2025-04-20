import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { addStockToInventory } from '~/controllers/inventories.controllers'
import { inventoryValidator } from '~/middlewares/inventories.middlewares'
const inventoryRouter = Router()

//authentication
inventoryRouter.use(accessTokenValidator)

/**
 * Description: Add stock to inventory
 * Path: /inventories/add-stock
 * Method: POST
 * Body: {stock: number, productId: string, location?: string}
 */
inventoryRouter.post('/add-stock', inventoryValidator, wrapRequestHandler(addStockToInventory))

export default inventoryRouter
