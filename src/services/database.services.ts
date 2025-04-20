import { Db, MongoClient, Collection } from 'mongodb'
import { envConfig } from '../constants/config'
import User from '../models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import Product from '~/models/schemas/Products/Product.schema'
import Electronics from '~/models/schemas/Products/Electronic.schema'
import Furniture from '~/models/schemas/Products/Furniture.schema'
import Clothing from '~/models/schemas/Products/Clothing.schema'
import Inventory from '~/models/schemas/Inventory.schema'
import Discount from '~/models/schemas/Discount.schema'
import Cart from '~/models/schemas/Cart.schema'
import Seller from '~/models/schemas/Seller.schema'
import Book from '~/models/schemas/Products/Book.schema'

import Order from '~/models/schemas/Order.schema'
import DeliveryInfo from '~/models/schemas/DeliveryInfo.schema'

import Stationery from '~/models/schemas/Products/Stationery.schema'
import Souvenir from '~/models/schemas/Products/Souvenir.schema'
import Kitchenware from '~/models/schemas/Products/Kitchenware.schema'
import Instrument from '~/models/schemas/Products/Instrument.schema'

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@twitter-cluster.hzc1q.mongodb.net/?retryWrites=true&w=majority&appName=Twitter-Cluster`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.dbName)
  }
  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Error', error)
      throw error
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUsersCollection)
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection)
  }
  get products(): Collection<Product> {
    return this.db.collection(envConfig.dbProductsCollection)
  }
  get electronics(): Collection<Electronics> {
    return this.db.collection(envConfig.dbElectronicsCollection)
  }
  get furniture(): Collection<Furniture> {
    return this.db.collection(envConfig.dbFurnitureCollection)
  }
  get clothes(): Collection<Clothing> {
    return this.db.collection(envConfig.dbClothesCollection)
  }
  get inventories(): Collection<Inventory> {
    return this.db.collection(envConfig.dbInventoriesCollection)
  }
  get discounts(): Collection<Discount> {
    return this.db.collection(envConfig.dbDiscountsCollection)
  }
  get carts(): Collection<Cart> {
    return this.db.collection(envConfig.dbCartsCollection)
  }
  get sellers(): Collection<Seller> {
    return this.db.collection(envConfig.dbSellersCollection)
  }
  get books(): Collection<Book> {
    return this.db.collection(envConfig.dbBooksCollection)
  }

  get orders(): Collection<Order> {
    return this.db.collection(envConfig.dbOrdersCollection)
  }
  get deliveryInfos(): Collection<DeliveryInfo> {
    return this.db.collection(envConfig.dbDeliveryInfosCollection)
  }

  // Method to get the MongoDB client for transactions
  getMongoClient(): MongoClient {
    return this.client

  get stationery(): Collection<Stationery> {
    return this.db.collection(envConfig.dbStationeryCollection)
  }
  get souvenirs(): Collection<Souvenir> {
    return this.db.collection(envConfig.dbSouvenirsCollection)
  }
  get kitchenware(): Collection<Kitchenware> {
    return this.db.collection(envConfig.dbKitchenwareCollection)
  }
  get instruments(): Collection<Instrument> {
    return this.db.collection(envConfig.dbInstrumentsCollection)

  }
}
const databaseService = new DatabaseService()
export default databaseService
