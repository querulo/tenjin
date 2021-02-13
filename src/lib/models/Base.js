/*
create(record)

read(query)
reaById(id)
readAll()

update(query, record)

delete(query)
deleteById(id)
*/



class BaseModel {

  static async create(data) {
    let result = await this.datastore.create(data)

    let id = Number(Object.keys(result)[0])
    return { id, ...result[id] }
  }



  static async read(query) {
    return await this.datastore.read(query)
  }

  static async readById(id) {
    let result =  await this.datastore.read({ id })

    return { id, ...result[id] }
  }

  static async readAll() {
    return await this.datastore.read()
  }



  static async update(query, changes) {
    return await this.datastore.update(query, changes)
  }



  static async delete(query) {
    return await this.datastore.delete(query)
  }

  static async deleteById(id) {
    return await this.datastore.delete({ id })
  }
}



module.exports = BaseModel