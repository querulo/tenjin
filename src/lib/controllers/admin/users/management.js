const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { User } = require('../../../models')



const management = (req, res) => {
  User.readAll()
    .then(users => {
      const usersArray = Object.keys(users).reduce((acc, userId) => {
        return [ ...acc, { id: userId, ...users[userId]} ]
      }, [])

      function compareByLastname(userA, userB) {
        if (userA.lastname < userB.lastname) return -1
        if (userA.lastname > userB.lastname) return 1
        return 0
      }
      usersArray.sort(compareByLastname)

      res.render('admin/users/management', { users: usersArray, title: 'Users management' })
    })
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: noPermissions,
  admin: management
})