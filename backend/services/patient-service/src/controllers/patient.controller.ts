import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PatientRepository } from '../repositories/patient.repository';
import logger from '@hospital/shared/dist/utils/logger';
import { 
  CreatePatientDto, 
  UpdatePatientDto, 
  PatientSearchFilters,
  PatientResponse,
  PaginatedPatientResponse
} from '../types/patient.types';

export class PatientController {
  private patientRepository: PatientRepository;

  constructor() {
    this.patientRepository = new PatientRepository();
  }

  // Get all patients with optional filters and pagination
  async getAllPatients(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: PatientSearchFilters = {
        search: req.query.search as string,
        gender: req.query.gender as 'male' | 'female' | 'other',
        status: req.query.status as 'active' | 'inactive' | 'suspended',
        blood_type: req.query.blood_type as string,
        age_min: req.query.age_min ? parseInt(req.query.age_min as string) : undefined,
        age_max: req.query.age_max ? parseInt(req.query.age_max as string) : undefined,
        created_after: req.query.created_after as string,
        created_before: req.query.created_before as string
      };

      const { patients, total } = await this.patientRepository.getAllPatients(filters, page, limit);

      const response: PaginatedPatientResponse = {
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
    } catch (error) {
      logger.error('Error in getAllPatients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patients',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient by ID
  async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const response: PatientResponse = {
        success: true,
        data: patient,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getPatientById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient by profile ID
  async getPatientByProfileId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const response: PatientResponse = {
        success: true,
        data: patient,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getPatientByProfileId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patients by doctor ID
  async getPatientsByDoctorId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const response: PatientResponse = {
        success: true,
        data: patients,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getPatientsByDoctorId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patients',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create new patient
  async createPatient(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const patientData: CreatePatientDto = req.body;
      const patient = await this.patientRepository.createPatient(patientData);

      const response: PatientResponse = {
        success: true,
        data: patient,
        message: 'Patient created successfully',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error in createPatient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update patient
  async updatePatient(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
      const updateData: UpdatePatientDto = req.body;

      // Check if patient exists
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

      const response: PatientResponse = {
        success: true,
        data: patient,
        message: 'Patient updated successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in updatePatient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Delete patient (soft delete)
  async deletePatient(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      // Check if patient exists
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
    } catch (error) {
      logger.error('Error in deletePatient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient statistics
  async getPatientStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.patientRepository.getPatientStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getPatientStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}
