const db = require('quick.db')
const bcrypt = require('bcrypt')
const path = require('path')
const fs = require('fs')
const date = require('date-and-time')
const uuidv4 = require('uuid/v4')
const { createCanvas } = require('canvas')
var users = new db.table('users')

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

exports.post_image = function (req, res) {
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
      path = __dirname + "../public/cdn/" + id;
      if (!fs.existsSync(path))
      {
        break;
      }
    }
    let image = "https://sketchel.art/cdn/" + path.split("../public/cdn/")[1];
    let base = canvas.toDataURL()
    var base64Data = base.replace(/^data:image\/png;base64,/, "");
  
    fs.writeFile(path + ".json", JSON.stringify(body));
    fs.writeFile(path + ".png", base64Data, 'base64');
    posts.set(id, {"image_url": image + ".png", "title": body.title, "author": user, "likes": 0, "dislikes": 0, "comments": 0, "views": 0, "comments_list": [], "like_list": [], "dislike_list": []})
    users.add(`${user}.posts`, 1)
    users.push(`${user}.posts_list`, id)
    res.send(`${id}`)
}

exports.get_user = function (req, res) {
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
}

exports.get_avatar = function (req, res) {
    if (!req.params.userId) {
        res.status(400)
        return
      } else {
        var user = users.get(req.params.userId)
        if (!user) {
          res.status(404)
        } else {
          var avatar = users.get(`${req.params.userId}.avatar`)
          res.sendFile(path.join(__dirname, '../public/' + avatar))
          res.status(200)
        }
      }
}

exports.settings_submit = function (req, res) {
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
}

exports.profile_submit = function (req, res) {
    var username = getUser(req.cookies)
    var bio = req.body.bio;
    if (bio) {
      users.set(`${username}.bio`, bio)
    }
    res.redirect('/profile')
}

exports.login_user = function (req, res) {
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
}

exports.add_user = function (req, res) {
    //var captcha = req.body['g-recaptcha-response'];
    //if (captcha === undefined || captcha === '' || captcha === null) {
    //  req.flash('error', 'Captcha invalid.')
    //  res.redirect('/signup')
    //  return
    //}
    var username = req.body.username
    var password = req.body.password
    var alphanumeric = isAlphaNumeric(username);
    if (!req.body.username) {
      console.log("no username")
      req.flash('error', 'No username provided.')
      res.redirect('/signup')
      return
    } else if (req.body.username.length <= 2) {
      req.flash('error', 'Username is too short.')
      res.redirect('/signup')
      console.log("username too short.")
      return    
    } else if (!req.body.email) {
      req.flash('error', 'No email provided.')
      res.redirect('/signup')
      return
    } else if (!req.body.password) {
      req.flash('error', 'No password provided.')
      res.redirect('/signup')
      return
    } else if (!req.body.confirmPassword) {
      req.flash('error', 'No confirm password provided.')
      res.redirect('/signup')
      return
    } else if (req.body.confirmPassword !== req.body.password) {
      req.flash('error', 'Password doesn\'t match confirm password.')
      res.redirect('/signup')
      return
    } else if (req.body.tosCheck !== "on") {
      req.flash('error', 'I highly doubt you think you are going to receive an account if you don\'t agree to the checkbox below.')
      res.redirect('/signup')
      return
    } else if (!alphanumeric) {
      req.flash('error', 'Your username isn\'t alphanumeric.')
      res.redirect('/signup')
      return
    } else if (req.body.password.length > 72) {
      req.flash('error', 'Your password was too long (72 characters limit)');
      res.redirect('/signup');
      return
    }
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
    users.set(`${username}.session`, `${username}.${session}`)
    res.redirect('/welcome')
  }
