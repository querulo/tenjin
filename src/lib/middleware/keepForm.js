const keepForm = (req, res, next) => {
  if (req.session.oldForm) {
    res.locals.oldForm = req.session.oldForm
    delete req.session.oldForm
  }

  res.keepForm = formData => req.session.oldForm = formData

  next()
}



module.exports = keepForm