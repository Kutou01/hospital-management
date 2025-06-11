"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_validators_1 = require("../validators/auth.validators");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const authController = new auth_controller_1.AuthController();
router.post('/signup', auth_validators_1.validateSignUp, authController.signUp);
router.post('/signin', auth_validators_1.validateSignIn, authController.signIn);
router.post('/signout', auth_middleware_1.authMiddleware, authController.signOut);
router.post('/refresh', auth_validators_1.validateRefreshToken, authController.refreshToken);
router.post('/reset-password', auth_validators_1.validateResetPassword, authController.resetPassword);
router.get('/verify', authController.verifyToken);
router.get('/me', auth_middleware_1.authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.full_name,
            role: req.user.role,
            is_active: req.user.is_active
        }
    });
});
router.post('/create-doctor-record', authController.createDoctorRecord);
router.post('/create-patient-record', authController.createPatientRecord);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map