const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { User } = require('../../../models')



const remove = (req, res) => {
  let userId = req.user.id

  User.deleteById(userId)
    .then(() => {
      res.redirect(303, `/admin/users`)
    })
}
  
  
  
module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: noPermissions,
  admin: remove
})