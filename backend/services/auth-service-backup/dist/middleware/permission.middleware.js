"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canManageSystem = exports.canWriteBilling = exports.canReadBilling = exports.canWritePrescriptions = exports.canReadPrescriptions = exports.canWriteMedicalRecords = exports.canReadMedicalRecords = exports.canWriteAppointments = exports.canReadAppointments = exports.canWriteDoctors = exports.canReadDoctors = exports.canWritePatients = exports.canReadPatients = exports.canDeleteUsers = exports.canWriteUsers = exports.canReadUsers = exports.createResourcePermission = exports.profileAccessMiddleware = exports.ownerOrAdminMiddleware = exports.anyPermissionMiddleware = exports.permissionMiddleware = void 0;
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
/**
 * Middleware to check if user has specific permission
 */
const permissionMiddleware = (requiredPermission) => {
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
            if (!user.permissions || !user.permissions.includes(requiredPermission)) {
                logger_1.default.warn('Permission denied', {
                    userId: user.id,
                    role: user.role,
                    requiredPermission,
                    userPermissions: user.permissions,
                    path: req.path,
                    method: req.method
                });
                res.status(403).json({
                    success: false,
                    error: `Permission denied. Required permission: ${requiredPermission}`
                });
                return;
            }
            logger_1.default.info('Permission granted', {
                userId: user.id,
                role: user.role,
                permission: requiredPermission,
                path: req.path,
                method: req.method
            });
            next();
        }
        catch (error) {
            logger_1.default.error('Permission middleware error', { error });
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};
exports.permissionMiddleware = permissionMiddleware;
/**
 * Middleware to check if user has any of the specified permissions
 */
const anyPermissionMiddleware = (requiredPermissions) => {
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
            const hasPermission = requiredPermissions.some(permission => user.permissions && user.permissions.includes(permission));
            if (!hasPermission) {
                logger_1.default.warn('Permission denied - no matching permissions', {
                    userId: user.id,
                    role: user.role,
                    requiredPermissions,
                    userPermissions: user.permissions,
                    path: req.path,
                    method: req.method
                });
                res.status(403).json({
                    success: false,
                    error: `Permission denied. Required one of: ${requiredPermissions.join(', ')}`
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Any permission middleware error', { error });
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};
exports.anyPermissionMiddleware = anyPermissionMiddleware;
/**
 * Middleware to check if user can access their own resource or has admin permission
 */
const ownerOrAdminMiddleware = (userIdParam = 'id') => {
    return (req, res, next) => {
        try {
            const user = req.user;
            const resourceUserId = req.params[userIdParam];
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }
            // Allow if user is accessing their own resource
            if (user.id === resourceUserId) {
                next();
                return;
            }
            // Allow if user has admin permissions
            if (user.permissions && user.permissions.includes('users:read')) {
                next();
                return;
            }
            logger_1.default.warn('Access denied - not owner or admin', {
                userId: user.id,
                role: user.role,
                resourceUserId,
                path: req.path,
                method: req.method
            });
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own resources.'
            });
        }
        catch (error) {
            logger_1.default.error('Owner or admin middleware error', { error });
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};
exports.ownerOrAdminMiddleware = ownerOrAdminMiddleware;
/**
 * Middleware to check if user has role-based access to profile
 */
const profileAccessMiddleware = (req, res, next) => {
    try {
        const user = req.user;
        const profileId = req.params.profileId;
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        // Allow if user is accessing their own profile
        if (user.profile_id === profileId) {
            next();
            return;
        }
        // Allow if user has appropriate read permissions
        const canReadProfiles = user.permissions && (user.permissions.includes('patients:read') ||
            user.permissions.includes('doctors:read') ||
            user.permissions.includes('users:read'));
        if (canReadProfiles) {
            next();
            return;
        }
        logger_1.default.warn('Profile access denied', {
            userId: user.id,
            role: user.role,
            profileId,
            userProfileId: user.profile_id,
            path: req.path,
            method: req.method
        });
        res.status(403).json({
            success: false,
            error: 'Access denied. You can only access your own profile.'
        });
    }
    catch (error) {
        logger_1.default.error('Profile access middleware error', { error });
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.profileAccessMiddleware = profileAccessMiddleware;
/**
 * Helper function to create resource-specific permission middleware
 */
const createResourcePermission = (resource, action) => {
    return (0, exports.permissionMiddleware)(`${resource}:${action}`);
};
exports.createResourcePermission = createResourcePermission;
// Common permission middlewares
exports.canReadUsers = (0, exports.permissionMiddleware)('users:read');
exports.canWriteUsers = (0, exports.permissionMiddleware)('users:write');
exports.canDeleteUsers = (0, exports.permissionMiddleware)('users:delete');
exports.canReadPatients = (0, exports.permissionMiddleware)('patients:read');
exports.canWritePatients = (0, exports.permissionMiddleware)('patients:write');
exports.canReadDoctors = (0, exports.permissionMiddleware)('doctors:read');
exports.canWriteDoctors = (0, exports.permissionMiddleware)('doctors:write');
exports.canReadAppointments = (0, exports.permissionMiddleware)('appointments:read');
exports.canWriteAppointments = (0, exports.permissionMiddleware)('appointments:write');
exports.canReadMedicalRecords = (0, exports.permissionMiddleware)('medical-records:read');
exports.canWriteMedicalRecords = (0, exports.permissionMiddleware)('medical-records:write');
exports.canReadPrescriptions = (0, exports.permissionMiddleware)('prescriptions:read');
exports.canWritePrescriptions = (0, exports.permissionMiddleware)('prescriptions:write');
exports.canReadBilling = (0, exports.permissionMiddleware)('billing:read');
exports.canWriteBilling = (0, exports.permissionMiddleware)('billing:write');
exports.canManageSystem = (0, exports.permissionMiddleware)('system:manage');
