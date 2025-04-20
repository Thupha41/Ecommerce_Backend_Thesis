import express, { Request, Response, RequestHandler } from 'express'
import { envConfig, isProduction } from './constants/config'
import initApiRoute from './routes/api'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middleware'
import { initFolder } from './utils/file'
import helmet from 'helmet'
import cors, { CorsOptions } from 'cors'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
const PORT = envConfig.port
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
app.use(compression())
const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.clientUrl : '*'
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
