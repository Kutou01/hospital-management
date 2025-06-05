import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DoctorRepository } from '../repositories/doctor.repository';
import logger from '@hospital/shared/src/utils/logger';

export class DoctorController {
  private doctorRepository: DoctorRepository;

  constructor() {
    this.doctorRepository = new DoctorRepository();
  }

  async getAllDoctors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const doctors = await this.doctorRepository.findAll(limit, offset);
      const total = await this.doctorRepository.count();

      res.json({
        success: true,
        data: doctors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching doctors', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async getDoctorById(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const doctor = await this.doctorRepository.findById(doctorId);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
        return;
      }

      res.json({
        success: true,
        data: doctor
      });
    } catch (error) {
      logger.error('Error fetching doctor by ID', { error, doctorId: req.params.doctorId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async getDoctorsByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const doctors = await this.doctorRepository.findByDepartment(departmentId, limit, offset);
      const total = await this.doctorRepository.countByDepartment(departmentId);

      res.json({
        success: true,
        data: doctors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching doctors by department', { error, departmentId: req.params.departmentId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async searchDoctors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const searchQuery = {
        specialty: req.query.specialty as string,
        department_id: req.query.department_id as string,
        gender: req.query.gender as string,
        search: req.query.search as string
      };

      const doctors = await this.doctorRepository.search(searchQuery, limit, offset);

      res.json({
        success: true,
        data: doctors,
        pagination: {
          page,
          limit,
          total: doctors.length
        }
      });
    } catch (error) {
      logger.error('Error searching doctors', { error, query: req.query });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async createDoctor(req: Request, res: Response): Promise<void> {
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

      const doctor = await this.doctorRepository.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: doctor
      });
    } catch (error) {
      logger.error('Error creating doctor', { error, body: req.body });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async updateDoctor(req: Request, res: Response): Promise<void> {
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

      const { doctorId } = req.params;
      const doctor = await this.doctorRepository.update(doctorId, req.body);

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Doctor updated successfully',
        data: doctor
      });
    } catch (error) {
      logger.error('Error updating doctor', { error, doctorId: req.params.doctorId, body: req.body });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  async deleteDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const success = await this.doctorRepository.delete(doctorId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Doctor deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting doctor', { error, doctorId: req.params.doctorId });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}
