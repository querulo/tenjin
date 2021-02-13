const moment = require('moment-timezone')
const { body, validationResult } = require('express-validator')

const { mapRoles, validation } = require('../../../middleware')
const { goToSignin, noPermissions } = require('../../auth')
const { Lesson } = require('../../../models')
const LANGUAGES = require('../../../../data-other/locale-languages-trovatiacaso')



const get = (req, res) => {

  req.lesson = {
    title: '',
    language: "English (United States)",
    contents: ''
  }

  if (res.locals.oldForm) {

    req.lesson = {
      ...req.lesson,
      ...res.locals.oldForm
    }

  } else {

    // date formatting to fill the form (current day)
    
    let userTz = req.session.tz

    let currDate = moment.tz(userTz)

    let [currDay, currMonth, currYear, currHour, currMinute] = currDate.format("D-MMMM-YYYY-H-mm").split('-')

    req.lesson = {
      ...req.lesson,
      startDay: currDay, startMonth: currMonth, startYear: currYear, startHour: currHour, startMinute: currMinute,
      endDay: currDay, endMonth: currMonth, endYear: currYear, endHour: currHour, endMinute: currMinute
    }

  }



  res.render('course/lesson/new', { lesson: req.lesson, languages: LANGUAGES, title: 'New lesson' })
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


  
  // model record creation
  
  let newLesson = {
    ...Lesson.template(),
    title: req.body.title,
    start: start.toISOString(),
    end: end.toISOString(),
    language: req.body.language,
    contents: req.body.contents
  }

  Lesson.create(newLesson, req.course.id)
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