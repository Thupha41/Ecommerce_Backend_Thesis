import { ObjectId } from 'mongodb'
import { ICreateSKU } from '~/models/requests/products.requests'
import databaseService from './database.services'
import { generateSPUNo } from '~/utils'

interface VariantImageGroup {
  primary_value_index: number
  secondary_variant_index?: number
  secondary_value_index?: number
  image?: string
}

class SKUService {
  async createSKU({ spu_id, spu_no, sku_list }: ICreateSKU) {
    const convert_sku_list = sku_list.map((sku, index) => {
      console.log(`Input SKU ${index} for conversion:`, JSON.stringify(sku, null, 2))

      const hasImage = sku.sku_image !== undefined && sku.sku_image !== null

      const convertedSku = {
        ...sku,
        product_id: new ObjectId(spu_id),
        sku_no: `${spu_id}_${spu_no}_${generateSPUNo()}`,
        created_at: new Date(),
        updated_at: new Date()
      }

      console.log(`Converted SKU ${index}:`, JSON.stringify(convertedSku, null, 2))
      console.log(`Has sku_image: ${hasImage}, Value: ${sku.sku_image}`)

      return convertedSku
    })

    console.log(
      'All converted SKUs before insert:',
      convert_sku_list.map((sku) => ({
        sku_tier_idx: sku.sku_tier_idx,
        sku_price: sku.sku_price,
        sku_image: sku.sku_image
      }))
    )

    const skus = await databaseService.productSKUs.insertMany(convert_sku_list)

    console.log('Insert result:', JSON.stringify(skus, null, 2))

    return skus
  }

  async getSKUsByProductId(product_id: string) {
    return await databaseService.productSKUs
      .find({
        product_id: new ObjectId(product_id)
      })
      .toArray()
  }
}

const skusService = new SKUService()
export default skusService
