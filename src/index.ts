import express, { Request, Response, RequestHandler } from 'express'
import { envConfig, isProduction } from './constants/config'
import initApiRoute from './routes/api'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middleware'
import { initFolder } from './utils/file'
import helmet from 'helmet'
import cors, { CorsOptions } from 'cors'
import rateLimit from 'express-rate-limit'

const PORT = envConfig.port
const HOST = envConfig.host
const app = express()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
  // store: ... , // Use an external store for more precise rate limiting
})
app.use(limiter)

app.use(helmet())
// const corsOptions: CorsOptions = {
//   origin: isProduction ? envConfig.clientUrl : '*'
// }
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true)
    }

    const allowedOrigins = [
      envConfig.clientUrl,  // Your Expo URL from env
      /^exp:\/\/.*$/,       // Any Expo URL
      /^http:\/\/localhost:\d+$/,  // Local development
      envConfig.chatServiceUrl
    ]

    // Check if the origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin
      }
      // If it's a RegExp, test it
      return allowedOrigin.test(origin)
    })

    if (isAllowed) {
      return callback(null, true)
    }

    callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
//Init folder upload
initFolder()
// Parse JSON body to object
app.use(express.json())

// Initialize API Routes
initApiRoute(app)

// Validation and route
app.use(defaultErrorHandler)

// Connect to database
databaseService.connect()

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`)
})