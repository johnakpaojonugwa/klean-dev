import jwt from 'jsonwebtoken';

export const auth = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
        
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            branchId: decoded.branchId
        };
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token, pls login again' });
    }
}

export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false, 
                message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`
            });
        }
        next();
    }
}
