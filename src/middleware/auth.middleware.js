const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
        
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id; // Attach user ID to request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        }
        res.status(403).json({ message: "Invalid token" });
    }
}

module.exports = { verifyToken };
