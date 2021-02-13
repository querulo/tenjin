const moment = require('moment-timezone')
const { body, validationResult } = require('express-validator')

const { mapRoles, validation } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { Lesson } = require('../../../models')
const LANGUAGES = require('../../../../data-other/locale-languages-trovatiacaso')



const get = (req, res) => {

  if (res.locals.oldForm) {

    req.lesson = {
      ...req.lesson,
      ...res.locals.oldForm
    }

  } else {

    // date formatting to fill the form

    let userTz = req.session.tz

    let start = moment.tz(req.lesson.start, userTz)
    let end = moment.tz(req.lesson.end, userTz)

    let startArray = start.format("D-MMMM-YYYY-H-mm").split('-')
    let startDay = startArray[0], startMonth = startArray[1], startYear = startArray[2]
    let startHour = startArray[3], startMinute = startArray[4]

    let endArray = end.format("D-MMMM-YYYY-H-mm").split('-')
    let endDay = endArray[0], endMonth = endArray[1], endYear = endArray[2]
    let endHour = endArray[3], endMinute = endArray[4]

    req.lesson = {
      ...req.lesson,
      startDay, startMonth, startYear, startHour, startMinute,
      endDay, endMonth, endYear, endHour, endMinute
    }

  }

  res.render('course/lesson/edit', { lesson: req.lesson, languages: LANGUAGES, title: 'Lesson settings: '+req.lesson.title })
}



const postValidation = validation.expVal.compose(
  body('title').not().isEmpty().withMessage('Please insert a title'),

  validation.expVal.lessonAndCourseDates,
  validation.expVal.lessonAndCourseLanguage
)

const post = (req, res, next) => {

  let formDataToKeep = {
    tempTitle: req.body.title,
    
    startDay: req.body.startDay, startMonth: req.body.startMonth, startYear: req.body.startYear,
    endDay: req.body.endDay, endMonth: req.body.endMonth, endYear: req.body.endYear,
    startHour: req.body.startHour, startMinute: req.body.startMinute,
    endHour: req.body.endHour, endMinute: req.body.endMinute,

    language: req.body.language,
    contents: req.body.contents
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
    res.addFlash({ message: "The starting hour must be before the ending hour", style: 'danger'})
    res.keepForm(formDataToKeep)
    return res.redirect(303, 'back')
  }



  // model update

  let changes = {
    title: req.body.title,
    start: start.toISOString(),
    end: end.toISOString(),
    language: req.body.language,
    contents: req.body.contents
  }

  Lesson.updateById(req.lesson.id, changes)
    .then(() => res.redirect(303, `/course/${req.course.id}`))
    .catch(err => next(err))
}



module.exports = {
  get: mapRoles({
    anon: goToSignin,
    student: noPermissions,
    teacher: get,
    admin: get
  }),

  post: [
    mapRoles({ teacher: postValidation, admin: postValidation }),

    mapRoles({
      anon: goToSignin,
      student: noPermissions,
      teacher: post,
      admin: post
    })
  ]
}