const fs = require('fs')
const path = require('path')

require('dotenv').config()

const { copyDirRecursive } = require('../../../lib/utils')

const restoreMariadb = require('./restoreMariadb')



// RESTORE THE JSON DATASTORE

const dataPath = path.resolve(__dirname, '../../../data')
const dataBCKPath = path.resolve(__dirname, '../../../data-backup')

fs.rmdirSync(dataPath, { recursive: true })
copyDirRecursive(dataBCKPath, dataPath)



// RESTORE THE MARIADB DATABASE

restoreMariadb()



// RESTORE THE UPLOADS

const uploadsPath = path.resolve(__dirname, '../../../public/img/uploads')
const uploadsBCKPath = path.resolve(__dirname, '../../../public/img/uploads-backup')

fs.rmdirSync(uploadsPath, { recursive: true })
copyDirRecursive(uploadsBCKPath, uploadsPath)



console.log('database and uploads restored!')