const { sequelize } = require("../config/database")
const User = require("./User")
const Category = require("./Category")
const Product = require("./Product")
const Order = require("./Order")
const OrderItem = require("./OrderItem")

Category.hasMany(Product, { foreignKey: "categoryId", as: "products" })
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" })

User.hasMany(Order, { foreignKey: "userId", as: "orders" })
Order.belongsTo(User, { foreignKey: "userId", as: "user" })

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" })
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" })

Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" })
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" })

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Order,
  OrderItem,
}
