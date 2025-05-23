import slugify from 'slugify'
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { ProductType } from '~/constants/enums'
import { IProductType } from '~/models/schemas/Products/Product.schema'
import { productRepository } from '../models/repositories/products.repo'
import { insertInventory } from '~/models/repositories/inventory.repo'
import skusService from './skus.services'
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
    product_attributes,
    product_ratingsAverage
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
    this.product_ratingsAverage = product_ratingsAverage || 4.5
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
      total_reviews: 0,
      reviews_by_rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviews_with_media: 0,
      total_media_count: 0,
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

class Book extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.books.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new book error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new book error')

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
        model: Book
      })
    }

    const updateProduct = await super.updateProduct(productId, productRepository.updateNestedObjectParser(objectParams))

    return updateProduct
  }
}

class Stationery extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.stationery.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new stationery error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new stationery error')

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
        model: Stationery
      })
    }

    const updateProduct = await super.updateProduct(productId, productRepository.updateNestedObjectParser(objectParams))

    return updateProduct
  }
}

class Kitchenware extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.kitchenware.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new kitchenware error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new kitchenware error')

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
        model: Kitchenware
      })
    }

    const updateProduct = await super.updateProduct(productId, productRepository.updateNestedObjectParser(objectParams))

    return updateProduct
  }
}

class Instrument extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.instruments.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new instrument error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new instrument error')

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
        model: Instrument
      })
    }

    const updateProduct = await super.updateProduct(productId, productRepository.updateNestedObjectParser(objectParams))

    return updateProduct
  }
}

class Souvenir extends Product {
  async createProduct() {
    const { insertedId } = await databaseService.souvenirs.insertOne({
      ...this.product_attributes,
      product_shop: this.product_shop,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!insertedId) throw new Error('Create new souvenir error')

    const newProduct = await super.createProduct(insertedId)
    if (!newProduct) throw new Error('Create new souvenir error')

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
        model: Souvenir
      })
    }

    const updateProduct = await super.updateProduct(productId, productRepository.updateNestedObjectParser(objectParams))

    return updateProduct
  }
}

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
    [ProductType.Furniture]: Furniture,
    [ProductType.Book]: Book,
    [ProductType.Stationery]: Stationery,
    [ProductType.Souvenir]: Souvenir,
    [ProductType.Kitchenware]: Kitchenware,
    [ProductType.Instrument]: Instrument
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

  static async findAllProducts({ limit = 3000, sort = 'ctime', page = 1, filter = { isPublished: true } }) {
    return await productRepository.findAll({
      limit,
      sort,
      page,
      filter,
      select: [
        'product_name',
        'product_price',
        'product_thumb',
        'product_shop',
        'product_attributes',
        'product_slug',
        'product_ratingsAverage',
        'product_variations',
        'product_media',
        'isDraft',
        'isPublished',
        '_id',
        'product_category'
      ]
    })
  }

  static async findOneProduct({ product_id }: { product_id: string }) {
    // Get the product details
    const product = await productRepository.findOne({
      product_id,
      unSelect: ['__v', 'created_at', 'updated_at']
    })
    if (!product) return null
    //get shop of product
    const shop = await databaseService.shops.findOne({
      _id: new ObjectId(product.product_shop)
    }, {
      projection: {
        shop_name: 1,
        shop_logo: 1,
        _id: 1,
        shop_rating: 1,
        shop_response_rate: 1,
      }
    })

    // Count total products of this shop
    const totalProducts = await databaseService.productSPUs.countDocuments({
      product_shop: new ObjectId(product.product_shop),
      isPublished: true
    })

    // Get other products from the same shop (excluding the current product)
    const otherShopProducts = await databaseService.productSPUs
      .find({
        product_shop: new ObjectId(product.product_shop),
        _id: { $ne: new ObjectId(product_id) }, // Exclude current product
        isPublished: true,
        isDeleted: { $ne: true }
      })
      .sort({ created_at: -1 }) // Sort by newest first
      .limit(10) // Limit to 10 products
      .project({
        product_name: 1,
        product_thumb: 1,
        product_price: 1,
        sold_quantity: 1,
        _id: 1
      })
      .toArray()

    // Get the SKUs for this product
    const productSkus = await skusService.getSKUsByProductId(product_id)

    // Return the product details, SKUs, shop info, and other products from the shop
    return {
      ...product,
      product_skus: productSkus,
      shop: shop ? {
        _id: shop._id.toString(),
        shop_name: shop.shop_name,
        shop_logo: shop.shop_logo,
        shop_rating: shop.shop_rating,
        shop_response_rate: shop.shop_response_rate,
        total_products: totalProducts
      } : null,
      other_shop_products: otherShopProducts
    }
  }

  static async findOneProductByName({ product_name }: { product_name: string }) {
    return await productRepository.findOneByName({
      product_name,
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
