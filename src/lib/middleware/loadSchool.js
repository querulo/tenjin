const { School } = require('../models')



module.exports = (req, res, next) => {
  School.read()
    .then(school => {
      req.school = res.locals.school = school
      next()
    })
    .catch(err => next(err))
}