"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const user_service_1 = require("../services/user.service");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
class ProfileController {
    constructor() {
        /**
         * @swagger
         * /api/profiles/me:
         *   get:
         *     summary: Get current user's profile
         *     tags: [Profile]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Profile retrieved successfully
         *       401:
         *         description: Unauthorized
         *       404:
         *         description: Profile not found
         */
        this.getCurrentUserProfile = async (req, res, next) => {
            try {
                const user = req.user;
                const profile = await this.profileService.getProfileByUserId(user.id, user.role);
                if (!profile) {
                    res.status(404).json({
                        success: false,
                        error: 'Profile not found'
                    });
                    return;
                }
                const response = {
                    success: true,
                    data: { profile },
                    message: 'Profile retrieved successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * @swagger
         * /api/profiles/{profileId}:
         *   get:
         *     summary: Get profile by ID
         *     tags: [Profile]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: profileId
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Profile retrieved successfully
         *       401:
         *         description: Unauthorized
         *       403:
         *         description: Access denied
         *       404:
         *         description: Profile not found
         */
        this.getProfileById = async (req, res, next) => {
            try {
                const { profileId } = req.params;
                const user = req.user;
                // Get user by profile ID to determine role
                const profileUser = await this.userService.getUserByProfileId(profileId);
                if (!profileUser) {
                    res.status(404).json({
                        success: false,
                        error: 'Profile not found'
                    });
                    return;
                }
                const profile = await this.profileService.getProfileByUserId(profileUser.id, profileUser.role);
                const response = {
                    success: true,
                    data: {
                        profile,
                        user: {
                            id: profileUser.id,
                            email: profileUser.email,
                            full_name: profileUser.full_name,
                            role: profileUser.role
                        }
                    },
                    message: 'Profile retrieved successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * @swagger
         * /api/profiles/me:
         *   put:
         *     summary: Update current user's profile
         *     tags: [Profile]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               profile_data:
         *                 type: object
         *     responses:
         *       200:
         *         description: Profile updated successfully
         *       401:
         *         description: Unauthorized
         *       404:
         *         description: Profile not found
         */
        this.updateCurrentUserProfile = async (req, res, next) => {
            try {
                const user = req.user;
                const { profile_data } = req.body;
                // Update profile based on role
                await this.updateProfileByRole(user.profile_id, user.role, profile_data);
                // Get updated profile
                const updatedProfile = await this.profileService.getProfileByUserId(user.id, user.role);
                logger_1.default.info('Profile updated successfully', {
                    userId: user.id,
                    role: user.role,
                    profileId: user.profile_id
                });
                const response = {
                    success: true,
                    data: { profile: updatedProfile },
                    message: 'Profile updated successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * @swagger
         * /api/profiles/doctors:
         *   get:
         *     summary: Get all doctor profiles
         *     tags: [Profile]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: specialization
         *         schema:
         *           type: string
         *       - in: query
         *         name: department_id
         *         schema:
         *           type: string
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *     responses:
         *       200:
         *         description: Doctor profiles retrieved successfully
         *       401:
         *         description: Unauthorized
         *       403:
         *         description: Access denied
         */
        this.getDoctorProfiles = async (req, res, next) => {
            try {
                const { specialization, department_id, page = 1, limit = 10 } = req.query;
                // This would be implemented in ProfileService
                // const doctors = await this.profileService.getDoctorProfiles({
                //   specialization: specialization as string,
                //   department_id: department_id as string,
                //   page: parseInt(page as string),
                //   limit: parseInt(limit as string)
                // });
                const response = {
                    success: true,
                    data: { doctors: [] }, // Placeholder
                    message: 'Doctor profiles retrieved successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * @swagger
         * /api/profiles/patients:
         *   get:
         *     summary: Get all patient profiles
         *     tags: [Profile]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Patient profiles retrieved successfully
         *       401:
         *         description: Unauthorized
         *       403:
         *         description: Access denied
         */
        this.getPatientProfiles = async (req, res, next) => {
            try {
                // This would be implemented in ProfileService
                // const patients = await this.profileService.getPatientProfiles();
                const response = {
                    success: true,
                    data: { patients: [] }, // Placeholder
                    message: 'Patient profiles retrieved successfully'
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.profileService = new profile_service_1.ProfileService();
        this.userService = new user_service_1.UserService();
    }
    async updateProfileByRole(profileId, role, profileData) {
        // This would be implemented based on role
        // For now, just log the update
        logger_1.default.info('Profile update requested', { profileId, role, profileData });
    }
}
exports.ProfileController = ProfileController;
