"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const express_validator_1 = require("express-validator");
const patient_repository_1 = require("../repositories/patient.repository");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class PatientController {
    constructor() {
        this.patientRepository = new patient_repository_1.PatientRepository();
    }
    async getAllPatients(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const filters = {
                search: req.query.search,
                gender: req.query.gender,
                status: req.query.status,
                blood_type: req.query.blood_type,
                age_min: req.query.age_min ? parseInt(req.query.age_min) : undefined,
                age_max: req.query.age_max ? parseInt(req.query.age_max) : undefined,
                created_after: req.query.created_after,
                created_before: req.query.created_before
            };
            const { patients, total } = await this.patientRepository.getAllPatients(filters, page, limit);
            const response = {
                success: true,
                data: patients,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getAllPatients:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patients',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientById(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { patientId } = req.params;
            const patient = await this.patientRepository.getPatientById(patientId);
            if (!patient) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const response = {
                success: true,
                data: patient,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientById:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientByProfileId(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { profileId } = req.params;
            const patient = await this.patientRepository.getPatientByProfileId(profileId);
            if (!patient) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const response = {
                success: true,
                data: patient,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientByProfileId:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientsByDoctorId(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { doctorId } = req.params;
            const patients = await this.patientRepository.getPatientsByDoctorId(doctorId);
            const response = {
                success: true,
                data: patients,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientsByDoctorId:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patients',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async createPatient(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const patientData = req.body;
            const patient = await this.patientRepository.createPatient(patientData);
            const response = {
                success: true,
                data: patient,
                message: 'Patient created successfully',
                timestamp: new Date().toISOString()
            };
            res.status(201).json(response);
        }
        catch (error) {
            logger_1.default.error('Error in createPatient:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async updatePatient(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { patientId } = req.params;
            const updateData = req.body;
            const exists = await this.patientRepository.patientExists(patientId);
            if (!exists) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const patient = await this.patientRepository.updatePatient(patientId, updateData);
            const response = {
                success: true,
                data: patient,
                message: 'Patient updated successfully',
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in updatePatient:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async deletePatient(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { patientId } = req.params;
            const exists = await this.patientRepository.patientExists(patientId);
            if (!exists) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            await this.patientRepository.deletePatient(patientId);
            res.json({
                success: true,
                message: 'Patient deleted successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in deletePatient:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientStats(req, res) {
        try {
            const stats = await this.patientRepository.getPatientStats();
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in getPatientStats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient statistics',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=patient.controller.js.map