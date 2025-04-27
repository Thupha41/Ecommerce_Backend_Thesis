import { createClient } from 'redis';
import { envConfig } from '~/constants/config';

const redisClient = createClient({
    url: envConfig.redisUrl
});

// Xử lý sự kiện kết nối thành công
redisClient.on('connect', () => console.log('Redis client connected'));

// Xử lý sự kiện lỗi
redisClient.on('error', (err) => console.log('Redis client error', err));

// Kết nối đến Redis khi khởi động
(async () => {
    await redisClient.connect().catch(console.error);
})();

export default redisClient; 