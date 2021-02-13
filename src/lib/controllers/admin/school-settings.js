const fs = require('fs')

const multiparty = require('multiparty')

const { mapRoles } = require('../../middleware')
const { goToSignin, noPermissions } = require('../auth')
const { School, images } = require('../../models')



const get = (req, res) => {
  res.render('admin/school-settings', { title: 'School settings'})
}



const post = (req, res, next) => {
  const form = new multiparty.Form()
  form.parse(req, (err, fields, files) => {
    let changes = {
      topBlock: {
        name: fields.schoolName[0],
        title: fields.schoolTitle[0],
        short: fields.schoolShort[0]
      },
      callOut: {
        title: fields.callOutTitle[0],
        short: fields.callOutShort[0]
      }
    }

    let imgPathTemp = files.image[0].path
    let imageSize = files.image[0].size

    School.update(changes)
      .then(school => {
        if (imageSize < 1) {   // no image uploaded
          fs.promises.unlink(imgPathTemp)
            .then(() => {
              return res.redirect(303, `/`)
            })
          return
        }

        // image uploaded
        let ext = imgPathTemp.split('.').pop()
        images.school.updateImage(imgPathTemp, ext)
          .then(newImageUrl => {
            School.update({ topBlock: { image: newImageUrl } })
              .then(school => {
                return res.redirect(303, `/`)
              })
          })
      })
      .catch(err => {
        fs.unlinkSync(imgPathTemp)
        next(err)
      })
  })
}



module.exports = {
  get: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: noPermissions,
    admin: get
  }),

  post: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: noPermissions,
    admin: post
  }),
}