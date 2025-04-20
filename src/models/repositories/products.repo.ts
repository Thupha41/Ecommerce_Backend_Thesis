import { ObjectId, Sort, SortDirection } from 'mongodb'
import databaseService from '~/services/database.services'
import { ProductUpdateReqBody } from '~/models/requests/products.requests'
import { ICheckoutProduct } from '../requests/checkout.requests'

class ProductRepository {
  private products = databaseService.products

  async findDrafts({ query, limit, skip }: { query: any; limit: number; skip: number }) {
    return this.queryProducts({ query, limit, skip })
  }

  async findPublished({ query, limit, skip }: { query: any; limit: number; skip: number }) {
    return this.queryProducts({ query, limit, skip })
  }

  private async queryProducts({ query, limit, skip }: { query: any; limit: number; skip: number }) {
    return await this.products
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'shops',
            localField: 'product_shop',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  _id: 0
                }
              }
            ],
            as: 'product_shop'
          }
        },
        { $sort: { updated_at: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray()
  }

  async publishProduct({ product_shop, product_id }: { product_shop: string; product_id: string }) {
    const foundProduct = await this.products.findOne({
      product_shop: new ObjectId(product_shop),
      _id: new ObjectId(product_id)
    })

    if (!foundProduct) return null

    const result = await this.products.updateOne(
      { _id: foundProduct._id },
      { $set: { isDraft: false, isPublished: true } }
    )

    return result.modifiedCount
  }

  async unPublishProduct({ product_shop, product_id }: { product_shop: string; product_id: string }) {
    const foundProduct = await this.products.findOne({
      product_shop: new ObjectId(product_shop),
      _id: new ObjectId(product_id)
    })

    if (!foundProduct) return null

    const result = await this.products.updateOne(
      { _id: foundProduct._id },
      { $set: { isDraft: true, isPublished: false } }
    )

    return result.modifiedCount
  }

  async searchProduct({ keySearch }: { keySearch: string }) {
    const results = await this.products
      .find(
        {
          isPublished: true,
          $text: { $search: keySearch }
        },
        {
          projection: { score: { $meta: 'textScore' } }
        }
      )
      .sort({ score: { $meta: 'textScore' } })
      .toArray()

    return results
  }

  async findAll({
    limit,
    sort,
    page,
    filter,
    select
  }: {
    limit: number
    sort: string
    page: number
    filter: any
    select: string[]
  }) {
    const skip = (page - 1) * limit
    const sortBy: Sort = sort === 'ctime' ? { _id: -1 as SortDirection } : { _id: 1 as SortDirection }

    const projection: Record<string, 1 | 0> = {}
    select.forEach((field) => {
      projection[field] = 1
    })

    // Convert string IDs to ObjectId in the $in filter if present
    if (filter._id?.$in) {
      filter._id.$in = filter._id.$in.map((id: string) => new ObjectId(id))
    }

    return await this.products.find(filter).sort(sortBy).skip(skip).limit(limit).project(projection).toArray()
  }

  async findOne({ product_id, unSelect }: { product_id: string; unSelect?: string[] }) {
    const projection: Record<string, 1 | 0> = {}
    if (unSelect) {
      unSelect.forEach((field) => {
        projection[field] = 0
      })
    }

    return await this.products.findOne({ _id: new ObjectId(product_id) }, { projection })
  }
  async findOneByName({ product_name, unSelect }: { product_name: string; unSelect?: string[] }) {
    const projection: Record<string, 1 | 0> = {}
    if (unSelect) {
      unSelect.forEach((field) => {
        projection[field] = 0
      })
    }

    // Use a case-insensitive regex match instead of exact match
    return await this.products.findOne(
      {
        product_name: { $regex: new RegExp('^' + product_name + '$', 'i') },
        isPublished: true
      },
      { projection }
    )
  }

  async createTextIndexes() {
    try {
      await this.products.createIndex({
        product_name: 'text',
        product_description: 'text'
      })
    } catch (error) {
      console.error('Error creating text indexes:', error)
    }
  }

  async updateProductById({
    productId,
    bodyUpdate,
    model = this.products,
    isNew = true
  }: {
    productId: string
    bodyUpdate: any
    model?: any
    isNew?: boolean
  }) {
    return await this.products.findOneAndUpdate(
      { _id: new ObjectId(productId) },
      { $set: bodyUpdate },
      { returnDocument: isNew ? 'after' : 'before' }
    )
  }
  removeNullOrUndefinedV1 = (obj: ProductUpdateReqBody) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null))
  }

  removeNullOrUndefinedV2 = (obj: ProductUpdateReqBody) => {
    Object.keys(obj).forEach((key) => {
      if (obj[key as keyof ProductUpdateReqBody] === null || obj[key as keyof ProductUpdateReqBody] === undefined) {
        delete obj[key as keyof ProductUpdateReqBody]
      }
    })
    return obj
  }

  updateNestedObjectParser = (obj: ProductUpdateReqBody) => {
    // First remove any null/undefined values
    console.log(`[1]`, obj)
    const cleanObj = this.removeNullOrUndefinedV2(obj)
    console.log(`[2]`, cleanObj)
    const final = {}
    Object.keys(cleanObj).forEach((key) => {
      if (
        typeof cleanObj[key as keyof ProductUpdateReqBody] === 'object' &&
        cleanObj[key as keyof ProductUpdateReqBody] !== null &&
        !Array.isArray(cleanObj[key as keyof ProductUpdateReqBody])
      ) {
        // Recursively clean nested objects
        const res = this.updateNestedObjectParser(cleanObj[key as keyof ProductUpdateReqBody])
        // Only add nested properties if the result is not empty
        if (Object.keys(res).length > 0) {
          Object.keys(res).forEach((resKey) => {
            ; (final as Record<string, unknown>)[`${key}.${resKey}`] = res[resKey as keyof typeof res]
          })
        }
      } else {
        ; (final as Record<string, unknown>)[key] = cleanObj[key as keyof ProductUpdateReqBody]
      }
    })
    console.log(`[3]`, final)
    return final
  }
  getProductById = async (productId: string) => {
    return await this.products.findOne({
      _id: new ObjectId(productId)
    })
  }
  checkProductByServer = async (products: ICheckoutProduct[]) => {
    return await Promise.all(
      products.map(async (product) => {
        const foundProduct = await this.getProductById(product.productId)
        if (foundProduct) {
          return {
            price: foundProduct.product_price,
            quantity: product.quantity,
            productId: product.productId
          }
        }
        return null
      })
    )
  }
}

export const productRepository = new ProductRepository()
