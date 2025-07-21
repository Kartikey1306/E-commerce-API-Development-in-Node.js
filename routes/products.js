const express = require("express")
const Product = require("../models/Product")
const { authenticate, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build query
    const query = { isActive: true }

    if (category) {
      query.category = category
    }

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    if (search) {
      query.$text = { $search: search }
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .populate("createdBy", "name")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Product.countDocuments(query)

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      products,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("createdBy", "name")

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" })
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

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user.id,
    }

    const product = await Product.create(productData)
    await product.populate("createdBy", "name")

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

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

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Admin only)
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
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

// @route   GET /api/products/categories/list
// @desc    Get all product categories
// @access  Public
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await Product.distinct("category", { isActive: true })

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

module.exports = router
