const { mapRoles } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { Course, images } = require('../../../models')



const remove = (req, res) => {
  let courseId = req.course.id

  Course.deleteById(courseId)
    .then(() => {
      images.courses.deleteImage(courseId)
        .then(() => {
          res.redirect(303, `/admin/courses`)
        })
    })
}



module.exports = mapRoles({
  anon: goToSignin,
  student: noPermissions,
  teacher: noPermissions,
  admin: remove
})