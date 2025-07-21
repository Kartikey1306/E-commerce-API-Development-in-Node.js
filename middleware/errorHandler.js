const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require("sequelize")

const errorHandler = (err, req, res, next) => {
  const error = { ...err }
  error.message = err.message

  console.error(err)

  if (err instanceof ValidationError) {
    const message = err.errors.map((e) => e.message).join(", ")
    return res.status(400).json({
      success: false,
      message: message,
    })
  }

  if (err instanceof UniqueConstraintError) {
    const message = "Duplicate field value entered"
    return res.status(400).json({
      success: false,
      message: message,
    })
  }

  if (err instanceof ForeignKeyConstraintError) {
    const message = "Invalid reference to related resource"
    return res.status(400).json({
      success: false,
      message: message,
    })
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    })
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
  })
}

module.exports = { errorHandler }
