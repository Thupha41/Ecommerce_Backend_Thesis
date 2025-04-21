import { cartRepository } from '~/models/repositories/cart.repo'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { AddToCartReqBody, UpdateCartReqBody, GetListCartReqQuery } from '~/models/requests/carts.requests'
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
    // check cart co ton tai hay khong
    // const userCart = await databaseService.carts.findOne({ cart_userId: new ObjectId(userId) })
    // if (!userCart) {
    //   // create new cart
    //   return await this.cartRepo.createUserCart(userId, { product })
    // }

    // Check product exists
    const foundProduct = await databaseService.products.findOne({
      _id: new ObjectId(product.product_id)
    })
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    //check so luong
    //neu co gio hang roi nhung chua co san pham?
    // if (!userCart.cart_products.length) {
    //   return await databaseService.carts.findOneAndUpdate(
    //     { _id: userCart._id },
    //     { $set: { cart_products: [product] } },
    //     { returnDocument: 'after' }
    //   )
    // }

    //gio hang ton tai va co san pham thi update quantity
    // Use the updated repository method that handles both new and existing products
    const res = await this.cartRepo.updateUserCartQuantity(userId, { product })
    console.log('>>> check add to cart', res)
    return res
  }
  //update cart
  /*
    shop_order_ids: [
        {
            shopId,
            item_products: [
                {
                    quantity,
                    price,
                    shopId,
                    old_quantity,
                    productId,
                }
            ]
            version
        }
    ]
  */
  async addToCartV2(userId: string, { shop_order_ids }: UpdateCartReqBody) {
    const { productId, product_quantity, old_quantity } = shop_order_ids[0].item_products[0]
    //check san pham nay co ton tai hay khong
    const foundProduct = await productRepository.getProductById(productId)
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    //compare
    if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
      throw new ErrorWithStatus({
        message: 'Product do not belong to the shop',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    //check so luong
    if (product_quantity > foundProduct.product_quantity || product_quantity <= 0) {
      throw new ErrorWithStatus({
        message: 'Product quantity is not enough',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    if (product_quantity === 0) {
      //delete
      return await this.deleteUserCart(userId, productId)
    }
    //update quantity
    return await this.cartRepo.updateUserCartQuantity(userId, {
      product: {
        product_id: productId,
        product_quantity: product_quantity - old_quantity
      }
    })
  }
  async deleteUserCart(userId: string, productId: string) {
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
    const productInCart = userCart.cart_products.find((p) => p.product_id.toString() === productId)

    if (!productInCart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.PRODUCT_NOT_IN_CART,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Calculate values to decrement
    const quantityToRemove = productInCart.product_quantity || 0
    const priceToRemove = (productInCart.product_price || 0) * quantityToRemove

    // Update the cart
    const query = { cart_userId: new ObjectId(userId), cart_status: CartStatus.Active }
    const updateSet = {
      $pull: {
        cart_products: { product_id: new ObjectId(productId) }
      },
      $inc: {
        cart_count_product: -quantityToRemove,
        cart_total_price: -priceToRemove
      }
    }

    const deleteCart = await databaseService.carts.updateOne(query, updateSet)
    return deleteCart
  }

  async getListCart({ userId }: GetListCartReqQuery) {
    const query = { cart_userId: new ObjectId(userId) }
    const listCart = await databaseService.carts.findOne(query)
    return listCart
  }

  // Increase quantity by one
  async increaseCartItemQuantity(userId: string, productId: string) {
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
      cart_status: CartStatus.Active,
      'cart_products.product_id': new ObjectId(productId)
    })

    if (!cart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.PRODUCT_NOT_IN_CART,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const cartItem = cart.cart_products.find((p) => p.product_id === new ObjectId(productId))
    const itemPrice = cartItem?.product_price || foundProduct.product_price
    return await this.cartRepo.updateUserCartQuantity(userId, {
      product: {
        product_id: productId,
        product_quantity: 1,
        product_price: itemPrice
      }
    })
  }

  // Decrease quantity by one
  async decreaseCartItemQuantity(userId: string, productId: string) {
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
      cart_status: CartStatus.Active,
      'cart_products.product_id': new ObjectId(productId)
    })

    if (!cart) {
      throw new ErrorWithStatus({
        message: CARTS_MESSAGES.PRODUCT_NOT_IN_CART,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const cartItem = cart.cart_products.find((p) => p.product_id.toString() === productId)
    if (!cartItem || (cartItem.product_quantity as number) <= 1) {
      // If quantity would become 0, remove the item
      return await this.deleteUserCart(userId, productId)
    }

    // Get the exact price from the cart item to ensure consistency
    const itemPrice = cartItem.product_price || foundProduct.product_price

    // Decrease by 1
    return await this.cartRepo.updateUserCartQuantity(userId, {
      product: {
        product_id: productId,
        product_quantity: -1,
        product_price: itemPrice
      }
    })
  }
}

const cartService = new CartService()
export default cartService
