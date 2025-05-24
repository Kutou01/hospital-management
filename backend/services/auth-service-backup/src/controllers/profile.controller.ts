import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../services/user.service';
import { ApiResponse } from '@hospital/shared/src/types/common.types';
import { AuthenticatedRequest } from '../middleware/permission.middleware';
import logger from '@hospital/shared/src/utils/logger';

export class ProfileController {
  private profileService: ProfileService;
  private userService: UserService;

  constructor() {
    this.profileService = new ProfileService();
    this.userService = new UserService();
  }

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
  getCurrentUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      const profile = await this.profileService.getProfileByUserId(user.id, user.role);
      
      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: { profile },
        message: 'Profile retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
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
  getProfileById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { profileId } = req.params;
      const user = (req as AuthenticatedRequest).user;

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

      const response: ApiResponse = {
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
    } catch (error) {
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
  updateCurrentUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { profile_data } = req.body;

      // Update profile based on role
      await this.updateProfileByRole(user.profile_id!, user.role, profile_data);

      // Get updated profile
      const updatedProfile = await this.profileService.getProfileByUserId(user.id, user.role);

      logger.info('Profile updated successfully', {
        userId: user.id,
        role: user.role,
        profileId: user.profile_id
      });

      const response: ApiResponse = {
        success: true,
        data: { profile: updatedProfile },
        message: 'Profile updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
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
  getDoctorProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { specialization, department_id, page = 1, limit = 10 } = req.query;

      // This would be implemented in ProfileService
      // const doctors = await this.profileService.getDoctorProfiles({
      //   specialization: specialization as string,
      //   department_id: department_id as string,
      //   page: parseInt(page as string),
      //   limit: parseInt(limit as string)
      // });

      const response: ApiResponse = {
        success: true,
        data: { doctors: [] }, // Placeholder
        message: 'Doctor profiles retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
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
  getPatientProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This would be implemented in ProfileService
      // const patients = await this.profileService.getPatientProfiles();

      const response: ApiResponse = {
        success: true,
        data: { patients: [] }, // Placeholder
        message: 'Patient profiles retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  private async updateProfileByRole(profileId: string, role: string, profileData: any): Promise<void> {
    // This would be implemented based on role
    // For now, just log the update
    logger.info('Profile update requested', { profileId, role, profileData });
  }
}
