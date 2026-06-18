const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { registerValidators, loginValidators } = require('../validators/auth.validators');
const validate = require('../middleware/validate');

const router = Router();

router.post('/register', registerValidators, validate, authController.register);
router.post('/login', loginValidators, validate, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
