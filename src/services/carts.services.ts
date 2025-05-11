import { cartRepository } from '~/models/repositories/cart.repo'
import databaseService from './database.services'
import { ObjectId, UpdateResult } from 'mongodb'
import { AddToCartReqBody, GetListCartReqQuery, UpdateCartReqBody } from '~/models/requests/carts.requests'
import { ErrorWithStatus } from '~/models/Errors'
import { productRepository } from '~/models/repositories/products.repo'
import { CartStatus } from '~/constants/enums'
import { USERS_MESSAGES, PRODUCTS_MESSAGES, CARTS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
/*
    1. Add product to cart [user]
    2. Reduce product quantity by one [user]
    3. Increase product quantity by one [user]
    4. Get list to Cart [user]
    5. Delete cart [user]
    6. Delete cart item [user]
*/
class CartService {
  private cartRepo = cartRepository

  async addToCart(userId: string, { product }: AddToCartReqBody): Promise<any> {
    // Check user exists
    const foundUser = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!foundUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    //gio hang ton tai va co san pham thi update quantity
    // Use the updated repository method that handles both new and existing products
    const res = await this.cartRepo.updateUserCartQuantity(userId, { product })
    console.log('>>> check add to cart', res)
    return res
  }

  async deleteUserCart(userId: string, productId: string, sku_id?: string) {
    // Found user
    const foundUser = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!foundUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Found product
    const foundProduct = await productRepository.getProductById(productId)
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get the cart first to update totals
    const userCart = await databaseService.carts.findOne({
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active
    })

    if (!userCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Find the product in the cart to calculate totals
    // If sku_id is provided, find the specific variant
    const productInCart = sku_id
      ? userCart.cart_products.find((p) => p.product_id.toString() === productId && p.sku_id?.toString() === sku_id)
      : userCart.cart_products.find((p) => p.product_id.toString() === productId && !p.sku_id)

    if (!productInCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.PRODUCT_NOT_IN_CART,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Calculate values to decrement
    const quantityToRemove = productInCart.product_quantity || 0
    const priceToRemove = (productInCart.product_price || 0) * quantityToRemove

    // Filter out the product from cart_products
    const updatedProducts = userCart.cart_products.filter((p) => {
      if (sku_id) {
        // For variants, remove only the specific variant
        return !(p.product_id.toString() === productId && p.sku_id?.toString() === sku_id)
      } else {
        // For products without variants, remove products with matching ID and no sku_id
        return !(p.product_id.toString() === productId && !p.sku_id)
      }
    })

    // Update the cart with the filtered products and updated totals
    const query = { cart_userId: new ObjectId(userId), cart_status: CartStatus.Active }
    const updateSet = {
      $set: {
        cart_products: updatedProducts
      },
      $inc: {
        cart_count_product: -quantityToRemove,
        cart_total_price: -priceToRemove
      }
    }

    const updateResult: UpdateResult = await databaseService.carts.updateOne(query, updateSet)
    if (updateResult.modifiedCount === 0) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.UPDATE_CART_FAILED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
    // Get the updated cart to return details
    const updatedCart = await databaseService.carts.findOne(query)
    if (!updatedCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return updatedCart
  }

  async getListCart({ userId }: GetListCartReqQuery) {
    //check user
    console.log(1)
    const foundUser = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!foundUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const query = { cart_userId: new ObjectId(userId) }
    const listCart = await databaseService.carts.findOne(query)
    return listCart
  }

  // Increase quantity by one
  async increaseCartItemQuantity(userId: string, productId: string, sku_id?: string) {
    const foundProduct = await productRepository.getProductById(productId)
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    // Get current quantity in cart
    const cart = await databaseService.carts.findOne({
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active
    })

    if (!cart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Find the specific product variant in cart
    const cartItem = sku_id
      ? cart.cart_products.find((p) => p.product_id.toString() === productId && p.sku_id?.toString() === sku_id)
      : cart.cart_products.find((p) => p.product_id.toString() === productId && !p.sku_id)

    if (!cartItem) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.PRODUCT_NOT_IN_CART,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const itemPrice = cartItem?.product_price || foundProduct.product_price
    const shopId = cartItem?.shopId?.toString() || foundProduct.product_shop.toString()

    return await this.cartRepo.updateUserCartQuantity(userId, {
      product: {
        product_id: productId,
        product_quantity: 1,
        product_price: itemPrice,
        shopId: shopId,
        sku_id: sku_id
      }
    })
  }

  // Decrease quantity by one
  async decreaseCartItemQuantity(userId: string, productId: string, sku_id?: string) {
    const foundProduct = await productRepository.getProductById(productId)
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get current quantity in cart
    const cart = await databaseService.carts.findOne({
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active
    })

    if (!cart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Find the specific product variant in cart
    const cartItem = sku_id
      ? cart.cart_products.find((p) => p.product_id.toString() === productId && p.sku_id?.toString() === sku_id)
      : cart.cart_products.find((p) => p.product_id.toString() === productId && !p.sku_id)

    if (!cartItem) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.PRODUCT_NOT_IN_CART,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!cartItem || (cartItem.product_quantity as number) <= 1) {
      // If quantity would become 0, remove the item
      return await this.deleteUserCart(userId, productId, sku_id)
    }

    // Get the exact price from the cart item to ensure consistency
    const itemPrice = cartItem.product_price || foundProduct.product_price
    const shopId = cartItem.shopId?.toString() || foundProduct.product_shop.toString()

    // Decrease by 1
    return await this.cartRepo.updateUserCartQuantity(userId, {
      product: {
        product_id: productId,
        product_quantity: -1,
        product_price: itemPrice,
        shopId: shopId,
        sku_id: sku_id
      }
    })
  }

  async updateCartQuantity(userId: string, { product }: UpdateCartReqBody) {
    // Check user exists
    const foundUser = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!foundUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if product exists
    const productId = product.product_id
    const foundProduct = await productRepository.getProductById(productId)
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Validate new quantity must be greater than 0
    if (!product.product_quantity || product.product_quantity <= 0) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.QUANTITY_MUST_BE_GREATER_THAN_ZERO,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get current cart
    const currentCart = await databaseService.carts.findOne({
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active
    })

    if (!currentCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Find the current product in cart
    const cartItem = product.sku_id
      ? currentCart.cart_products.find(
          (p) => p.product_id.toString() === productId && p.sku_id?.toString() === product.sku_id
        )
      : currentCart.cart_products.find((p) => p.product_id.toString() === productId && !p.sku_id)

    if (!cartItem) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.PRODUCT_NOT_IN_CART,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Validate old_quantity matches current quantity in cart
    if (product.old_quantity !== cartItem.product_quantity) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.OLD_QUANTITY_MISMATCH,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Variables to store SKU information
    let actualStock = 0
    let productThumb = foundProduct.product_thumb
    let variants = undefined
    let newSkuId = product.new_sku_id || product.sku_id

    // Check if we need to change the SKU (variant)
    if (product.new_sku_id) {
      // Validate the new SKU exists and get its details
      const newSku = await databaseService.productSKUs.findOne({
        _id: new ObjectId(product.new_sku_id),
        product_id: new ObjectId(productId)
      })

      if (!newSku) {
        throw new ErrorWithStatus({
          message: 'New product variant not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // Update stock, thumbnail and variants from the new SKU
      actualStock = newSku.sku_stock
      if (newSku.sku_image) {
        productThumb = newSku.sku_image
      }

      // Get variants information if available
      if (newSku.sku_tier_idx && foundProduct.product_variations) {
        variants = newSku.sku_tier_idx.map((idx, i) => {
          const variation = foundProduct.product_variations[i]
          return {
            name: variation.name,
            value: variation.options[idx]
          }
        })
      }
    }
    // If not changing SKU but using existing one
    else if (product.sku_id) {
      const sku = await databaseService.productSKUs.findOne({
        _id: new ObjectId(product.sku_id)
      })

      if (!sku) {
        throw new ErrorWithStatus({
          message: 'Product variant not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      actualStock = sku.sku_stock
      if (sku.sku_image) {
        productThumb = sku.sku_image
      }

      // Keep existing variants if not changing SKU
      variants = cartItem.variants
    }
    // For products without variants
    else {
      const inventory = await databaseService.inventories.findOne({
        inventory_productId: new ObjectId(productId)
      })

      if (!inventory) {
        throw new ErrorWithStatus({
          message: 'Product inventory not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      actualStock = inventory.inventory_stock
    }

    // Check if requested quantity is available
    if (product.product_quantity > actualStock) {
      throw new ErrorWithStatus({
        message: `Product is out of stock. Only ${actualStock} available.`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Calculate the quantity difference
    const oldQuantity = cartItem.product_quantity || 0
    const newQuantity = product.product_quantity

    // If changing SKU, remove old item and add new one
    if (product.new_sku_id) {
      // Remove old item
      const updatedCartProducts = currentCart.cart_products.filter((p) => {
        return !(p.product_id.toString() === productId && p.sku_id?.toString() === product.sku_id)
      })

      // Add new item with the new SKU
      updatedCartProducts.push({
        product_id: new ObjectId(productId),
        product_quantity: newQuantity,
        product_price: product.product_price || cartItem.product_price,
        shopId: new ObjectId(product.shopId),
        name: product.name || cartItem.name,
        product_thumb: productThumb,
        sku_id: new ObjectId(product.new_sku_id),
        variants: variants
      })

      // Update the cart with the new product
      const query = { cart_userId: new ObjectId(userId), cart_status: CartStatus.Active }
      const updateSet: any = {
        $set: {
          cart_products: updatedCartProducts
        }
      }

      // Calculate total price and count adjustments
      const oldTotalPrice = (cartItem.product_price || 0) * oldQuantity
      const newTotalPrice = (product.product_price || cartItem.product_price || 0) * newQuantity
      const priceDifference = newTotalPrice - oldTotalPrice
      const quantityDifference = newQuantity - oldQuantity

      // Add increments to update set
      updateSet.$inc = {
        cart_count_product: quantityDifference,
        cart_total_price: priceDifference
      }

      const updateResult: UpdateResult = await databaseService.carts.updateOne(query, updateSet)
      if (updateResult.modifiedCount === 0) {
        throw new ErrorWithStatus({
          message: CARTS_MESSAGES.UPDATE_CART_FAILED,
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR
        })
      }
    }
    // If not changing SKU, just update quantity
    else {
      // Update the product in cart to have the exact new quantity
      const updatedCartProducts = currentCart.cart_products.map((p) => {
        const isMatch = product.sku_id
          ? p.product_id.toString() === productId && p.sku_id?.toString() === product.sku_id
          : p.product_id.toString() === productId && !p.sku_id

        if (isMatch) {
          return {
            ...p,
            product_quantity: newQuantity
          }
        }
        return p
      })

      // Calculate total price adjustment
      const productPrice = cartItem.product_price || foundProduct.product_price
      const priceDifference = productPrice * (newQuantity - oldQuantity)
      const quantityDifference = newQuantity - oldQuantity

      // Update the cart with the new product quantities and adjusted totals
      const query = { cart_userId: new ObjectId(userId), cart_status: CartStatus.Active }
      const updateSet = {
        $set: {
          cart_products: updatedCartProducts
        },
        $inc: {
          cart_count_product: quantityDifference,
          cart_total_price: priceDifference
        }
      }

      const updateResult: UpdateResult = await databaseService.carts.updateOne(query, updateSet)
      if (updateResult.modifiedCount === 0) {
        throw new ErrorWithStatus({
          message: CARTS_MESSAGES.UPDATE_CART_FAILED,
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR
        })
      }
    }

    // Get the updated cart to return details
    const updatedCart = await databaseService.carts.findOne({
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active
    })

    if (!updatedCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.CART_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return updatedCart
  }
}

const cartService = new CartService()
export default cartService
