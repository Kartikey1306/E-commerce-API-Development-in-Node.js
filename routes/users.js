const express = require("express")
const User = require("../models/User")
const { authenticate, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query

    const query = {}

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    if (role) {
      query.role = role
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      users,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin only)
router.get("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, email, role, phone, address, isActive } = req.body

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, phone, address, isActive },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   DELETE /api/users/:id
// @desc    Deactivate user
// @access  Private (Admin only)
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      message: "User deactivated successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   GET /api/users/stats/overview
// @desc    Get user statistics
// @access  Private (Admin only)
router.get("/stats/overview", authenticate, authorize("admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const adminUsers = await User.countDocuments({ role: "admin" })
    const regularUsers = await User.countDocuments({ role: "user" })

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    })

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers,
        recentRegistrations,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
