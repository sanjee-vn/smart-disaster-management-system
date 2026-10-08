const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const User = require('./auth.model');
const AuthSession = require('./auth.session');
const ISSUER = 'disaster-connect';
const AUDIENCE = 'disaster-connect-mobile';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const dummyHash = bcrypt.hashSync(randomUUID(), 12);

function authError(status, message) { return Object.assign(new Error(message), { status }); }
function assertAuthConfig() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
}
function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}
async function createSession(user) {
  assertAuthConfig();
  const tokenId = randomUUID();
  const token = jwt.sign({}, process.env.JWT_SECRET, { algorithm: 'HS256', subject: String(user._id), jwtid: tokenId, expiresIn: SESSION_SECONDS, issuer: ISSUER, audience: AUDIENCE });
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  await AuthSession.create({ tokenId, userId: user._id, expiresAt });
  return { token, expiresAt, user: publicUser(user) };
}
async function register(data) {
  assertAuthConfig();
  const passwordHash = await bcrypt.hash(data.password, 12);
  let user;
  try { user = await User.create({ name: data.name, email: data.email, passwordHash, role: 'CITIZEN' }); }
  catch (error) {
    if (error.code === 11000) throw authError(409, 'An account with this email already exists. Please log in.');
    throw error;
  }
  // Registration creates the account only; login separately establishes the session.
  return publicUser(user);
}
async function login(data) {
  assertAuthConfig();
  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  const matches = await bcrypt.compare(data.password, user?.passwordHash || dummyHash);
  if (!user || !matches) throw authError(401, 'Email or password is incorrect.');
  return createSession(user);
}
async function authenticate(token) {
  assertAuthConfig();
  let claims;
  try { claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE }); }
  catch { throw authError(401, 'Your session is invalid or expired. Please log in again.'); }
  if (!claims.jti || !mongoose.isValidObjectId(claims.sub)) throw authError(401, 'Invalid session.');
  const session = await AuthSession.findOne({ tokenId: claims.jti, userId: claims.sub, expiresAt: { $gt: new Date() } });
  if (!session) throw authError(401, 'Your session has ended. Please log in again.');
  const user = await User.findById(claims.sub);
  if (!user) throw authError(401, 'Your account is unavailable.');
  return { user: publicUser(user), tokenId: claims.jti };
}
async function logout(tokenId) { await AuthSession.deleteOne({ tokenId }); }
module.exports = { register, login, authenticate, logout, publicUser, assertAuthConfig };
