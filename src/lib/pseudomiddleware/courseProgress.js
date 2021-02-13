
const one = (req) => {
  let lessons = req.course.lessons
  let lessonsNum = lessons.length
  if (lessonsNum === 0) {
    req.course.progress = 0
  } else {
    let completed = lessons.filter(lesson => lesson.completed.some(user => user.id === req.loggedUser.id)).length
    let progress = Math.round((completed / lessonsNum) * 100)
    req.course.progress = progress
  }
}



const all = (req, coursesArray) => {
  return coursesArray.map(course => {
    let lessons = course.lessons
    let lessonsNum = lessons.length
    if (lessonsNum === 0) {
      return { ...course, progress: 0 }
    } else {
      let completed = lessons.filter(lesson => lesson.completed.some(user => user.id === req.loggedUser.id)).length
      let progress = Math.round((completed / lessonsNum) * 100)
      return { ...course, progress }
    }
  })
}



module.exports = { one, all }