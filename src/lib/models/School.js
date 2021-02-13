const getDatastoreInstance = require('../datastore')



/*
read()

update(school)

-----

validate(school)
template()
*/



class School {

  static datastore = getDatastoreInstance('school')

  static coursesDatastore = getDatastoreInstance('courses')
  static usersDatastore = getDatastoreInstance('users')
  static lessonsDatastore = getDatastoreInstance('lessons')



  static async read() {
    let school = await this.datastore.read()
    school = school[0]



    // "join"

    let courses = await this.coursesDatastore.read()
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

    school.activeCourses = school.activeCourses.map(id => { return { id, ...courses[id] } })
    school.nonActiveCourses = school.nonActiveCourses.map(id => { return { id, ...courses[id] } })


    
    return school
  }



  static async update(changes) {
    if(!this.validate()) return new Error('VALIDATION')

    let school = await this.datastore.update({ id: 0 }, changes)
    return school[0]
  }



  static validate(data) {
    return true
  }


  
  static template() {
    return {
      "topBlock": {
        "name": "",
        "image": "",
        "title": "",
        "short": ""
      },
      "callOut": {
        "title": "",
        "short": ""
      },
      "activeCourses": [],
      "nonActiveCourses": []
    }
  }
}



module.exports = School