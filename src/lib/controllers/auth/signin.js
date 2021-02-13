const { User } = require('../../models')
const { mapRoles, validation, csrf } = require('../../middleware')
const goToHome = require('./goToHome')

const { body, validationResult } = require('express-validator')



const get = (req, res) => {
  if (req.session.userId) res.redirect(303, '/')
  else res.render('signin', { title: 'Signin'})
}



const postValidation = validation.expVal.compose(
  body('email', 'The email or password are incorrect')
    .not().isEmpty()
    .isEmail()
    .normalizeEmail(),

  body('password', 'The email or password are incorrect')
    .not().isEmpty()
    .isLength({ min: 8 })
    .matches(/\d/)
    .matches(/\p{Ll}/u)
    .matches(/\p{Lu}/u)
)

const post = (req, res) => {
  // espress validator errors

  let errors = validationResult(req).array();
  if (errors.length) {
    let message = errors.shift().msg

    res.addFlash({ message, style: 'danger'})
    return res.redirect(303, '/signin')
  }

  // model validation

  User.authenticate(req.body.email, req.body.password)
    .then(user => {
      if (!user.active) {
        res.addFlash({message: 'Your account is temporarily banned', style: 'danger'})
        return res.redirect(303, '/signin')
      }

      req.session.userId = user.id
      return res.redirect(303, '/')
    })
    .catch(err => {
      if (err.message === 'WRONG_EMAIL' || err.message === 'WRONG_PASSWORD') {
        res.addFlash({message: 'The email or password are incorrect', style: 'danger'})
        return res.redirect(303, '/signin')
      }
      throw(err)
    })
}



module.exports = {
  get: [
    mapRoles({ anon: csrf }),

    mapRoles({
      anon: get,
      student: goToHome,
      teacher: goToHome,
      admin: goToHome
    })
  ],

  post: [
    mapRoles({ anon: csrf }),
    mapRoles({ anon: postValidation }),

    mapRoles({
      anon: post,
      student: goToHome,
      teacher: goToHome,
      admin: goToHome
    })
  ]
}