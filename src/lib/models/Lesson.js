const BaseModel = require('./Base')
const getDatastoreInstance = require('../datastore')



/*
create(lesson, courseId)     (also adds the lesson in the course)

read([query])
reaById(id)
readByName(name)
readAll()

update(query, lesson)
updateById(id, lesson)

delete(query)     (NOT FINISHED - missing deletion of the lesson from the course)
deleteById(id)

-----

validate(lesson)
moveUpOrDown(id, direction)
template()
*/



class Lesson extends BaseModel {

  static datastore = getDatastoreInstance('lessons')

  static usersDatastore = getDatastoreInstance('users')
  static coursesDatastore = getDatastoreInstance('courses')



  // ===================================== CREATE =====================================



  static async create(lesson, courseId) {          // also adds the lesson in the course
    if(!this.validate()) return new Error('VALIDATION')

    let course
    try {
      course = await this.coursesDatastore.read({ id: courseId })
    } catch (err) {
      if (err.message = "NO_MATCHES") throw(new Error('LESSONCREATE_NO_COURSE_FOUND'))
      else throw(err)
    }
    course = course[courseId]

    lesson = await super.create(lesson)

    course.lessons.push(lesson.id)
    await this.coursesDatastore.update({ id: courseId }, course)
  }



  // ===================================== READ =====================================



  static async read(query) {
    let lessons = await this.datastore.read(query)



    // "join"

    let users = await this.usersDatastore.read()

    for (let id in lessons) {
      for (let i = 0; i < lessons[id].completed.length; i++) {
        let studentId = lessons[id].completed[i]
        let student = users[studentId]
        lessons[id].completed[i] = { id: studentId, ...student }
      }
    }
    

    
    return lessons
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



  static async readAll() {
    return await this.read()
  }
  


  // ===================================== UPDATE =====================================



  static async update(query, lesson) {
    if(!this.validate()) return new Error('VALIDATION')

    return await super.update(query, lesson)
  }



  static async updateById(id, lesson) {
    if(!this.validate()) return new Error('VALIDATION')

    return await super.update({ id }, lesson)
  }



  // ===================================== DELETE =====================================



  static async delete(query) {       // (NOT FINISHED - missing deletion of the lesson from the course)
    return await this.datastore.delete(query)
  }



  static async deleteById(id) {               // also deletes the lesson from the course
    await this.datastore.delete({ id })

    let courses = await this.coursesDatastore.read()
    let coursesIds = Object.keys(courses)
    let course, courseId
    for (let i = 0; i < coursesIds.length && !course; i++) {
      if (courses[coursesIds[i]].lessons.includes(id)) {
        course = courses[coursesIds[i]]
        courseId = coursesIds[i]
      }
    }

    if (!course) throw(new Error('LESSONDELETEBYID_LESSON_WAS_NOT_IN_A_COURSE!?'))

    let index = course.lessons.findIndex(el => el === id)
    course.lessons.splice(index, 1)
    let lessons = course.lessons
    await this.coursesDatastore.update({ id: courseId }, { lessons })
  }
  

  
  // ===================================== OTHER FUNCTIONALITIES =====================================



  static validate(lesson) {
    return true
  }



  static async moveUpOrDown(id, direction) {
    let courses = await this.coursesDatastore.read()
    let coursesIds = Object.keys(courses)
    let course, courseId
    for (let i = 0; i < coursesIds.length && !course; i++) {
      if (courses[coursesIds[i]].lessons.includes(id)) {
        course = courses[coursesIds[i]]
        courseId = coursesIds[i]
      }
    }

    if (!course) throw(new Error('LESSONMOVEUPORDOWN_LESSON_WAS_NOT_IN_A_COURSE!?'))
    
    let lessons = course.lessons
    let index = lessons.findIndex(el => el === id)

    if (direction === 'up') {
      if (index === 0) return
      let prevCopy = lessons[index - 1]
      lessons[index - 1] = id
      lessons[index] = prevCopy
    } else {
      if (index === lessons.length - 1) return
      let nextCopy = lessons[index + 1]
      lessons[index + 1] = id
      lessons[index] = nextCopy
    }

    await this.coursesDatastore.update({ id: courseId }, { lessons })
  }



  static template() {
    return {
      "title": "",
      "start": "",
      "end": "",
      "language": "",
      "contents": "",
      "completed": []
    }
  }
}



module.exports = Lesson