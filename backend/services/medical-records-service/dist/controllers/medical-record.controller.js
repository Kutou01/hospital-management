"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordController = void 0;
const medical_record_repository_1 = require("../repositories/medical-record.repository");
const shared_1 = require("@hospital/shared");
const express_validator_1 = require("express-validator");
class MedicalRecordController {
    constructor() {
        this.medicalRecordRepository = new medical_record_repository_1.MedicalRecordRepository();
    }
    async getAllMedicalRecords(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const records = await this.medicalRecordRepository.findAll(limit, offset);
            const total = await this.medicalRecordRepository.count();
            res.json({
                success: true,
                data: records,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical records', { error });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getMedicalRecordById(req, res) {
        try {
            const { recordId } = req.params;
            const record = await this.medicalRecordRepository.findById(recordId);
            if (!record) {
                res.status(404).json({
                    success: false,
                    message: 'Medical record not found'
                });
                return;
            }
            res.json({
                success: true,
                data: record
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical record by ID', { error, recordId: req.params.recordId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getMedicalRecordsByPatientId(req, res) {
        try {
            const { patientId } = req.params;
            const records = await this.medicalRecordRepository.findByPatientId(patientId);
            res.json({
                success: true,
                data: records
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical records by patient ID', { error, patientId: req.params.patientId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getMedicalRecordsByDoctorId(req, res) {
        try {
            const { doctorId } = req.params;
            const records = await this.medicalRecordRepository.findByDoctorId(doctorId);
            res.json({
                success: true,
                data: records
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical records by doctor ID', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async createMedicalRecord(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const userId = req.user?.id || 'SYSTEM';
            const record = await this.medicalRecordRepository.create(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Medical record created successfully',
                data: record
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating medical record', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updateMedicalRecord(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { recordId } = req.params;
            const userId = req.user?.id || 'SYSTEM';
            const record = await this.medicalRecordRepository.update(recordId, req.body, userId);
            res.json({
                success: true,
                message: 'Medical record updated successfully',
                data: record
            });
        }
        catch (error) {
            shared_1.logger.error('Error updating medical record', { error, recordId: req.params.recordId, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async deleteMedicalRecord(req, res) {
        try {
            const { recordId } = req.params;
            await this.medicalRecordRepository.delete(recordId);
            res.json({
                success: true,
                message: 'Medical record deleted successfully'
            });
        }
        catch (error) {
            shared_1.logger.error('Error deleting medical record', { error, recordId: req.params.recordId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Lab Results endpoints
    async createLabResult(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const labResult = await this.medicalRecordRepository.createLabResult(req.body);
            res.status(201).json({
                success: true,
                message: 'Lab result created successfully',
                data: labResult
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating lab result', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getLabResultsByRecordId(req, res) {
        try {
            const { recordId } = req.params;
            const labResults = await this.medicalRecordRepository.getLabResultsByRecordId(recordId);
            res.json({
                success: true,
                data: labResults
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching lab results', { error, recordId: req.params.recordId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Vital Signs endpoints
    async createVitalSigns(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const userId = req.user?.id || 'SYSTEM';
            const vitalSigns = await this.medicalRecordRepository.createVitalSigns(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Vital signs recorded successfully',
                data: vitalSigns
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating vital signs', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getVitalSignsByRecordId(req, res) {
        try {
            const { recordId } = req.params;
            const vitalSigns = await this.medicalRecordRepository.getVitalSignsByRecordId(recordId);
            res.json({
                success: true,
                data: vitalSigns
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching vital signs', { error, recordId: req.params.recordId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.MedicalRecordController = MedicalRecordController;
//# sourceMappingURL=medical-record.controller.js.map