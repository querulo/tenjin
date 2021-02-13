const { mapRoles } = require('../middleware')
const { courseProgress } = require('../pseudomiddleware')
const { User, Course, School } = require('../models')



function splitCoursesInRows(coursesArray, rowLength) {
  const coursesRows = []
  let j = -1;
  for(i = 0; i < coursesArray.length; i++) {
    if(i % rowLength === 0) {
      j += 1
      coursesRows[j] = []
    }
    coursesRows[j].push(coursesArray[i])
  }
  return coursesRows
}



async function courseStyleFromQS(req, res) {
  const styles = [ "myteachingcoursesstyle", "mycoursesstyle", "activecoursesstyle"]
  
  for (let style of styles)  {
    if (req.query[style] === 'list' || req.query[style] === 'card') {
      if (req.query[style] !== req.loggedUser.dashboardstyles[style]) {
        const id = req.session.userId

        let user = await User.updateById(id, { dashboardstyles: { [style]: req.query[style] } })

        user = { id, ...user[id] }
        req.loggedUser = res.locals.loggedUser = user
      }
    }
  }
}



let anon = (req, res, next) => {
  let coursesRows = splitCoursesInRows(req.school.activeCourses, 3)

  res.render('home/home_anon-admin', { courses: coursesRows, role: 'anon'})
}



let student = (req, res, next) => {
  courseStyleFromQS(req, res)
    .then(() => {
      let enrolledCourses = [], notenrolledCourses = []
      req.school.activeCourses.forEach(course => {
        if (course.students.some(student => student.id === req.session.userId)) enrolledCourses.push(course)
        else notenrolledCourses.push(course)
      })

      enrolledCourses = courseProgress.all(req, enrolledCourses)

      res.render('home/home_student', { enrolledCourses, notenrolledCourses })
    })
    .catch(err => next(err))
}



let teacher = (req, res, next) => {
  courseStyleFromQS(req, res)
    .then(() => {
      let teachingCourses = [], enrolledCourses = [], notenrolledCourses = []
      req.school.activeCourses.forEach(course => {
        if (course.teacher.id === req.session.userId) teachingCourses.push(course)
        else if (course.students.some(student => student.id === req.session.userId)) enrolledCourses.push(course)
        else notenrolledCourses.push(course)
      })
      req.school.nonActiveCourses.forEach(course => {
        if (course.teacher.id === req.session.userId) teachingCourses.push({ ...course, nonActive: true })
      })

      enrolledCourses = courseProgress.all(req, enrolledCourses)

      res.render('home/home_teacher', { teachingCourses, enrolledCourses, notenrolledCourses })
    })
    .catch(err => next(err))
}



let admin = (req, res, next) => {
  let coursesRows = splitCoursesInRows(req.school.activeCourses, 3)

  if (req.query.edit) {
    if (req.query.edit === 'start') req.session.homeEdit = true
    if (req.query.edit === 'end') req.session.homeEdit = false
  }

  if (req.session.homeEdit === true) {     // home edit
    return res.render('home/home_admin_edit', { courses: coursesRows, edit: true })
  } else {                                 // not edit
    return res.render('home/home_anon-admin', { courses: coursesRows, role: 'admin', edit: false })
  }
}



module.exports = mapRoles({ anon, student, teacher, admin })