import { Request, Response } from 'express';
import { MedicalRecordRepository } from '../repositories/medical-record.repository';
import { logger } from '@hospital/shared';
import { validationResult } from 'express-validator';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class MedicalRecordController {
  private medicalRecordRepository: MedicalRecordRepository;

  constructor() {
    this.medicalRecordRepository = new MedicalRecordRepository();
  }

  async getAllMedicalRecords(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
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
    } catch (error) {
      logger.error('Error fetching medical records', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async getMedicalRecordById(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      logger.error('Error fetching medical record by ID', { error, recordId: req.params.recordId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async getMedicalRecordsByPatientId(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const records = await this.medicalRecordRepository.findByPatientId(patientId);

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      logger.error('Error fetching medical records by patient ID', { error, patientId: req.params.patientId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async getMedicalRecordsByDoctorId(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const records = await this.medicalRecordRepository.findByDoctorId(doctorId);

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      logger.error('Error fetching medical records by doctor ID', { error, doctorId: req.params.doctorId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async createMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
    } catch (error) {
      logger.error('Error creating medical record', { error, body: req.body });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async updateMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
    } catch (error) {
      logger.error('Error updating medical record', { error, recordId: req.params.recordId, body: req.body });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async deleteMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      await this.medicalRecordRepository.delete(recordId);

      res.json({
        success: true,
        message: 'Medical record deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting medical record', { error, recordId: req.params.recordId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Lab Results endpoints
  async createLabResult(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
    } catch (error) {
      logger.error('Error creating lab result', { error, body: req.body });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async getLabResultsByRecordId(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const labResults = await this.medicalRecordRepository.getLabResultsByRecordId(recordId);

      res.json({
        success: true,
        data: labResults
      });
    } catch (error) {
      logger.error('Error fetching lab results', { error, recordId: req.params.recordId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Vital Signs endpoints
  async createVitalSigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
    } catch (error) {
      logger.error('Error creating vital signs', { error, body: req.body });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async getVitalSignsByRecordId(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const vitalSigns = await this.medicalRecordRepository.getVitalSignsByRecordId(recordId);

      res.json({
        success: true,
        data: vitalSigns
      });
    } catch (error) {
      logger.error('Error fetching vital signs', { error, recordId: req.params.recordId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}
