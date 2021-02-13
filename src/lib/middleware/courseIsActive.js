module.exports = (req, res, next) => {
  if (req.school.nonActiveCourses.some(course => course.id === req.course.id)) {
    req.course.nonActive = true
  }

  next() 
}