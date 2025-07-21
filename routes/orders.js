const express = require("express")
const Order = require("../models/Order")
const Product = require("../models/Product")
const { authenticate, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post("/", authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" })
    }

    // Validate products and calculate total
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await Product.findById(item.product)

      if (!product || !product.isActive) {
        return res.status(400).json({
          message: `Product ${item.product} not found or inactive`,
        })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${product.name}`,
        })
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      })

      // Update product stock
      product.stock -= item.quantity
      await product.save()
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes,
    })

    await order.populate("items.product", "name images")
    await order.populate("user", "name email")

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   GET /api/orders
// @desc    Get user's orders or all orders (admin)
// @access  Private
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = {}

    // If not admin, only show user's orders
    if (req.user.role !== "admin") {
      query.user = req.user.id
    }

    if (status) {
      query.status = status
    }

    const orders = await Order.find(query)
      .populate("items.product", "name images price")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Order.countDocuments(query)

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get("/:id", authenticate, async (req, res) => {
  try {
    const query = { _id: req.params.id }

    // If not admin, only allow access to own orders
    if (req.user.role !== "admin") {
      query.user = req.user.id
    }

    const order = await Order.findOne(query)
      .populate("items.product", "name images price")
      .populate("user", "name email phone")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
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

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin only)
router.put("/:id/status", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { status, deliveryDate } = req.body

    const updateData = { status }
    if (status === "delivered" && deliveryDate) {
      updateData.deliveryDate = deliveryDate
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate("items.product", "name images price")
      .populate("user", "name email")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put("/:id/cancel", authenticate, async (req, res) => {
  try {
    const query = { _id: req.params.id }

    // If not admin, only allow canceling own orders
    if (req.user.role !== "admin") {
      query.user = req.user.id
    }

    const order = await Order.findOne(query).populate("items.product")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot cancel delivered or already cancelled order",
      })
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product._id)
      if (product) {
        product.stock += item.quantity
        await product.save()
      }
    }

    order.status = "cancelled"
    await order.save()

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
