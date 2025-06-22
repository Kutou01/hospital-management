"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialtyController = void 0;
const express_validator_1 = require("express-validator");
class SpecialtyController {
    constructor() {
    }
    async getAllSpecialties(req, res) {
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
            res.json({
                success: true,
                data: [
                    {
                        specialty_id: 'SPEC001',
                        specialty_name: 'Cardiology',
                        specialty_code: 'CARD',
                        department_id: 'DEPT001',
                        description: 'Heart and cardiovascular system',
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ],
                message: 'Specialties retrieved successfully (test data)',
                timestamp: new Date().toISOString(),
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getSpecialtyById(req, res) {
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
            const { specialtyId } = req.params;
            const specialty = null;
            if (!specialty) {
                res.status(404).json({
                    success: false,
                    error: 'Specialty not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: specialty,
                message: 'Specialty retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getSpecialtyDoctors(req, res) {
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
            res.json({
                success: true,
                data: [],
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async createSpecialty(req, res) {
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
            const specialtyData = req.body;
            const newSpecialty = { ...specialtyData, specialty_id: 'TEST001' };
            res.status(201).json({
                success: true,
                data: newSpecialty,
                message: 'Specialty created successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async updateSpecialty(req, res) {
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
            const { specialtyId } = req.params;
            const updateData = req.body;
            const updatedSpecialty = { ...updateData, specialty_id: specialtyId };
            if (!updatedSpecialty) {
                res.status(404).json({
                    success: false,
                    error: 'Specialty not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: updatedSpecialty,
                message: 'Specialty updated successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async deleteSpecialty(req, res) {
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
            const { specialtyId } = req.params;
            const deleted = true;
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Specialty not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                message: 'Specialty deleted successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getSpecialtyStats(req, res) {
        try {
            const stats = { total: 5, active: 4, inactive: 1 };
            res.json({
                success: true,
                data: stats,
                message: 'Specialty statistics retrieved successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.SpecialtyController = SpecialtyController;
//# sourceMappingURL=specialty.controller.js.map