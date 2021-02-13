const MarkdownIt = require('markdown-it')
const md = MarkdownIt({ breaks: true })

const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

const moment = require('moment-timezone')

const { mapRoles } = require('../../middleware')
const { courseProgress } = require('../../pseudomiddleware')



const title = (req, res, next) => {
  res.locals.title = 'Course: ' + req.course.title
  next()
}

function lessonsMDToHtml(req) {
  for (let lesson of req.course.lessons) {
    lesson.htmlContents = md.render(lesson.contents)

    lesson.htmlContents = DOMPurify.sanitize(
      lesson.htmlContents,
      { ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em',
        'ul', 'ol', 'li', 'a', 'img'] }
    )
  }
}
function courseMDToHtml(req) {
  req.course.htmlDescription = md.render(req.course.description)

  req.course.htmlDescription = DOMPurify.sanitize(
    req.course.htmlDescription,
    { ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em',
      'ul', 'ol', 'li', 'a', 'img'] }
  )
}

function shortLanguage(req) {
  if (req.course.language.includes('(')) {
    let language = req.course.language.split('(')[0]
    language = language.substr(0, (language.length - 1))
    req.course.language = language
  }
}

function courseDates(req) {
  let userTz = req.session.tz

  let start = moment.tz(req.course.start, userTz)
  let end = moment.tz(req.course.end, userTz)

  req.course.start = start.format("dddd, MMMM DD, YYYY")
  req.course.end = end.format("dddd, MMMM DD, YYYY")
}

function lessonsDates(req) {
  let userTz = req.session.tz

  // next lesson
  
  if (req.course.lessons.length) {
    let futureLessons = req.course.lessons.filter(lesson => {
      return moment().isBefore(moment(lesson.start))
    })
    
    if (futureLessons.length) {
      req.course.nextLesson = futureLessons.reduce((smallest, curr) => {
        if (moment(curr.start).isBefore(moment(smallest.start))) return curr
        else return smallest
      })
    }
  }

  // total hours

  if (req.course.lessons.length) {
    let durations = req.course.lessons.map(lesson => {
      return moment.duration(moment(lesson.end).diff(moment(lesson.start)))
    })

    totalDuration = durations.reduce((prev, curr) => prev.add(curr))

    req.course.totalHours = totalDuration.asHours()
  } else {
    req.course.totalHours = 0
  }

  // dates and hours formatting

  for (let lesson of req.course.lessons) {
    let start = moment.tz(lesson.start, userTz)
    let end = moment.tz(lesson.end, userTz)

    let startDate = start.format("dddd, MMMM DD, YYYY")
    let endDate = end.format("dddd, MMMM DD, YYYY")

    let startHour = start.format("h:mm A")
    let endHour = end.format("h:mm A")
    
    if(!start.isSame(end, "day")) {
      endHour += " of " + end.format("MMMM DD, YYYY")
    }

    lesson.start = startHour
    lesson.end = endHour
    lesson.date = startDate
  }
}



const anon = (req, res) => {
  // course is not active
  if (req.course.nonActive) return res.render('error', { title: "The course you're looking for doesn't exist" })

  shortLanguage(req)
  courseMDToHtml(req)
  courseDates(req)

  res.render('course/root/course_anon', { course: req.course, lessons: req.course.lessons })
}



const student = (req, res) => {
  // course is not active
  if (req.course.nonActive) return res.render('error', { title: "The course you're looking for doesn't exist" })

  shortLanguage(req)

  if (req.course.students.some(student => student.id === req.session.userId)) {   // enrolled
    lessonsMDToHtml(req)
    courseProgress.one(req)
    lessonsDates(req)
    return res.render('course/root/course_student_enr', { course: req.course, lessons: req.course.lessons })
  }
  courseMDToHtml(req)                            // not enrolled
  courseDates(req)
  res.render('course/root/course_student_notEnr', { course: req.course, lessons: req.course.lessons })
}



const teacher = (req, res) => {
  shortLanguage(req)
  lessonsMDToHtml(req)
  
  if (req.course.teacher.id === req.session.userId) {                  // teaching
    if (req.query.edit) {
      if (req.query.edit === 'start') req.session.courseEdit = true
      if (req.query.edit === 'end') req.session.courseEdit = false
    }

    lessonsDates(req)

    if (req.session.courseEdit === true) {     // teaching - edit
      return res.render('course/root/course_teacher_teaching_edit', { course: req.course, lessons: req.course.lessons })
    } else {                           // teaching - not edit
      return res.render('course/root/course_teacher_teaching', { course: req.course, lessons: req.course.lessons })
    }
  }

  // course is not active
  if (req.course.nonActive) return res.render('error', { title: "The course you're looking for doesn't exist" })

  if (req.course.students.some(student => student.id === req.session.userId)) {   // enrolled
    courseProgress.one(req)
    lessonsDates(req)
    return res.render('course/root/course_teacher_enr', { course: req.course, lessons: req.course.lessons })
  }

  courseMDToHtml(req)                                   // not enrolled
  courseDates(req)
  res.render('course/root/course_teacher_notEnr', { course: req.course, lessons: req.course.lessons })
}



const admin = (req, res) => {
  shortLanguage(req)
  lessonsMDToHtml(req)

  if (req.query.edit) {
    if (req.query.edit === 'start') req.session.courseEdit = true
    if (req.query.edit === 'end') req.session.courseEdit = false
  }

  lessonsDates(req)

  if (req.session.courseEdit === true) {     // teaching - edit
    return res.render('course/root/course_teacher_teaching_edit', { course: req.course, lessons: req.course.lessons })
  } else {                           // teaching - not edit
    return res.render('course/root/course_teacher_teaching', { course: req.course, lessons: req.course.lessons })
  }
}



module.exports = [
  title,
  mapRoles({ anon, student, teacher, admin })
]