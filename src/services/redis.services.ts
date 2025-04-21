import { createClient } from 'redis'
import { reserveInventory } from '~/models/repositories/inventory.repo'
import { envConfig } from '~/constants/config'


const REDIS_HOST = envConfig.redisHost || 'localhost'
const REDIS_PORT = envConfig.redisPort || '6379'
const REDIS_URL = envConfig.redisUrl || `redis://${REDIS_HOST}:${REDIS_PORT}`

console.log(`Attempting to connect to Redis at: ${REDIS_URL}`)

// Create a Redis client with the new API
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff with max of 10 seconds
      const delay = Math.min(retries * 50, 10000)
      console.log(`Redis reconnect attempt ${retries} with delay ${delay}ms`)
      return delay
    }
  }
})

// Handle Redis errors without crashing the application
redisClient.on('error', (err) => {
  console.error('Redis error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis client connected')
})

redisClient.on('ready', () => {
  console.log('Redis client ready')
})

// Connect to Redis with fallback mechanism
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

// Try to connect initially
connectRedis()

// Khi người dùng muốn đặt hàng
// Hàm acquiredLock: Cố gắng khóa một sản phẩm trước khi thực hiện thao tác
const acquiredLock = async (productId: string, quantity: number, cartId: string) => {
  // If Redis isn't connected, proceed without locking (fallback)
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
    // tạo một key, thằng nào nắm giữ được được thanh toán
    const result = await redisClient.setNX(keyLock, expireTime.toString())
    // nếu thằng nào nắm giữ được được thanh toán thì trả về true, nếu chưa ai giữ thì trả về false
    console.log('>>> result', result)
    if (result) {
      // thao tác với inventory
      const isReservation = await reserveInventory({
        productId,
        quantity,
        cartId
      })
      // Check if reservation was successful - MongoDB findOneAndUpdate returns a document if successful
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

// Hàm releaseLock: Giải phóng khóa sau khi hoàn thành thao tác
const releaseLock = async (keyLock: string) => {
  // If Redis isn't connected or no real lock was created, just return
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

export { acquiredLock, releaseLock }
