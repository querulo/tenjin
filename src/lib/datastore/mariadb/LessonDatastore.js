const BaseDatastore = require('./BaseDatastore')



module.exports = class LessonDatastore extends BaseDatastore {
  
  constructor(pool) {
    super(pool)
      
    this.table = "lessons"

    this.columnNames = ["title", "start", "end", "language", "contents", "completed"]
  }

  

  _objectToColumnsValues(data) {          // called by create()
    return [ data.title, data.start, data.end, data.language, data.contents,
      JSON.stringify(data.completed)
    ]
  }



  _formatRecords(readData) {          // called by read()
    for (let id in readData) {
      readData[id] = {
        ...readData[id],
        "completed": JSON.parse(readData[id].completed)
      }
    }
    return readData
  }



  _updateCreateColumnsValuesMap(changes) {          // called by update()
    let columnsValuesMap = {}

    if ("title" in changes) columnsValuesMap.title = changes.title
    if ("start" in changes) columnsValuesMap.start = changes.start
    if ("end" in changes) columnsValuesMap.end = changes.end
    if ("language" in changes) columnsValuesMap.language = changes.language
    if ("contents" in changes) columnsValuesMap.contents = changes.contents
    if ("completed" in changes) columnsValuesMap.completed = JSON.stringify(changes.completed)

    return columnsValuesMap
  }
}