import { SHOP_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { CreateProductSPUReqBody } from '~/models/requests/products.requests'
import { generateSlug } from '~/utils'
import { generateSPUNo } from '~/utils'
import ProductSPU from '~/models/schemas/Products/Product_SPU.schema'
import skusService from './skus.services'
import { insertInventory } from '~/models/repositories/inventory.repo'
class ProductSPUService {
  async createProductSPU(
    user_id: string,
    {
      product_shop,
      product_name,
      product_thumb,
      product_media,
      product_description,
      product_quantity,
      product_category,
      product_attributes,
      product_price,
      product_variations,
      sku_list
    }: CreateProductSPUReqBody
  ) {
    //1. Check user
    const foundUser = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!foundUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //2. Check shop
    const foundShop = await databaseService.shops.findOne({
      _id: new ObjectId(product_shop)
    })
    if (!foundShop) {
      throw new ErrorWithStatus({
        message: SHOP_MESSAGES.SHOP_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Log sku_list trước khi tạo sản phẩm
    console.log('SKU list before product creation:', JSON.stringify(sku_list, null, 2))

    //3. Create product SPU
    const spuNo = generateSPUNo().toString()
    const newProductSPU = await databaseService.productSPUs.insertOne(
      new ProductSPU({
        product_shop: new ObjectId(product_shop),
        product_name,
        product_thumb,
        product_media: product_media || [],
        product_description,
        product_quantity,
        product_category: new ObjectId(product_category),
        product_attributes,
        product_price,
        product_variations,
        isPublished: true,
        isDraft: false,
        spu_no: spuNo,
        product_slug: generateSlug(product_name),
        created_at: new Date(),
        updated_at: new Date()
      })
    )
    //create inventory
    if (newProductSPU) {
      await insertInventory({
        productId: newProductSPU.insertedId.toString(),
        shopId: product_shop,
        stock: product_quantity
      })
    }
    //4. Create product SKUs
    let createdSKUs = null
    if (newProductSPU && sku_list && sku_list.length) {
      createdSKUs = await skusService.createSKU({
        spu_id: newProductSPU.insertedId.toString(),
        spu_no: spuNo,
        sku_list
      })
    }

    // Lấy SKUs đã tạo với thông tin đầy đủ bao gồm sku_image
    const skus = await skusService.getSKUsByProductId(newProductSPU.insertedId.toString())
    console.log('Retrieved SKUs after creation:', JSON.stringify(skus, null, 2))

    return {
      _id: newProductSPU.insertedId,
      spu_no: spuNo,
      product_name,
      product_thumb,
      product_description,
      product_quantity,
      product_category,
      product_attributes,
      product_price,
      product_variations,
      sku_list: skus // Trả về SKUs đầy đủ từ database
    }
  }

  async getProductSPUWithVariants(product_id: string) {
    // Check if product exists
    const product = await databaseService.productSPUs.findOne({
      _id: new ObjectId(product_id)
    })

    if (!product) {
      throw new ErrorWithStatus({
        message: 'Product not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    // Get all SKUs for this product with full information
    const skus = await skusService.getSKUsByProductId(product_id)

    // Return product with SKUs
    return {
      ...product,
      skus
    }
  }
}

const spuService = new ProductSPUService()
export default spuService
