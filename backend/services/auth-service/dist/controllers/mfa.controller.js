"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMFAVerificationNeeded = exports.getMFAAuditHistory = exports.checkMFACompliance = exports.unenrollTOTP = exports.authenticateWithMFA = exports.verifyTOTP = exports.challengeTOTP = exports.completeTOTPEnrollment = exports.enrollTOTP = exports.getMFAStatus = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const mfa_service_1 = require("../../../../lib/services/mfa.service");
const getMFAStatus = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const status = await mfa_service_1.mfaService.getUserMFAStatus();
        response_helpers_1.ResponseHelper.success(res, "MFA status retrieved successfully", {
            mfaStatus: status,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting MFA status:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to get MFA status");
    }
};
exports.getMFAStatus = getMFAStatus;
const enrollTOTP = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const { friendlyName } = req.body;
        const result = await mfa_service_1.mfaService.enrollTOTP(friendlyName);
        if (result.success) {
            response_helpers_1.ResponseHelper.success(res, "TOTP enrollment started successfully", {
                enrollment: {
                    factorId: result.factorId,
                    qrCode: result.qrCode,
                    secret: result.secret,
                    friendlyName: result.friendlyName,
                },
            });
        }
        else {
            response_helpers_1.ResponseHelper.badRequest(res, result.error || "Failed to start TOTP enrollment");
        }
    }
    catch (error) {
        logger_1.default.error("Error starting TOTP enrollment:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to start TOTP enrollment");
    }
};
exports.enrollTOTP = enrollTOTP;
const completeTOTPEnrollment = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const { factorId, code } = req.body;
        if (!factorId || !code) {
            response_helpers_1.ResponseHelper.badRequest(res, "Factor ID and verification code are required");
            return;
        }
        const success = await mfa_service_1.mfaService.completeEnrollment(factorId, code);
        if (success) {
            response_helpers_1.ResponseHelper.success(res, "TOTP enrollment completed successfully");
        }
        else {
            response_helpers_1.ResponseHelper.badRequest(res, "Invalid verification code");
        }
    }
    catch (error) {
        logger_1.default.error("Error completing TOTP enrollment:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to complete TOTP enrollment");
    }
};
exports.completeTOTPEnrollment = completeTOTPEnrollment;
const challengeTOTP = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const { factorId } = req.body;
        if (!factorId) {
            response_helpers_1.ResponseHelper.badRequest(res, "Factor ID is required");
            return;
        }
        const challengeId = await mfa_service_1.mfaService.challengeTOTP(factorId);
        response_helpers_1.ResponseHelper.success(res, "TOTP challenge created successfully", {
            challengeId,
        });
    }
    catch (error) {
        logger_1.default.error("Error creating TOTP challenge:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to create TOTP challenge");
    }
};
exports.challengeTOTP = challengeTOTP;
const verifyTOTP = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const { factorId, challengeId, code } = req.body;
        if (!factorId || !challengeId || !code) {
            response_helpers_1.ResponseHelper.badRequest(res, "Factor ID, challenge ID, and verification code are required");
            return;
        }
        const result = await mfa_service_1.mfaService.verifyTOTP(factorId, challengeId, code);
        if (result.success) {
            response_helpers_1.ResponseHelper.success(res, "TOTP verification successful", {
                verified: true,
                session: result.session,
            });
        }
        else {
            response_helpers_1.ResponseHelper.badRequest(res, result.error || "TOTP verification failed");
        }
    }
    catch (error) {
        logger_1.default.error("Error verifying TOTP:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to verify TOTP");
    }
};
exports.verifyTOTP = verifyTOTP;
const authenticateWithMFA = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const { factorId, code } = req.body;
        if (!factorId || !code) {
            response_helpers_1.ResponseHelper.badRequest(res, "Factor ID and verification code are required");
            return;
        }
        const result = await mfa_service_1.mfaService.authenticateWithMFA(factorId, code);
        if (result.success) {
            response_helpers_1.ResponseHelper.success(res, "MFA authentication successful", {
                authenticated: true,
                session: result.session,
            });
        }
        else {
            response_helpers_1.ResponseHelper.badRequest(res, result.error || "MFA authentication failed");
        }
    }
    catch (error) {
        logger_1.default.error("Error authenticating with MFA:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to authenticate with MFA");
    }
};
exports.authenticateWithMFA = authenticateWithMFA;
const unenrollTOTP = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const { factorId } = req.params;
        if (!factorId) {
            response_helpers_1.ResponseHelper.badRequest(res, "Factor ID is required");
            return;
        }
        const success = await mfa_service_1.mfaService.unenrollTOTP(factorId);
        if (success) {
            response_helpers_1.ResponseHelper.success(res, "TOTP factor unenrolled successfully");
        }
        else {
            response_helpers_1.ResponseHelper.badRequest(res, "Failed to unenroll TOTP factor");
        }
    }
    catch (error) {
        logger_1.default.error("Error unenrolling TOTP factor:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to unenroll TOTP factor");
    }
};
exports.unenrollTOTP = unenrollTOTP;
const checkMFACompliance = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const compliance = await mfa_service_1.mfaService.validateMFACompliance();
        response_helpers_1.ResponseHelper.success(res, "MFA compliance check completed", {
            compliance,
        });
    }
    catch (error) {
        logger_1.default.error("Error checking MFA compliance:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to check MFA compliance");
    }
};
exports.checkMFACompliance = checkMFACompliance;
const getMFAAuditHistory = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const { limit = 50 } = req.query;
        const auditHistory = await mfa_service_1.mfaService.getMFAAuditHistory(Number(limit));
        response_helpers_1.ResponseHelper.success(res, "MFA audit history retrieved successfully", {
            auditHistory,
            limit: Number(limit),
        });
    }
    catch (error) {
        logger_1.default.error("Error getting MFA audit history:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to get MFA audit history");
    }
};
exports.getMFAAuditHistory = getMFAAuditHistory;
const checkMFAVerificationNeeded = async (req, res) => {
    try {
        if (!req.user) {
            response_helpers_1.ResponseHelper.unauthorized(res, "User not authenticated");
            return;
        }
        const verificationNeeded = await mfa_service_1.mfaService.needsMFAVerification();
        response_helpers_1.ResponseHelper.success(res, "MFA verification check completed", {
            verificationNeeded,
        });
    }
    catch (error) {
        logger_1.default.error("Error checking MFA verification:", error);
        response_helpers_1.ResponseHelper.internalError(res, "Failed to check MFA verification");
    }
};
exports.checkMFAVerificationNeeded = checkMFAVerificationNeeded;
//# sourceMappingURL=mfa.controller.js.map