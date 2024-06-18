const app = require('./src/server.js')
require('dotenv').config()
const {PORT} = process.env || 3001

app.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`))