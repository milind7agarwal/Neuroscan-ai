const { Router } = require('express');
const { register, login, getMe } = require('../controllers/auth.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

const authRouter = Router();

authRouter.post('/register',register);
authRouter.post('/login',login);


module.exports = authRouter;