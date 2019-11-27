const db = require('quick.db')
var users = new db.table('users')
var posts = new db.table('posts')

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

exports.like = function (req, res) {
    var user = getUser(req.cookies) 
    if (!user) {
      res.redirect(`/post/${post}`)
    }
    var post = req.params.postID;
    if (!posts.get(`${post}`)) {
      res.render('404', { quote: quote, authorized: user ? true : false,  })
    }
    if (!posts.get(`${post}.like_list`).includes(user)) {
      posts.add(`${post}.likes`, 1)
      posts.push(`${post}.like_list`, user)
      users.push(`${user}.like_list`, post)
      res.redirect(`/post/${post}`)
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
}

exports.dislike = function (req, res) {
    var user = getUser(req.cookies) 
    if (!user) {
      res.redirect(`/post/${post}`)
    }
    var post = req.params.postID;
    if (!posts.get(`${post}`)) {
      res.redirect('/postnotfoundlol')
    }
    if (!posts.get(`${post}.dislike_list`).includes(user)) {
      posts.add(`${post}.dislikes`, 1)
      posts.push(`${post}.dislike_list`, user)
      users.push(`${user}.dislike_list`, post)
      res.redirect(`/post/${post}`)
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
}

exports.unfollow = function (req, res) {
    var quote = getQuote()
    if (!req.params.userId) {
      res.render('404', { title: "404", quote: quote })
      return
    }
    var user = getUser(req.cookies) 
    if (!user) {
      res.render('not-logged-in', { title: "Not Logged In", quote: quote })
      return
    }
    var to_follow = users.get(req.params.userId);
    if (!to_follow) {
      res.render("404", { title: "404", quote: quote })
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
}

exports.follow = function (req, res) {
    var quote = getQuote()
    if (!req.params.userId) {
      res.render('404', { title: "404", quote: quote })
      return
    }
    var user = getUser(req.cookies) 
    if (!user) {
      res.render('not-logged-in', { title: "You are not logged in", quote: quote })
      return
    }
    var to_follow = users.get(req.params.userId);
    if (!to_follow) {
      res.render("404", { title: "404", quote: quote })
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
}