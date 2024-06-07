const express = require('express')
const app = express()
const port = 3001

app.use('/', (req, res) => {
  res.status(200).json({name: 'Jhon Doe'})
})

app.listen(port, () => console.log(`listening on http://localhost:${port}`))