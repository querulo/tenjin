module.exports = (map) => {
  return (req, res, next) => {
    let role = req.loggedUser ? req.loggedUser.role : 'anon'

    // if the middleware for the role is not provided, next() will be called
    // (use this to mount conditional middleware, or, at the end of the chain, to give a 404)
    if (!map[role]) return next()

    // if the middleware is provided it will be called
    map[role](req, res, next)
  }
}