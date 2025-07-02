"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.requireDoctorOrAdmin = exports.requireAdmin = exports.requireDoctor = exports.requireRole = exports.authMiddleware = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const authMiddleware = async (req, res, next) => {
    try {
        logger_1.default.info('🔍 AUTH MIDDLEWARE CALLED', {
            url: req.url,
            method: req.method,
            headers: {
                authorization: req.headers.authorization ? 'Bearer ***' : 'none',
                'user-agent': req.headers['user-agent']
            }
        });
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Authorization token required'
            });
            return;
        }
        const token = authHeader.substring(7);
        const { data: { user }, error } = await database_config_1.supabaseAdmin.auth.getUser(token);
        logger_1.default.info('🔍 DEBUG Auth Middleware - User from token:', {
            userId: user?.id,
            email: user?.email,
            error: error?.message
        });
        if (error || !user) {
            logger_1.default.warn('Invalid token provided:', { error: error?.message });
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
            return;
        }
        const { data: profile, error: profileError } = await database_config_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        logger_1.default.info('🔍 DEBUG Auth Middleware - Profile from database:', {
            profileFound: !!profile,
            profileRole: profile?.role,
            profileActive: profile?.is_active,
            profileEmail: profile?.email,
            error: profileError?.message
        });
        if (profileError || !profile) {
            logger_1.default.error('Error fetching user profile:', { error: profileError, userId: user.id });
            res.status(401).json({
                success: false,
                message: 'User profile not found'
            });
            return;
        }
        if (!profile.is_active) {
            res.status(401).json({
                success: false,
                message: 'User account is inactive'
            });
            return;
        }
        let doctorId = null;
        if (profile.role === 'doctor') {
            const { data: doctor, error: doctorError } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select('doctor_id')
                .eq('profile_id', user.id)
                .single();
            if (!doctorError && doctor) {
                doctorId = doctor.doctor_id;
            }
        }
        req.user = {
            id: user.id,
            userId: user.id,
            email: user.email || profile.email,
            role: profile.role,
            full_name: profile.full_name,
            phone_number: profile.phone_number,
            is_active: profile.is_active,
            doctor_id: doctorId
        };
        logger_1.default.info('🔍 DEBUG Auth Middleware - Final req.user:', {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email
        });
        next();
    }
    catch (error) {
        logger_1.default.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireDoctor = (0, exports.requireRole)(['doctor']);
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireDoctorOrAdmin = (0, exports.requireRole)(['doctor', 'admin']);
exports.authenticateToken = exports.authMiddleware;
//# sourceMappingURL=auth.middleware.js.map