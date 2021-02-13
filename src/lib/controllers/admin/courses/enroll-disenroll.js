const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { Course } = require('../../../models')



const enroll = (req, res, next) => {
  Course.enrollUser(req.course.id, req.user.id)
    .then(() => {
      return res.redirect(303, `/admin/courses/${req.course.id}/enrollment`)
    })
    .catch(err => {
      if (err.message === "ENROLLUSER_CAN'T_ENROL_ADMINS") {
        return res.render('error', { title: "Admins can't be enrolled to courses"})
      }
      if (err.message === "ENROLLUSER_CAN'T_ENROLL_THE_TEACHER") {
        return res.render('error', { title: "You can't enroll the teacher of the course"})
      }
      next(err)
    })
}



const disenroll = (req, res) => {
  Course.disenrollUser(req.course.id, req.user.id)
    .then(() => {
      return res.redirect(303, `/admin/courses/${req.course.id}/enrollment`)
    })
}



module.exports = {
  enroll: mapRoles({
    anon:  goToSignin,
    student:  noPermissions,
    teacher:  noPermissions,
    admin: enroll
  }),

  disenroll: mapRoles({
    anon:  goToSignin,
    student:  noPermissions,
    teacher: noPermissions,
    admin: disenroll
  }),
}