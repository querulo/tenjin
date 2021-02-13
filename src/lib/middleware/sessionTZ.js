module.exports = (req, res, next) => {
  if (req.session.tz) {                       // tz already in session
    res.locals.knownTZ = true
    next()
  } else if (req.query.tz) {                  // tz in QS
    let tz = req.query.tz.split('~').join('/')
    req.session.tz = tz
    res.redirect(303, 'back')
  } else {                                    // tz not known yet
    res.locals.url = req.originalUrl
    next()
  }
}