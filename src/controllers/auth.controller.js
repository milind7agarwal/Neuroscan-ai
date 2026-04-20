const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sessionModel = require('../models/session.model.js');


async function register(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ 
            message: "User registered successfully",
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body; //need to send data in the JSON format

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        const salt = await bcrypt.genSalt(10);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash: hashedRefreshToken,
            ip: req.ip,
            userAgent: req.headers[ "user-agent" ]
        })


        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });


        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ 
            message: "Login successful",
            user: { id: user._id, username: user.username, email: user.email },
            token: accessToken
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }
    
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        const salt = await bcrypt.genSalt(10);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

        const session = await sessionModel.findOne(
            { refreshTokenHash: hashedRefreshToken, revoked: false }
        );
        
        if (!session) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign({id: decoded.id}, process.env.JWT_SECRET,{ expiresIn: "15m" });

        const newRefreshToken = jwt.sign({id: decoded.id}, process.env.JWT_SECRET,{ expiresIn: "7d" });

        const refreshTokenHash = await bcrypt.hash(newRefreshToken, salt);

        session.refreshTokenHash = refreshTokenHash;
        await session.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
          
        res.status(200).json({
            message: "Token refreshed successfully",
            token: accessToken
        });
    } catch (error) {
        res.status(401).json({ message: "Invalid refresh token" });
    }
}


async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ message: "No refresh token provided" });
    }

    try {

        const salt = await bcrypt.genSalt(10);
        const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

        const session = await sessionModel.findOne(
            { refreshTokenHash: refreshTokenHash, revoked: false }
        );

        if (!session) {
            return res.status(400).json({ message: "Invalid refresh token" });
        }

        session.revoked = true;
        await session.save();

        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function logoutAll(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ message: "No refresh token provided" });
    }
    
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        await sessionModel.updateMany(
            { user: decoded.id, revoked: false },
            { $set: { revoked: true } }
        );

        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out from all sessions successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = { register, login, refreshToken , logout , logoutAll };