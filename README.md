# ShopLaz E-Commerce Backend API

A robust, feature-rich e-commerce backend API built with Node.js, Express, TypeScript, and MongoDB.

## Overview

This API serves as the backend for an e-commerce platform, providing endpoints for user management, product management, cart functionality, order processing, shop management, and more. It is designed with a modular architecture and follows RESTful API principles.

## Features

- **User Management**
  - Authentication (JWT-based)
  - Registration and login
  - User profile management
  - Role-based access control

- **Product Management**
  - Multiple product categories (Electronics, Furniture, Clothing, Books, etc.)
  - Product creation, update, and deletion
  - Product categorization and search
  - Product SKU and SPU management
  - Inventory tracking

- **Shopping Features**
  - Cart management
  - Order processing
  - Discount and promotion system
  - Review and rating system
  - Delivery information management

- **Seller Management**
  - Shop creation and management
  - Seller profiles
  - Product listing for sellers

- **Security**
  - JWT authentication
  - Role-based access control
  - API rate limiting
  - CORS protection
  - Helmet security headers

## Tech Stack

<div align="center">
  
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
  
  ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
  ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
  ![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)
  
  ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
  ![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)
  ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

</div>

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (with MongoDB Atlas)
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Deployment**: Docker, PM2
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js (v20+)
- MongoDB
- Redis (optional, for caching)
- AWS Account (for S3 storage)

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ecommerce_Backend_Thesis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   
   Create the following environment files based on your environment:
   - `.env.development` - For development environment
   - `.env.staging` - For staging environment
   - `.env.production` - For production environment

   Use the following template:

   ```env
   # Server
   PORT=4000
   HOST=localhost

   # Database
   DB_NAME=your_database_name
   DB_USERNAME=your_username
   DB_PASSWORD=your_password

   # Collections
   DB_USERS_COLLECTION=users
   DB_PRODUCTS_COLLECTION=products
   DB_FOLLOWERS_COLLECTION=followers
   DB_ELECTRONICS_COLLECTION=electronics
   DB_FURNITURE_COLLECTION=furniture
   DB_CLOTHES_COLLECTION=clothes
   DB_INVENTORIES_COLLECTION=inventories
   DB_DISCOUNTS_COLLECTION=discounts
   DB_CARTS_COLLECTION=carts
   DB_SELLERS_COLLECTION=sellers
   DB_BOOKS_COLLECTION=books
   DB_ORDERS_COLLECTION=orders
   DB_DELIVERY_INFOS_COLLECTION=delivery_infos
   DB_STATIONERY_COLLECTION=stationery
   DB_SOUVENIRS_COLLECTION=souvenirs
   DB_KITCHENWARE_COLLECTION=kitchenware
   DB_INSTRUMENTS_COLLECTION=instruments
   DB_SHOPS_COLLECTION=shops
   DB_RESOURCES_COLLECTION=resources
   DB_ROLES_COLLECTION=roles
   DB_REVIEWS_COLLECTION=reviews
   DB_CATEGORIES_COLLECTION=categories
   DB_PRODUCT_SPUS_COLLECTION=product_spus
   DB_PRODUCT_SKUS_COLLECTION=product_skus
   DB_REFRESH_TOKENS_COLLECTION=refresh_tokens

   # JWT
   JWT_SECRET_ACCESS_TOKEN=your_access_token_secret
   JWT_SECRET_REFRESH_TOKEN=your_refresh_token_secret
   EMAIL_SECRET_TOKEN=your_email_verify_token_secret
   FORGOT_PASSWORD_TOKEN=your_forgot_password_token_secret
   REFRESH_TOKEN_EXPIRES_IN=7d
   ACCESS_TOKEN_EXPIRES_IN=15m
   EMAIL_VERIFY_TOKEN_EXPIRES_IN=7d
   FORGOT_PASSWORD_TOKEN_EXPIRES_IN=7d

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URL=your_redirect_url
   GOOGLE_APP_EMAIL=your_app_email
   GOOGLE_APP_PASSWORD=your_app_password

   # Client URLs
   CLIENT_URL=http://localhost:3000
   CHAT_SERVICE_URL=your_chat_service_url

   # AWS S3
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=your_aws_region
   S3_BUCKET_NAME=your_bucket_name

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_URL=redis://localhost:6379
   ```

4. **Run the application**

   Development mode:
   ```bash
   npm run dev
   ```

   Staging mode:
   ```bash
   npm run dev:stag
   ```

   Production mode:
   ```bash
   npm run dev:prod
   ```

## API Structure

<div align="center">
  <img src="https://img.shields.io/badge/API-RESTful-009688?style=for-the-badge&logo=api&logoColor=white" alt="RESTful API">
</div>

The API is structured into multiple modules:

- `/api/v1/users` - User management
- `/api/v1/products` - Product management
- `/api/v1/carts` - Cart management
- `/api/v1/orders` - Order management
- `/api/v1/sellers` - Seller management
- `/api/v1/shops` - Shop management
- `/api/v1/categories` - Category management
- `/api/v1/discounts` - Discount management
- `/api/v1/delivery-info` - Delivery information management
- `/api/v1/reviews` - Review management
- `/api/v1/resources` - Resource management (RBAC)
- `/api/v1/roles` - Role management (RBAC)

## Building for Production

```bash
npm run build
```

This will generate the compiled JavaScript code in the `dist` directory.

To start the production server:

```bash
npm run start:prod
```

## Docker Deployment

<div align="center">
  <img src="https://img.shields.io/badge/Docker-Container-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Container">
</div>

This application can be containerized using Docker.

### Building the Docker image

```bash
docker build -t e-commerce-thesis-api .
```

### Running the Docker container

```bash
docker run -p 4000:4000 e-commerce-thesis-api
```

## CI/CD Pipeline

<div align="center">
  <img src="https://img.shields.io/badge/CI/CD-Pipeline-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI/CD Pipeline">
</div>

This project uses GitHub Actions for CI/CD. The workflow:

1. Code is pushed to GitHub
2. GitHub Actions builds a Docker image
3. The image is pushed to Docker Hub
4. The server pulls the image and runs it

Check the `.github/workflows/docker-image.yml` file for details.

## MongoDB Schema Design

<div align="center">
  <img src="https://img.shields.io/badge/MongoDB-Schema-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Schema">
</div>

The application uses MongoDB with the following main collections:

- `users` - User information
- `products` - Base product information
- `product_spus` - Standard Product Unit information
- `product_skus` - Stock Keeping Unit information
- `orders` - Order information
- `carts` - Shopping cart information
- `shops` - Shop information
- `categories` - Product categories
- `reviews` - Product reviews
- `roles` and `resources` - For RBAC (Role-Based Access Control)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

<div align="center">
  <img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="ISC License">
</div>

This project is licensed under the ISC License.

## Author

<div align="center">
  <img src="https://img.shields.io/badge/Author-Thupha4141-FF5722?style=for-the-badge" alt="Thupha4141">
</div>

Thupha4141 