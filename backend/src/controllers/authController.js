const authService = require('../services/authService')

const respond = (response, data, status = 200) => response.status(status).json({ success: true, data })

exports.register = async (request, response, next) => {
  try { respond(response, await authService.register(request.body), 201) } catch (error) { next(error) }
}

exports.login = async (request, response, next) => {
  try { respond(response, await authService.login(request.body)) } catch (error) { next(error) }
}

exports.currentUser = async (request, response, next) => {
  try { respond(response, { user: await authService.getCurrentUser(request.auth.sub) }) } catch (error) { next(error) }
}
