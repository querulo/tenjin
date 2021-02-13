const util = require('util')
const crypto = require('crypto')
const scrypt = util.promisify(crypto.scrypt)

const BaseModel = require('./Base')
const getDatastoreInstance = require('../datastore')



/*
create(user, hash)

read([query])
reaById(id)
readByUsername(username)
readByEmail(email)
readAll()

update(query, user, hash)     (NOT FINISHED - missing the checks for already existing username and email and the changing of role)
updateById(id, user, hash)

delete(query)     (NOT FINISHED - missing deletion of the user from the courses and the lessons)
deleteById(id)

-----

validate(user)
authenticate(email, password)
hashPassword(user)
alreadyExists(username, email)
template()
*/



class User extends BaseModel {

  static datastore = getDatastoreInstance('users')

  static coursesDatastore = getDatastoreInstance('courses')
  static lessonsDatastore = getDatastoreInstance('lessons')



  // ===================================== CREATE =====================================



  static async create(user, hash = true) {
    if(!this.validate()) return new Error('VALIDATION')

    await this.alreadyExists(user.username, user.email)

    if (hash) user = await this.hashPassword(user)

    return await super.create(user)
  }



  // ===================================== READ =====================================



  // read(query)   -----   (super)



  // readById(id)   -----   (super)



  static async readByUsername(username) {
    return await super.read({ username })
  }



  static async readByEmail(email) {
    return await super.read({ email })
  }



  // readAll()   -----   (super)
  


  // ===================================== UPDATE =====================================



  static async update(query, changes, hash = false) {       // (NOT FINISHED - missing the checks for already existing username and email and the changing of role)
    if(!this.validate()) return new Error('VALIDATION')

    if (hash) changes = await this.hashPassword(changes)

    return await super.update(query, changes)
  }



  static async updateById(id, changes, hash = false) {
    // also check if the role if changed, and if it is then checks if he was a teacher and is not anymore, then
    // removes him as a teacher from his courses,
    // or if he was a student / teacher and now is an admin removes him from the enrollment to courses and
    // from the lesson completion
    


    if(!this.validate()) return new Error('VALIDATION')



    // checks if username or email already exists

    if (Object.keys(changes).some(key => key === 'username' || key === 'email')) {
      let users = await this.datastore.read()
      for (let key in users) {
        if (Number(key) !== id && users[key].username === changes.username) throw(new Error('USERNAME_EXISTS'))
      }
      for (let key in users) {
        if (Number(key) !== id && users[key].email === changes.email) throw(new Error('EMAIL_EXISTS'))
      }
    }



    // check if the role changed

    let user = await this.datastore.read({ id })
    user = { id, ...user[id] }

    if ('role' in changes && user.role !== changes.role) {

      let previousRole = user.role
      let newRole = changes.role

      let updatePromises = []

      let changedCourses = { }

      let courses = await this.coursesDatastore.read()

      for (let courseId in courses) {

        // if a teacher is no longer a teacher remove him from the course he taught

        if (previousRole === "teacher") {
          if (courses[courseId].teacher === id) {
            changedCourses[courseId] = { teacher: -1 }
          }
        }

        // if a student / teacher becomes an admin remove him from the enrollment to the courses

        if (newRole === "admin") {
          let index = courses[courseId].students.findIndex(st => st === id)
          if (index > -1) {
            courses[courseId].students.splice(index, 1)
            changedCourses[courseId] = { students: courses[courseId].students }
          }
        }

      }

      let lessons = await this.lessonsDatastore.read()

      for (let lessonId in lessons) {
        
        // if a student / teacher becomes and admin remove him from the lesson completion

        if (newRole === "admin") {
          let index = lessons[lessonId].completed.findIndex(st => st === id)
          if (index > -1) {
            lessons[lessonId].completed.splice(index, 1)
            updatePromises.push(this.lessonsDatastore.update({ id: lessonId }, { completed: lessons[lessonId].completed }))
          }
        }

      }

      if (Object.keys(changedCourses).length) {
        for (let id in changedCourses) {
          updatePromises.push(this.coursesDatastore.update({ id }, { ...changedCourses[id] }))
        }
      }

      await Promise.all(updatePromises)
    }



    if (hash) changes = await this.hashPassword(changes)

    return await super.update({ id }, changes)
  }


  
  // ===================================== DELETE =====================================



  // delete(query)   -----   (super)       // (NOT FINISHED - missing deletion of the user from the courses and the lessons)



  static async deleteById(id) {     // also deletes the user from the courses and the lessons

    // deletes the user from the courses teachers and the courses students
    
    let courses = await this.coursesDatastore.read()

    let changedCourses = { }

    for (let courseId in courses) {
      courseId = Number(courseId)

      if (courses[courseId].teacher === id) {
        if (!changedCourses[courseId]) changedCourses[courseId] = {}
        changedCourses[courseId].teacher = -1
      }

      let index = courses[courseId].students.findIndex(st => st === id )
      if (index > -1) {
        if (!changedCourses[courseId]) changedCourses[courseId] = {}
        courses[courseId].students.splice(index, 1)
        changedCourses[courseId].students = courses[courseId].students
      }

    }

    let courseUpdatePromises = []
    if (Object.keys(changedCourses).length) {
      for (let id in changedCourses) {
        courseUpdatePromises.push(this.coursesDatastore.update({ id }, { ...changedCourses[id] }))
      }
    }
    await Promise.all(courseUpdatePromises)



    // deletes the user from the lesson completion

    let lessons = await this.lessonsDatastore.read()

    let lesUpdatePromises = []
    for (let lessonId in lessons) {
      let index = lessons[lessonId].completed.findIndex(st => st === id)
      if (index > -1) {
        lessons[lessonId].completed.splice(index)
        lesUpdatePromises.push(this.lessonsDatastore.update({ id: lessonId }, { completed: lessons[lessonId].completed }))
      }
    }
    await Promise.all(lesUpdatePromises)



    return super.deleteById(id)
  }



  // ===================================== OTHER FUNCTIONALITIES =====================================



  static validate(user) {
    return true
  }



  static async authenticate(email, password) {
    let user
    try {
      user = await this.readByEmail(email)
    } catch (err) {
      if (err.message === 'NO_MATCHES') throw(new Error('WRONG_EMAIL'))
      throw(err)
    }

    let id = Number(Object.keys(user)[0])
    user = { id, ...user[id] }

    let hashedPsw = await scrypt(password, user.salt, 64)
    hashedPsw =  hashedPsw.toString('hex')
    
    if (hashedPsw !== user.password) throw(new Error('WRONG_PASSWORD'))
    return user
  }



  static async hashPassword(user) {
    let salt = crypto.randomBytes(8).toString('hex')     // 16 characters

    let hashedPsw = await scrypt(user.password, salt, 64)
    hashedPsw =  hashedPsw.toString('hex')

    user.password = hashedPsw
    user.salt = salt
    return user
  }



  static async alreadyExists(username, email) {
    let users = await this.datastore.read()
    for (let key in users) {
      if (users[key].username === username) throw(new Error('USERNAME_EXISTS'))
    }
    for (let key in users) {
      if (users[key].email === email) throw(new Error('EMAIL_EXISTS'))
    }
    return true
  }
  


  static template() {
    return {
      "username": "",
      "firstname": "",
      "lastname": "",
      "nickname": "",
      "email": "",
      "website": "",
      "publicinfo": "",
      "password": "",
      "salt": "",
      "active": true,
      "role": "student",
      "dashboardstyles": {
        "myteachingcoursesstyle": "card",
        "mycoursesstyle": "card",
        "activecoursesstyle": "card"
      }
    }
  }
}



module.exports = User