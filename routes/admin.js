const express = require("express")
const { Op } = require("sequelize")
const { User, Category, Product, Order, OrderItem, sequelize } = require("../models")
const { authenticate, authorize } = require("../middleware/auth")
const { generateToken } = require("../utils/jwt")

const router = express.Router()

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    const admin = await User.findOne({
      where: {
        email,
        role: "admin",
        isActive: true,
      },
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    const isPasswordValid = await admin.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    const token = generateToken(admin.id)

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/categories", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query

    const whereClause = {}
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` }
    }

    const categories = await Category.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Product,
          as: "products",
          attributes: ["id"],
          required: false,
        },
      ],
    })

    res.json({
      success: true,
      count: categories.rows.length,
      total: categories.count,
      totalPages: Math.ceil(categories.count / limit),
      currentPage: Number.parseInt(page),
      categories: categories.rows,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.post("/categories", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, description } = req.body

    const category = await Category.create({
      name,
      description,
    })

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

router.put("/categories/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, description, isActive } = req.body

    const [updatedRowsCount] = await Category.update({ name, description, isActive }, { where: { id: req.params.id } })

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    const category = await Category.findByPk(req.params.id)

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

router.delete("/categories/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const deletedRowsCount = await Category.destroy({
      where: { id: req.params.id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/products", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query

    const whereClause = {}
    if (search) {
      whereClause[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }]
    }
    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
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

router.post("/products", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, description, price, stock, categoryId, brand, images, specifications } = req.body

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      categoryId,
      brand,
      images,
      specifications,
    })

    const productWithCategory = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: productWithCategory,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

router.put("/products/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, description, price, stock, categoryId, brand, images, specifications, isActive } = req.body

    const [updatedRowsCount] = await Product.update(
      { name, description, price, stock, categoryId, brand, images, specifications, isActive },
      { where: { id: req.params.id } },
    )

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    })

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

router.delete("/products/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const deletedRowsCount = await Product.destroy({
      where: { id: req.params.id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/reports/sales-by-category", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    let dateFilter = ""
    if (startDate && endDate) {
      dateFilter = `AND o."createdAt" BETWEEN '${startDate}' AND '${endDate}'`
    }

    const salesByCategory = await sequelize.query(
      `
      SELECT 
        c.id,
        c.name as category_name,
        COUNT(oi.id) as total_items_sold,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p."categoryId"
      LEFT JOIN order_items oi ON p.id = oi."productId"
      LEFT JOIN orders o ON oi."orderId" = o.id
      WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )

    res.json({
      success: true,
      message: "Sales report by category retrieved successfully",
      data: salesByCategory,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/reports/top-selling-products", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query

    let dateFilter = ""
    if (startDate && endDate) {
      dateFilter = `AND o."createdAt" BETWEEN '${startDate}' AND '${endDate}'`
    }

    const topSellingProducts = await sequelize.query(
      `
      SELECT 
        p.id,
        p.name as product_name,
        p.price,
        c.name as category_name,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi."orderId") as total_orders
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN order_items oi ON p.id = oi."productId"
      LEFT JOIN orders o ON oi."orderId" = o.id
      WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ${dateFilter}
      GROUP BY p.id, p.name, p.price, c.name
      ORDER BY total_quantity_sold DESC
      LIMIT ${limit}
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )

    res.json({
      success: true,
      message: "Top selling products retrieved successfully",
      data: topSellingProducts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

router.get("/reports/worst-selling-products", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query

    let dateFilter = ""
    if (startDate && endDate) {
      dateFilter = `AND o."createdAt" BETWEEN '${startDate}' AND '${endDate}'`
    }

    const worstSellingProducts = await sequelize.query(
      `
      SELECT 
        p.id,
        p.name as product_name,
        p.price,
        p.stock,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue,
        COUNT(DISTINCT oi."orderId") as total_orders
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN order_items oi ON p.id = oi."productId"
      LEFT JOIN orders o ON oi."orderId" = o.id AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ${dateFilter}
      WHERE p."isActive" = true
      GROUP BY p.id, p.name, p.price, p.stock, c.name
      ORDER BY total_quantity_sold ASC, p.stock DESC
      LIMIT ${limit}
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )

    res.json({
      success: true,
      message: "Worst selling products retrieved successfully",
      data: worstSellingProducts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
