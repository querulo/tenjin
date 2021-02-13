const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { User } = require('../../../models')



const ban = (req, res) => {
  let userId = req.user.id

  User.updateById(userId, { active: false })
    .then(() => {
      res.redirect(303, `/admin/users`)
    })
}



const unban = (req, res) => {
  let userId = req.user.id

  User.updateById(userId, { active: true })
    .then(() => {
      res.redirect(303, `/admin/users`)
    })
}
  
  
  
module.exports = {
  ban: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: noPermissions,
    admin: ban
  }),
  unban: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: noPermissions,
    admin: unban
  }),
}