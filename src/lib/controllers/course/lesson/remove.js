const { Lesson } = require('../../../models')
const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')



const remove = (req, res) => {
  let courseId = req.course.id

  Lesson.deleteById(req.lesson.id)
    .then(() => {
      res.redirect(303, `/course/${courseId}`)
    })
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: remove,
  admin: remove
})