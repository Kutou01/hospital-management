"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
class UserController {
    constructor() {
        this.getCurrentUser = async (req, res, next) => {
            try {
                const userId = req.user.id;
                const user = await this.userService.getUserById(userId);
                const response = {
                    success: true,
                    data: { user },
                    message: 'Current user retrieved successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getUserById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const currentUserId = req.user.id;
                const currentUserRole = req.user.role;
                // Users can only access their own data unless they're admin
                if (id !== currentUserId && currentUserRole !== 'admin') {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden: You can only access your own profile'
                    });
                    return;
                }
                const user = await this.userService.getUserById(id);
                const response = {
                    success: true,
                    data: { user },
                    message: 'User retrieved successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getAllUsers = async (req, res, next) => {
            try {
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;
                const users = await this.userService.getAllUsers(limit, offset);
                const total = await this.userService.getUserCount();
                const response = {
                    success: true,
                    data: { users },
                    message: 'Users retrieved successfully',
                    pagination: {
                        page: Math.floor(offset / limit) + 1,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: offset + limit < total,
                        hasPrev: offset > 0
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getUsersByRole = async (req, res, next) => {
            try {
                const { role } = req.params;
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;
                const users = await this.userService.getUsersByRole(role, limit, offset);
                const total = await this.userService.getUserCountByRole(role);
                const response = {
                    success: true,
                    data: { users },
                    message: `Users with role ${role} retrieved successfully`,
                    pagination: {
                        page: Math.floor(offset / limit) + 1,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: offset + limit < total,
                        hasPrev: offset > 0
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.updateUser = async (req, res, next) => {
            try {
                const { id } = req.params;
                const currentUserId = req.user.id;
                const currentUserRole = req.user.role;
                const userData = req.body;
                // Users can only update their own data unless they're admin
                if (id !== currentUserId && currentUserRole !== 'admin') {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden: You can only update your own profile'
                    });
                    return;
                }
                // Non-admin users cannot change is_active status
                if (currentUserRole !== 'admin' && userData.is_active !== undefined) {
                    delete userData.is_active;
                }
                const user = await this.userService.updateUser(id, userData);
                logger_1.default.info('User updated', {
                    userId: id,
                    updatedBy: currentUserId,
                    changes: Object.keys(userData)
                });
                const response = {
                    success: true,
                    data: { user },
                    message: 'User updated successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.activateUser = async (req, res, next) => {
            try {
                const { id } = req.params;
                const currentUserId = req.user.id;
                await this.userService.activateUser(id);
                logger_1.default.info('User activated', {
                    userId: id,
                    activatedBy: currentUserId
                });
                const response = {
                    success: true,
                    message: 'User activated successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.deactivateUser = async (req, res, next) => {
            try {
                const { id } = req.params;
                const currentUserId = req.user.id;
                // Prevent self-deactivation
                if (id === currentUserId) {
                    res.status(400).json({
                        success: false,
                        error: 'You cannot deactivate your own account'
                    });
                    return;
                }
                await this.userService.deactivateUser(id);
                logger_1.default.info('User deactivated', {
                    userId: id,
                    deactivatedBy: currentUserId
                });
                const response = {
                    success: true,
                    message: 'User deactivated successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteUser = async (req, res, next) => {
            try {
                const { id } = req.params;
                const currentUserId = req.user.id;
                // Prevent self-deletion
                if (id === currentUserId) {
                    res.status(400).json({
                        success: false,
                        error: 'You cannot delete your own account'
                    });
                    return;
                }
                await this.userService.deleteUser(id);
                logger_1.default.info('User deleted', {
                    userId: id,
                    deletedBy: currentUserId
                });
                const response = {
                    success: true,
                    message: 'User deleted successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getUserStats = async (req, res, next) => {
            try {
                const totalUsers = await this.userService.getUserCount();
                const adminCount = await this.userService.getUserCountByRole('admin');
                const doctorCount = await this.userService.getUserCountByRole('doctor');
                const patientCount = await this.userService.getUserCountByRole('patient');
                const nurseCount = await this.userService.getUserCountByRole('nurse');
                const receptionistCount = await this.userService.getUserCountByRole('receptionist');
                const stats = {
                    total: totalUsers,
                    byRole: {
                        admin: adminCount,
                        doctor: doctorCount,
                        patient: patientCount,
                        nurse: nurseCount,
                        receptionist: receptionistCount
                    }
                };
                const response = {
                    success: true,
                    data: { stats },
                    message: 'User statistics retrieved successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.userService = new user_service_1.UserService();
    }
}
exports.UserController = UserController;
