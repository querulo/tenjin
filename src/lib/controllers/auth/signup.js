const { User } = require('../../models')
const { mapRoles, validation } = require('../../middleware')
const goToHome = require('./goToHome')

const { body, validationResult } = require('express-validator')



const get = (req, res) => {
  if (req.session.auth) res.redirect(303, '/')
  else res.render('signup', { title: 'Signup'})
}



const postValidation = validation.expVal.compose(
  validation.expVal.user,
  validation.expVal.userPassword
)

const post = (req, res, next) => {
  let formDataToKeep = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username,
    nickname: req.body.nickname,
    email: req.body.email
  }

  // espress validator errors

  let errors = validationResult(req).array();
  if (errors.length) {
    let message = errors.shift().msg

    res.addFlash({ message, style: 'danger'})
    res.keepForm(formDataToKeep)
    return res.redirect(303, '/signup')
  }

  // custom validation (confirm password)

  if (req.body.password !== req.body.confirmPassword) {
    res.addFlash({message: "The two passwords don't match", style: 'danger'})
    res.keepForm(formDataToKeep)
    return res.redirect(303, '/signup')
  }

  // model validation

  User.alreadyExists(req.body.username, req.body.email)
    .then(() => User.create({
      ...User.template(),
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      nickname: req.body.nickname,
      email: req.body.email,
      password: req.body.password
    }))
    .then(user => {
      req.session.userId = user.id
      res.redirect(303, '/')
    })
    .catch(err => {
      if (err.message === 'USERNAME_EXISTS') {
        res.addFlash({message: 'This username already exists', style: 'danger'})
        res.keepForm(formDataToKeep)
        return res.redirect(303, '/signup')
      }
      if (err.message === 'EMAIL_EXISTS')  {
        res.addFlash({message: 'This email is already used', style: 'danger'})
        res.keepForm(formDataToKeep)
        return res.redirect(303, '/signup')
      }
      next(err)
    })
}  



module.exports = {
  get: mapRoles({
    anon: get,
    student: goToHome,
    teacher: goToHome,
    admin: goToHome
  }),

  post: [
    mapRoles({ anon: postValidation }),

    mapRoles({
      anon: post,
      student: goToHome,
      teacher: goToHome,
      admin: goToHome
    })
  ]
}