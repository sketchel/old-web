const express = require('express');
const db = require('quick.db');
const flash = require('connect-flash');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const chalk = require('chalk');
const uuidv4 = require('uuid/v4');
const date = require('date-and-time');

const app = express();
const port = 80;


// Views
app.set('view engine', 'pug')

// Change middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(__dirname + '/public'))

app.use(session({
  cookie: { maxAge: 60000 },
  secret: 'keyboard cat',
  saveUninitialized: false,
  resave: false
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success')
  res.locals.error_messages = req.flash('error')
  next()
})

function getQuote() {
  const json = require("./quotes.json")
  const values = Object.values(json)
  const quote = values[parseInt(Math.random() * values.length)]
  return quote
}

// Functions
function getUser(cookies) {
  var session = cookies['session'];
  if (!session) {
    console.log("user not logged in")
    return false
  }
  var username = session.split(".")[0]
  var session_db = db.get(`${username}.session`)
  if (session === session_db) {
    return username
    console.log("user logged in.")
  } else {
    return false
  }
}

function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};

// Load pages
app.get('/', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('home', { quote: quote })
  } else {
    var username = user;
    res.render('home', { quote: quote, username: username, authorized: "true" })
  }
});
app.get('/welcome', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('welcome', { quote: quote })
  } else {
    var username = user;
    res.render('welcome', { quote: quote, username: username, authorized: "true" })
  }
});
app.get('/rules', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('rules', { quote: quote })
  } else {
    var username = user;
    res.render('rules', { quote: quote, username: username, authorized: "true" })
  }
});
app.get('/terms', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('terms', { quote: quote })
  } else {
    var username = user;
    res.render('terms', { quote: quote, username: username, authorized: "true" })
  }
});
app.get('/login', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('login', { quote: quote })
  } else {
    var username = user;
    res.render('login', { quote: quote, username: username, authorized: "true" })
  }
});
app.get('/signup', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('signup', { quote: quote })
  } else {
    var username = user;
    res.render('signup', { quote: quote, username: username, authorized: "true" })
  }
});
app.get('/settings', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('settings', { quote: quote })
  } else {
    var username = user;
    res.render('settings', { quote: quote, username: username, authorized: "true" })
  }
});
app.get('/follow/:userId', (req, res) => {
  if (!req.params.userId) {
    res.render('404')
  }
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('not-logged-in', { quote: quote })
  }
  var to_follow = db.get(req.params.userId);
  if (!to_follow) {
    res.render("404", { quote: quote })
  }
  if (req.params.userId === user) {
    res.redirect("/profile")
  } else {
    if (db.get(`${req.params.userId}.followers_list`).includes(user)) {
      res.redirect(`/profile/${req.params.userId}`)
      return
    }
    db.push(`${req.params.userId}.followers_list`, `${user}`)
    db.add(`${req.params.userId}.followers`, 1)
    db.add(`${user}.following`, 1)
    db.push(`${user}.following_list`, user)
    res.redirect(`/profile/${req.params.userId}`)
  }
})

app.get('/profile', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('profile', { quote: quote })
  } else {
    var username = user;
    var bio = db.get(`${user}.bio`)
    var avatar = db.get(`${user}.avatar`)
    var rank = db.get(`${user}.rank`)
    var following = db.get(`${user}.following`)
    var followers = db.get(`${user}.followers`)
    var joindate = db.get(`${user}.joindate`)
    res.render('profile', { quote: quote, 
      username: username, 
      bio: bio, 
      avatar: avatar, 
      rank: rank, 
      followers: followers, 
      following: following, 
      authorized: "true",
      joindate: joindate
    })
  }
});

// API
app.get('/logout', (req, res) => {
  var user = getUser(req.cookies)
  if (!user) {
    return res.redirect("/")
  }
  res.clearCookie("session")
  res.redirect("/")
  db.set(`${user}.session`, null);
});

app.post('/users/signup', (req, res) => {
  if (!req.body.username) {
    console.log("no username")
    req.flash('error', 'No username provided.')
    res.redirect('/signup')
    return
  } else {
    if (req.body.username.length <= 2) {
      req.flash('error', 'Username is too short.')
      res.redirect('/signup')
      console.log("username too short.")
      return    
    } else {
      if (!req.body.email) {
        req.flash('error', 'No email provided.')
        res.redirect('/signup')
        return
      }   
      if (!req.body.password) {
        req.flash('error', 'No password provided.')
        res.redirect('/signup')
        return
      }  
      if (!req.body.confirmPassword) {
        req.flash('error', 'No confirm password provided.')
        res.redirect('/signup')
        return
      } 
      if (req.body.confirmPassword !== req.body.password) {
        req.flash('error', 'Password doesn\'t match confirm password.')
        res.redirect('/signup')
        return
      } else if (req.body.tosCheck !== "on") {
        req.flash('error', 'I highly doubt you think you are going to receive an account if you don\'t agree to the checkbox below.')
        res.redirect('/signup')
        return
      } else if (!db.get(`${req.body.username}`)) {
        var username = req.body.username;
        var alphanumeric = isAlphaNumeric(username);
        if (alphanumeric === false) {
          req.flash('error', 'Your username isn\'t alphanumeric.')
          res.redirect('/signup')
          return
        }
        var password = req.body.password;
        var email = req.body.email;
        const now = new Date();
        db.set(`${username}`, {
          "password" : password, 
          "email" : email, 
          "followers": 0,
          "following": 0,
          "followers_list": [],
          "following_list": [],
          "password" : password, 
          "rank" : 'default', 
          "username" : username, 
          "nsfw": false,
          "private": false,
          "avatar" : "/assets/profile.png", 
          "bio" : "This user prefers to stay quiet.",
          "joindate": date.format(now, 'MM/DD/YYYY'),
          "jointime": date.format(now, 'HH:mm:ss')
        })
        var session = uuidv4();
        res.cookie('session', `${username}.${session}`)
        db.set(`${username}.session`, `${username}.${session}`);
        res.redirect('/welcome')
      } else {
        req.flash('error', 'Username has been already taken, sorry.')
        res.redirect('/signup')
        return
      }
    } 
  }      
})
app.post('/settings/submit-changes', (req, res) => {
  var new_username = req.body.username;
  var username = getUser(req.cookies)
  var current_password = req.body.currentpass;
  var new_password = req.body.newpass;
  var nsfw_check = req.body.nsfwCheck;
  var private_check = req.body.privateCheck;
  if (current_password) {
    if (!new_password) {
      req.flash('error', 'You did not insert the current password.')
      res.redirect('/settings')
      return
    }
  }
  if (current_password) {
    if (current_password !== db.get(`${username}.password`)) {
      req.flash('error', 'Your current password is incorrect.')
      res.redirect('/settings')
      return    
    }
  }
  if (current_password === db.get(`${username}.password`)) {
    if (new_password.length < 6) {
      req.flash('error', 'Your new password must be 6 characters or more.')
      res.redirect('/settings')
      return
    } else {
      db.set(`${username}.password`, new_password);
    }
  }
  if (nsfw_check == "on") {
    db.set(`${username}.nsfw`, true);
  } else {
    db.set(`${username}.nsfw`, false);
  }
  if (private_check == "on") {
    db.set(`${username}.private`, true);
  } else {
    db.set(`${username}.private`, false);
  }  
  if (new_username) {
    var alphanumeric = isAlphaNumeric(new_username) 
    if (alphanumeric === false) {
      req.flash('error', 'Your inserted username isn\'t alphanumeric.')
      res.redirect('/settings')
      return
    } else {
      req.flash('error', 'Changing username is a feature that\'s coming soon')
      res.redirect('/settings')
      return
    }
  }
  req.flash('success', 'Successfully saved changes.')
  res.redirect('/settings')
  return
});

app.post('/users/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  if (!username) {
    req.flash('error', 'No username provided.')
    res.redirect('/login')
    return
  }
  if (!password) {
    req.flash('error', 'No password provided.')
    res.redirect('/login')
    return
  }
  var user = db.has(`${username}`);
  if (!user) {
    req.flash('error', 'Username invalid.')
    res.redirect('/login')
    return
  } 
  if (db.get(`${username}.password`) != password) {
    req.flash('error', 'Password invalid.')
    res.redirect('/login')
    return
  }
  var session = uuidv4();
  res.cookie('session', `${username}.${session}`)
  db.set(`${username}.session`, `${username}.${session}`);
  res.redirect('/')

});


// Catch 404s
app.use((req, res, next) => {
  res.status(404);
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('404', { quote: quote })
  } else {
    var username = user;
    res.render('404', { quote: quote, username: username, authorized: "true" })
  }
});

// Start listener
app.listen(port, () => console.log('Server started listening on port 80!'))