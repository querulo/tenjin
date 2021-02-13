const fs = require('fs')
const path = require('path')



const DATA_DIR = 'data'
const FILE_EXT = 'json'



class Datastore {

  static instances = {}

  static getInstance(table) {
    if (table in Datastore.instances) return Datastore.instances[table]

    const filePath = path.resolve(__dirname, `../../${DATA_DIR}/${table}.${FILE_EXT}`)
    try {
      fs.accessSync(filePath)
    } catch (err) {
      fs.writeFileSync(filePath, JSON.stringify({ biggestId: -1 }, null, 2))
    }
    Datastore.instances[table] = new Datastore(filePath)
    return Datastore.instances[table]
  }



  constructor(filePath) {
    this.filePath = filePath
    this.readCache = null
    this.locked = false
    this.callsQueue = []
  }


  
  async create(data = {}) {         // returns a "table", even if create() creates only one record
    await this._takeLock()

    let fileData = await this.readFromFile()

    let dataCopy = JSON.parse(JSON.stringify(data)) 

    const nextId = ++fileData.biggestId
    fileData[nextId] = dataCopy

    await this.writeToFile(fileData)

    this._releaseLock()
    return { [nextId]: data }
  }



  async read(query = {}) {       // always returns a "table", even if only one record is found
    await this._takeLock()

    let fileData = await this.readFromFile()
    this.readCache = fileData

    let fileDataCopy = JSON.parse(JSON.stringify(fileData))
    delete fileDataCopy.biggestId

    if(query.id || query.id === 0) {              // query is id
      let record = fileDataCopy[query.id]
      if (record) {
        this._releaseLock()
        return { [query.id]: record }
      }

      this._releaseLock()
      throw(new Error('NO_MATCHES'))
    }
    
    if(Object.keys(query).length) {               // query is not id
      fileDataCopy = this._filterByQuery(query, fileDataCopy)

      if (!Object.keys(fileDataCopy).length) {
        this._releaseLock()
        throw(new Error('NO_MATCHES'))  // potrei ritornare un oggetto vuoto??
      }

      this._releaseLock()
      return fileDataCopy
    }

    this._releaseLock()
    return fileDataCopy              // empty query
  }



  async update(query = {}, changes = {}) {      // always returns a "table", even if only one record is updated

    // with this version you can pass only the keys you are interested in, and it will do a "deep object assign" on the old record
    
    await this._takeLock()

    let fileData = await this.readFromFile()

    let changesCopy = JSON.parse(JSON.stringify(changes)) 

    if(!Object.keys(query).length) {            // empty query
      for (let key in fileData) {
        if (key !== 'biggestId') fileData[key] = this._deepAssign(fileData[key], changesCopy)
      }

      await this.writeToFile(fileData)

      let fileDataCopy = JSON.parse(JSON.stringify(fileData))
      delete fileDataCopy.biggestId
      this._releaseLock()
      return fileDataCopy
    }

    if('id' in query) {          // query is id
      if (!fileData[query.id]) {
        this.readCache = fileData
        this._releaseLock()
        throw(new Error('NO_MATCHES'))
      }

      fileData[query.id] = this._deepAssign(fileData[query.id], changesCopy)

      await this.writeToFile(fileData)

      let updated =  { [query.id]: fileData[query.id] }
      let updatedCopy = JSON.parse(JSON.stringify(updated)) 
      this._releaseLock()
      return updatedCopy
    }

    let queried = this._filterByQuery(query, fileData)      // query is not id
    if (!Object.keys(queried).length) {
      this.readCache = fileData
      this._releaseLock()
      throw(new Error('NO_MATCHES'))
    }

    for (let key in queried) {
      queried[key] = this._deepAssign(queried[key], changesCopy)
      fileData[key] = queried[key]
    }

    await this.writeToFile(fileData)

    let queriedCopy = JSON.parse(JSON.stringify(queried))
    this._releaseLock()
    return queriedCopy
  }

  async updateOver(query = {}, data = {}) {         // always returns a "table", even if only one record is updated

    // this version ovverride completely the record with the new "data" given

    await this._takeLock()

    let fileData = await this.readFromFile()

    let dataCopy = JSON.parse(JSON.stringify(data)) 

    if(!Object.keys(query).length) {            // empty query 
      for (let key in fileData) {
        if (key !== 'biggestId') fileData[key] = dataCopy
      }

      await this.writeToFile(fileData)

      let fileDataCopy = JSON.parse(JSON.stringify(fileData))
      delete fileDataCopy.biggestId
      this._releaseLock()
      return fileDataCopy
    }

    if(query.id || query.id === 0) {          // query is id
      if (!fileData[query.id]) {
        this.readCache = fileData
        this._releaseLock()
        throw(new Error('NO_MATCHES'))
      }

      fileData[query.id] = dataCopy

      await this.writeToFile(fileData)

      let updated =  { [query.id]: fileData[query.id] }
      let updatedCopy = JSON.parse(JSON.stringify(updated)) 
      this._releaseLock()
      return updatedCopy
    }

    let queried = this._filterByQuery(query, fileData)      // query is not id
    if (!Object.keys(queried).length) {
      this.readCache = fileData
      this._releaseLock()
      throw(new Error('NO_MATCHES'))
    }

    for (let key in queried) {
      queried[key] = dataCopy
      fileData[key] = dataCopy
    }

    await this.writeToFile(fileData)

    let queriedCopy = JSON.parse(JSON.stringify(queried))
    this._releaseLock()
    return queriedCopy
  }



  async delete(query = {}) {           // returns true (or throws an error)
    await this._takeLock()

    let fileData = await this.readFromFile()

    if (!Object.keys(query).length) {         // empty query
      const biggestId = fileData.biggestId

      await this.writeToFile({ biggestId })

      this._releaseLock()
      return true
    }

    if(query.id || query.id === 0) {          // query is id
      if (!fileData[query.id]) {
        this.readCache = fileData
        this._releaseLock()
        throw(new Error('NO_MATCHES'))
      }

      delete fileData[query.id]
      await this.writeToFile(fileData)

      this._releaseLock()
      return true
    }

    let queried = this._filterByQuery(query, fileData)         // query is not id
    
    if (!Object.keys(queried).length) {
      this.readCache = fileData
      this._releaseLock()
      throw(new Error('NO_MATCHES'))
    }

    Object.keys(queried).forEach(id => delete fileData[id])
  
    await this.writeToFile(fileData)

    this._releaseLock()
    return true
  }



  async readFromFile() {
    let fileData
    if (this.readCache) {
      fileData = this.readCache
    } else {
      try {
        fileData = await fs.promises.readFile(this.filePath)
      } catch (err) {
        this._releaseLock()
        throw(err)
      }

      fileData = JSON.parse(fileData.toString())
    }
    return fileData
  }

  async writeToFile(fileData) {
    this.readCache = null
    try {
      await fs.promises.writeFile(this.filePath, JSON.stringify(fileData, null, 2))
    } catch (err) {
      this._releaseLock()
      throw(err)
    }
    this.readCache = fileData
  }



  _filterByQuery(query, fileData) {
    let matching = {}

    function match(record) {
      for (let key in query) {
        if (record[key] !== query[key]) return false
      }
      return true
    }

    for (let id in fileData) {
      if (id !== 'biggestId' && match(fileData[id])) matching = { ...matching, [id]: { ...fileData[id] } }
    }

    return matching
  }

  _deepAssign(obj1, obj2) {
    for (let key in obj2) {
      if (!obj1[key] || typeof obj1[key] !== 'object' || typeof obj2[key] !== 'object') obj1[key] = obj2[key]
      else if (Array.isArray(obj1[key]) || Array.isArray(obj2[key])) obj1[key] = obj2[key]     // with arrays, simply substitutes the new array
      else obj1[key] = this._deepAssign(obj1[key], obj2[key])
    }
    return obj1
  }


  
  async _takeLock() {
    if (!this.locked) return this.locked = true

    await new Promise((resolve) => {
      this.callsQueue.push(resolve)
    })
  }

  _releaseLock() {
    if (!this.callsQueue.length) return this.locked = false

    let nextCall = this.callsQueue.shift()
    nextCall()
  }
}



module.exports = Datastore.getInstance