const express = require('express')
const app = express()

app.get('/', (req, res) => {
  return res.status(200).json({name: 'Jhon Doe'})
})

module.exports = app