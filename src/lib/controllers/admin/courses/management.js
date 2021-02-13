const moment = require('moment-timezone')

const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')



function coursesDates(tz, coursesArray) {
  for (let course of coursesArray) {
    let start = moment.tz(course.start, tz)
    let end = moment.tz(course.end, tz)

    course.start = start.format("ddd, MMM DD, YYYY")
    course.end = end.format("ddd, MMM DD, YYYY")
  }
}



const management = (req, res) => {
  coursesDates(req.session.tz, req.school.activeCourses)
  coursesDates(req.session.tz, req.school.nonActiveCourses)

  res.render('admin/courses/management', { activeCourses: req.school.activeCourses, nonActiveCourses: req.school.nonActiveCourses, title: 'Courses management'})
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: noPermissions,
  admin: management
})