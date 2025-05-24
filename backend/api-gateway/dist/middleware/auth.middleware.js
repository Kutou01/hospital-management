"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided'
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'No token provided'
            });
            return;
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Add user info to request headers for downstream services
        req.headers['x-user-id'] = decoded.sub;
        req.headers['x-user-email'] = decoded.email;
        req.headers['x-user-role'] = decoded.role;
        console.log('Request authenticated via API Gateway', {
            userId: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            path: req.path,
            method: req.method
        });
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        else {
            res.status(401).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    }
};
exports.authMiddleware = authMiddleware;
