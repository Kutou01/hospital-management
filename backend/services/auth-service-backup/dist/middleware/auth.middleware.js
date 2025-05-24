"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const common_types_1 = require("@hospital/shared/src/types/common.types");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_types_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!token) {
            throw new common_types_1.UnauthorizedError('No token provided');
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Add user info to request object
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            full_name: decoded.full_name,
            profile_id: decoded.profile_id,
            permissions: decoded.permissions || []
        };
        logger_1.default.info('User authenticated', {
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
                error: error instanceof Error ? error.message : 'Authentication failed'
            });
        }
    }
};
exports.authMiddleware = authMiddleware;
