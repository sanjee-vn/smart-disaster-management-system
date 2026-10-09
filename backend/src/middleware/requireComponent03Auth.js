const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");
const staffAuth = require("../services/authService");
const mobileAuth = require("../modules/auth/auth.service");

const mobileRoleMap = {
  RESPONSE_OPERATIONS_OFFICER: "response_officer",
  DISTRICT_RESOURCE_COORDINATION_OFFICER: "district_resource_officer",
  STAFF_OFFICER: "staff_officer",
};

module.exports = async function requireComponent03Auth(request, _response, next) {
  const header = request.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next(new AppError("Sign in to continue", 401, "AUTHENTICATION_REQUIRED"));

  const unverified = jwt.decode(token);
  const isMobileSession = unverified?.iss === "disaster-connect"
    && (unverified?.aud === "disaster-connect-mobile"
      || (Array.isArray(unverified?.aud) && unverified.aud.includes("disaster-connect-mobile")));

  if (isMobileSession) {
    try {
      const session = await mobileAuth.authenticate(token);
      const role = mobileRoleMap[session.user.role];
      if (!role) return next(new AppError("Your account does not have permission for Component 03", 403, "ROLE_FORBIDDEN"));
      request.auth = { sub: session.user.id, role };
      request.user = session.user;
      request.tokenId = session.tokenId;
      return next();
    } catch (error) {
      if (error.status === 403) return next(error);
      if (error.status === 401) return next(new AppError("Your session is invalid or expired. Sign in again.", 401, "INVALID_SESSION"));
      return next(new AppError("Authentication is temporarily unavailable. Please try again.", 503, "AUTHENTICATION_UNAVAILABLE"));
    }
  }

  try {
    const claims = jwt.verify(token, staffAuth.tokenSecret(), { algorithms: ["HS256"] });
    if (claims.sub && staffAuth.ROLES.includes(claims.role)) {
      request.auth = claims;
      return next();
    }
  } catch {
    return next(new AppError("Your session is invalid or expired. Sign in again.", 401, "INVALID_SESSION"));
  }

  return next(new AppError("Your session is invalid or expired. Sign in again.", 401, "INVALID_SESSION"));
};
