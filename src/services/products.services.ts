import slugify from 'slugify'
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { ProductType } from '~/constants/enums'
import { IProductType } from '~/models/schemas/Products/Product.schema'
import { productRepository } from '../models/repositories/products.repo'
import { insertInventory } from '~/models/repositories/inventory.repo'
// Base Product Class
class Product {
  private products = databaseService.products
  protected product_name: string
  protected product_thumb: string
  protected product_price: number
  protected product_quantity: number
  protected product_type: ProductType
  protected product_description: string
  protected product_shop: ObjectId
  protected product_attributes: any
  protected product_slug: string
  protected product_ratingsAverage: number = 4.5
  protected product_variations: Array<any> = []
  protected isDraft: boolean = true
  protected isPublished: boolean = false

  constructor({
    product_name,
    product_thumb,
    product_price,
    product_quantity,
    product_type,
    product_description,
    product_shop,
    product_attributes
  }: IProductType) {
    this.product_name = product_name
    this.product_thumb = product_thumb
    this.product_price = product_price
    this.product_quantity = product_quantity
    this.product_type = product_type
    this.product_description = product_description
    this.product_shop = typeof product_shop === 'string' ? new ObjectId(product_shop) : product_shop
    this.product_attributes = product_attributes
    this.product_slug = this.generateSlug(product_name)
  }

  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true, // Convert to lower case
      strict: true, // Strip special characters except replacement
      locale: 'vi', // Language code for Vietnamese characters
      trim: true // Trim leading and trailing replacement chars
    })
  }
  async createProduct(product_id?: ObjectId) {
    const productData = {
      _id: product_id,
      product_name: this.product_name,
      product_thumb: this.product_thumb,
      product_price: this.product_price,
      product_quantity: this.product_quantity,
      product_type: this.product_type,
      product_description: this.product_description,
      product_shop: this.product_shop,
      product_attributes: this.product_attributes,
      product_slug: this.product_slug,
      product_ratingsAverage: this.product_ratingsAverage,
      product_variations: this.product_variations,
      isDraft: this.isDraft,
      isPublished: this.isPublished,
      created_at: new Date(),
      updated_at: new Date()
    }

    const newProduct = await this.products.insertOne(productData)
    if (newProduct) {
      await insertInventory({
        productId: newProduct.insertedId.toString(),
        shopId: this.product_shop.toString(),
        stock: this.product_quantity
      })
    }

    return {
      ...productData,
      _id: product_id || productData._id,
      product_shop: productData.product_shop.toString()
    }
  }

  async updateProduct(productId: string, bodyUpdate: any) {
    return await productRepository.updateProductById({
      productId,
      bodyUpdate,
      model: this.products
    })
  }
}

// Product Type Specific Classes
class Clothing extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.clothes.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new clothing error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new clothing error')

    return newProduct
  }

  async updateProduct(productId: string) {
    /*
      {
        a: undefined,
        b: null
      }
      //1. remove attribute has null / undefined
      //2 check where to update
    */
    //1
    const objectParams = productRepository.removeNullOrUndefinedV2({
      product_name: this.product_name,
      product_thumb: this.product_thumb,
      product_description: this.product_description,
      product_price: this.product_price,
      product_quantity: this.product_quantity,
      product_type: this.product_type,
      product_attributes: this.product_attributes
    })
    //2
    if (objectParams.product_attributes) {
      //update child
      await productRepository.updateProductById({
        productId,
        bodyUpdate: {
          product_attributes: productRepository.updateNestedObjectParser(objectParams.product_attributes)
        },
        model: Clothing
      })
    }

    const updateProduct = await super.updateProduct(productId, productRepository.updateNestedObjectParser(objectParams))

    return updateProduct
  }
}

class Electronics extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.electronics.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new electronic error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new electronic error')

    return newProduct
  }
}

class Furniture extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.furniture.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new product error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new product error')

    return newProduct
  }
}

// Product Factory using Strategy Pattern
class ProductFactory {
  static productRegistry = {
    [ProductType.Clothing]: Clothing,
    [ProductType.Electronic]: Electronics,
    [ProductType.Furniture]: Furniture
  }

  static async createProduct(type: ProductType, payload: IProductType) {
    const ProductClass = ProductFactory.productRegistry[type]

    if (!ProductClass) {
      throw new Error(`Invalid Product Type ${type}`)
    }

    return new ProductClass(payload).createProduct()
  }

  static async updateProduct(type: ProductType, productId: string, payload: IProductType) {
    const ProductClass = ProductFactory.productRegistry[type]

    if (!ProductClass) {
      throw new Error(`Invalid Product Type ${type}`)
    }

    return new ProductClass(payload).updateProduct(productId, payload)
  }

  // QUERY Methods
  static async findAllDraftsForShop({
    product_shop,
    limit = 50,
    skip = 0
  }: {
    product_shop: string
    limit?: number
    skip?: number
  }) {
    const query = { product_shop: new ObjectId(product_shop), isDraft: true }
    return await productRepository.findDrafts({ query, limit, skip })
  }

  static async findAllPublishedForShop({
    product_shop,
    limit = 50,
    skip = 0
  }: {
    product_shop: string
    limit?: number
    skip?: number
  }) {
    const query = { product_shop: new ObjectId(product_shop), isPublished: true }
    return await productRepository.findPublished({ query, limit, skip })
  }

  static async searchProductByUser({ keySearch }: { keySearch: string }) {
    // First ensure indexes exist
    await productRepository.createTextIndexes()
    return await productRepository.searchProduct({ keySearch })
  }

  static async findAllProducts({ limit = 50, sort = 'ctime', page = 1, filter = { isPublished: true } }) {
    return await productRepository.findAll({
      limit,
      sort,
      page,
      filter,
      select: ['product_name', 'product_description', 'product_price']
    })
  }

  static async findOneProduct({ product_id }: { product_id: string }) {
    return await productRepository.findOne({
      product_id,
      unSelect: ['__v', 'product_variations']
    })
  }

  // PUT Methods
  static async publishProductByShop({ product_shop, product_id }: { product_shop: string; product_id: string }) {
    return await productRepository.publishProduct({ product_shop, product_id })
  }

  static async unPublishProductByShop({ product_shop, product_id }: { product_shop: string; product_id: string }) {
    return await productRepository.unPublishProduct({ product_shop, product_id })
  }
}

export default ProductFactory
