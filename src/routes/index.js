const {Router} = require('express')
const router = Router()
const users = require('./privateRoutes/users.routes.js')
const links = require('./privateRoutes/links.routes.js')
const linksRedirect = require('./publicRoutes/linksRedirect.routes.js')
require('dotenv').config()

router.use('/',users)
router.use('/',links)
router.use('/',linksRedirect)


module.exports = router