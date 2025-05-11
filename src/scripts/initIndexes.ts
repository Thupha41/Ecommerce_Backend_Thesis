import databaseService from '../services/database.services'
import fs from 'fs'
import path from 'path'

interface IndexSpec {
  key: { [key: string]: number | string }
  options: { background: boolean; [key: string]: any }
  collection: string
  name: string
}

// Path để lưu trạng thái đã khởi tạo index
const INDEX_STATE_FILE = path.join(__dirname, '../../.index-state.json')

// Kiểm tra xem đã khởi tạo index chưa
function checkIndexState(): boolean {
  try {
    if (fs.existsSync(INDEX_STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(INDEX_STATE_FILE, 'utf8'))
      return data.initialized === true
    }
  } catch (err) {
    console.error('Error reading index state file:', err)
  }
  return false
}

// Lưu trạng thái đã khởi tạo index
function saveIndexState(): void {
  try {
    fs.writeFileSync(
      INDEX_STATE_FILE,
      JSON.stringify({
        initialized: true,
        timestamp: new Date().toISOString()
      })
    )
    console.log('Index state saved')
  } catch (err) {
    console.error('Error saving index state:', err)
  }
}

async function checkAndCreateIndex(
  collection: any,
  indexSpec: IndexSpec
): Promise<{ created: boolean; message: string }> {
  try {
    const existingIndexes = await collection.indexes()

    // Kiểm tra tên index
    const indexExistsByName = existingIndexes.some((idx: any) => idx.name === indexSpec.name)

    if (indexExistsByName) {
      return {
        created: false,
        message: `Index ${indexSpec.name} on ${indexSpec.collection} already exists`
      }
    }

    // Kiểm tra key và options
    const indexExists = existingIndexes.some((idx: any) => {
      // Kiểm tra key
      const keysMatch = Object.keys(indexSpec.key).every((key) => idx.key[key] === indexSpec.key[key])

      if (!keysMatch) return false

      // Nếu là unique index, kiểm tra thêm option unique
      if (indexSpec.options.unique && !idx.unique) return false

      return true
    })

    if (indexExists) {
      return {
        created: false,
        message: `Index with same keys on ${indexSpec.collection} already exists, skipping creation`
      }
    }

    await collection.createIndex(indexSpec.key, {
      ...indexSpec.options,
      name: indexSpec.name
    })
    return {
      created: true,
      message: `Created index ${indexSpec.name} on ${indexSpec.collection}`
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to process index ${indexSpec.name} on ${indexSpec.collection}: ${errorMessage}`)
  }
}

// Map collection names to databaseService properties
const collectionMap: Record<string, any> = {
  reviews: databaseService.reviews,
  products: databaseService.products,
  shops: databaseService.shops,
  orders: databaseService.orders,
  users: databaseService.users,
  carts: databaseService.carts,
  discounts: databaseService.discounts,
  inventories: databaseService.inventories,
  sellers: databaseService.sellers,
  roles: databaseService.roles,
  resources: databaseService.resources,
  deliveryInfos: databaseService.deliveryInfos,
  refreshTokens: databaseService.refreshTokens,
  followers: databaseService.followers
}

async function createIndexes(options: { force?: boolean } = {}) {
  // Kiểm tra xem đã khởi tạo index chưa, nếu có và không force thì bỏ qua
  if (checkIndexState() && !options.force) {
    console.log('Indexes have already been initialized. Use --force to reinitialize.')
    return {
      success: true,
      message: 'Indexes already initialized'
    }
  }

  let client
  try {
    // Kết nối tới MongoDB
    await databaseService.connect()
    client = databaseService.getMongoClient()

    // Danh sách các index cần tạo
    const indexes: IndexSpec[] = [
      // Reviews Indexes
      {
        key: { product_id: 1, status: 1 },
        options: { background: true },
        collection: 'reviews',
        name: 'reviews_product_status'
      },
      {
        key: { order_id: 1 },
        options: { background: true },
        collection: 'reviews',
        name: 'reviews_order'
      },
      {
        key: { user_id: 1, product_id: 1, order_id: 1 },
        options: { background: true, unique: true },
        collection: 'reviews',
        name: 'reviews_user_product_order_unique'
      },
      {
        key: { user_id: 1 },
        options: { background: true },
        collection: 'reviews',
        name: 'reviews_user'
      },
      {
        key: { created_at: -1 },
        options: { background: true },
        collection: 'reviews',
        name: 'reviews_created_at'
      },

      // Product Indexes
      {
        key: { product_shop: 1, isPublished: 1, isDeleted: 1 },
        options: { background: true },
        collection: 'product_spu',
        name: 'product_spu_shop_published_deleted'
      },
      {
        key: { product_shop: 1, isPublished: 1, isDeleted: 1, sold_quantity: -1 },
        options: { background: true },
        collection: 'product_spu',
        name: 'product_spu_shop_published_deleted_sold_quantity'
      },
      {
        key: { product_shop: 1, isPublished: 1, isDeleted: 1, created_at: -1 },
        options: { background: true },
        collection: 'product_spu',
        name: 'product_spu_shop_published_deleted_created_at'
      },
      {
        key: { product_shop: 1, isPublished: 1, isDeleted: 1, product_price: 1 },
        options: { background: true },
        collection: 'product_spu',
        name: 'product_spu_shop_published_deleted_price_asc'
      },
      {
        key: { product_shop: 1, isPublished: 1, isDeleted: 1, product_price: -1 },
        options: { background: true },
        collection: 'product_spu',
        name: 'product_spu_shop_published_deleted_price_desc'
      },
      {
        key: { product_slug: 1 },
        options: { background: true, unique: true },
        collection: 'product_spu',
        name: 'product_spu_slug_unique'
      },

      // Orders Indexes
      {
        key: { order_userId: 1 },
        options: { background: true },
        collection: 'orders',
        name: 'orders_user'
      },
      {
        key: { order_status: 1 },
        options: { background: true },
        collection: 'orders',
        name: 'orders_status'
      },
      {
        key: { order_userId: 1, order_status: 1 },
        options: { background: true },
        collection: 'orders',
        name: 'orders_user_status'
      },
      {
        key: { order_createdAt: -1 },
        options: { background: true },
        collection: 'orders',
        name: 'orders_created_at'
      },

      // Users Indexes
      {
        key: { email: 1 },
        options: { background: true, unique: true },
        collection: 'users',
        name: 'users_email_unique'
      },
      {
        key: { role_ids: 1 },
        options: { background: true },
        collection: 'users',
        name: 'users_roles'
      },
      {
        key: { is_seller: 1 },
        options: { background: true },
        collection: 'users',
        name: 'users_is_seller'
      },
      {
        key: { verify: 1 },
        options: { background: true },
        collection: 'users',
        name: 'users_verify'
      },

      // Carts Indexes
      {
        key: { cart_userId: 1 },
        options: { background: true, unique: true },
        collection: 'carts',
        name: 'carts_user_unique'
      },
      {
        key: { cart_status: 1 },
        options: { background: true },
        collection: 'carts',
        name: 'carts_status'
      },

      // Discounts Indexes
      {
        key: { discount_code: 1 },
        options: { background: true, unique: true },
        collection: 'discounts',
        name: 'discounts_code_unique'
      },
      {
        key: { discount_shopId: 1 },
        options: { background: true },
        collection: 'discounts',
        name: 'discounts_shop'
      },
      {
        key: { discount_start_date: 1, discount_end_date: 1 },
        options: { background: true },
        collection: 'discounts',
        name: 'discounts_date_range'
      },

      // Inventories Indexes
      {
        key: { inven_productId: 1 },
        options: { background: true, unique: true },
        collection: 'inventories',
        name: 'inventories_product_unique'
      },
      {
        key: { inven_location: 1 },
        options: { background: true },
        collection: 'inventories',
        name: 'inventories_location'
      },

      // Shops Indexes
      {
        key: { shop_owner: 1 },
        options: { background: true, unique: true },
        collection: 'shops',
        name: 'shops_owner_unique'
      },
      {
        key: { shop_name: 1 },
        options: { background: true, unique: true },
        collection: 'shops',
        name: 'shops_name_unique'
      },
      {
        key: { shop_status: 1 },
        options: { background: true },
        collection: 'shops',
        name: 'shops_status'
      },

      // Roles and Resources Indexes
      {
        key: { role_name: 1 },
        options: { background: true, unique: true },
        collection: 'roles',
        name: 'roles_name_unique'
      },
      {
        key: { resource_name: 1 },
        options: { background: true, unique: true },
        collection: 'resources',
        name: 'resources_name_unique'
      },

      // DeliveryInfo Indexes
      {
        key: { user_id: 1 },
        options: { background: true },
        collection: 'deliveryInfos',
        name: 'delivery_info_user'
      },
      {
        key: { is_default: 1 },
        options: { background: true },
        collection: 'deliveryInfos',
        name: 'delivery_info_default'
      },

      // RefreshTokens Indexes
      {
        key: { token: 1 },
        options: { background: true, unique: true },
        collection: 'refreshTokens',
        name: 'tokens_unique'
      },
      {
        key: { user_id: 1 },
        options: { background: true },
        collection: 'refreshTokens',
        name: 'tokens_user'
      },
      {
        key: { expires: 1 },
        options: { background: true, expireAfterSeconds: 0 },
        collection: 'refreshTokens',
        name: 'tokens_ttl'
      },
      //category indexes
      {
        key: { parent_id: 1 },
        options: { background: true },
        collection: 'categories',
        name: 'categories_parentId'
      },
      {
        key: { level: 1 },
        options: { background: true },
        collection: 'categories',
        name: 'categories_level'
      },
      {
        key: { category_slug: 1 },
        options: { background: true },
        collection: 'categories',
        name: 'categories_slug'
      },
      {
        key: { category_path: 1 },
        options: { background: true },
        collection: 'categories',
        name: 'categories_categoryPath'
      },
      {
        key: { category_name: 'text' },
        options: { background: true },
        collection: 'categories',
        name: 'categories_text_search'
      }
    ]

    // Kiểm tra và tạo từng index
    const results = []
    for (const indexSpec of indexes) {
      const collection = collectionMap[indexSpec.collection]
      if (!collection) {
        console.warn(`Collection ${indexSpec.collection} not found in database service`)
        continue
      }
      try {
        const result = await checkAndCreateIndex(collection, indexSpec)
        results.push(result)
        console.log(result.message)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Error creating index ${indexSpec.name} on ${indexSpec.collection}:`, errorMessage)
        // Continue with other indexes instead of exiting
        continue
      }
    }

    // Ghi log tóm tắt
    const createdCount = results.filter((r) => r.created).length
    console.log(
      `Index creation completed: ${createdCount} indexes created, ${results.length - createdCount} indexes already exist`
    )

    // Lưu trạng thái đã khởi tạo
    saveIndexState()

    return {
      success: true,
      created: createdCount,
      skipped: results.length - createdCount
    }
  } catch (err) {
    console.error('Error during index creation:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }
  } finally {
    // Không đóng kết nối nếu được gọi từ ứng dụng chính
    if (client && require.main === module) {
      await client.close()
      console.log('MongoDB connection closed')
      // Only exit if script is run directly
      process.exit(0)
    }
  }
}

// Kiểm tra có tham số --force không
let forceInit = false
if (process.argv.includes('--force')) {
  forceInit = true
  console.log('Force index initialization')
}

// Chỉ gọi hàm nếu script được chạy trực tiếp, không gọi khi import
if (require.main === module) {
  createIndexes({ force: forceInit })
}

// Export hàm để có thể gọi từ bên ngoài
export default createIndexes
