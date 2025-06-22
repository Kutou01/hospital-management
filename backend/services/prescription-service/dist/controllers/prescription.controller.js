"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionController = void 0;
const prescription_repository_1 = require("../repositories/prescription.repository");
const shared_1 = require("@hospital/shared");
const express_validator_1 = require("express-validator");
class PrescriptionController {
    constructor() {
        this.prescriptionRepository = new prescription_repository_1.PrescriptionRepository();
    }
    async getAllPrescriptions(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const prescriptions = await this.prescriptionRepository.findAllPrescriptions(limit, offset);
            res.json({
                success: true,
                data: prescriptions,
                pagination: {
                    page,
                    limit,
                    total: prescriptions.length
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching prescriptions', { error });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getPrescriptionById(req, res) {
        try {
            const { prescriptionId } = req.params;
            const prescription = await this.prescriptionRepository.findPrescriptionById(prescriptionId);
            if (!prescription) {
                res.status(404).json({
                    success: false,
                    message: 'Prescription not found'
                });
                return;
            }
            res.json({
                success: true,
                data: prescription
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching prescription by ID', { error, prescriptionId: req.params.prescriptionId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getPrescriptionsByPatientId(req, res) {
        try {
            const { patientId } = req.params;
            const prescriptions = await this.prescriptionRepository.findPrescriptionsByPatientId(patientId);
            res.json({
                success: true,
                data: prescriptions
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching prescriptions by patient ID', { error, patientId: req.params.patientId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getPrescriptionsByDoctorId(req, res) {
        try {
            const { doctorId } = req.params;
            const prescriptions = await this.prescriptionRepository.findPrescriptionsByDoctorId(doctorId);
            res.json({
                success: true,
                data: prescriptions
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching prescriptions by doctor ID', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async createPrescription(req, res) {
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
            const prescription = await this.prescriptionRepository.createPrescription(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Prescription created successfully',
                data: prescription
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating prescription', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updatePrescription(req, res) {
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
            const { prescriptionId } = req.params;
            const userId = req.user?.id || 'SYSTEM';
            const prescription = await this.prescriptionRepository.updatePrescription(prescriptionId, req.body, userId);
            res.json({
                success: true,
                message: 'Prescription updated successfully',
                data: prescription
            });
        }
        catch (error) {
            shared_1.logger.error('Error updating prescription', { error, prescriptionId: req.params.prescriptionId, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async deletePrescription(req, res) {
        try {
            const { prescriptionId } = req.params;
            await this.prescriptionRepository.deletePrescription(prescriptionId);
            res.json({
                success: true,
                message: 'Prescription deleted successfully'
            });
        }
        catch (error) {
            shared_1.logger.error('Error deleting prescription', { error, prescriptionId: req.params.prescriptionId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Medication endpoints
    async getAllMedications(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;
            const medications = await this.prescriptionRepository.findAllMedications(limit, offset);
            res.json({
                success: true,
                data: medications
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching medications', { error });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async searchMedications(req, res) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
                return;
            }
            const medications = await this.prescriptionRepository.searchMedications(q);
            res.json({
                success: true,
                data: medications
            });
        }
        catch (error) {
            shared_1.logger.error('Error searching medications', { error, query: req.query.q });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async createMedication(req, res) {
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
            const medication = await this.prescriptionRepository.createMedication(req.body);
            res.status(201).json({
                success: true,
                message: 'Medication created successfully',
                data: medication
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating medication', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async checkDrugInteractions(req, res) {
        try {
            const { medicationIds } = req.body;
            if (!Array.isArray(medicationIds) || medicationIds.length < 2) {
                res.status(400).json({
                    success: false,
                    message: 'At least 2 medication IDs are required'
                });
                return;
            }
            const interactionCheck = await this.prescriptionRepository.checkDrugInteractions(medicationIds);
            res.json({
                success: true,
                data: interactionCheck
            });
        }
        catch (error) {
            shared_1.logger.error('Error checking drug interactions', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.PrescriptionController = PrescriptionController;
//# sourceMappingURL=prescription.controller.js.map