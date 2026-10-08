const AppError = require('../errors/AppError')

module.exports = (...allowedRoles) => (request, _response, next) => {
  if (!request.auth || !allowedRoles.includes(request.auth.role)) {
    return next(new AppError('Your account does not have permission for this action', 403, 'ROLE_FORBIDDEN'))
  }
  return next()
}
