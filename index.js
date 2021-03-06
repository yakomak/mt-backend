var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var session = require('express-session')
var hash = require('pbkdf2-password')()
var config = require('./etc/config.json')
var redis = require('redis')

const { spawn } = require('child_process')
const dbServer = spawn('redis-server', ['./etc/redis.conf'])
dbServer.stdout.on('data', (data) => {process.stdout.write(data)} )
dbServer.stderr.on('data', (data) => {process.stderr.write(data)} )
dbServer.on('close', (code) => {process.stdout.write(`redis server exited with code ${code}\n`) })
process.on('SIGINT', () => {
  setTimeout(() => {process.exit(0), 100 })
})

var rdb = redis.createClient(6400) // eslint-disable-line

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

app.get('/', (req, res) => {
  res.send('magtool v.0.1.0')
})

app.post('/login', jsonParser, (req, res) => {
  if (!req.body) return res.sendStatus(400)
  auth(req.body.username, req.body.password, (err, user) => {
    if (err || !user) {
      res.json({
        status: 'FAIL',
        error: 'invalid username or password'
      })
      return
    }

    req.session.regenerate(() => {
      req.session.user = user
      res.json({
        status: 'OK'
      })
    })
  })
})

app.post('/command', checkAuth, jsonParser, (req, res) => {
  if (!req.body) return res.sendStatus(400)
  const cmd = req.body.command
  switch (cmd) {
    case 'PING':
      res.json({
        status: 'OK',
        data: 'PONG'
      })
      break
    default:
      break
  }
})

app.post('/logout', jsonParser, (req, res) => {
  req.session.destroy(() => {
    res.json({
      status: 'OK'
    })
  })
})

app.listen(config.port)
console.log(`Example app listening on port ${config.port}!`)
