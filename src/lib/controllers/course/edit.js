const fs = require('fs')

const multiparty = require('multiparty')
const moment = require('moment-timezone')
const { body, validationResult } = require('express-validator')

const { mapRoles, validation } = require('../../middleware')
const { goToSignin, noPermissions } = require('../auth')
const { Course, images } = require('../../models')
const LANGUAGES = require('../../../data-other/locale-languages-trovatiacaso')
const { loadTeachers, adminPostValidation, adminGet, adminPost, } = require('../admin/courses/edit').admin



const get = (req, res) => {

  if (res.locals.oldForm) {

    req.course = {
      ...req.course,
      ...res.locals.oldForm
    }

  } else {

    // date formatting to fill the form

    let userTz = req.session.tz

    let start = moment.tz(req.course.start, userTz)
    let end = moment.tz(req.course.end, userTz)

    let startArray = start.format("D-MMMM-YYYY-H-mm").split('-')
    let startDay = startArray[0], startMonth = startArray[1], startYear = startArray[2]
    let startHour = startArray[3], startMinute = startArray[4]

    let endArray = end.format("D-MMMM-YYYY-H-mm").split('-')
    let endDay = endArray[0], endMonth = endArray[1], endYear = endArray[2]
    let endHour = endArray[3], endMinute = endArray[4]

    req.course = {
      ...req.course,
      startDay, startMonth, startYear, startHour, startMinute,
      endDay, endMonth, endYear, endHour, endMinute
    }
    
  }
  
  res.render('course/edit', { course: req.course, languages: LANGUAGES, title: 'Course settings: '+req.course.title })
}



const multipartyParse = (req, res, next) => {
  const form = new multiparty.Form()
  form.parse(req, (err, fields, files) => {
    req.files = files

    for (let field in fields) {
      req.body[field] = fields[field][0]
    }
    next()
  })
}

const postValidation = validation.expVal.compose(
  body('title').not().isEmpty().withMessage('Please insert a title'),

  validation.expVal.lessonAndCourseDates,
  validation.expVal.lessonAndCourseLanguage
)

const post = (req, res, next) => {

  let formDataToKeep = {
    tempTitle: req.body.title,
    short: req.body.short,

    startDay: req.body.startDay, startMonth: req.body.startMonth, startYear: req.body.startYear,
    endDay: req.body.endDay, endMonth: req.body.endMonth, endYear: req.body.endYear,
    startHour: req.body.startHour, startMinute: req.body.startMinute,
    endHour: req.body.endHour, endMinute: req.body.endMinute,

    language: req.body.language,
    description: req.body.description
  }



  // espress validator errors

  let errors = validationResult(req).array();
  if (errors.length) {
    let message = errors.shift().msg

    res.addFlash({ message, style: 'danger'})
    res.keepForm(formDataToKeep)
    return res.redirect(303, 'back')
  }



  // date parsing and validation

  let userTz = req.session.tz

  let startDay = String(req.body.startDay).padStart(2, "0"), startMonth = req.body.startMonth, startYear = req.body.startYear
  let endDay = String(req.body.endDay).padStart(2, "0"), endMonth = req.body.endMonth, endYear = req.body.endYear
  let startHour = String(req.body.startHour).padStart(2, "0"), startMinute = req.body.startMinute
  let endHour = String(req.body.endHour).padStart(2, "0"), endMinute = req.body.endMinute

  let start = moment.tz(`${startDay}/${startMonth}/${startYear} ${startHour}:${startMinute}`, "DD/MMMM/YYYY hh:mm", userTz)
  let end = moment.tz(`${endDay}/${endMonth}/${endYear} ${endHour}:${endMinute}`, "DD/MMMM/YYYY hh:mm", userTz)

  if (!start.isValid() || !end.isValid()) {
    res.addFlash({ message: 'The date is not valid', style: 'danger'})
    res.keepForm(formDataToKeep)
    return res.redirect(303, 'back')
  }
  if (end.isBefore(start)) {
    res.addFlash({ message: "The starting date must be before the ending date", style: 'danger'})
    res.keepForm(formDataToKeep)
    return res.redirect(303, 'back')
  }



  let changes = {
    title: req.body.title,
    short: req.body.short,
    start: start.toISOString(),
    end: end.toISOString(),
    language: req.body.language,
    description: req.body.description
  }

  let imgPathTemp = req.files.image[0].path
  let imageSize = req.files.image[0].size

  Course.updateById(req.course.id, changes)
    .then(course => {
      if (imageSize < 1) {   // no image uploaded
        fs.promises.unlink(imgPathTemp)
          .then(() => {
            return res.redirect(303, `/course/${course.id}`)
          })
        return
      }

      // image uploaded
      let ext = imgPathTemp.split('.').pop()
      images.courses.updateImage(req.course.id, imgPathTemp, ext)
        .then(newImageUrl => {
          Course.updateById(req.course.id, { image: newImageUrl })
            .then(course => {
              return res.redirect(303, `/course/${course.id}`)
            })
        })
    })
    .catch(err => {
      fs.unlinkSync(imgPathTemp)

      if (err.message === 'TITLE_EXISTS') {
        res.addFlash({ message: 'This title is already used by another course', style: 'danger'})
        res.keepForm(formDataToKeep)
        return res.redirect(303, 'back')
      }
      next(err)
    })
}



module.exports = {
  get: [
    mapRoles({ admin: loadTeachers }),

    mapRoles({
      anon: goToSignin,
      student: noPermissions,
      teacher: get,
      admin: adminGet
    })
  ],

  post: [
    mapRoles({ teacher: multipartyParse, admin: multipartyParse }),
    mapRoles({ admin: loadTeachers }),
    mapRoles({ teacher: postValidation, admin: adminPostValidation }),

    mapRoles({
      anon: goToSignin,
      student: noPermissions,
      teacher: post,
      admin: adminPost
    })
  ]
}