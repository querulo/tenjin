const { mapRoles, validation } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { User } = require('../../../models')

const { body, validationResult } = require('express-validator')



const get = (req, res) => {

  if (res.locals.oldForm) {

    req.user = res.locals.oldForm

  } else {

    req.user = {
      username: '',
      firstname: '',
      lastname: '',
      nickname: '',
      email: '',
      website: '',
      publicinfo: '',
      active: true,
      role: 'student'
    }

  }

  res.render('admin/users/new', { user: req.user, title: 'New user' })
}



const postValidation =  validation.expVal.compose(
  validation.expVal.user,
  validation.expVal.userPassword,
  validation.expVal.userAdmin
)

const post = (req, res, next) => {

  let formDataToKeep = {
    username: req.body.username,
    tempFirstname: req.body.firstname,
    tempLastname: req.body.lastname,
    nickname: req.body.nickname,
    email: req.body.email,
    website: req.body.website,
    publicinfo: req.body.publicinfo,
    active: req.body.active === "true" ? true : false,
    role: req.body.role
  }

  // espress validator errors

  let errors = validationResult(req).array();
  if (errors.length) {
    let message = errors.shift().msg

    res.addFlash({ message, style: 'danger'})
    res.keepForm(formDataToKeep)
    return res.redirect(303, 'back')
  }

  // model validation and record creation

  let userData = {
      ...User.template(),
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      nickname: req.body.nickname,
      email: req.body.email,
      website: req.body.website,
      publicinfo: req.body.publicinfo,
      password: req.body.password,
      active: req.body.active === "true" ? true : false,
      role: req.body.role
    }

    User.create(userData)
      .then(() => res.redirect(303, '/admin/users'))
      .catch(err => {
        if (err.message === 'USERNAME_EXISTS') {
          res.addFlash({message: 'This username already exists', style: 'danger'})
          res.keepForm(formDataToKeep)
          return res.redirect(303, 'back')
        }
        if (err.message === 'EMAIL_EXISTS')  {
          res.addFlash({message: 'This email is already used', style: 'danger'})
          res.keepForm(formDataToKeep)
          return res.redirect(303, 'back')
        }
        next(err)
      })
}



module.exports = {
  get: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: noPermissions,
    admin: get
  }),

  post: [
    mapRoles({ admin: postValidation }),

    mapRoles({
      anon: goToSignin,
      student: noPermissions,
      teacher: noPermissions,
      admin: post
    })
  ]
}