const { mapRoles, validation } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { User } = require('../../../models')

const { body, validationResult } = require('express-validator')



const get = (req, res) => {
  if (res.locals.oldForm) {
    req.user = {
      ...req.user,
      ...res.locals.oldForm
    }
  }

  res.render('admin/users/edit', { user: req.user })
}



const postValidation = validation.expVal.compose(
  validation.expVal.user,
  validation.expVal.userNewPass,
  validation.expVal.userAdmin
)

const post = (req, res, next) => {

  let formDataToKeep = {
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
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

  // model validation and updating

  let changes = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      nickname: req.body.nickname,
      email: req.body.email,
      website: req.body.website,
      publicinfo: req.body.publicinfo,
      active: req.body.active === "true" ? true : false,
      role: req.body.role
    }
  
    let hash = false
    if (req.body.newpass) {
      hash = true
      changes.password = req.body.newpass
    }
  
    User.updateById(req.user.id, changes, hash)
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