const BaseDatastore = require('./BaseDatastore')



module.exports = class CourseDatastore extends BaseDatastore {

  constructor(pool) {
    super(pool)
      
    this.table = "courses"

    this.columnNames = ["title", "slug", "image", "short", "start", "end", "language",
    "description", "teacher", "students", "lessons", "selfenrollment"]
  }


  
  _objectToColumnsValues(data) {          // called by create()
    return [ data.title, data.slug, data.image, data.short, data.start, data.end, data.language,
      data.description, data.teacher,
      JSON.stringify(data.students), JSON.stringify(data.lessons),
      data.selfenrollment ? 1 : 0
    ]
  }



  _formatRecords(readData) {          // called by read()
    for (let id in readData) {
      readData[id] = {
        ...readData[id],
        "students": JSON.parse(readData[id].students),
        "lessons": JSON.parse(readData[id].lessons),
        "selfenrollment": Boolean(readData[id].selfenrollment)
      }
    }
    return readData
  }



  _updateCreateColumnsValuesMap(changes) {          // called by update()
    let columnsValuesMap = {}

    if ("title" in changes) columnsValuesMap.title = changes.title
    if ("slug" in changes) columnsValuesMap.slug = changes.slug
    if ("image" in changes) columnsValuesMap.image = changes.image
    if ("short" in changes) columnsValuesMap.short = changes.short
    if ("start" in changes) columnsValuesMap.start = changes.start
    if ("end" in changes) columnsValuesMap.end = changes.end
    if ("language" in changes) columnsValuesMap.language = changes.language
    if ("description" in changes) columnsValuesMap.description = changes.description
    if ("teacher" in changes) columnsValuesMap.teacher = changes.teacher
    if ("students" in changes) columnsValuesMap.students = JSON.stringify(changes.students)
    if ("lessons" in changes) columnsValuesMap.lessons = JSON.stringify(changes.lessons)
    if ("selfenrollment" in changes) columnsValuesMap.selfenrollment = changes.selfenrollment ? 1 : 0

    return columnsValuesMap
  }
}


