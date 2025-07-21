const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { sequelize } = require("./config/database")
const { errorHandler } = require("./middleware/errorHandler")

const adminRoutes = require("./routes/admin")
const userRoutes = require("./routes/user")
const authRoutes = require("./routes/auth")

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/admin", adminRoutes)
app.use("/api/user", userRoutes)
app.use("/api/auth", authRoutes)

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "E-commerce API is running",
    timestamp: new Date().toISOString(),
  })
})

app.use(errorHandler)

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log("Database connected successfully")

    await sequelize.sync({ force: false })
    console.log("Database synchronized")

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error("Unable to start server:", error)
    process.exit(1)
  }
}

startServer()

module.exports = app
