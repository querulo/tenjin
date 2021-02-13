const { Course } = require('../../../models')
const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')



const move = (req, res, next) => {
  if (req.params.action !== 'up' && req.params.action !== 'down') next()

  Course.moveUpOrDown(req.course.id, req.params.action)
    .then(() => {
      res.redirect(303, `/admin/courses`)
    })
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: noPermissions,
  admin: move
})