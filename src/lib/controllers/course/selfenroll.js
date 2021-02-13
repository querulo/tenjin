const { mapRoles } = require('../../middleware')
const { goToSignin } = require('../auth')
const { Course } = require('../../models')



const student = (req, res, next) => {
  if (req.course.students.some(student => student.id === req.session.userId)) {
    return res.render('error', { title: "You're already enrolled to this course" })
  }

  if (!req.school.activeCourses.some(course => course.id === req.course.id)) {
    return res.render('error', { title: "The course you're looking for doesn't exist" })
  }

  if (!req.course.selfenrollment) return res.render('error', { title: "Self-enrollment not available for this course" })



  let enrolledStudentsArray = req.course.students.map(student => student.id)
  enrolledStudentsArray.push(req.session.userId)

  Course.updateById(req.course.id, { students: enrolledStudentsArray})
    .then(course => {
      res.redirect(303, `/course/${req.course.id}`)
    })
    .catch(err => next(err))
}



const teacher = (req, res) => {
  if (req.course.teacher.id === req.session.userId) {
    return res.render('error', { title: "You can't be enrolled in a course you teach" })
  }

  if (req.course.students.some(student => student.id === req.session.userId)) {
    return res.render('error', { title: "You're already enrolled to this course" })
  }

  if (!req.school.activeCourses.some(course => course.id === req.course.id)) {
    return res.render('error', { title: "The course you're looking for doesn't exist" })
  }

  if (!req.course.selfenrollment) return res.render('error', { title: "Self-enrollment not available for this course" })



  let enrolledStudentsArray = req.course.students.map(student => student.id)
  enrolledStudentsArray.push(req.session.userId)

  Course.updateById(req.course.id, { students: enrolledStudentsArray})
    .then(course => {
      res.redirect(303, `/course/${req.course.id}`)
    })
    .catch(err => next(err))
}



const admin = (req, res) => {
  res.render('error', { title: "Admins can't be enrolled to courses"})
}



module.exports = mapRoles({
  anon: goToSignin,
  student,
  teacher,
  admin
})
