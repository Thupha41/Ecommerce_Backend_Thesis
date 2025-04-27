import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
// import argv from 'minimist'

const env = process.env.NODE_ENV
console.log(`env: ${env}`)
const envFilename = `.env.${env}`
// const options = argv(process.argv.slice(2))

if (!env) {
  console.log(`Bạn chưa cung cấp biến môi trường NODE_ENV (ví dụ: development, production)`)
  console.log(`Phát hiện NODE_ENV = ${env}`)
  process.exit(1)
}
console.log(`Phát hiện NODE_ENV = ${env}, vì thế app sẽ dùng file môi trường là ${envFilename}`)
if (!fs.existsSync(path.resolve(envFilename))) {
  console.log(`Không tìm thấy file môi trường ${envFilename}`)
  console.log(`Lưu ý: App không dùng file .env, ví dụ môi trường là development thì app sẽ dùng file .env.development`)
  console.log(`Vui lòng tạo file ${envFilename} và tham khảo nội dung ở file .env.example`)
  process.exit(1)
}

config({
  // path: '.env'
  path: envFilename
  // path: options.env ? `.env.${options.env}` : '.env'
})

export const isProduction = env === 'production'

export const envConfig = {
  port: (process.env.PORT as unknown as number) || 4000,
  host: process.env.HOST as string,
  // database
  dbName: process.env.DB_NAME as string,
  dbUsername: process.env.DB_USERNAME as string,
  dbPassword: process.env.DB_PASSWORD as string,
  dbUsersCollection: process.env.DB_USERS_COLLECTION as string,
  dbProductsCollection: process.env.DB_PRODUCTS_COLLECTION as string,
  dbFollowersCollection: process.env.DB_FOLLOWERS_COLLECTION as string,
  dbElectronicsCollection: process.env.DB_ELECTRONICS_COLLECTION as string,
  dbFurnitureCollection: process.env.DB_FURNITURE_COLLECTION as string,
  dbClothesCollection: process.env.DB_CLOTHES_COLLECTION as string,
  dbInventoriesCollection: process.env.DB_INVENTORIES_COLLECTION as string,
  dbDiscountsCollection: process.env.DB_DISCOUNTS_COLLECTION as string,
  dbCartsCollection: process.env.DB_CARTS_COLLECTION as string,
  dbSellersCollection: process.env.DB_SELLERS_COLLECTION as string,
  dbBooksCollection: process.env.DB_BOOKS_COLLECTION as string,
  dbOrdersCollection: process.env.DB_ORDERS_COLLECTION as string,
  dbDeliveryInfosCollection: process.env.DB_DELIVERY_INFOS_COLLECTION as string,
  dbStationeryCollection: process.env.DB_STATIONERY_COLLECTION as string,
  dbSouvenirsCollection: process.env.DB_SOUVENIRS_COLLECTION as string,
  dbKitchenwareCollection: process.env.DB_KITCHENWARE_COLLECTION as string,
  dbInstrumentsCollection: process.env.DB_INSTRUMENTS_COLLECTION as string,
  dbShopsCollection: process.env.DB_SHOPS_COLLECTION as string,
  dbResourcesCollection: process.env.DB_RESOURCES_COLLECTION as string,
  dbRolesCollection: process.env.DB_ROLES_COLLECTION as string,
  // jwt authentication

  jwtSecretAccessToken: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  jwtSecretRefreshToken: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  jwtSecretEmailVerifyToken: process.env.EMAIL_SECRET_TOKEN as string,
  jwtSecretForgotPasswordToken: process.env.FORGOT_PASSWORD_TOKEN as string,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  dbRefreshTokensCollection: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
  emailVerifyTokenExpiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as string,
  forgotPasswordTokenExpiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as string,
  clientRedirectCallback: process.env.GOOGLE_REDIRECT_URL as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URL as string,
  googleAppEmail: process.env.GOOGLE_APP_EMAIL as string,
  googleAppPassword: process.env.GOOGLE_APP_PASSWORD as string,

  // client url
  clientUrl: process.env.CLIENT_URL as string,
  chatServiceUrl: process.env.CHAT_SERVICE_URL as string,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  awsRegion: process.env.AWS_REGION as string,
  s3BucketName: process.env.S3_BUCKET_NAME as string,

  // Redis configuration
  redisHost: process.env.REDIS_HOST as string,
  redisPort: process.env.REDIS_PORT as string,
  redisUrl: process.env.REDIS_URL as string
}
