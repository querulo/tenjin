const fs = require('fs')

const multiparty = require('multiparty')
const moment = require('moment-timezone')
const { body, validationResult } = require('express-validator')

const { mapRoles, validation } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { Course, User, images } = require('../../../models')
const LANGUAGES = require('../../../../data-other/locale-languages-trovatiacaso')



const loadTeachers = (req, res, next) => {
  User.read({ role: 'teacher' })
  .then(teachers => {
    req.teachers = Object.keys(teachers).reduce((arr, id) => {
      return [ ...arr, { id: Number(id), ...teachers[id] } ]
    }, [])
    next()
  })
  .catch(err => {
    if (err === 'NO_MATCHES') {
      req.teachers = []
      next()
    }
    else next(err)
  })
}



const get = (req, res, next) => {

  req.course = {
    title: '',
    short: '',
    language: "English (United States)",
    description: '',
    teacher: { id: -1 },
    selfenrollment: false
  }

  if (res.locals.oldForm) {

    req.course = {
      ...req.course,
      ...res.locals.oldForm
    }

  } else {

    // date formatting to fill the form (current day)
    
    let userTz = req.session.tz

    let currDate = moment.tz(userTz)

    let currDateArray = currDate.format("D-MMMM-YYYY-H-mm").split('-')
    let currDay = currDateArray[0], currMonth = currDateArray[1], currYear = currDateArray[2]
    let currHour = currDateArray[3], currMinute = currDateArray[4]

    req.course = {
      ...req.course,
      startDay: currDay, startMonth: currMonth, startYear: currYear, startHour: currHour, startMinute: currMinute,
      endDay: currDay, endMonth: currMonth, endYear: currYear, endHour: currHour, endMinute: currMinute
    }

  }

  res.render('admin/courses/new', { course: req.course, languages: LANGUAGES, teachers: req.teachers, title: 'New course' })
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
  validation.expVal.lessonAndCourseLanguage,
  validation.expVal.courseAdmin
)

const post = (req, res) => {

  let formDataToKeep = {
    tempTitle: req.body.title,
    short: req.body.short,

    startDay: req.body.startDay, startMonth: req.body.startMonth, startYear: req.body.startYear,
    endDay: req.body.endDay, endMonth: req.body.endMonth, endYear: req.body.endYear,
    startHour: req.body.startHour, startMinute: req.body.startMinute,
    endHour: req.body.endHour, endMinute: req.body.endMinute,

    language: req.body.language,
    description: req.body.description,
    teacher: { id: Number(req.body.teacher) },
    selfenrollment: req.body.selfenrollment === "true" ? true : false
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



  // model validation and record creation

  let course = {
    ...Course.template(),
    title: req.body.title,
    short: req.body.short,
    start: start.toISOString(),
    end: end.toISOString(),
    language: req.body.language,
    description: req.body.description,
    teacher: Number(req.body.teacher)
  }

  let imgPathTemp = req.files.image[0].path
  let imageSize = req.files.image[0].size

  Course.create(course)
    .then(course => {
      if (imageSize < 1) {   // no image uploaded
        fs.promises.unlink(imgPathTemp)
          .then(() => {
            images.courses.newImagePlaceholder(course.id)
              .then(newImageUrl => {
                Course.updateById(course.id, { image: newImageUrl })
                  .then(course => {
                    return res.redirect(303, `/course/${course.id}`)
                  })
              })
          })
        return
      } else {
        // image uploaded
        let ext = imgPathTemp.split('.').pop()
        images.courses.newImage(course.id, imgPathTemp, ext)
          .then(newImageUrl => {
            Course.updateById(course.id, { image: newImageUrl })
              .then(course => {
                return res.redirect(303, `/course/${course.id}`)
              })
        })
      }
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
      teacher: noPermissions,
      admin: get
    })
  ],

  post: [
    mapRoles({ admin: loadTeachers }),
    mapRoles({ admin: multipartyParse }),
    mapRoles({ admin: postValidation }),

    mapRoles({
      anon: goToSignin,
      student: noPermissions,
      teacher: noPermissions,
      admin: post
    })
  ]
}