module.exports = (options = {}) => (req, res, next) => {
  let { param, model, errorMessage } = options

  try {
    const Model = require('../models')[model]

    let method = model === 'Course' ? 'readByIdOrSlug' : 'readById'

    Model[method](model === 'Course' ? req.params[param] : Number(req.params[param]))
      .then(record => {
        req[model.toLowerCase()] = record
        next()
      })
      .catch(err => {
        if (err.message === 'NO_MATCHES') return res.render(`error`, { title: errorMessage })
        next(err)
      })
  } catch (err) {
    next(err)
  }
}