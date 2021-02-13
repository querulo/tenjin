const management = require('./management')
const remove = require('./remove')
const { activate, deactivate } = require('./activate-deactivate')
const move = require('./move')
const edit = require('./edit')
const newC = require('./new')
const enrollment = require('./enrollment')
const { enroll, disenroll } = require('./enroll-disenroll')



module.exports = {
  management, remove, activate, deactivate, move, edit, newC,
  enrollment, enroll, disenroll }