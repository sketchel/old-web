const db = require('quick.db')
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

const grecaptcha = {
    "site": "6LctSsMUAAAAADBNNLlYhZ-i7coSpp4iOQyYOMpv",
    "secret": "6LctSsMUAAAAAAIcCz8EeKT-RnrNAAFpyoQBuhuP"
  };

exports.index = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('home', { title: "Home", quote: quote, username: user, authorized: user ? true : false })
  };

exports.welcome = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('welcome', { title: "Welcome", quote: quote, username: user, authorized: user ? true : false })
  };  

exports.create = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('canvas', { title: "Create", quote: quote, username: user, authorized: user ? true : false })
  };  

exports.privacy = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('privacy', { title: "Privacy Policy", quote: quote, username: user, authorized: user ? true : false })
  }; 
  
exports.login = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('login', { title: "Login", quote: quote, username: user, authorized: user ? true : false, gsitekey: grecaptcha.site })
  };   

exports.signup = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('signup', { title: "Signup", quote: quote, username: user, authorized: user ? true : false, gsitekey: grecaptcha.site })
  }; 

exports.terms = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('terms', { title: "Terms of Service", quote: quote, username: user, authorized: user ? true : false })
  };  

exports.rules = function(req, res){
    var quote = getQuote()
    var user = getUser(req.cookies) 
    res.render('rules', { title: "Rules", quote: quote, username: user, authorized: user ? true : false })
  };    