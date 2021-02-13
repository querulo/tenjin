const mariadb = require('mariadb')

const SchoolDatastore = require('./SchoolDatastore')
const CourseDatastore = require('./CourseDatastore')
const LessonDatastore = require('./LessonDatastore')
const UserDatastore = require('./UserDatastore')



const datastore = {

  pool: mariadb.createPool({host: "localhost", user: "tenjin", password: "password", connectionLimit: 5}),

  instances: {},

  getDatastore(table) {
    if (table in datastore.instances) return datastore.instances[table]

    switch(table) {
      case "school":
        return datastore.instances.school = new SchoolDatastore(datastore.pool)
      case "courses":
        return datastore.instances.courses = new CourseDatastore(datastore.pool)
      case "lessons":
        return datastore.instances.lessons = new LessonDatastore(datastore.pool)
      case "users":
        return datastore.instances.users = new UserDatastore(datastore.pool)
      default:
        throw(new Error('GETDATASTORE_INVALID_TABLE_NAME'))
    }
  } 

}



datastore.getDatastore.pool = datastore.pool

module.exports = datastore.getDatastore