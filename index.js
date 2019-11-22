
const Sentry = require('@sentry/node')
Sentry.init({ dsn: 'https://8ae48a0f7a4645e0b72042f5cb3f85fc@sentry.io/1826211' })
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
const open = require('opn');
const app = express();
const markdown = require('markdown')
const xss = require('xss')
const request = require('request');
const { createCanvas } = require('canvas')
const helmet = require('helmet')

var users = new db.table('users')
var posts = new db.table('posts')
var hashes = new db.table('hashes')

var discord = {
  "oauth": {
    "clientId": "645366454618816522",
    "clientSecret": "d2Hfn0cHpPPwoRKtpnuyM8amIxluwxF9"
  },
  scopes: [
    'identify',
    'email'
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
users.set('Minota.rank', "owner")
users.set('HVENetworks.rank', "owner")

// Views
app.set('view engine', 'pug')

// Change middleware
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb'}))
app.use(cookieParser())
app.use(express.static(__dirname + '/public'))
app.use(helmet())
app.use(helmet.frameguard({ action: 'sameorigin' }))

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


app.get('/api/v1/get-user/:userId', (req, res) => {
  if(!req.params.userId || !users.get(`${req.params.userId}`)) return res.status(404).json({ error: 'You didn\'t provide a userId or that userId didn\'t exist.' })
  let bio = users.get(`${req.params.userId}.bio`),
    avatar = users.get(`${req.params.userId}.avatar`),
    rank = users.get(`${req.params.userId}.rank`),
    following = users.get(`${req.params.userId}.following`),
    followers = users.get(`${req.params.userId}.followers`),
    joindate = users.get(`${req.params.userId}.joindate`),
    following_list = users.get(`${req.params.userId}.following_list`),
    follower_list = users.get(`${req.params.userId}.followers_list`)
  return res.status(200).json({ bio: bio, avatar: avatar, rank: rank, following: following, followers: followers, join_date: joindate, following: following_list, followers: follower_list })
})

/**
app.post('/api/render', (req, res) => {
  try {
    let body = JSON.parse(Object.keys(req.body)[0]);
    let canvas = createCanvas(body.width, body.height);
    let ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = body.width*body.height;
    ctx.moveTo(1, 1);
    ctx.lin
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
    
    while (true)
    {
      path = __dirname + "/public/cdn/" + uuidv4() + ".png";
      if (!fs.existsSync(path))
      {
        break;
      }
    }
    res.send("https://sketchel.art/cdn/" + path.split("/public/cdn/")[1]);
    let base = canvas.toDataURL()
    var base64Data = base.replace(/^data:image\/png;base64,/, "");

    require("fs").writeFile(path, base64Data, 'base64', function(err) {
      console.log(err);
    });
  } catch (err) {
    let id = Sentry.captureException(err);
    res.send("There was an error with your request. Reference error ID " + id + " with support");
  }
}) */

app.post('/api/post', (req, res) => {
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
  ctx.lineWidth = body.width+body.height*10;
  ctx.moveTo(1, 1);
  ctx.lineTo(body.width-1, body.height-1);
  ctx.stroke();
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
  let id;
  let path;
  while (true)
  {
    id = uuidv4()
    path = __dirname + "/public/cdn/" + id;
    if (!fs.existsSync(path))
    {
      break;
    }
  }
  let image = "https://sketchel.art/cdn/" + path.split("/public/cdn/")[1];
  let base = canvas.toDataURL()
  var base64Data = base.replace(/^data:image\/png;base64,/, "");

  fs.writeFile(path + ".json", JSON.stringify(body));
  fs.writeFile(path + ".png", base64Data, 'base64');
  const now = new Date();
  var postdate = date.format(now, 'MM/DD/YYYY')
  var time = date.format(now, 'HH:mm:ss')
  posts.set(id, {"image_url": image + ".png", "date": postdate, "time": time, "author": user, "likes": 0, "dislikes": 0, "comments": 0, "views": 0, "comments_list": [], "like_list": [], "dislike_list": []})
  users.add(`${user}.posts`, 1)
  users.push(`${user}.posts_list`, id)
  res.send(`${id}`)
})

app.get('/like/:postID', (req, res) => {
  var user = getUser(req.cookies) 
  if (!user) {
    res.redirect(`/post/${post}`)
    return
  }
  var post = req.params.postID;
  if (!posts.get(`${post}`)) {
    res.redirect('/postnotfoundlol')
    return
  }
  if (!posts.get(`${post}.like_list`).includes(user)) {
    posts.add(`${post}.likes`, 1)
    posts.push(`${post}.like_list`, user)
    users.push(`${user}.like_list`, post)
    res.redirect(`/post/${post}`)
    return
  } else {
    posts.subtract(`${post}.likes`, 1)
    var like_list = posts.get(`${post}.like_list`)
    var u_like_list = users.get(`${user}.like_list`) 
    if (!u_like_list) {
      users.set(`${user}.like_list`, [])
      var u_like_list = users.get(`${user}.like_list`) 
    }   
    var u1 = removeA(like_list, user)
    var u = removeA(u_like_list, post)
    posts.set(`${post}.like_list`, u1)
    users.set(`${user}.like_list`, u)
    res.redirect(`/post/${post}`)    
  }
})

app.get('/dislike/:postID', (req, res) => {
  var user = getUser(req.cookies) 
  if (!user) {
    res.redirect(`/post/${post}`)
    return
  }
  var post = req.params.postID;
  if (!posts.get(`${post}`)) {
    res.redirect('/postnotfoundlol')
    return
  }
  if (!posts.get(`${post}.dislike_list`).includes(user)) {
    posts.add(`${post}.dislikes`, 1)
    posts.push(`${post}.dislike_list`, user)
    users.push(`${user}.dislike_list`, post)
    res.redirect(`/post/${post}`)
    return
  } else {
    posts.subtract(`${post}.dislikes`, 1)
    var dislike_list = posts.get(`${post}.dislike_list`)
    var u_dislike_list = users.get(`${user}.dislike_list`)    
    if (!u_dislike_list) {
      users.set(`${user}.dislike_list`, [])
      var u_dislike_list = users.get(`${user}.dislike_list`)   
    }   
    var u1 = removeA(dislike_list, user)
    var u = removeA(u_dislike_list, post)
    posts.set(`${post}.dislike_list`, u1)
    users.set(`${user}.dislike_list`, u)
    res.redirect(`/post/${post}`)    
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
  var author = posts.get(`${post}.author`)
  var views = posts.add(`${post}.views`, 1)
  var author_joindate = users.get(`${author}.joindate`)
  if (user) {
    if (users.get(`${user}.like_list`)) {
      var is_liked = users.get(`${user}.like_list`).includes(post)  
    }
    if (users.get(`${user}.dislike_list`)) {
      var is_disliked = users.get(`${user}.dislike_list`).includes(post) 
    }
  }
  var comments = posts.get(`${post}.comments`)
  var comments_list = posts.get(`${post}.comments_list`)
  var dislikes = posts.get(`${post}.dislikes`)
  var image_url = posts.get(`${post}.image_url`)
  var rating = dislikes + likes
  if (!user) {
    res.render('post', { quote: quote, id: post, views: views, image_url: image_url, author: author, joindate: author_joindate, likes: likes, dislikes: dislikes, comments: comments, comments_list: comments_list, rating: rating })
  } else {
    res.render('post', { quote: quote, is_liked: is_liked, is_disliked: is_disliked, id: post, views: views, image_url: image_url, author: author, joindate: author_joindate, username: user, authorized: "true", likes: likes, dislikes: dislikes, comments: comments, comments_list: comments_list, rating: rating })
  }
})


// Load pages
app.get('/create', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies) 
  if (!user) {
    res.render('canvas', { quote: quote })
  } else {
    res.render('canvas', { quote: quote, username: user, authorized: "true" })
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

app.get('/feed', (req, res) => {
  var quote = getQuote()
  var user = getUser(req.cookies)
  if (!user) {
    res.render('not-logged-in', { quote: quote })
    return
  } 
  var followed_users = users.get(`${user}.following_list`)
  var list = []
  for (let i = 0; i < followed_users.length; i++) {
    let value = followed_users[i]
    let user = users.get(`${value}.posts_list`)
    list.push(user)
  }
  res.render('feed', { quote: quote, authorized: "", username: user, list: list })
})

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
  var tab = req.query.tab;
  if (!tab) {
    var tab = "pinned"
  }
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
  var posts = users.get(`${req.params.userId}.posts_list`); 
  if (!posts) {
    users.set(`${req.params.userId}.posts_list`, {})
  } 
  var posts = users.get(`${req.params.userId}.posts_list`); 
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
        following_list: following_list,
        tab: tab,
        posts: posts
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
        following_list: following_list,
        tab: tab,
        posts: posts
      })
    }
  } else {
    res.render('user-profile', { quote: quote,
      user: req.params.userId, 
      username: user, 
      bio: markdown.parse(xss(bio)), 
      avatar: avatar, 
      rank: rank, 
      followers: followers, 
      following: following, 
      is_followed: "true",
      authorized: "true",
      joindate: joindate,
      follower_list: follower_list, 
      following_list: following_list,
      tab: tab,
      posts: posts
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
    var posts = users.get(`${user}.posts_list`)   
    var dark = users.get(`${user}.dark`)
    if (dark) {
      res.render('profile', { quote: quote, 
        username: username, 
        bio: markdown.parse(xss(bio)), 
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
        dark: "true",
        following_list: user_to_list,
        follower_list: users_to_list,
        posts: posts

      })
    } else {
      res.render('profile', { quote: quote, 
        username: username, 
        bio: markdown.parse(xss(bio)),  
        avatar: avatar, 
        rank: rank, 
        followers: followers, 
        following: following, 
        authorized: "true",
        joindate: joindate,
        following_list: user_to_list,
        follower_list: users_to_list,
        posts: posts
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
        bio: markdown.parse(xss(bio)),  
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
        bio: markdown.parse(xss(bio)), 
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

// Serve
app.get('/cdn/serve/:path', (req, res) => {
  res.sendFile(__dirname + '/public/' + req.params.path);
})

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

app.get('/components/notifications', (req, res) => {
  var username = getUser(req.cookies);
  var dark = users.get(`${username}.dark`);

  res.render('notifications', { user: username, dark: dark ? true : false })
})

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
if(!process.env.HTTPS) {
  if(!fs.existsSync('/etc/letsencrypt/live/sketchel.art/privkey.pem')) {
    return console.log("I recommend using `npm run dev` if you are running this locally.")
  }

  const privateKey = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/privkey.pem', 'utf8')
  const certificate = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/cert.pem', 'utf8')
  const ca = fs.readFileSync('/etc/letsencrypt/live/sketchel.art/chain.pem', 'utf8')

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  }
  const httpsServer = https.createServer(credentials, app)
  httpsServer.listen(443, () => {
    console.log('Server started listening on port 443!');
    open(`http://localhost:443`);

  })
} else {
  const httpServer = http.createServer(app)
  httpServer.listen(80, () => {
    console.log('Server started listening on port 80!')
    open(`http://localhost:80`);
  })
}
