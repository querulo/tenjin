const express = require('express')

const { paramToRecord } = require('../lib/middleware')

const idToUser = paramToRecord({
  param: 'id',
  model: 'User',
  errorMessage: "The user you're looking for doesn't exist"
})

const user_idToUser = paramToRecord({
  param: 'user_id',
  model: 'User',
  errorMessage: "The user you're looking for doesn't exist"
})

const idOrSlugToCourse = paramToRecord({
  param: 'idOrSlug',
  model: 'Course',
  errorMessage: "The course you're looking for doesn't exist"
})



module.exports = controller => {
  const router = express.Router()



  router.route('/school-settings')
    .get(controller.schoolSettings.get)
    .post(controller.schoolSettings.post)



  router.get('/users', controller.users.management)

  router.get('/users/:id/remove', idToUser, controller.users.remove)

  router.get('/users/:id/ban', idToUser, controller.users.ban)

  router.get('/users/:id/unban', idToUser, controller.users.unban)

  router.route('/users/:id/edit')
    .get(idToUser, controller.users.edit.get)
    .post(idToUser, controller.users.edit.post)

  router.route('/users/new')
    .get(controller.users.newU.get)
    .post(controller.users.newU.post)



  router.get('/courses', controller.courses.management)

  router.get('/courses/:idOrSlug/remove', idOrSlugToCourse, controller.courses.remove)

  router.get('/courses/:idOrSlug/deactivate', idOrSlugToCourse, controller.courses.deactivate)
  router.get('/courses/:idOrSlug/activate', idOrSlugToCourse, controller.courses.activate)

  router.get('/courses/:idOrSlug/move/:action', idOrSlugToCourse, controller.courses.move)

  router.route('/courses/:idOrSlug/edit')
    .get(idOrSlugToCourse, controller.courses.edit.get)
    .post(idOrSlugToCourse, controller.courses.edit.post)

  router.route('/courses/new')
    .get(controller.courses.newC.get)
    .post(controller.courses.newC.post)

  router.get('/courses/:idOrSlug/enrollment', idOrSlugToCourse, controller.courses.enrollment)

  router.get('/courses/:idOrSlug/enrollment/users/:user_id/enroll', idOrSlugToCourse, user_idToUser, controller.courses.enroll)
  router.get('/courses/:idOrSlug/enrollment/users/:user_id/disenroll', idOrSlugToCourse, user_idToUser, controller.courses.disenroll)



  return router
}