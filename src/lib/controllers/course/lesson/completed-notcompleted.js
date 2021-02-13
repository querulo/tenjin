const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { Lesson } = require('../../../models')



const completed = (req, res, next) => {
  if (!req.course.students.map(student => student.id).includes(req.user.id)) {
    return res.render('error', { title: "This user is not enrolled to this course"})
  }

  let completedIds = req.lesson.completed.map(student => student.id)

  if (completedIds.includes(req.user.id)) {
    return res.redirect(303, `/course/${req.course.id}/lesson/${req.lesson.id}/student-completion`)
  }

  completedIds.push(req.user.id)

  Lesson.updateById(req.lesson.id, { completed: completedIds })
    .then(res.redirect(303, `/course/${req.course.id}/lesson/${req.lesson.id}/student-completion`))
    .catch(err => next(err))
}



const notCompleted = (req, res, next) => {
  if (!req.course.students.map(student => student.id).includes(req.user.id)) {
    return res.render('error', { title: "This user is not enrolled to this course"})
  }

  let completedIds = req.lesson.completed.map(student => student.id)

  if (!completedIds.includes(req.user.id)) {
    return res.redirect(303, `/course/${req.course.id}/lesson/${req.lesson.id}/student-completion`)
  }

  let index = completedIds.findIndex(id => id === req.user.id)
  completedIds.splice(index, 1)

  Lesson.updateById(req.lesson.id, { completed: completedIds })
    .then(res.redirect(303, `/course/${req.course.id}/lesson/${req.lesson.id}/student-completion`))
    .catch(err => next(err))
}



module.exports = {
  completed: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: completed,
    admin: completed
  }),

  notCompleted: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: notCompleted,
    admin: notCompleted
  })
}