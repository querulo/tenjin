const courseTeacherOrAdmin = (req, res, next) => {
  if (req.session.userId && (req.session.userId === req.course.teacher.id || req.loggedUser.role === 'admin')) {
    next()
  } else {
    res.render('error', { title: "You don't have the permissions to access this page" })
  }
}



module.exports = { courseTeacherOrAdmin }