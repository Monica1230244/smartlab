const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token invalide' });
    }
};

const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Permissions insuffisantes' });
        }
        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };
