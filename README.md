# E-commerce API

A comprehensive RESTful API for an e-commerce platform built with Node.js, Express, Sequelize ORM, and PostgreSQL database with JWT authentication.

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing with bcrypt
- Protected routes with middleware

### Admin Features
- Admin Login
- Category Management (Add, Update, Delete, List)
- Product Management (Add, Update, Delete, List)
- Sales Reports (Sales by category, Top-selling products, Worst-selling products)

### User Features
- User Registration & Login
- Product Browsing (View all products with filtering and search)
- Single Product View
- Order Management (Place orders with multiple products)
- Order History

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Admin APIs
- `POST /api/admin/login` - Admin login
- `GET /api/admin/categories` - List all categories
- `POST /api/admin/categories` - Create new category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/reports/sales-by-category` - Sales by category
- `GET /api/admin/reports/top-selling-products` - Top-selling products
- `GET /api/admin/reports/worst-selling-products` - Worst-selling products

### User APIs
- `GET /api/user/products` - View all products
- `GET /api/user/products/:id` - View single product
- `GET /api/user/categories` - View all categories
- `POST /api/user/orders` - Place new order
- `GET /api/user/orders` - View order history
- `GET /api/user/orders/:id` - View single order
- `PUT /api/user/orders/:id/cancel` - Cancel order

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Copy `.env.example` to `.env` and configure your environment variables
5. Seed the database: `npm run seed`
6. Start the server: `npm run dev`

## Environment Variables

Create a `.env` file with the following variables:

\`\`\`env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
\`\`\`

## Database Schema

### Tables
- users: User accounts with role-based access
- categories: Product categories
- products: Product catalog with specifications
- orders: Customer orders
- order_items: Individual items within orders

### Relationships
- Users have many Orders
- Categories have many Products
- Orders have many OrderItems
- Products have many OrderItems

## Authentication

Include JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Response Format

All API responses follow this consistent format:
\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
\`\`\`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based authorization
- Input validation with Sequelize
- SQL injection prevention
- Comprehensive error handling
