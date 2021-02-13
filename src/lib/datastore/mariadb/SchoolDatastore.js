const BaseDatastore = require('./BaseDatastore')



module.exports = class SchoolDatastore extends BaseDatastore {

  constructor(pool) {
    super(pool)
    
    this.table = "school"

    this.columnNames = ["topblock_name", "topblock_image", "topblock_title", "topblock_short",
    "callout_title", "callout_short", "active_courses", "not_active_courses"]
  }


  
  _objectToColumnsValues(data) {          // called by create()
    return [ data.topBlock.name, data.topBlock.image, data.topBlock.title, data.topBlock.short,
      data.callOut.title, data.callOut.short,
      JSON.stringify(data.activeCourses), JSON.stringify(data.nonActiveCourses),
    ]
  }



  _formatRecords(readData) {          // called by read()
    for (let id in readData) {
      readData[id] = {
        "topBlock": {
          "name": readData[id].topblock_name,
          "image": readData[id].topblock_image,
          "title": readData[id].topblock_title,
          "short": readData[id].topblock_short
        },
        "callOut": {
          "title": readData[id].callout_title,
          "short": readData[id].callout_short
        },
        "activeCourses": JSON.parse(readData[id].active_courses),
        "nonActiveCourses": JSON.parse(readData[id].not_active_courses)
      }  
    }
    return readData
  }



  _updateCreateColumnsValuesMap(changes) {          // called by update()
    let columnsValuesMap = {}

    if ("topBlock" in changes) {
      if ("name" in changes.topBlock) columnsValuesMap.topblock_name = changes.topBlock.name
      if ("image" in changes.topBlock) columnsValuesMap.topblock_image = changes.topBlock.image
      if ("title" in changes.topBlock) columnsValuesMap.topblock_title = changes.topBlock.title
      if ("short" in changes.topBlock) columnsValuesMap.topblock_short = changes.topBlock.short
    }
    if ("callOut" in changes) {
      if ("title" in changes.callOut) columnsValuesMap.callout_title = changes.callOut.title
      if ("short" in changes.callOut) columnsValuesMap.callout_short = changes.callOut.short
    }
    if ("activeCourses" in changes) columnsValuesMap.active_courses = JSON.stringify(changes.activeCourses)
    if ("nonActiveCourses" in changes) columnsValuesMap.not_active_courses = JSON.stringify(changes.nonActiveCourses)

    return columnsValuesMap
  }
}