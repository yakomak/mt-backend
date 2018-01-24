var express = require ('express')
var cors = require('cors')
var app = express()

app.use(cors())

app.get('/',(req,res) => {
  res.send('magtool v.0.1.0')
})

var port = process.env.PORT || 3000
app.listen(port)
console.log(`Example app listening on port ${port}!`)
