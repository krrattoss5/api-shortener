const { Router } = require('express')
const router = Router()
const authenticateToken = require('../../controllers/authenticateToken.js')
const {
  createUser,
  loginUser,
  getCurrentUser,
  updatePassword,
  updatePreferences
} = require('../../controllers/usersControllers.js')

router.post('/create-user', createUser)

router.post('/login', loginUser)

router.get('/me', authenticateToken, getCurrentUser)

router.post('/updatePassword', authenticateToken, updatePassword);

router.post('/updatePreferences', authenticateToken, updatePreferences);

router.delete('/deleteAccount', authenticateToken,);

module.exports = router