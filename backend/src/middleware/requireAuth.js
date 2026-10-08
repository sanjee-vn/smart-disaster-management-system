const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");
const { tokenSecret, ROLES } = require("../services/authService");

module.exports = function requireAuth(request, _response, next) {
  const header = request.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next(new AppError("Sign in to continue", 401, "AUTHENTICATION_REQUIRED"));
  try {
    const claims = jwt.verify(token, tokenSecret());
    if (!claims.sub || !ROLES.includes(claims.role)) {
      return next(new AppError("Your session is invalid or expired. Sign in again.", 401, "INVALID_SESSION"));
    }
    request.auth = claims;
    return next();
  } catch {
    return next(new AppError("Your session is invalid or expired. Sign in again.", 401, "INVALID_SESSION"));
  }
};
