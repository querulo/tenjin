const signin = require('./signin')
const signup = require('./signup')
const logout = require('./logout')
const goToSignin = require('./goToSignin')
const goToHome = require('./goToHome')
const noPermissions = require('./noPermissions')


module.exports = { signin, signup, logout, goToSignin, goToHome, noPermissions }