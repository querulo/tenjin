const BaseDatastore = require('./BaseDatastore')



module.exports = class CourseDatastore extends BaseDatastore {
  
  constructor(pool) {
    super(pool)
      
    this.table = "users"
  
    this.columnNames = ["username", "firstname", "lastname", "nickname", "email", "website", "publicinfo",
    "password", "salt", "active", "role", "dashboardstyles_myteachingcoursesstyle",
    "dashboardstyles_mycoursesstyle", "dashboardstyles_activecoursesstyle"]
  }
  

  
  _objectToColumnsValues(data) {          // called by create()
    return [ data.username, data.firstname, data.lastname, data.nickname, data.email, data.website, data.publicinfo,
      data.password, data.salt, data.active ? 1 : 0, data.role, data.dashboardstyles.myteachingcoursesstyle,
      data.dashboardstyles.mycoursesstyle, data.dashboardstyles.activecoursesstyle
    ]
  }



  _formatRecords(readData) {          // called by read()
    for (let id in readData) {
      readData[id] = {
        ...readData[id],
        "active":  Boolean(readData[id].active),
        "dashboardstyles": {
          "myteachingcoursesstyle": readData[id].dashboardstyles_myteachingcoursesstyle,
          "mycoursesstyle": readData[id].dashboardstyles_mycoursesstyle,
          "activecoursesstyle": readData[id].dashboardstyles_activecoursesstyle
        }
      }
      delete readData[id].dashboardstyles_myteachingcoursesstyle
      delete readData[id].dashboardstyles_mycoursesstyle,
      delete readData[id].dashboardstyles_activecoursesstyle
    }
    return readData
  }



  _updateCreateColumnsValuesMap(changes) {          // called by update()
    let columnsValuesMap = {}

    if ("username" in changes) columnsValuesMap.username = changes.username
    if ("firstname" in changes) columnsValuesMap.firstname = changes.firstname
    if ("lastname" in changes) columnsValuesMap.lastname = changes.lastname
    if ("nickname" in changes) columnsValuesMap.nickname = changes.nickname
    if ("email" in changes) columnsValuesMap.email = changes.email
    if ("website" in changes) columnsValuesMap.website = changes.website
    if ("publicinfo" in changes) columnsValuesMap.publicinfo = changes.publicinfo
    if ("password" in changes) columnsValuesMap.password = changes.password
    if ("salt" in changes) columnsValuesMap.salt = changes.salt
    if ("active" in changes) columnsValuesMap.active = changes.active ? 1 : 0
    if ("role" in changes) columnsValuesMap.role = changes.role
    if ("dashboardstyles" in changes) {
      if ("myteachingcoursesstyle" in changes.dashboardstyles) columnsValuesMap.dashboardstyles_myteachingcoursesstyle = changes.dashboardstyles.myteachingcoursesstyle
      if ("mycoursesstyle" in changes.dashboardstyles) columnsValuesMap.dashboardstyles_mycoursesstyle = changes.dashboardstyles.mycoursesstyle
      if ("activecoursesstyle" in changes.dashboardstyles) columnsValuesMap.dashboardstyles_activecoursesstyle = changes.dashboardstyles.activecoursesstyle
    }

    return columnsValuesMap
  }
}