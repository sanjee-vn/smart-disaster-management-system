const auth = require('../modules/auth/auth.service');
async function requireAuth(req, res, next) {
  const header = req.get('Authorization');
  const match = typeof header === 'string' && /^Bearer ([^\s]+)$/i.exec(header);
  if (!match) return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  try {
    const session = await auth.authenticate(match[1]);
    req.user = session.user;
    req.tokenId = session.tokenId;
    return next();
  } catch (error) {
    return res.status(error.status === 401 ? 401 : 503).json({ success: false, message: error.status === 401 ? error.message : 'Authentication is temporarily unavailable. Please try again.' });
  }
}
module.exports = requireAuth;
