var express = require ('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var session = require('express-session')
var hash = require("pbkdf2-password")()

var app = express()

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'shhhh, very secret'
}))

var jsonParser = bodyParser.json()

var users = {
  admin: {
    name: 'admin'
  }
}

// генерим первый хэш для admin-юзера
hash({ password: 'secret' }, (err, pass, salt, hash) => {
  if (err) throw err
  users.admin.salt = salt
  users.admin.hash = hash
})

var auth = (name, password, callback) => {
  const user = users[name]
  if (!user) return callback(new Error('cannot find user'))
  hash({ password, salt: user.salt }, (err, pass, salt, hash) => {
    if (err) return callback(err)
    if (hash === user.hash) return callback(null, user)
    callback(new Error('invalid password'))
  })
}
var checkAuth = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.json({
      status: 'FAIL',
      error: 'login is required'
    })
  }
}
app.use(cors())

app.get('/',(req,res) => {
  res.send('magtool v.0.1.0')
})

app.post('/command',jsonParser,(req,res) => {
app.post('/login',jsonParser,(req,res) => {
  if (!req.body) return res.sendStatus(400)
  auth(req.body.username,req.body.password, (err, user) => {
    if(err || !user){
      res.json({
        status: 'FAIL',
        error: 'invalid username or password'
      })
    }
  if (!req.body) return res.sendStatus(400)
  const cmd = req.body.command
  switch (cmd) {
    case 'PING':
      res.json({
        status: 'OK',
        data: 'PONG'
      })
      break;
    default:
      break;
  }
})

var port = process.env.PORT || 3000
app.listen(port)
console.log(`Example app listening on port ${port}!`)
