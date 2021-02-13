module.exports = (req, res, next) => {
  if (!req.session.userId && req.session.userId !== 0) return next()

  const User = require('../models').User

  User.readById(req.session.userId)
    .then(user => {
      if (!user.active) {
        delete req.session.userId
        return res.render('error', { title: "Your account has been temporarily banned" })
      }

      req.loggedUser = res.locals.loggedUser = user
      next()
    })
    .catch(err => {
      if (err.message === 'NO_MATCHES') {
        delete req.session.userId
        next()
      }
    })
}