const jwt = require('jsonwebtoken')
const AppError = require('../errors/AppError')
const { tokenSecret } = require('../services/authService')

module.exports = function requireAuth(request, _response, next) {
  const header = request.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return next(new AppError('Sign in to continue', 401, 'AUTHENTICATION_REQUIRED'))
  try {
    request.auth = jwt.verify(token, tokenSecret())
    return next()
  } catch {
    return next(new AppError('Your session is invalid or expired. Sign in again.', 401, 'INVALID_SESSION'))
  }
}
