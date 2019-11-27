const db = require('quick.db')
const xss = require('xss')
const markdown = require('markdown')

var users = new db.table('users')


function getQuote() {
    const json = require("../quotes.json")
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
    var session_db = users.get(`${username}.session`)
    if (session === session_db) {
      return username
    } else {
      return false
    }
}

exports.user_profile = function (req, res) {
    var user = getUser(req.cookies) 
    var quote = getQuote()
    if (!req.params.userId) {
      res.redirect('/profile')
    }
    var profile_user = users.get(req.params.userId);
    if (!profile_user) {
      res.render('404', { quote: quote })
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
    res.render('user-profile', { quote: quote,
      title: `${profile_user}'s Profile`,
      user: req.params.userId, 
      username: user, 
      bio: markdown.parse(xss(bio)), 
      avatar: avatar, 
      rank: rank, 
      followers: followers, 
      following: following, 
      is_followed: follow_status ? true : false,
      authorized: user ? true : false,
      joindate: joindate,
      follower_list: follower_list, 
      following_list: following_list,
      posts: posts
    })
}

exports.settings = function (req, res) { 
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('settings', { title: "Settings", quote: quote, username: user, authorized: user ? true : false })
  };  

exports.logout = function (req, res) {
    var user = getUser(req.cookies)
    if (!user) {
      return res.redirect("/")
    }
    res.clearCookie("session")
    res.redirect("/")
    users.set(`${user}.session`, null);
}

exports.profile = function (req, res) {
    var quote = getQuote()
    var user = getUser(req.cookies) 
    if (!user) {
      res.render('profile', { title: "Your Profile", quote: quote })
    }
    var username = user;
    var bio = users.get(`${user}.bio`)
    var avatar = users.get(`${user}.avatar`)
    var rank = users.get(`${user}.rank`)
    var following = users.get(`${user}.following`)
    var followers = users.get(`${user}.followers`)
    var joindate = users.get(`${user}.joindate`)
    var posts = users.get(`${user}.posts_list`)
    var user_to_list = users.get(`${user}.following_list`)
    var users_to_list = users.get(`${user}.followers_list`)    
    res.render('profile', { 
      title: "Your Profile",
      quote: quote, 
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
