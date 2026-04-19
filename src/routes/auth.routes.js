const { Router } = require('express');
const { register, login, verifyToken  } = require('../controllers/auth.controller.js');

const authRouter = Router();

authRouter.post('/register',register);
authRouter.post('/login',login);
authRouter.get('/verify-token', verifyToken);


module.exports = authRouter;