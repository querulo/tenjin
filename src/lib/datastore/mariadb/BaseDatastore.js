module.exports = class BaseDatastore {

  constructor(pool) {
    this.pool = pool
    this.readCache = null
  }



  async create(data) {
    this.readCache = null
    
    let columnNames = this.columnNames    // this is different for each sub-class
    
    let valuesArray = this._objectToColumnsValues(data)    // this is different for each sub-class

    let conn
    let res
    try {
      conn = await this.pool.getConnection();
      await conn.query("USE tenjin;")

      res = await conn.query(
        `INSERT INTO ${this.table}(
        ${columnNames.join(', ')}
        )
        VALUES(${columnNames.map(c => `?`).join(', ')})`,
        valuesArray
      )
    } catch (err) {
      throw(err)
    } finally {
      if (conn) conn.release()
    }

    return { [res.insertId]: data }
  }



  async read(query = {}) {
    if (this.readCache) {

      let allRowsData = this.readCache
      
      let allRowsDataCopy = JSON.parse(JSON.stringify(allRowsData))

      if (!Object.keys(query).length) {
        return allRowsDataCopy
      }

      if(query.id || query.id === 0) {              // query is id
        let record = allRowsDataCopy[query.id]
        if (record) {
          return { [query.id]: record }
        }
  
        throw(new Error('NO_MATCHES'))
      }
      
      if(Object.keys(query).length) {               // query is not id
        allRowsDataCopy = this._filterByQuery(query, allRowsDataCopy)
        if (!Object.keys(allRowsDataCopy).length) {
          throw(new Error('NO_MATCHES'))
        }
  
        return allRowsDataCopy
      }

    } else {
      let readData
      let conn
      try {

        conn = await this.pool.getConnection();
        await conn.query("USE tenjin;")

        let rows

        if (!Object.keys(query).length) {

          rows = await conn.query(`SELECT * FROM ${this.table};`)

        } else {

          let SQLQuery = `SELECT * FROM ${this.table} WHERE `
          let whereClauses = []
          for (let key in query) {
            let clause = `${key} = `
            let value = `${query[key]}`
            if (typeof query[key] === "string") value = `"` + value + `"`
            clause += value
            whereClauses.push(clause)
          }
          SQLQuery += ( whereClauses.join(' and ') + ';' )

          rows = await conn.query(SQLQuery)

        }

        readData = Array.from(rows).reduce((ogg, row) => {
          let { id } = row
          delete row.id
          return { ...ogg, [id]: row }
        }, {})

        if (!Object.keys(query).length) this.readCache = readData

        if (!Object.keys(readData).length && Object.keys(query).length) throw(new Error('NO_MATCHES'))

      } catch (err) {
        if (err.code === "ER_BAD_FIELD_ERROR") throw(new Error('NO_MATCHES'))
        throw(err)
      } finally {
        if (conn) conn.release()
      }

      readData = this._formatRecords(readData)    // this is different for each sub-class

      return JSON.parse(JSON.stringify(readData))
    }
  }



  async update(query = {}, changes) {
    if (!Object.keys(changes).length) throw(new Error('DATASTORE_UPDATE_CHANGES_ARE_EMPTY'))

    let columnsValuesMap = this._updateCreateColumnsValuesMap(changes)  // this is different for each sub-class

    if (!Object.keys(columnsValuesMap).length) throw(new Error('DATASTORE_UPDATE_CHANGES_ARE_WRONG'))

    this.readCache = null

    let conn
    let res

    try {

      conn = await this.pool.getConnection();
      await conn.query("USE tenjin;")
      
      let SQLQuery = `UPDATE ${this.table} SET `

      let setAssignments = []
      for (let column in columnsValuesMap) {
        let assignment = column + ` = `
        let value = columnsValuesMap[column]
        if (typeof value === "string") value = `"` + value + `"`
        assignment += value
        setAssignments.push(assignment)
      }
      SQLQuery += setAssignments.join(', ')

      SQLQuery += ', id=LAST_INSERT_ID(id)'     // this allows you to then know the updated record's id
                                                // (don't know how to kwnow all ids for multiple records...)
      if (Object.keys(query).length) {

        SQLQuery += " WHERE "
        let whereClauses = []
        for (let key in query) {
          let clause = `${key} = `
          let value = `${query[key]}`
          if (typeof query[key] === "string") value = `"` + value + `"`
          clause += value
          whereClauses.push(clause)
        }
        SQLQuery += ( whereClauses.join(' and ') + ';' )

      }

      SQLQuery += `;`

      res = await conn.query(SQLQuery)

      if (res.affectedRows === 1) {           // don't know how to do this for multiple records...
        res = await conn.query("SELECT LAST_INSERT_ID();")
  
        let updatedId = res[0]["LAST_INSERT_ID()"]

        let updatedRecord = await this.read({ id: updatedId })

        return { [updatedId]: updatedRecord[updatedId] }
      }

    } catch (err) {
      throw(err)
    } finally {
      if (conn) conn.release()
    }

    if (Object.keys(query).length && res.affectedRows === 0) throw(new Error('NO_MATCHES'))
  }



  async delete(query = {}) {
    this.readCache = null

    let conn
    let res

    try {

      conn = await this.pool.getConnection();
      await conn.query("USE tenjin;")

      if (!Object.keys(query).length) {

        res = await conn.query(`DELETE FROM ${this.table};`)

      } else {

        let SQLQuery = `DELETE FROM ${this.table} WHERE `
        let whereClauses = []
        for (let key in query) {
          let clause = `${key} = `
          let value = `${query[key]}`
          if (typeof query[key] === "string") value = `"` + value + `"`
          clause += value
          whereClauses.push(clause)
        }
        SQLQuery += ( whereClauses.join(' and ') + ';' )

        res = await conn.query(SQLQuery)

      }

    } catch (err) {
      if (err.code === "ER_BAD_FIELD_ERROR") throw(new Error('NO_MATCHES'))
      throw(err)
    } finally {
      if (conn) conn.release()
    }

    if (Object.keys(query).length && res.affectedRows === 0) throw(new Error('NO_MATCHES'))

    return true
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
      if (match(fileData[id])) matching = { ...matching, [id]: { ...fileData[id] } }
    }

    return matching
  }
}