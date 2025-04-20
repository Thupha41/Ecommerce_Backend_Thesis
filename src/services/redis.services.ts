import redis from 'redis'
import { promisify } from 'util'
import { reserveInventory } from '~/models/repositories/inventory.repo'
const redisClient = redis.createClient()
const pexpire = promisify(redisClient.pExpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setNX).bind(redisClient)

//Khi người dùng muốn đặt hàng
//Hàm acquiredLock: Cố gắng khóa một sản phẩm trước khi thực hiện thao tác
const acquiredLock = async (productId: string, quantity: number, cartId: string) => {
  const keyLock = `lock_product_v2025_${productId}`
  const retryTimes = 10
  const expireTime = 3000

  for (let i = 0; i < retryTimes; i++) {
    //tạo một key, thằng nào nắm giữ được được thanh toán
    const result = await setnxAsync(keyLock, expireTime)
    //nếu thằng nào nắm giữ được được thanh toán thì trả về 0, nếu chưa ai giữ thì trả về 1
    console.log('>>> result', result)
    if (result === 1) {
      //thao tác với inventory
      const isReservation = await reserveInventory({
        productId,
        quantity,
        cartId
      })
      // Check if reservation was successful - MongoDB findOneAndUpdate returns a document if successful
      if (isReservation) {
        await pexpire(keyLock, expireTime)
        return keyLock
      }
      return null
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
}

//Hàm releaseLock: Giải phóng khóa sau khi hoàn thành thao tác
const releaseLock = async (keyLock: string) => {
  const delAsyncKey = promisify(redisClient.del).bind(redisClient)
  return await delAsyncKey(keyLock)
}

export { acquiredLock, releaseLock }
