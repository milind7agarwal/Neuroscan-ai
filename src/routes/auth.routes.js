const { Router } = require('express');
const { register, login , refreshToken } = require('../controllers/auth.controller.js');
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



module.exports = authRouter;