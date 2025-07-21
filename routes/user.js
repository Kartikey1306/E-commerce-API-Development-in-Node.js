const express = require("express")
const { Op } = require("sequelize")
const { User, Category, Product, Order, OrderItem, sequelize } = require("../models")
const { authenticate } = require("../middleware/auth")

const router = express.Router()

router.get("/products", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query

    const whereClause = { isActive: true }

    if (search) {
      whereClause[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }]
    }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice) whereClause.price[Op.gte] = Number.parseFloat(minPrice)
      if (maxPrice) whereClause.price[Op.lte] = Number.parseFloat(maxPrice)
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: (page - 1) * limit,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
      attributes: { exclude: ["createdAt", "updatedAt"] },
    })

    res.json({
      success: true,
      count: products.rows.length,
      total: products.count,
      totalPages: Math.ceil(products.count / limit),
      currentPage: Number.parseInt(page),
      products: products.rows,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        isActive: true,
      },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    res.json({
      success: true,
      product,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "description"],
      include: [
        {
          model: Product,
          as: "products",
          attributes: ["id"],
          where: { isActive: true },
          required: false,
        },
      ],
    })

    res.json({
      success: true,
      categories,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.post("/orders", authenticate, async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      })
    }

    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction })

      if (!product || !product.isActive) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} not found or inactive`,
        })
      }

      if (product.stock < item.quantity) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        })
      }

      const subtotal = product.price * item.quantity
      totalAmount += subtotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal,
      })

      await product.update({ stock: product.stock - item.quantity }, { transaction })
    }

    const order = await Order.create(
      {
        userId: req.user.id,
        totalAmount,
        shippingAddress,
        paymentMethod,
        notes,
      },
      { transaction },
    )

    await OrderItem.bulkCreate(
      orderItems.map((item) => ({
        ...item,
        orderId: order.id,
      })),
      { transaction },
    )

    await transaction.commit()

    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
            },
          ],
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: completeOrder,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/orders", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const whereClause = { userId: req.user.id }
    if (status) {
      whereClause.status = status
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images", "price"],
              include: [
                {
                  model: Category,
                  as: "category",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    })

    res.json({
      success: true,
      count: orders.rows.length,
      total: orders.count,
      totalPages: Math.ceil(orders.count / limit),
      currentPage: Number.parseInt(page),
      orders: orders.rows,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/orders/:id", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images", "price", "description"],
              include: [
                {
                  model: Category,
                  as: "category",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      order,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.put("/orders/:id/cancel", authenticate, async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const order = await Order.findOne(
      {
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              {
                model: Product,
                as: "product",
              },
            ],
          },
        ],
      },
      { transaction },
    )

    if (!order) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot cancel delivered or already cancelled order",
      })
    }

    for (const item of order.items) {
      await item.product.update({ stock: item.product.stock + item.quantity }, { transaction })
    }

    await order.update({ status: "cancelled" }, { transaction })

    await transaction.commit()

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
