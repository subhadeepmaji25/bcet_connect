// backend/src/shared/middlewares/roleMiddleware.js

const ApiError = require("../errors/ApiError");

/**
 * Usage: allowRoles("admin", "faculty")
 * Route pe: authMiddleware, allowRoles("admin"), controller
 */
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(
        `Access denied. Required role: ${roles.join(" or ")}`
      )
    );
  }
  next();
};

module.exports = { allowRoles };