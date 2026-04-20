const { Router } = require('express');
const { register, login , refreshToken , logout , logoutAll } = require('../controllers/auth.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

const authRouter = Router();

authRouter.post('/register',register);

authRouter.post('/login',login);

authRouter.get('/verify-token', verifyToken, (req, res) => {
    res.status(200).json({ 
        message: "User details fetched successfully",
        user: { id: req.user._id, username: req.user.username, email: req.user.email }
    });
});

authRouter.get('/refresh-token', refreshToken);

authRouter.get('/logout', logout);

authRouter.get('/logoutAll', logoutAll);

module.exports = authRouter;