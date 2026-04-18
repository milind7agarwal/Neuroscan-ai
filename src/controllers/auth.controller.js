const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function parseJwtExpiration(expiration = '7d') {
    const normalized = String(expiration).trim().toLowerCase();
    const value = parseInt(normalized, 10);

    if (Number.isNaN(value)) {
        return 7 * 24 * 60 * 60; // 7 days in seconds
    }

    if (normalized.endsWith('d')) return value * 24 * 60 * 60;
    if (normalized.endsWith('h')) return value * 60 * 60;
    if (normalized.endsWith('m')) return value * 60;
    if (normalized.endsWith('s')) return value;
    return value;
}

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseJwtExpiration(process.env.JWT_EXPIRATION || '7d') * 1000,
        path: '/',
    };
}

function generateToken(userId) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign({ id: userId }, secret, {
        expiresIn: process.env.JWT_EXPIRATION || '7d',
    });
}

function setAuthCookie(res, token) {
    res.cookie('token', token, getCookieOptions());
}

async function register(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        const token = generateToken(newUser._id);
        setAuthCookie(res, token);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser._id, username: newUser.username, email: newUser.email },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        setAuthCookie(res, token);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

async function logout(req, res) {
    try {
        res.clearCookie('token', getCookieOptions());
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to logout' });
    }
}

module.exports = { register, login, logout };