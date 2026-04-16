const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_EXPIRATION || '7d' 
    });
}

async function register(req, res) {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);

        res.status(201).json({ 
            message: "User registered successfully",
            token,
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

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

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({ 
            message: "Login successful",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = { register, login };