const jwt = require('jsonwebtoken');

function validateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Check if Bearer token exists

    if (!token) {
        return res.status(401).json({ message: 'Access token is required' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log("Error during jwt verify (this error can also be caused by non valid token)")
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.userId = decoded.userId; // Attach userId to request object for further use
        next(); 
    });
}

module.exports = validateToken;