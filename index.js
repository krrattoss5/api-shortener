const app = require('./src/server.js')
const port = 3001

app.listen(port, () => console.log(`listening on http://localhost:${port}`))