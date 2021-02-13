const json = require('./json')
const mariaDB = require('./mariadb')



module.exports = json







/*

--------------------- DATASTORE: ---------------------


this module exports a single function:

getDatastore(tableName)

this function returns an instance of the datastore for the "table" name you give it
(a "singleton" instance)



the datastore instances have 4 public methods: create, read, update, delete
(all 4 return a promise)



CREATE

create(data)



READ

read([query])



UPDATE

update([query], data)



DELETE

delete([query])



*/

