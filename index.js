const Sentry = require('@sentry/node')
Sentry.init({ dsn: 'https://8ae48a0f7a4645e0b72042f5cb3f85fc@sentry.io/1826211' })
const express = require('express')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const https = require('https')
const http = require('http')
const fs = require('fs')
const app = express()
const path = require('path')
const helmet = require('helmet')
const db = require('quick.db')

var users_db = new db.table('users')

/** Initialization */
app.use(cookieParser())
app.use((req, res, next) => {
  if (Object.keys(req.cookies).length > 0) {
    next()
  } else {
    res.render('cookie')
  }
})
app.set('view engine', 'pug')
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(express.static(path.join(__dirname, '/public')))
app.use(helmet())
app.use(helmet.frameguard({ action: 'sameorigin' }))
app.use(session({
  cookie: { maxAge: 60000 },
  secret: 'keyboard cat',
  saveUninitialized: false,
  resave: false
}));
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success')
  res.locals.error_messages = req.flash('error')
  next()
})

const stat = require('./api/static')
const sitemap = require('./api/sitemap')
const users = require('./api/users')
const api = require('./api/api')
const posts = require('./api/posts')

/** Load pages */
app.get('/', stat.index)
app.get('/welcome', stat.welcome)
app.get('/rules', stat.rules)
app.get('/terms', stat.terms)
app.get('/create', stat.create)

app.get('/login', stat.login)
app.get('/signup', stat.signup)

/** Post API */
app.get('/like/:postID', posts.like)
app.get('/dislike/:postID', posts.dislike)
app.get('/unfollow/:userId', posts.unfollow)
app.get('/follow/:userId', posts.follow)

/** API */
app.get('/api/v1/get-user/:userId', api.get_user)
app.get('/api/v1/get-avatar/:userId', api.get_avatar)
app.post('/api/post', api.post_image)

/** Sitemaps */
app.get('/sitemap', sitemap.sitemap)
app.get('/sitemap.xml', sitemap.sitemap)
app.get('/map', sitemap.sitemap)
app.get('/maps', sitemap.sitemap)

/** User/Profile/ETC. */
app.post('/users/signup', api.add_user)
app.post('/users/login', api.login_user)
app.get('/logout', users.logout)
app.get('/settings', users.settings)
app.get('/profile', users.profile)
app.get('/profile/:userId', users.user_profile)
app.post('/profile/submit-changes', api.profile_submit)
app.post('/settings/submit-changes', api.settings_submit)

/** 404 */
function getQuote() {
  const json = require("./quotes.json")
  const values = Object.values(json)
  const quote = values[parseInt(Math.random() * values.length)]
  return quote
}

function getUser(cookies) {
  var session = cookies['session'];
  if (!session) {
    return false
  }
  var username = session.split(".")[0]
  var sessionDb = users_db.get(`${username}.session`)
  if (session === sessionDb) {
    return username
  } else {
    return false
  }
}

app.use((req, res, next) => {
  res.status(404)
  var quote = getQuote()
  var user = getUser(req.cookies)
  if (!user) {
    res.render('404', { title: '404', quote: quote })
  } else {
    var username = user
    res.render('404', { title: '404', quote: quote, username: username, authorized: true })
  }
})

/** Start the listener */
try {
  const privateKey = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/privkey.pem', 'utf8');
  const certificate = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/cert.pem', 'utf8');
  const ca = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/chain.pem', 'utf8');
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  }
  const httpsServer = https.createServer(credentials, app)
  httpsServer.listen(443, () => {
    console.log('Server started listening on port 443!')
  })
} catch (e) {
  const httpServer = http.createServer(app)
  httpServer.listen(8000, () => {
    console.log('Server started listening on port 8000!')
  })
}
