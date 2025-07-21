const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const Product = require("../models/Product")
const Order = require("../models/Order")

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ecommerce", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Product.deleteMany({})
    await Order.deleteMany({})

    console.log("Cleared existing data")

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12)
    const admin = await User.create({
      name: "Admin User",
      email: "admin@ecommerce.com",
      password: adminPassword,
      role: "admin",
      phone: "+1234567890",
      address: {
        street: "123 Admin St",
        city: "Admin City",
        state: "AC",
        zipCode: "12345",
        country: "USA",
      },
    })

    // Create regular users
    const userPassword = await bcrypt.hash("user123", 12)
    const users = await User.create([
      {
        name: "John Doe",
        email: "john@example.com",
        password: userPassword,
        phone: "+1234567891",
        address: {
          street: "456 User Ave",
          city: "User City",
          state: "UC",
          zipCode: "54321",
          country: "USA",
        },
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: userPassword,
        phone: "+1234567892",
        address: {
          street: "789 Customer Blvd",
          city: "Customer City",
          state: "CC",
          zipCode: "67890",
          country: "USA",
        },
      },
    ])

    console.log("Created users")

    // Create sample products
    const products = await Product.create([
      {
        name: "iPhone 15 Pro",
        description: "Latest iPhone with advanced features and powerful performance.",
        price: 999.99,
        category: "electronics",
        brand: "Apple",
        stock: 50,
        images: [
          {
            url: "https://example.com/iphone15pro.jpg",
            alt: "iPhone 15 Pro",
          },
        ],
        specifications: {
          "Screen Size": "6.1 inches",
          Storage: "128GB",
          Camera: "48MP",
          Battery: "3274mAh",
        },
        ratings: {
          average: 4.8,
          count: 125,
        },
        createdBy: admin._id,
      },
      {
        name: "Samsung Galaxy S24",
        description: "Premium Android smartphone with excellent camera and display.",
        price: 899.99,
        category: "electronics",
        brand: "Samsung",
        stock: 30,
        images: [
          {
            url: "https://example.com/galaxys24.jpg",
            alt: "Samsung Galaxy S24",
          },
        ],
        specifications: {
          "Screen Size": "6.2 inches",
          Storage: "256GB",
          Camera: "50MP",
          Battery: "4000mAh",
        },
        ratings: {
          average: 4.6,
          count: 89,
        },
        createdBy: admin._id,
      },
      {
        name: "Nike Air Max 270",
        description: "Comfortable running shoes with excellent cushioning.",
        price: 150.0,
        category: "clothing",
        brand: "Nike",
        stock: 100,
        images: [
          {
            url: "https://example.com/airmax270.jpg",
            alt: "Nike Air Max 270",
          },
        ],
        specifications: {
          Material: "Mesh and Synthetic",
          Sole: "Rubber",
          Weight: "300g",
          Type: "Running Shoes",
        },
        ratings: {
          average: 4.4,
          count: 67,
        },
        createdBy: admin._id,
      },
      {
        name: "The Great Gatsby",
        description: "Classic American novel by F. Scott Fitzgerald.",
        price: 12.99,
        category: "books",
        brand: "Scribner",
        stock: 200,
        images: [
          {
            url: "https://example.com/greatgatsby.jpg",
            alt: "The Great Gatsby Book Cover",
          },
        ],
        specifications: {
          Pages: "180",
          Language: "English",
          Publisher: "Scribner",
          ISBN: "978-0-7432-7356-5",
        },
        ratings: {
          average: 4.2,
          count: 234,
        },
        createdBy: admin._id,
      },
      {
        name: "Coffee Maker Deluxe",
        description: "Premium coffee maker with programmable features.",
        price: 89.99,
        category: "home",
        brand: "BrewMaster",
        stock: 25,
        images: [
          {
            url: "https://example.com/coffeemaker.jpg",
            alt: "Coffee Maker Deluxe",
          },
        ],
        specifications: {
          Capacity: "12 cups",
          Material: "Stainless Steel",
          Features: "Programmable, Auto-shutoff",
          Warranty: "2 years",
        },
        ratings: {
          average: 4.3,
          count: 45,
        },
        createdBy: admin._id,
      },
    ])

    console.log("Created products")

    // Create sample orders
    const sampleOrders = await Order.create([
      {
        user: users[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 1,
            price: products[0].price,
          },
          {
            product: products[2]._id,
            quantity: 2,
            price: products[2].price,
          },
        ],
        shippingAddress: {
          street: "456 User Ave",
          city: "User City",
          state: "UC",
          zipCode: "54321",
          country: "USA",
        },
        paymentMethod: "credit_card",
        status: "confirmed",
        paymentStatus: "completed",
      },
      {
        user: users[1]._id,
        items: [
          {
            product: products[1]._id,
            quantity: 1,
            price: products[1].price,
          },
          {
            product: products[3]._id,
            quantity: 3,
            price: products[3].price,
          },
        ],
        shippingAddress: {
          street: "789 Customer Blvd",
          city: "Customer City",
          state: "CC",
          zipCode: "67890",
          country: "USA",
        },
        paymentMethod: "paypal",
        status: "shipped",
        paymentStatus: "completed",
      },
    ])

    console.log("Created orders")

    console.log("✅ Database seeded successfully!")
    console.log("\n📧 Admin Login:")
    console.log("Email: admin@ecommerce.com")
    console.log("Password: admin123")
    console.log("\n👤 User Login:")
    console.log("Email: john@example.com")
    console.log("Password: user123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

seedData()
