"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = void 0;
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }
            if (!allowedRoles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};
exports.roleMiddleware = roleMiddleware;
