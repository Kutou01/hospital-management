import { Request, Response, NextFunction } from 'express';
export declare class ProfileController {
    private profileService;
    private userService;
    constructor();
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
    getCurrentUserProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    getProfileById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    updateCurrentUserProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    getDoctorProfiles: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    getPatientProfiles: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private updateProfileByRole;
}
