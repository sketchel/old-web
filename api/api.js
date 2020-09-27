const db = require('quick.db')
const bcrypt = require('bcrypt')
const path = require('path')
const fs = require('fs')
const date = require('date-and-time')
const uuidv4 = require('uuid/v4')
const shortid = require('shortid')
const { createCanvas } = require('canvas')
var users = new db.table('users')
var posts = new db.table('posts')

function isAlphaNumeric (str) {
  if (str.match(/^[a-z0-9]+$/i)) {
    return true
  } else {
    return false
  }
}

function getUser (cookies) {
  var session = cookies.session
  if (!session) {
    return false
  }
  var username = session.split('.')[0]
  var sessionDb = users.get(`${username}.session`)
  if (session === sessionDb) {
    return username
  } else {
    return false
  }
}

exports.post_image = function (req, res) {
  const user = getUser(req.cookies)
  if (!user) {
    throw 'User isn\'t logged in.'
  }
  const body = JSON.parse(Object.keys(req.body)[0])
  const canvas = createCanvas(body.width, body.height)
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = body.width + body.height * 10
  ctx.moveTo(1, 1)
  ctx.lineTo(body.width - 1, body.height - 1)
  ctx.stroke()
  for (let iii = 0; iii < body.history.length; iii++) {
    const el = body.history[iii]

    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.strokeStyle = el.color
    ctx.lineWidth = el.width
    ctx.moveTo(el.from.x, el.from.y)
    ctx.lineTo(el.to.x, el.to.y)
    ctx.stroke()
  }
  let id
  let filePath
  while (true) {
    id = shortid.generate()
    filePath = path.join(__dirname, '../public/cdn/', id)
    if (!fs.existsSync(filePath)) {
      break
    }
  }
  const image = 'localhost:8000/cdn/' + path.split('../public/cdn/')[1]
  const base = canvas.toDataURL()
  var base64Data = base.replace(/^data:image\/png;base64,/, '')

  fs.writeFile(filePath + '.json', JSON.stringify(body))
  fs.writeFile(filePath + '.png', base64Data, 'base64')
  posts.set(id, {
    image_url: image + '.png',
    title: body.title,
    author: user,
    likes: 0,
    dislikes: 0,
    comments: 0,
    views: 0,
    comments_list: [],
    like_list: [],
    dislike_list: []
  })
  users.add(`${user}.posts`, 1)
  users.push(`${user}.posts_list`, id)
  res.send(`${id}`)
}

exports.get_user = function (req, res) {
  if (!req.params.userId || !users.get(`${req.params.userId}`)) return res.status(404).json({ error: 'You didn\'t provide a userId or that userId didn\'t exist.' })
  const bio = users.get(`${req.params.userId}.bio`)
  const avatar = users.get(`${req.params.userId}.avatar`)
  const rank = users.get(`${req.params.userId}.rank`)
  const following = users.get(`${req.params.userId}.following`)
  const followers = users.get(`${req.params.userId}.followers`)
  const joindate = users.get(`${req.params.userId}.joindate`)
  const followingList = users.get(`${req.params.userId}.following_list`)
  const followerList = users.get(`${req.params.userId}.followers_list`)
  return res.status(200).json({
    bio: bio,
    avatar: avatar,
    rank: rank,
    following: following,
    followers: followers,
    join_date: joindate,
    following_list: followingList,
    followers_list: followerList
  })
}

exports.get_avatar = function (req, res) {
  if (!req.params.userId) {
    return res.status(400)
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
  var newUsername = req.body.username
  var username = getUser(req.cookies)
  var currentPassword = req.body.currentpass
  var newPassword = req.body.newpass
  var nsfwCheck = req.body.nsfwCheck
  var privateCheck = req.body.privateCheck
  if (currentPassword) {
    if (!newPassword) {
      req.flash('error', 'You did not insert the current password.')
      res.redirect('/settings')
      return
    }
  }
  if (currentPassword.length > 72) {
    req.flash('error', 'Your password was too long (72 characters limit)')
    res.redirect('/signup')
    return
  }
  if (currentPassword) {
    if (bcrypt.compareSync(currentPassword, users.get(`${username}.password`))) {
      req.flash('error', 'Your current password is incorrect.')
      return res.redirect('/settings')
    }
  }
  if (bcrypt.compareSync(currentPassword, users.get(`${username}.password`))) {
    if (newPassword.length < 6) {
      req.flash('error', 'Your new password must be 6 characters or more.')
      res.redirect('/settings')
      return
    } else {
      var hash = bcrypt.hashSync(newPassword, 12)
      users.set(`${username}.password`, hash)
    }
  }
  if (nsfwCheck === 'on') {
    users.set(`${username}.nsfw`, true)
  } else {
    users.set(`${username}.nsfw`, false)
  }
  if (privateCheck === 'on') {
    users.set(`${username}.private`, true)
  } else {
    users.set(`${username}.private`, false)
  }
  if (newUsername) {
    var alphanumeric = isAlphaNumeric(newUsername)
    if (alphanumeric === false) {
      req.flash('error', 'Your inserted username isn\'t alphanumeric.')
      return res.redirect('/settings')
    } else {
      req.flash('error', 'Changing username is a feature that\'s coming soon.')
      return res.redirect('/settings')
    }
  }
  req.flash('success', 'Successfully saved changes.')
  return res.redirect('/settings')
}

exports.profile_submit = function (req, res) {
  var username = getUser(req.cookies)
  var bio = req.body.bio
  if (bio) {
    users.set(`${username}.bio`, bio)
  }
  res.redirect('/profile')
}

exports.login_user = function (req, res) {
  var username = req.body.username
  var password = req.body.password
  /*
  var captcha = req.body['g-recaptcha-response'];
  if (captcha === undefined || captcha === '' || captcha === null) {
    req.flash('error', 'Captcha invalid.')
    res.redirect('/login')
    return
  }
  */
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
  var user = users.has(`${username}`)
  if (!user) {
    req.flash('error', 'Username invalid.')
    res.redirect('/login')
    return
  }
  const usersPass = users.get(`${username}.password`)
  const comparison = bcrypt.compareSync(password, usersPass)
  if (comparison === false) {
    req.flash('error', 'Password invalid.')
    res.redirect('/login')
    return
  }
  var session = uuidv4()
  res.cookie('session', `${username}.${session}`)
  users.set(`${username}.session`, `${username}.${session}`)
  res.redirect('/')
}

exports.add_user = function (req, res) {
  // var captcha = req.body['g-recaptcha-response'];
  // if (captcha === undefined || captcha === '' || captcha === null) {
  //   req.flash('error', 'Captcha invalid.')
  //   res.redirect('/signup')
  //   return
  // }
  var username = req.body.username
  var password = req.body.password
  var alphanumeric = isAlphaNumeric(username)
  if (!req.body.username) {
    req.flash('error', 'No username provided.')
    return res.redirect('/signup')
  } else if (req.body.username.length <= 2) {
    req.flash('error', 'Username is too short.')
    return res.redirect('/signup')
  } else if (!req.body.email) {
    req.flash('error', 'No email provided.')
    return res.redirect('/signup')
  } else if (!req.body.password) {
    req.flash('error', 'No password provided.')
    return res.redirect('/signup')
  } else if (!req.body.confirmPassword) {
    req.flash('error', 'No confirm password provided.')
    return res.redirect('/signup')
  } else if (req.body.confirmPassword !== req.body.password) {
    req.flash('error', 'Password doesn\'t match confirm password.')
    return res.redirect('/signup')
  } else if (req.body.tosCheck !== 'on') {
    req.flash('error', 'I highly doubt you think you are going to receive an account if you don\'t agree to the checkbox below.')
    return res.redirect('/signup')
  } else if (!alphanumeric) {
    req.flash('error', 'Your username isn\'t alphanumeric.')
    return res.redirect('/signup')
  } else if (req.body.password.length > 72) {
    req.flash('error', 'Your password was too long (72 characters limit)')
    return res.redirect('/signup')
  }
  var hash = bcrypt.hashSync(password, 12)
  var email = req.body.email
  const now = new Date()
  users.set(`${username}`, {
    password: hash,
    email: email,
    followers: 0,
    following: 0,
    followers_list: [],
    following_list: [],
    rank: 'default',
    username: username,
    nsfw: false,
    private: false,
    avatar: '/assets/profile.png',
    bio: 'This user prefers to stay quiet.',
    joindate: date.format(now, 'MM/DD/YYYY'),
    jointime: date.format(now, 'HH:mm:ss')
  })
  var session = uuidv4()
  res.cookie('session', `${username}.${session}`)
  users.set(`${username}.session`, `${username}.${session}`)
  res.redirect('/welcome')
}
