const express = require('express')
const db = require('quick.db')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const passport = require('passport')
const session = require('express-session')
const uuidv4 = require('uuid/v4')
const date = require('date-and-time')
const bcrypt = require('bcrypt')
const https = require('https')
const fs = require('fs');
const app = express();
const markdown = require('markdown')
const xss = require('xss')
const request = require('request');
const { createCanvas, loadImage } = require('canvas')
var base64ToImage = require('base64-to-image')
const Sentry = require('@sentry/node')
Sentry.init({ dsn: 'https://8ae48a0f7a4645e0b72042f5cb3f85fc@sentry.io/1826211' })

var users = new db.table('users')
var posts = new db.table('posts')

var discord = {
  "oauth": {
    "clientId": "645366454618816522",
    "clientSecret": "d2Hfn0cHpPPwoRKtpnuyM8amIxluwxF9"
  },
  "bot": {
    "token": "NjQ1MzY2NDU0NjE4ODE2NTIy.XdBkSQ.xl9NqXwKhTtToT8uFd_G2zHTdSg"
  },
  "scopes": [
    "identify",
    "email"
  ]
};
discord.scope = () => {
  return discord.scopes.join("%20");
}
const grecaptcha = {
  "site": "6LctSsMUAAAAADBNNLlYhZ-i7coSpp4iOQyYOMpv",
  "secret": "6LctSsMUAAAAAAIcCz8EeKT-RnrNAAFpyoQBuhuP"
};

// Anti-Deus Ex Machina
// users.set('Minota.rank', 'owner')

// Views
app.set('view engine', 'pug')

// Change middleware
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb'}))
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
    return false
  }
  var username = session.split(".")[0]
  var session_db = users.get(`${username}.session`)
  if (session === session_db) {
    return username
  } else {
    return false
  }
}

function removeA (arr) { // Credit: github.com/zetari
  let what
  let a = arguments
  let L = a.length
  let ax
  while (L > 1 && arr.length) {
    what = a[--L]
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1)
    }
  }
  return arr
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
function queryParam(str) {
  str.split('&');
}
function webPush(user) {

}
function postToSketchel(post, cookies) {
  
}


// Sitemap for better search results
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(__dirname + "/map.xml");
})
app.get('/sitemap', (req, res) => {
  res.sendFile(__dirname + "/map.xml");
})
app.get('/map', (req, res) => {
  res.sendFile(__dirname + "/map.xml");
})
app.get('/maps', (req, res) => {
  res.sendFile(__dirname + "/map.xml");
})

// User API


// Public API
app.post('/api/post', (req, res) => {
  
  try {
    let user = getUser(req.cookies)
    if (!user) {
      throw "User isn't logged in."
    }
    let body = JSON.parse(Object.keys(req.body)[0]);
    let canvas = createCanvas(body.width, body.height);
    let ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = body.width*body.height;
    res.set("brushSize", body.width*body.height);
    ctx.moveTo(1, 1);
    ctx.lineTo(body.width, body.height);
    for (let iii = 0; iii < body.history.length; iii++) {
      let el = body.history[iii];

      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.width;
      ctx.moveTo(el.from.x, el.from.y);
      ctx.lineTo(el.to.x, el.to.y);
      ctx.stroke();
    }
    let id = "";
    let path = "";
    while (true)
    {
      id = uuidv4()
      path = __dirname + "/public/cdn/" + id + ".png";
      if (!fs.existsSync(path))
      {
        break;
      }
    }
    let image = "https://sketchel.art/cdn/" + path.split("/public/cdn/")[1]
    let base = canvas.toDataURL()
    var base64Data = base.replace(/^data:image\/png;base64,/, "");

    posts.set(id, {"image_url": image, "author": user, "likes": 0, "dislikes": 0, "comments": 0, "comments_list": []})
    users.add(`${user}.posts`, 1)
    users.push(`${user}.posts_list`, id)
    res.send(`${id}`)

    require("fs").writeFile(path, base64Data, 'base64', function(err) {
      console.log(err);
    });
  } catch (err) {
    let id = Sentry.captureException(err);
    res.send("There was an error with your request. Reference error ID " + id + " with support");
  }
})

app.get('/post/:postID', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  var post = req.params.postID;
  if (!posts.get(`${post}`)) {
    res.redirect('/postnotfoundlol')
  }
  var likes = posts.get(`${post}.likes`)
  var comments = posts.get(`${post}.comments`)
  var comments_list = posts.get(`${post}.comments_list`)
  var dislikes = posts.get(`${post}.dislikes`)
  var image_url = posts.get(`${post}.image_url`)
  var rating = dislikes + likes
  if (!user) {
    res.render('post', { quote: quote, image_url: image_url, likes: likes, dislikes: dislikes, comments: comments, comments_list: comments_list, rating: rating })
  } else {
    res.render('post', { quote: quote, image_url: image_url, username: user, authorized: "true", likes: likes, dislikes: dislikes, comments: comments, comments_list: comments_list, rating: rating })
  }
})


// Load pages
app.get('/beta/canvas', (req, res) => {
  res.render('canvas')
})
app.get('/beta/create', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('create', { quote: quote })
  } else {
    res.render('create', { quote: quote, username: user, authorized: "true" })
  }
})

app.get('/', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  var dark = users.get(`${user}.dark`)
  if (!user) {
    if (dark) {
      res.render('home', { quote: quote, dark: "true" })
    } else {
      res.render('home', { quote: quote })
    }
  } else {
    if (dark) {
      var username = user;
      res.render('home', { quote: quote, username: username, authorized: "true", dark: "true" })
    } else {
      var username = user;
      res.render('home', { quote: quote, username: username, authorized: "true" })      
    }
  }
});

app.get('/welcome', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  var dark = users.get(`${user}.dark`)
  if (!user) {
    if (dark) {
      res.render('welcome', { quote: quote, dark: "true" })
    } else {
      res.render('welcome', { quote: quote })
    }
  } else {
    if (dark) {
      var username = user;
      res.render('welcome', { quote: quote, username: username, authorized: "true", dark: "true" })
    } else {
      var username = user;
      res.render('welcome', { quote: quote, username: username, authorized: "true" })      
    }
  }
});
app.get('/rules', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  var dark = users.get(`${user}.dark`)
  if (!user) {
    if (dark) {
      res.render('rules', { quote: quote, dark: "true" })
    } else {
      res.render('rules', { quote: quote })
    }
  } else {
    if (dark) {
      var username = user;
      res.render('rules', { quote: quote, username: username, authorized: "true", dark: "true" })
    } else {
      var username = user;
      res.render('rules', { quote: quote, username: username, authorized: "true" })      
    }
  }
});
app.get('/privacy', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  var dark = users.get(`${user}.dark`)
  if (!user) {
    if (dark) {
      res.render('privacy', { quote: quote, dark: "true" })
    } else {
      res.render('privacy', { quote: quote })
    }
  } else {
    if (dark) {
      var username = user;
      res.render('privacy', { quote: quote, username: username, authorized: "true", dark: "true" })
    } else {
      var username = user;
      res.render('privacy', { quote: quote, username: username, authorized: "true" })      
    }
  }
});

app.get('/terms', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  var dark = users.get(`${user}.dark`)
  if (!user) {
    if (dark) {
      res.render('terms', { quote: quote, dark: "true" })
    } else {
      res.render('terms', { quote: quote })
    }
  } else {
    if (dark) {
      var username = user;
      res.render('terms', { quote: quote, username: username, authorized: "true", dark: "true" })
    } else {
      var username = user;
      res.render('terms', { quote: quote, username: username, authorized: "true" })      
    }
  }
});
app.get('/login', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('login', { quote: quote, dark: "true", gsitekey: grecaptcha.site })
    } else {
      res.render('login', { quote: quote, gsitekey: grecaptcha.site })
    }
  } else {
    var username = user;
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('login', { quote: quote, username: username, authorized: "true", dark: "true", gsitekey: grecaptcha.site })
    } else {
      res.render('login', { quote: quote, username: username, authorized: "true", gsitekey: grecaptcha.site })
    }
    
  }
});
app.get('/signup', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('signup', { quote: quote, dark: "true", gsitekey: grecaptcha.site })
    } else {
      res.render('signup', { quote: quote, gsitekey: grecaptcha.site })
    }
    
  } else {
    var username = user;
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('signup', { quote: quote, username: username, authorized: "true", dark: "true" })
    } else {
      res.render('signup', { quote: quote, username: username, authorized: "true" })
    }
  }
});
app.get('/settings', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('settings', { quote: quote, dark: "true" })
    } else {
      res.render('settings', { quote: quote })
    }
    
  } else {
    var username = user;
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('settings', { quote: quote, username: username, authorized: "true", dark: "true" })
    } else {
      res.render('settings', { quote: quote, username: username, authorized: "true" })
    }
    
  }
});
app.get('/profile/:userId', (req, res) => {
  var user = getUser(req.cookies) 
  var quote = getQuote()
  if (!req.params.userId) {
    res.redirect('/profile')
  }
  var profile_user = users.get(req.params.userId);
  if (!profile_user) {
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('404', { quote: quote, dark: "true" })
    } else {
      res.render('404', { quote: quote })
    }

  }
  if (user) {
    if (req.params.userId === user) {
      res.redirect('/profile')
    }
  }
  var bio = users.get(`${req.params.userId}.bio`)
  var avatar = users.get(`${req.params.userId}.avatar`)
  var rank = users.get(`${req.params.userId}.rank`)
  var following = users.get(`${req.params.userId}.following`)
  var followers = users.get(`${req.params.userId}.followers`)
  var joindate = users.get(`${req.params.userId}.joindate`)
  var follow_status = users.get(`${req.params.userId}.followers_list`).includes(user);
  var following_list = users.get(`${req.params.userId}.following_list`);  
  var follower_list = users.get(`${req.params.userId}.followers_list`);   
  var dark = users.get(`${user}.dark`)
  if (!follow_status) {
    if (dark) {
      res.render('user-profile', { quote: quote, 
        user: req.params.userId, 
        username: user, 
        bio: markdown.parse(xss(bio)), 
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
        dark: "true",
        follower_list: follower_list, 
        following_list: following_list
      })
    } else {
      res.render('user-profile', { quote: quote, 
        user: req.params.userId, 
        username: user, 
        bio: markdown.parse(xss(bio)),  
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
        follower_list: follower_list, 
        following_list: following_list
      })
    }
  } else {
    res.render('user-profile', { quote: quote,
      user: req.params.userId, 
      username: user, 
      bio: bio, 
      avatar: avatar, 
      rank: rank, 
      followers: followers, 
      following: following, 
      is_followed: "true",
      authorized: "true",
      joindate: joindate,
      follower_list: follower_list, 
      following_list: following_list
    })
  }
})
app.get('/follow/:userId', (req, res) => {
  var quote = getQuote()
  if (!req.params.userId) {
    res.render('404', { quote: quote })
    return
  }
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('not-logged-in', { quote: quote })
    return
  }
  var to_follow = users.get(req.params.userId);
  if (!to_follow) {
    res.render("404", { quote: quote })
    return
  }
  if (req.params.userId === user) {
    res.redirect("/profile")
    return
  } else {
    if (users.get(`${req.params.userId}.followers_list`).includes(user)) {
      res.redirect(`/profile/${req.params.userId}`)
      return
    }
    users.push(`${req.params.userId}.followers_list`, user)
    users.add(`${req.params.userId}.followers`, 1)
    users.add(`${user}.following`, 1)
    users.push(`${user}.following_list`, req.params.userId)
    res.redirect(`/profile/${req.params.userId}`)
  }
})
app.get('/unfollow/:userId', (req, res) => {
  var quote = getQuote()
  if (!req.params.userId) {
    res.render('404', { quote: quote })
    return
  }
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('not-logged-in', { quote: quote })
    return
  }
  var to_follow = users.get(req.params.userId);
  if (!to_follow) {
    res.render("404", { quote: quote })
    return
  }
  if (req.params.userId === user) {
    res.redirect("/profile")
    return
  } else {
    if (!users.get(`${req.params.userId}.followers_list`).includes(user)) {
      res.redirect(`/profile/${req.params.userId}`)
      return
    }
    var follower_list = users.get(`${req.params.userId}.followers_list`)
    var updated_follower_list = removeA(follower_list, user)
    users.set(`${req.params.userId}.followers_list`, updated_follower_list)
    var following_list = users.get(`${user}.following_list`)
    var updated_following_list = removeA(following_list, req.params.userId)
    users.set(`${user}.following_list`, updated_following_list)

    users.subtract(`${req.params.userId}.followers`, 1)
    users.subtract(`${user}.following`, 1)
    users.push(`${user}.following_list`, user)
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
    var bio = users.get(`${user}.bio`)
    var avatar = users.get(`${user}.avatar`)
    var rank = users.get(`${user}.rank`)
    var following = users.get(`${user}.following`)
    var followers = users.get(`${user}.followers`)
    var joindate = users.get(`${user}.joindate`)
    var user_to_list = users.get(`${user}.following_list`)
    var users_to_list = users.get(`${user}.followers_list`)    
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('profile', { quote: quote, 
        username: username, 
        bio: bio, 
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
        dark: "true",
        following_list: user_to_list,
        follower_list: users_to_list

      })
    } else {
      res.render('profile', { quote: quote, 
        username: username, 
        bio: bio, 
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
        following_list: user_to_list,
        follower_list: users_to_list
      })
    }
  }
});
app.get('/beta/profile', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('profile-beta', { quote: quote })
  } else {
    var username = user;
    var bio = users.get(`${user}.bio`)
    var avatar = users.get(`${user}.avatar`)
    var rank = users.get(`${user}.rank`)
    var following = users.get(`${user}.following`)
    var followers = users.get(`${user}.followers`)
    var joindate = users.get(`${user}.joindate`)
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('profile-beta', { quote: quote, 
        username: username, 
        bio: bio, 
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
        dark: "true"
      })
    } else {
      res.render('profile-beta', { quote: quote, 
        username: username, 
        bio: bio, 
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
      })
    }
  }
});

// API
app.get('/api/v1/get-avatar/:userId', (req, res) => {
  if (!req.params.userId) {
    res.status(400)
    return
  } else {
    var user = users.get(req.params.userId)
    if (!user) {
      res.status(404)
    } else {
      var avatar = users.get(`${req.params.userId}.avatar`)
      res.sendFile(__dirname + "/public/" + avatar)
      res.status(200)
    }
  }
});

app.get('/logout', (req, res) => {
  var user = getUser(req.cookies)
  if (!user) {
    return res.redirect("/")
  }
  res.clearCookie("session")
  res.redirect("/")
  users.set(`${user}.session`, null);
});

app.post('/users/signup', (req, res) => {
  var captcha = req.body['g-recaptcha-response'];
  if (captcha === undefined || captcha === '' || captcha === null) {
    req.flash('error', 'Captcha invalid.')
    res.redirect('/signup')
    return
  }
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
      } else if (!users.get(`${req.body.username}`)) {
        var username = req.body.username;
        var alphanumeric = isAlphaNumeric(username);
        if (alphanumeric === false) {
          req.flash('error', 'Your username isn\'t alphanumeric.')
          res.redirect('/signup')
          return
        }
        var password = req.body.password;
        if (password.length > 72)
        {
          req.flash('error', 'Your password was too long (72 characters limit)');
          res.redirect('/signup');
          return;
        }
          request("https://www.google.com/recaptcha/api/siteverify?secret=" + grecaptcha.secret + "&response=" + captcha + "&remoteip=" + req.connection.remoteAddress, (error, response, body) => {
            body = JSON.parse(body);
            if(body.success !== undefined && !body.success) {
              req.flash('error', 'Captcha invalid')
              res.redirect('/signup')
            }
            else
            {
              var hash = bcrypt.hashSync(password, 12);
              var email = req.body.email;
              const now = new Date();
              users.set(`${username}`, {
                "password" : hash, 
                "email" : email, 
                "followers": 0,
                "following": 0,
                "followers_list": [],
                "following_list": [],
                "password" : hash, 
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
              users.set(`${username}.session`, `${username}.${session}`);
              res.redirect('/welcome')
            }
          });
        } else {
        req.flash('error', 'Username has been already taken, sorry.')
        res.redirect('/signup')
        return
      }
    } 
  }      
})
app.post('/profile/submit-changes', (req, res) => {
  var username = getUser(req.cookies)
  var bio = req.body.bio;
  if (bio) {
    users.set(`${username}.bio`, bio)
  }
  res.redirect('/profile')
})
app.post('/settings/submit-changes', (req, res) => {
  var new_username = req.body.username;
  var username = getUser(req.cookies)
  var current_password = req.body.currentpass;
  var new_password = req.body.newpass;
  var nsfw_check = req.body.nsfwCheck;
  var private_check = req.body.privateCheck;
  var darkswitch = req.body.darkswitch;  
  if (current_password) {
    if (!new_password) {
      req.flash('error', 'You did not insert the current password.')
      res.redirect('/settings')
      return
    }
  }
  if (current_password.length > 72)
  {
    req.flash('error', 'Your password was too long (72 characters limit)');
    res.redirect('/signup');
    return;
  }
  if (current_password) {
    if (bcrypt.compareSync(current_password, users.get(`${username}.password`))) {
      req.flash('error', 'Your current password is incorrect.')
      res.redirect('/settings')
      return    
    }
  }
  if (bcrypt.compareSync(current_password, users.get(`${username}.password`))) {
    if (new_password.length < 6) {
      req.flash('error', 'Your new password must be 6 characters or more.')
      res.redirect('/settings')
      return
    } else {
      users.set(`${username}.password`, new_password);
    }
  }
  if (nsfw_check == "on") {
    users.set(`${username}.nsfw`, true);
  } else {
    users.set(`${username}.nsfw`, false);
  }
  if (darkswitch == "on") {
    users.set(`${username}.dark`, true);
  } else {
    users.set(`${username}.dark`, false);
  }  
  if (private_check == "on") {
    users.set(`${username}.private`, true);
  } else {
    users.set(`${username}.private`, false);
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
  var captcha = req.body['g-recaptcha-response'];
  if (captcha === undefined || captcha === '' || captcha === null) {
    req.flash('error', 'Captcha invalid.')
    res.redirect('/login')
    return
  }
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
  var user = users.has(`${username}`);
  if (!user) {
    req.flash('error', 'Username invalid.')
    res.redirect('/login')
    return
  }
  let usersPass = users.get(`${username}.password`);
  let comparison = bcrypt.compareSync(password, usersPass)
  if (comparison === false) {
    req.flash('error', 'Password invalid.')
    res.redirect('/login')
    return
  }
  request("https://www.google.com/recaptcha/api/siteverify?secret=" + grecaptcha.secret + "&response=" + captcha + "&remoteip=" + req.connection.remoteAddress, (error, response, body) => {
    body = JSON.parse(body);
    if(body.success !== undefined && !body.success) {
      req.flash('error', 'Captcha invalid')
      res.redirect('/login')
    }
    else
    {
      var session = uuidv4();
      res.cookie('session', `${username}.${session}`)
      users.set(`${username}.session`, `${username}.${session}`);
      res.redirect('/')
    }
  })
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
const privateKey = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
	console.log('Server started listening on port 443!');
});