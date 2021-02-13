const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { Course } = require('../../../models')



const deactivate = (req, res) => {
  let courseId = req.course.id

  Course.deactivate(courseId)
    .then(() => res.redirect(303, `/admin/courses`))
    .catch(err => { throw err })
}



const activate = (req, res) => {
  let courseId = req.course.id

  Course.activate(courseId)
    .then(() => res.redirect(303, `/admin/courses`))
    .catch(err => { throw err })
}
  
  
  
module.exports = {
  deactivate: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: noPermissions,
    admin: deactivate
  }),
  activate: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: noPermissions,
    admin: activate
  }),
}