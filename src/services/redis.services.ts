import { createClient } from 'redis'
import { reserveInventory } from '~/models/repositories/inventory.repo'
import { envConfig } from '~/constants/config'
import { ShopProductsCache } from '~/models/requests/shops.requests'
const REDIS_HOST = envConfig.redisHost || 'localhost'
const REDIS_PORT = envConfig.redisPort || '6379'
const REDIS_URL = envConfig.redisUrl || `redis://${REDIS_HOST}:${REDIS_PORT}`

console.log(`Attempting to connect to Redis at: ${REDIS_URL}`)

// Create a Redis client with the new API
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 50, 10000)
      console.log(`Redis reconnect attempt ${retries} with delay ${delay}ms`)
      return delay
    }
  }
})

redisClient.on('error', (err) => {
  console.error('Redis error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis client connected')
})

redisClient.on('ready', () => {
  console.log('Redis client ready')
})

let redisConnected = false

const connectRedis = async () => {
  if (!redisConnected) {
    try {
      await redisClient.connect()
      redisConnected = true
      console.log('Connected to Redis successfully')
    } catch (err) {
      console.error('Redis connection error:', err)
      console.log('Continuing without Redis - some features might be limited')
    }
  }
}

connectRedis()

// Khóa phân tán cho đặt hàng (giữ nguyên)
const acquiredLock = async (productId: string, quantity: number, cartId: string) => {
  if (!redisConnected) {
    console.log('Redis not connected, proceeding without lock')
    const isReservation = await reserveInventory({
      productId,
      quantity,
      cartId
    })
    return isReservation ? 'no_lock_needed' : null
  }

  const keyLock = `lock_product_v2025_${productId}`
  const retryTimes = 10
  const expireTime = 3000

  for (let i = 0; i < retryTimes; i++) {
    const result = await redisClient.setNX(keyLock, expireTime.toString())
    console.log('>>> result', result)
    if (result) {
      const isReservation = await reserveInventory({
        productId,
        quantity,
        cartId
      })
      if (isReservation) {
        await redisClient.pExpire(keyLock, expireTime)
        return keyLock
      }
      return null
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
}

const releaseLock = async (keyLock: string) => {
  if (!redisConnected || keyLock === 'no_lock_needed') {
    return true
  }

  try {
    return await redisClient.del(keyLock)
  } catch (err) {
    console.error('Error releasing lock:', err)
    return false
  }
}

// Thêm các hàm để quản lý thống kê
// Lưu trữ thống kê sản phẩm
const setProductStats = async (productId: string, stats: any) => {
  if (!redisConnected) {
    console.log('Redis not connected, cannot cache product stats')
    return
  }

  const key = `product:${productId}`
  try {
    await redisClient.hSet(key, stats)
    await redisClient.expire(key, 3600) // TTL 1 giờ
  } catch (err) {
    console.error('Error caching product stats:', err)
  }
}

// Lấy thống kê sản phẩm
const getProductStats = async (productId: string) => {
  if (!redisConnected) {
    console.log('Redis not connected, cannot retrieve product stats')
    return null
  }

  const key = `product:${productId}`
  try {
    const stats = await redisClient.hGetAll(key)
    if (Object.keys(stats).length === 0) return null
    return {
      total_reviews: parseInt(stats.total_reviews) || 0,
      reviews_by_rating: {
        1: parseInt(stats['reviews_by_rating:1']) || 0,
        2: parseInt(stats['reviews_by_rating:2']) || 0,
        3: parseInt(stats['reviews_by_rating:3']) || 0,
        4: parseInt(stats['reviews_by_rating:4']) || 0,
        5: parseInt(stats['reviews_by_rating:5']) || 0
      },
      reviews_with_media: parseInt(stats.reviews_with_media) || 0,
      total_media_count: parseInt(stats.total_media_count) || 0
    }
  } catch (err) {
    console.error('Error retrieving product stats:', err)
    return null
  }
}

// Lưu trữ thống kê shop
const setShopStats = async (shopId: string, stats: any) => {
  if (!redisConnected) {
    console.log('Redis not connected, cannot cache shop stats')
    return
  }

  const key = `shop:${shopId}`
  try {
    await redisClient.hSet(key, stats)
    await redisClient.expire(key, 3600) // TTL 1 giờ
  } catch (err) {
    console.error('Error caching shop stats:', err)
  }
}

// Lấy thống kê shop
const getShopStats = async (shopId: string) => {
  if (!redisConnected) {
    console.log('Redis not connected, cannot retrieve shop stats')
    return null
  }

  const key = `shop:${shopId}`
  try {
    const stats = await redisClient.hGetAll(key)
    if (Object.keys(stats).length === 0) return null
    return {
      total_reviews: parseInt(stats.total_reviews) || 0,
      shop_rating: parseFloat(stats.shop_rating) || 0,
      reviews_by_rating: {
        1: parseInt(stats['reviews_by_rating:1']) || 0,
        2: parseInt(stats['reviews_by_rating:2']) || 0,
        3: parseInt(stats['reviews_by_rating:3']) || 0,
        4: parseInt(stats['reviews_by_rating:4']) || 0,
        5: parseInt(stats['reviews_by_rating:5']) || 0
      },
      reviews_with_media: parseInt(stats.reviews_with_media) || 0,
      total_media_count: parseInt(stats.total_media_count) || 0
    }
  } catch (err) {
    console.error('Error retrieving shop stats:', err)
    return null
  }
}

const getShopProductsFromCache = async (
  shopId: string,
  sortBy: string,
  page?: number,
  limit?: number
): Promise<ShopProductsCache | null> => {
  if (!redisConnected) {
    console.log('Redis not connected, cannot retrieve shop products from cache')
    return null
  }

  const cacheKey = `products:shop:${shopId}:${sortBy}:${page || 1}:${limit || 20}`
  try {
    const cached = await redisClient.get(cacheKey)
    if (!cached) return null

    const parsedCache: ShopProductsCache = JSON.parse(cached)
    return parsedCache
  } catch (err) {
    console.error(`Error retrieving shop products from cache for key ${cacheKey}:`, err)
    return null
  }
}

// Hàm mới: Lưu danh sách sản phẩm của shop vào cache
const setShopProductsToCache = async (shopId: string, sortBy: string, data: any, page?: number, limit?: number) => {
  if (!redisConnected) {
    console.log('Redis not connected, cannot cache shop products')
    return
  }

  const cacheKey = `products:shop:${shopId}:${sortBy}:${page || 1}:${limit || 20}`
  try {
    await redisClient.setEx(cacheKey, 900, JSON.stringify(data)) // TTL 15 phút
    console.log(`Cached shop products for key: ${cacheKey}`)
  } catch (err) {
    console.error(`Error caching shop products for key ${cacheKey}:`, err)
  }
}

// Hàm xóa cache của shop khi dữ liệu thay đổi
const invalidateShopProductsCache = async (shopId: string) => {
  if (!redisConnected) {
    console.log('Redis not connected, cannot invalidate shop products cache')
    return
  }

  const pattern = `products:shop:${shopId}:*`
  try {
    // Sử dụng SCAN để xóa tất cả key khớp với pattern
    let cursor = '0'
    do {
      const { cursor: newCursor, keys } = await redisClient.scan(parseInt(cursor), { MATCH: pattern, COUNT: 100 })
      if (keys.length > 0) {
        const pipeline = redisClient.multi()
        keys.forEach((key) => pipeline.del(key))
        await pipeline.exec()
      }
      cursor = newCursor.toString()
    } while (cursor !== '0')
    console.log(`Invalidated cache for shop ${shopId}`)
  } catch (err) {
    console.error(`Error invalidating shop products cache for shop ${shopId}:`, err)
  }
}

export {
  acquiredLock,
  releaseLock,
  setProductStats,
  getProductStats,
  setShopStats,
  getShopStats,
  redisConnected,
  setShopProductsToCache,
  invalidateShopProductsCache,
  getShopProductsFromCache
}
