const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/StaffUser')
const AppError = require('../errors/AppError')

const ROLES = User.USER_ROLES
const tokenSecret = () => process.env.JWT_SECRET || 'local-development-secret-set-JWT_SECRET-before-deploying'
const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  district: user.district || '',
})
const issueToken = (user) => jwt.sign({ sub: String(user._id), role: user.role }, tokenSecret(), { expiresIn: '8h' })

async function register({ name, email, password, role, district = '' } = {}) {
  const normalizedName = String(name || '').trim()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (normalizedName.length < 2 || normalizedName.length > 100) throw new AppError('Enter your name (2 to 100 characters)', 400, 'INVALID_NAME')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new AppError('Enter a valid email address', 400, 'INVALID_EMAIL')
  if (typeof password !== 'string' || password.length < 8) throw new AppError('Password must contain at least 8 characters', 400, 'WEAK_PASSWORD')
  if (!ROLES.includes(role)) throw new AppError('Select a valid portal role', 400, 'INVALID_ROLE')
  if (role === 'district_officer' && !String(district).trim()) throw new AppError('Select a district for the District Officer account', 400, 'DISTRICT_REQUIRED')
  if (await User.exists({ email: normalizedEmail })) throw new AppError('An account already exists for this email', 409, 'EMAIL_ALREADY_REGISTERED')
  const user = await User.create({ name: normalizedName, email: normalizedEmail, password, role, district: String(district).trim() })
  return { user: publicUser(user), token: issueToken(user) }
}

async function login({ email, password, role } = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail || typeof password !== 'string' || !ROLES.includes(role)) {
    throw new AppError('Email, password and portal role are required', 400, 'LOGIN_FIELDS_REQUIRED')
  }
  const user = await User.findOne({ email: normalizedEmail }).select('+password')
  if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS')
  if (user.role !== role) throw new AppError('This account is registered for a different portal role', 403, 'ROLE_MISMATCH')
  return { user: publicUser(user), token: issueToken(user) }
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId)
  if (!user) throw new AppError('Account no longer exists', 401, 'ACCOUNT_NOT_FOUND')
  return publicUser(user)
}

module.exports = { register, login, getCurrentUser, ROLES, tokenSecret }
