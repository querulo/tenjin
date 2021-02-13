const { Lesson } = require('../../../models')
const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')



const move = (req, res, next) => {
  if (req.params.action !== 'up' && req.params.action !== 'down') next()

  let courseId = req.course.id

  Lesson.moveUpOrDown(req.lesson.id, req.params.action)
    .then(() => {
      res.redirect(303, `/course/${courseId}`)
    })
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: move,
  admin: move
})