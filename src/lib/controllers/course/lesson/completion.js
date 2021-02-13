const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')



const completion = (req, res) => {
  let students = req.course.students
  let completedStudents = req.lesson.completed
  let completedStudentsIds = completedStudents.map(student => student.id)
  let notCompletedStudents = students.filter(student => !completedStudentsIds.includes(student.id))

  function compareByLastname(userA, userB) {
    if (userA.lastname < userB.lastname) return -1
    if (userA.lastname > userB.lastname) return 1
    return 0
  }

  completedStudents.sort(compareByLastname)
  notCompletedStudents.sort(compareByLastname)

  res.render('course/lesson/completion', {
    course: req.course, lesson: req.lesson,
    completedStudents, notCompletedStudents,
    title: 'Student completion: ' + req.lesson.title
  })
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: completion,
  admin: completion
})