import databaseService from '../services/database.services'

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
  roles: databaseService.roles,
  resources: databaseService.resources,
  deliveryInfos: databaseService.deliveryInfos,
  refreshTokens: databaseService.refreshTokens
}

async function checkIndexes() {
  let client
  try {
    // Kết nối tới MongoDB
    await databaseService.connect()
    client = databaseService.getMongoClient()

    console.log('Checking existing indexes...')

    // Kiểm tra từng collection
    for (const [collectionName, collection] of Object.entries(collectionMap)) {
      try {
        const indexes = await collection.indexes()
        console.log(`\n=== ${collectionName} Indexes (${indexes.length}) ===`)

        indexes.forEach((idx: any, i: number) => {
          const keyStr = Object.entries(idx.key)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')

          const optionsStr = idx.unique
            ? 'unique: true'
            : idx.expireAfterSeconds !== undefined
              ? `expireAfterSeconds: ${idx.expireAfterSeconds}`
              : ''

          console.log(`${i + 1}. ${idx.name} - { ${keyStr} }${optionsStr ? ` (${optionsStr})` : ''}`)
        })
      } catch (err) {
        console.log(`\n=== ${collectionName} ===`)
        console.log(`Error: Collection does not exist or cannot be accessed`)
      }
    }

    console.log('\nIndex check completed')
  } catch (err) {
    console.error('Error during index check:', err)
  } finally {
    if (client) {
      await client.close()
      console.log('MongoDB connection closed')
      process.exit(0)
    }
  }
}

// Run the function
checkIndexes()
