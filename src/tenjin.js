require('dotenv').config()

const path = require('path')

const express = require('express')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const helmet = require('helmet')

const sessionStore = require('./lib/redis-session-store')

const mountRoutes = require('./routes')
const middleware = require('./lib/middleware')

const { COOKIE_SECRET } = process.env



// CONFIGURATION

const app = express()
const port = process.argv[2] || process.env.PORT || 3000

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')



// MIDDLEWARE

app.use(express.static('public'))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(cookieParser(COOKIE_SECRET))
app.use(expressSession({
  store: sessionStore,
  secret: COOKIE_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(helmet({ contentSecurityPolicy: false }))



// CUSTOM MIDDLEWARE

app.use(middleware.sessionTZ)
app.use(middleware.flash('autoDelete'))
app.use(middleware.keepForm)
app.use(middleware.loadSchool)
app.use(middleware.loadUser)
app.use(middleware.xssFilters)



mountRoutes(app)



app.use((req, res) => res.status(404).render('error', { title: '404 - NOT FOUND' }))

app.use((err, req, res, next) => {
  console.log(err)
  res.status(500).render('error', { title: 'SERVER ERROR', message: err.stack })
})



app.listen(port, () => console.log('listening on port ' + port))