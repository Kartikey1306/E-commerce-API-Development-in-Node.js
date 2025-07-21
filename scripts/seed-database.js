const { sequelize, User, Category, Product, Order, OrderItem } = require("../models")

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true })
    console.log("Database tables created")

    const admin = await User.create({
      name: "Admin User",
      email: "admin@ecommerce.com",
      password: "admin123",
      role: "admin",
      phone: "+1234567890",
      address: "123 Admin Street, Admin City, AC 12345",
    })

    const users = await User.bulkCreate([
      {
        name: "John Doe",
        email: "john@example.com",
        password: "user123",
        phone: "+1234567891",
        address: "456 User Avenue, User City, UC 54321",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "user123",
        phone: "+1234567892",
        address: "789 Customer Boulevard, Customer City, CC 67890",
      },
    ])

    console.log("Users created")

    const categories = await Category.bulkCreate([
      {
        name: "Electronics",
        description: "Electronic devices and gadgets",
      },
      {
        name: "Clothing",
        description: "Fashion and apparel",
      },
      {
        name: "Books",
        description: "Books and literature",
      },
      {
        name: "Home & Garden",
        description: "Home improvement and garden supplies",
      },
      {
        name: "Sports",
        description: "Sports equipment and accessories",
      },
    ])

    console.log("Categories created")

    const products = await Product.bulkCreate([
      {
        name: "iPhone 15 Pro",
        description: "Latest iPhone with advanced features and powerful performance.",
        price: 999.99,
        stock: 50,
        categoryId: categories[0].id,
        brand: "Apple",
        images: [{ url: "https://example.com/iphone15pro.jpg", alt: "iPhone 15 Pro" }],
        specifications: {
          "Screen Size": "6.1 inches",
          Storage: "128GB",
          Camera: "48MP",
          Battery: "3274mAh",
        },
      },
      {
        name: "Samsung Galaxy S24",
        description: "Premium Android smartphone with excellent camera and display.",
        price: 899.99,
        stock: 30,
        categoryId: categories[0].id,
        brand: "Samsung",
        images: [{ url: "https://example.com/galaxys24.jpg", alt: "Samsung Galaxy S24" }],
        specifications: {
          "Screen Size": "6.2 inches",
          Storage: "256GB",
          Camera: "50MP",
          Battery: "4000mAh",
        },
      },
      {
        name: "Nike Air Max 270",
        description: "Comfortable running shoes with excellent cushioning.",
        price: 150.0,
        stock: 100,
        categoryId: categories[1].id,
        brand: "Nike",
        images: [{ url: "https://example.com/airmax270.jpg", alt: "Nike Air Max 270" }],
        specifications: {
          Material: "Mesh and Synthetic",
          Sole: "Rubber",
          Weight: "300g",
          Type: "Running Shoes",
        },
      },
      {
        name: "The Great Gatsby",
        description: "Classic American novel by F. Scott Fitzgerald.",
        price: 12.99,
        stock: 200,
        categoryId: categories[2].id,
        brand: "Scribner",
        images: [{ url: "https://example.com/greatgatsby.jpg", alt: "The Great Gatsby Book Cover" }],
        specifications: {
          Pages: "180",
          Language: "English",
          Publisher: "Scribner",
          ISBN: "978-0-7432-7356-5",
        },
      },
      {
        name: "Coffee Maker Deluxe",
        description: "Premium coffee maker with programmable features.",
        price: 89.99,
        stock: 25,
        categoryId: categories[3].id,
        brand: "BrewMaster",
        images: [{ url: "https://example.com/coffeemaker.jpg", alt: "Coffee Maker Deluxe" }],
        specifications: {
          Capacity: "12 cups",
          Material: "Stainless Steel",
          Features: "Programmable, Auto-shutoff",
          Warranty: "2 years",
        },
      },
      {
        name: "Yoga Mat Pro",
        description: "High-quality yoga mat for all fitness levels.",
        price: 45.99,
        stock: 75,
        categoryId: categories[4].id,
        brand: "FitnessPro",
        images: [{ url: "https://example.com/yogamat.jpg", alt: "Yoga Mat Pro" }],
        specifications: {
          Material: "TPE",
          Thickness: "6mm",
          Size: "183cm x 61cm",
          Weight: "1.2kg",
        },
      },
    ])

    console.log("Products created")

    const order1 = await Order.create({
      userId: users[0].id,
      totalAmount: 1149.98,
      shippingAddress: "456 User Avenue, User City, UC 54321",
      paymentMethod: "credit_card",
      status: "confirmed",
      paymentStatus: "completed",
    })

    await OrderItem.bulkCreate([
      {
        orderId: order1.id,
        productId: products[0].id,
        quantity: 1,
        price: products[0].price,
        subtotal: products[0].price * 1,
      },
      {
        orderId: order1.id,
        productId: products[2].id,
        quantity: 1,
        price: products[2].price,
        subtotal: products[2].price * 1,
      },
    ])

    const order2 = await Order.create({
      userId: users[1].id,
      totalAmount: 938.97,
      shippingAddress: "789 Customer Boulevard, Customer City, CC 67890",
      paymentMethod: "paypal",
      status: "shipped",
      paymentStatus: "completed",
    })

    await OrderItem.bulkCreate([
      {
        orderId: order2.id,
        productId: products[1].id,
        quantity: 1,
        price: products[1].price,
        subtotal: products[1].price * 1,
      },
      {
        orderId: order2.id,
        productId: products[3].id,
        quantity: 3,
        price: products[3].price,
        subtotal: products[3].price * 3,
      },
    ])

    console.log("Orders created")

    console.log("\nDatabase seeded successfully!")
    console.log("\nAdmin Login Credentials:")
    console.log("Email: admin@ecommerce.com")
    console.log("Password: admin123")
    console.log("\nUser Login Credentials:")
    console.log("Email: john@example.com")
    console.log("Password: user123")
    console.log("\nEmail: jane@example.com")
    console.log("Password: user123")

    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
