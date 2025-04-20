import databaseService from '~/services/database.services'
import { ObjectId, WithId, ReturnDocument } from 'mongodb'
import { CartStatus } from '~/constants/enums'
import Cart from '../schemas/Cart.schema'
import { AddToCartReqBody } from '../requests/carts.requests'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { CARTS_MESSAGES, PRODUCTS_MESSAGES } from '~/constants/messages'
class CartRepository {
  private carts = databaseService.carts

  async createUserCart(userId: string, { product }: AddToCartReqBody) {
    //check product exist
    const foundProduct = await databaseService.products.findOne({ _id: new ObjectId(product.product_id) })
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const productWithObjectId = {
      ...product,
      product_id: new ObjectId(product.product_id),
      shop_id: new ObjectId(product.shop_id)
    }

    const query = { cart_userId: new ObjectId(userId), cart_status: CartStatus.Active }
    const updateOrInsert = {
      $addToSet: {
        cart_products: productWithObjectId
      }
    }
    const options = {
      upsert: true,
      new: true
    }
    return await this.carts.findOneAndUpdate(query, updateOrInsert, options)
  }

  async updateUserCartQuantity(userId: string, { product }: AddToCartReqBody): Promise<WithId<Cart> | null> {
    const product_id = product.product_id
    const product_quantity = product.product_quantity || 0
    const product_price = product.product_price || 0

    //check product exist
    const foundProduct = await databaseService.products.findOne({ _id: new ObjectId(product_id) })
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: 'Product not found',
        status: 404
      })
    }
    // Get current cart to check existing quantity
    const existingCart = await this.carts.findOne({
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active
    })

    // Find the product in the cart
    const existingProduct = existingCart?.cart_products.find((p) => p.product_id.toString() === product_id)

    // Calculate the new total quantity after this update
    const currentQuantity = existingProduct?.product_quantity || 0
    const newTotalQuantity =
      product_quantity > 0
        ? currentQuantity + product_quantity // Adding more
        : Math.max(0, currentQuantity + product_quantity)

    // Check inventory against the new total
    const inventory = await databaseService.inventories.findOne({
      inventory_productId: new ObjectId(product_id)
    })

    if (!inventory) {
      throw new ErrorWithStatus({
        message: 'Product inventory not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Only check stock when adding items (not when reducing)
    if (product_quantity > 0 && inventory.inventory_stock < newTotalQuantity) {
      throw new ErrorWithStatus({
        message: `Product is out of stock. Only ${inventory.inventory_stock} available.`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Chuyển đổi chuỗi sang ObjectId
    const productWithObjectId = {
      ...product,
      product_id: new ObjectId(product.product_id),
      shop_id: new ObjectId(product.shop_id)
    }

    if (existingProduct) {
      // Update existing product quantity
      const updated = await this.carts.findOneAndUpdate(
        {
          cart_userId: new ObjectId(userId),
          cart_status: CartStatus.Active,
          'cart_products.product_id': new ObjectId(product_id)
        },
        {
          $inc: {
            'cart_products.$.product_quantity': product_quantity,
            cart_count_product: product_quantity,
            cart_total_price: product_quantity * product_price
          }
        },
        { returnDocument: ReturnDocument.AFTER }
      )
      return updated
    } else {
      // Add new product to cart
      const updated = await this.carts.findOneAndUpdate(
        {
          cart_userId: new ObjectId(userId),
          cart_status: CartStatus.Active
        },
        {
          $push: {
            cart_products: productWithObjectId
          },
          $inc: {
            cart_count_product: product_quantity,
            cart_total_price: product_quantity * product_price
          }
        },
        {
          upsert: true,
          returnDocument: ReturnDocument.AFTER
        }
      )
      return updated
    }
  }
  async findCartById(cartId: string) {
    const foundCart = await this.carts.findOne({
      _id: new ObjectId(cartId),
      cart_status: CartStatus.Active
    })
    if (!foundCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return foundCart
  }
}

export const cartRepository = new CartRepository()
