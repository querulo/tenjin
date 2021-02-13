const crypto = require('crypto')



// this middleware protects from CSRF (it's based on the 'csrf' and 'csurf' modules)
// (i don't know wether is right, or there are problems... i tried...)

// if you mount it on a GET route, it puts a salt + a token in locals as "csrf"
// if you mount it on a POST rout, it checks if the field body.csrf is correct
// (to calculate the token it creates an hash with a secret (stored in the session) and the salt)

// PER ORA L'HO MESSO SOLO SU SIGNIN...



function hash(str) {
  return crypto
    .createHash('sha1')
    .update(str, 'ascii')
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '')
    .replace(/\//g, '')
}



module.exports = (req, res, next) => {

  if (req.method === 'GET') {

    if (!req.session.csrfSecret) { 
      let secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      req.session.csrfSecret = secret
    
    }

    let salt = Math.random().toString(36).slice(2)
    let token = hash(req.session.csrfSecret + salt)
    let saltAndToken = salt + '-' + token

    res.locals.csrf = saltAndToken

    next()

  } else if (req.method === 'POST') {

    if (!req.session.csrfSecret) return res.render('error', { title: "Invalid POST request" })
    if (!req.body.csrf) return res.render('error', { title: "Invalid POST request" })

    let saltAndToken = req.body.csrf
    let index = saltAndToken.indexOf('-')
    let salt = saltAndToken.substr(0, index)
    let token = saltAndToken.substr(index + 1)

    let recalculatedToken = hash(req.session.csrfSecret + salt)

    if (recalculatedToken !== token) return res.render('error', { title: "Invalid POST request" })

    next()

  }
}