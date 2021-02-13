const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { User } = require('../../../models')



const enrollment = (req, res) => {
  User.readAll()
    .then(users => {
      let usersArray = Object.keys(users).reduce((arr, currId) => {
        return [ ...arr, { id: Number(currId), ... users[currId] } ]
      }, [])

      usersArray = usersArray.filter(user => user.role !== 'admin')
      usersArray = usersArray.filter(user => user.id !== req.course.teacher.id)

      let enrolledIds = req.course.students.map(student => student.id)

      let enrolledUsers = req.course.students
      let notEnrolledUsers = usersArray.filter(user => !enrolledIds.includes(user.id))

      function compareByLastname(userA, userB) {
        if (userA.lastname < userB.lastname) return -1
        if (userA.lastname > userB.lastname) return 1
        return 0
      }
      enrolledUsers.sort(compareByLastname)
      notEnrolledUsers.sort(compareByLastname)

      res.render('admin/courses/enrollment', { course: req.course, enrolledUsers, notEnrolledUsers, title: 'User enrollment: '+req.course.title })
    })
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: noPermissions,
  admin: enrollment
})