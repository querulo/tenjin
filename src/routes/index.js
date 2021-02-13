const controllers = require('../lib/controllers')
const courseRouter = require('./courseRouter')
const adminRouter = require('./adminRouter')



module.exports = app => {

  app.route('/signin')
    .get(controllers.auth.signin.get)
    .post(controllers.auth.signin.post)

  app.route('/signup')
    .get(controllers.auth.signup.get)
    .post(controllers.auth.signup.post)

  app.get('/logout', controllers.auth.logout)



  app.get('/', controllers.home)



  app.route('/profile')
    .get(controllers.profile.get)
    .post(controllers.profile.post)



  app.use('/course', courseRouter(controllers.course))



  app.use('/admin', adminRouter(controllers.admin))



}