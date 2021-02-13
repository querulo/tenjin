const remove = require('./remove')
const edit = require('./edit')
const move = require('./move')
const newL = require('./new')
const completion = require('./completion')
const { completed, notCompleted } = require('./completed-notcompleted')



module.exports = { edit, remove, move, newL, completion, completed, notCompleted }