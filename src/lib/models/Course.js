const slugify = require('slugify')

const BaseModel = require('./Base')
const getDatastoreInstance = require('../datastore')



/*
create(course)

read([query])
reaById(id)
readByTitle(title)
readAll()

update(query, course)     (NOT FINISHED - missing the checks for already existing title)
updateById(id, course)

delete(query)     (NOT FINISHED - missing deletion of the course from the school, and of all the lessons)
deleteById(id)

-----

validate(course)
alreadyExists(title)
addSlug(course)
moveUpOrDown(id, direction)
activate(id)
deactivate(id)
enrollUser(id, userId)
disenrollUser(id, userId)
template()
*/



class Course extends BaseModel {

  static datastore = getDatastoreInstance('courses')

  static usersDatastore = getDatastoreInstance('users')
  static lessonsDatastore = getDatastoreInstance('lessons')
  static schoolDatastore = getDatastoreInstance('school')



  // ===================================== CREATE =====================================



  static async create(course) {                           // also add the course in the school
    if(!this.validate()) return new Error('VALIDATION')

    await this.alreadyExists(course.title)

    this.addSlug(course)

    course = await super.create(course)

    let school = await this.schoolDatastore.read()
    school = school[0]

    school.nonActiveCourses.push(course.id)

    await this.schoolDatastore.update({ id: 0 }, school)

    return course
  }



  // ===================================== READ =====================================



  static async read(query) {
    let courses = await this.datastore.read(query)
    
    

    // "join"

    let users = await this.usersDatastore.read()
    let lessons = await this.lessonsDatastore.read()

    for (let id in courses) {
      if (courses[id].teacher) {
        let teacherId = courses[id].teacher
        let teacher = users[teacherId]
        courses[id].teacher = { id: teacherId, ...teacher }
      }

      courses[id].students = courses[id].students.map(id => { return { id, ...users[id] } })

      courses[id].lessons = courses[id].lessons.map(id => { return { id, ...lessons[id] } })

      courses[id].lessons.forEach(lesson => {
        lesson.completed = lesson.completed.map(id => { return { id, ...users[id] } })
      })
    }



    return courses
  }



  static async readById(id) {
    let result = await this.read({ id })

    return { id, ...result[id] }
  }



  static async readByTitle(title) {
    let result = await this.read({ title })
    
    let id = Object.keys(result)[0]

    return { id, ...result[id] }
  }



  static async readByIdOrSlug(idOrSlug) {
    if (!isNaN(parseInt(idOrSlug, 10))) return await this.readById(Number(idOrSlug))

    let result = await await this.read({ slug: idOrSlug })
    
    let id = Object.keys(result)[0]

    return { id, ...result[id] }
  }



  static async readAll() {
    return await this.read()
  }



  // ===================================== UPDATE =====================================



  static async update(query, changes) {            // da fare (con i controlli se title esiste)...
    if(!this.validate()) return new Error('VALIDATION')

    return await super.update(query, changes)
  }



  static async updateById(id, changes) {
    if(!this.validate()) return new Error('VALIDATION')

    if (Object.keys(changes).some(key => key === 'title')) {
      let courses = await this.datastore.read()
      for (let key in courses) {
        if (Number(key) !== id && courses[key].title === changes.title) throw(new Error('TITLE_EXISTS'))
      }

      this.addSlug(changes)
    }

    let course = await this.datastore.update({ id }, changes)
    return { id, ... course[id] }
  }



  // ===================================== DELETE =====================================



  // delete(query)   -----   (super)       // (NOT FINISHED - missing deletion of the course from the school, and of all the lessons)



  static async deleteById(id) {      // also deletes the course from the school, and all the lessons

    // deletes the course from the school

    let school = await this.schoolDatastore.read({ id: 0 })
    school = school[0]

    if (school.activeCourses.includes(id)) {
      let index = school.activeCourses.findIndex(el => el === id)
      school.activeCourses.splice(index, 1)
    } else {
      let index = school.nonActiveCourses.findIndex(el => el === id)
      school.nonActiveCourses.splice(index, 1)
    }

    await this.schoolDatastore.update({ id: 0 }, school)



    // deletes all the lessons

    let course = await this.readById(id)

    let lessonsIds = course.lessons.map(lesson => lesson.id)

    await Promise.all(lessonsIds.map(lessonId => this.lessonsDatastore.delete({ id: lessonId })))



    // deletes the course

    await super.deleteById(id)
  }



  // ===================================== OTHER FUNCTIONALITIES =====================================



  static validate(course) {
    return true
  }



  static async alreadyExists(title) {
    let courses = await this.datastore.read()
    for (let key in courses) {
      if (courses[key].title === title) throw(new Error('TITLE_EXISTS'))
    }
    return true
  }



  static addSlug(course) {
    course.slug = slugify(course.title)
  }



  static async moveUpOrDown(id, direction) {
    let school = await this.schoolDatastore.read({ id: 0 })
    school = school[0]
    
    let courses = school.activeCourses
    let index = courses.findIndex(el => el === id)

    if (direction === 'up') {
      if (index === 0) return
      let prevCopy = courses[index - 1]
      courses[index - 1] = id
      courses[index] = prevCopy
    } else {
      if (index === courses.length - 1) return
      let nextCopy = courses[index + 1]
      courses[index + 1] = id
      courses[index] = nextCopy
    }

    await this.schoolDatastore.update({ id: 0 }, { activeCourses: courses })
  }
  


  static async activate(id) {
    let school = await this.schoolDatastore.read()
    school = school[0]

    let index = school.nonActiveCourses.findIndex(el => el === id)

    if (index < 0) return new Error('COURSE_ACTIVATE_NO_COURSE_MATCHING_THIS_ID')

    school.nonActiveCourses.splice(index, 1)
    school.activeCourses.push(id)

    await this.schoolDatastore.update({ id: 0 }, school)
  }



  static async deactivate(id) {
    let school = await this.schoolDatastore.read()
    school = school[0]

    let index = school.activeCourses.findIndex(el => el === id)

    if (index < 0) return new Error('COURSE_DEACTIVATE_NO_COURSE_MATCHING_THIS_ID')

    school.activeCourses.splice(index, 1)
    school.nonActiveCourses.push(id)

    await this.schoolDatastore.update({ id: 0 }, school)
  }



  static async enrollUser(id, userId) {
    let course = await this.readById(id)
    let user = await this.usersDatastore.read({ id: userId })
    user = { id: userId, ...user[Object.keys(user)[0]] }

    if (user.role === "admin") throw new Error("ENROLLUSER_CAN'T_ENROL_ADMINS")
    if (course.teacher.id === userId) throw new Error("ENROLLUSER_CAN'T_ENROLL_THE_TEACHER")

    let enrolledUsers = course.students.map(user => user.id)

    if (enrolledUsers.includes(userId)) return

    enrolledUsers.push(userId)
    await this.updateById(id, { students: enrolledUsers })
  }



  static async disenrollUser(id, userId) {
    let course = await this.readById(id)
    let user = await this.usersDatastore.read({ id: userId })
    user = { id: userId, ...user[Object.keys(user)[0]] }

    let enrolledUsers = course.students.map(user => user.id)

    if (!enrolledUsers.includes(userId)) return

    let index = enrolledUsers.findIndex(id => id === userId)
    enrolledUsers.splice(index, 1)

    await this.updateById(id, { students: enrolledUsers })



    let lessonsIds = course.lessons.map(lesson => lesson.id)

    if (!lessonsIds.length) return

    let lessons = await Promise.all(lessonsIds.map(id => this.lessonsDatastore.read({ id })))
    lessons = lessons.map(lesson => { return { id: Object.keys(lesson)[0], ...lesson[Object.keys(lesson)[0]] } })

    lessons.forEach(lesson => {
      let completed = lesson.completed
      let index = completed.findIndex(id => id === userId)
      if (index > -1) completed.splice(index, 1)
    })

    await Promise.all(lessons.map(lesson => this.lessonsDatastore.update({ id: lesson.id }, { completed: lesson.completed })))
  }



  static template() {
    return {
      "title": "",
      "slug": "",
      "image": "",
      "short": "",
      "start": "",
      "end": "",
      "language": "",
      "description": "",
      "teacher": -1,
      "students": [],
      "lessons": [],
      "selfenrollment": false
    }
  }
}



module.exports = Course