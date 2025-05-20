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

  async createUserCart(userId: string) {
    const cart = await this.carts.insertOne({
      _id: new ObjectId(),
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active,
      cart_products: [],
      cart_count_product: 0,
      cart_total_price: 0,
      created_at: new Date(),
      updated_at: new Date()
    })
    if (!cart) {
      throw new ErrorWithStatus({
        message: 'Failed to create cart',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
    return cart
  }

  async updateUserCartQuantity(userId: string, { product }: AddToCartReqBody): Promise<WithId<Cart> | null | any> {
    const product_id = product.product_id
    const product_quantity = product.product_quantity || 0
    const product_price = product.product_price || 0

    //check product exist
    const foundProduct = await databaseService.productSPUs.findOne({ _id: new ObjectId(product_id) })
    if (!foundProduct) {
      throw new ErrorWithStatus({
        message: PRODUCTS_MESSAGES.PRODUCT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra variant
    let hasVariants = foundProduct.product_variations && foundProduct.product_variations.length > 0

    // Nếu có variant nhưng chưa có sku_id, cần trả về danh sách variants cho frontend hiển thị
    if (hasVariants && !product.sku_id) {
      // Lấy danh sách variants của sản phẩm
      const skus = await databaseService.productSKUs.find({
        product_id: new ObjectId(product.product_id),
        isDeleted: false
      }).toArray();

      return {
        requireVariantSelection: true,
        product: foundProduct,
        variants: foundProduct.product_variations,
        skus: skus
      }
    }

    // Chuyển đổi sku_id nếu có
    let sku_id = undefined
    let productThumb = foundProduct.product_thumb
    let variants = undefined
    let actualStock = 0

    // Nếu có sku_id, tức là người dùng đã chọn variant
    if (product.sku_id) {
      sku_id = new ObjectId(product.sku_id)

      // Lấy thông tin variant để cập nhật ảnh và thuộc tính
      const sku = await databaseService.productSKUs.findOne({ _id: sku_id })
      if (sku) {
        if (sku.sku_image) {
          productThumb = sku.sku_image
        }

        actualStock = sku.sku_stock;

        // Tạo thông tin variants nếu có
        if (sku.sku_tier_idx && foundProduct.product_variations) {
          variants = sku.sku_tier_idx.map((idx, i) => {
            const variation = foundProduct.product_variations[i];
            return {
              name: variation.name,
              value: variation.options[idx]
            };
          });
        }
      } else {
        throw new ErrorWithStatus({
          message: 'Product variant not found',
          status: HTTP_STATUS.NOT_FOUND
        });
      }
    } else {
      // Kiểm tra tồn kho tổng của sản phẩm
      const inventory = await databaseService.inventories.findOne({
        inventory_productId: new ObjectId(product_id)
      });

      if (!inventory) {
        throw new ErrorWithStatus({
          message: 'Product inventory not found',
          status: HTTP_STATUS.NOT_FOUND
        });
      }

      actualStock = inventory.inventory_stock;
      // actualStock = foundProduct.product_quantity
    }

    // Get current cart to check existing quantity
    const existingCart = await this.carts.findOne({
      cart_userId: new ObjectId(userId),
      cart_status: CartStatus.Active
    })

    // Tìm sản phẩm trong giỏ hàng hiện tại
    const existingProduct = existingCart?.cart_products.find(p => {
      if (sku_id) {
        // So sánh cả product_id và sku_id
        return p.product_id.toString() === product_id &&
          p.sku_id?.toString() === sku_id.toString();
      } else {
        // Chỉ so sánh product_id nếu không có variant
        return p.product_id.toString() === product_id && !p.sku_id;
      }
    });

    // Calculate the new total quantity after this update
    const currentQuantity = existingProduct?.product_quantity || 0
    const newTotalQuantity =
      product_quantity > 0
        ? currentQuantity + product_quantity // Adding more
        : Math.max(0, currentQuantity + product_quantity)

    // Kiểm tra tồn kho
    if (product_quantity > 0 && actualStock < newTotalQuantity) {
      throw new ErrorWithStatus({
        message: `Product is out of stock. Only ${actualStock} available.`,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    // Chuyển đổi chuỗi sang ObjectId
    const productWithObjectId = {
      ...product,
      product_id: new ObjectId(product.product_id),
      shopId: new ObjectId(product.shopId),
      product_thumb: productThumb,
      sku_id: sku_id,
      variants: variants
    }

    if (existingProduct) {
      // Update existing product quantity
      const updated = await this.carts.findOneAndUpdate(
        {
          _id: existingCart?._id,
          cart_userId: new ObjectId(userId),
          cart_status: CartStatus.Active,
          'cart_products.product_id': new ObjectId(product_id),
          ...(sku_id ? { 'cart_products.sku_id': sku_id } : {})
        },
        {
          $inc: {
            'cart_products.$.product_quantity': product_quantity,
            cart_count_product: product_quantity,
            cart_total_price: product_quantity * product_price
          },
          // Thêm cập nhật variants nếu cần
          ...(variants ? {
            $set: {
              'cart_products.$.variants': variants,
              'cart_products.$.product_thumb': productThumb
            }
          } : {})
        },
        { returnDocument: ReturnDocument.AFTER }
      )

      // Trả về thêm thông tin về sản phẩm đã cập nhật
      if (variants) {
        return {
          ...updated,
          updatedProduct: {
            product_id,
            sku_id,
            variants,
            product_thumb: productThumb,
            product_quantity: newTotalQuantity,
            product_price
          }
        }
      }

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

      // Trả về thêm thông tin về sản phẩm đã thêm
      if (variants) {
        return {
          ...updated,
          addedProduct: {
            ...productWithObjectId,
            variants
          }
        }
      }

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
