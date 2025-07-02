import { GraphQLContext } from '../types/context.types';
import { logger } from '@hospital/shared';

/**
 * Medical Records GraphQL Resolvers
 * Handles all medical record-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
export const medicalRecordsResolvers = {
  Query: {
    // Get single medical record
    async medicalRecord(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        if (!id) {
          throw new Error(context.i18n.translate('medical_record.errors.missing_id'));
        }

        logger.debug('Fetching medical record:', { id, requestId: context.requestId });

        const response = await context.restApi.getMedicalRecord(id);
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.fetch_failed'));
        }

        return response.data;
      } catch (error) {
        logger.error('Error fetching medical record:', error);
        throw error;
      }
    },

    // Get multiple medical records with filters
    async medicalRecords(
      _: any,
      { filters, limit = 20, offset = 0, sortBy = 'visitDate', sortOrder = 'DESC' }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug('Fetching medical records:', { filters, limit, offset, requestId: context.requestId });

        const response = await context.restApi.getMedicalRecords({
          ...filters,
          limit,
          offset,
          sortBy,
          sortOrder
        });
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.fetch_failed'));
        }

        return {
          edges: response.data.map((record: any) => ({
            node: record,
            cursor: Buffer.from(record.id).toString('base64')
          })),
          pageInfo: {
            hasNextPage: response.data.length === limit,
            hasPreviousPage: offset > 0,
            startCursor: response.data.length > 0 ? Buffer.from(response.data[0].id).toString('base64') : null,
            endCursor: response.data.length > 0 ? Buffer.from(response.data[response.data.length - 1].id).toString('base64') : null
          },
          totalCount: response.totalCount || response.data.length
        };
      } catch (error) {
        logger.error('Error fetching medical records:', error);
        throw error;
      }
    },

    // Get patient medical records
    async patientMedicalRecords(
      _: any,
      { patientId, limit = 20, offset = 0, dateFrom, dateTo }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug('Fetching patient medical records:', { patientId, limit, offset, requestId: context.requestId });

        const response = await context.restApi.getPatientMedicalRecords({
          patientId,
          limit,
          offset,
          dateFrom,
          dateTo
        });
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.patient_records_failed'));
        }

        return {
          edges: response.data.map((record: any) => ({
            node: record,
            cursor: Buffer.from(record.id).toString('base64')
          })),
          pageInfo: {
            hasNextPage: response.data.length === limit,
            hasPreviousPage: offset > 0,
            startCursor: response.data.length > 0 ? Buffer.from(response.data[0].id).toString('base64') : null,
            endCursor: response.data.length > 0 ? Buffer.from(response.data[response.data.length - 1].id).toString('base64') : null
          },
          totalCount: response.totalCount || response.data.length
        };
      } catch (error) {
        logger.error('Error fetching patient medical records:', error);
        throw error;
      }
    },

    // Get doctor medical records
    async doctorMedicalRecords(
      _: any,
      { doctorId, limit = 20, offset = 0, dateFrom, dateTo }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug('Fetching doctor medical records:', { doctorId, limit, offset, requestId: context.requestId });

        const response = await context.restApi.getDoctorMedicalRecords({
          doctorId,
          limit,
          offset,
          dateFrom,
          dateTo
        });
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.doctor_records_failed'));
        }

        return {
          edges: response.data.map((record: any) => ({
            node: record,
            cursor: Buffer.from(record.id).toString('base64')
          })),
          pageInfo: {
            hasNextPage: response.data.length === limit,
            hasPreviousPage: offset > 0,
            startCursor: response.data.length > 0 ? Buffer.from(response.data[0].id).toString('base64') : null,
            endCursor: response.data.length > 0 ? Buffer.from(response.data[response.data.length - 1].id).toString('base64') : null
          },
          totalCount: response.totalCount || response.data.length
        };
      } catch (error) {
        logger.error('Error fetching doctor medical records:', error);
        throw error;
      }
    },

    // Search medical records
    async searchMedicalRecords(
      _: any,
      { query, filters, limit = 20, offset = 0 }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug('Searching medical records:', { query, filters, limit, offset, requestId: context.requestId });

        const response = await context.restApi.searchMedicalRecords({
          query,
          ...filters,
          limit,
          offset
        });
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.search_failed'));
        }

        return {
          edges: response.data.map((record: any) => ({
            node: record,
            cursor: Buffer.from(record.id).toString('base64')
          })),
          pageInfo: {
            hasNextPage: response.data.length === limit,
            hasPreviousPage: offset > 0,
            startCursor: response.data.length > 0 ? Buffer.from(response.data[0].id).toString('base64') : null,
            endCursor: response.data.length > 0 ? Buffer.from(response.data[response.data.length - 1].id).toString('base64') : null
          },
          totalCount: response.totalCount || response.data.length
        };
      } catch (error) {
        logger.error('Error searching medical records:', error);
        throw error;
      }
    },

    // Get vital signs history
    async vitalSignsHistory(
      _: any,
      { patientId, limit = 20, offset = 0, dateFrom, dateTo }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug('Fetching vital signs history:', { patientId, limit, offset, requestId: context.requestId });

        const response = await context.restApi.getVitalSignsHistory({
          patientId,
          limit,
          offset,
          dateFrom,
          dateTo
        });
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.vital_signs_failed'));
        }

        return response.data;
      } catch (error) {
        logger.error('Error fetching vital signs history:', error);
        throw error;
      }
    },

    // Get lab results
    async labResults(
      _: any,
      { patientId, testType, limit = 20, offset = 0, dateFrom, dateTo }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug('Fetching lab results:', { patientId, testType, limit, offset, requestId: context.requestId });

        const response = await context.restApi.getLabResults({
          patientId,
          testType,
          limit,
          offset,
          dateFrom,
          dateTo
        });
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.lab_results_failed'));
        }

        return response.data;
      } catch (error) {
        logger.error('Error fetching lab results:', error);
        throw error;
      }
    }
  },

  Mutation: {
    // Create new medical record
    async createMedicalRecord(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug('Creating medical record:', { input, requestId: context.requestId });

        const response = await context.restApi.createMedicalRecord(input);
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.create_failed'));
        }

        logger.info('Medical record created successfully:', { recordId: response.data.id });
        return response.data;
      } catch (error) {
        logger.error('Error creating medical record:', error);
        throw error;
      }
    },

    // Update medical record
    async updateMedicalRecord(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug('Updating medical record:', { id, input, requestId: context.requestId });

        const response = await context.restApi.updateMedicalRecord(id, input);
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.update_failed'));
        }

        logger.info('Medical record updated successfully:', { recordId: id });
        return response.data;
      } catch (error) {
        logger.error('Error updating medical record:', error);
        throw error;
      }
    },

    // Delete medical record
    async deleteMedicalRecord(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug('Deleting medical record:', { id, requestId: context.requestId });

        const response = await context.restApi.deleteMedicalRecord(id);
        
        if (!response.success) {
          throw new Error(response.error?.message || context.i18n.translate('medical_record.errors.delete_failed'));
        }

        logger.info('Medical record deleted successfully:', { recordId: id });
        return true;
      } catch (error) {
        logger.error('Error deleting medical record:', error);
        throw error;
      }
    }
  },

  // Field resolvers for MedicalRecord type
  MedicalRecord: {
    // Resolve patient using DataLoader
    async patient(parent: any, _: any, context: GraphQLContext) {
      if (!parent.patientId) return null;

      try {
        return await context.dataloaders.patientById.load(parent.patientId);
      } catch (error) {
        logger.error('Error loading medical record patient:', error);
        return null;
      }
    },

    // Resolve doctor using DataLoader
    async doctor(parent: any, _: any, context: GraphQLContext) {
      if (!parent.doctorId) return null;

      try {
        return await context.dataloaders.doctorById.load(parent.doctorId);
      } catch (error) {
        logger.error('Error loading medical record doctor:', error);
        return null;
      }
    },

    // Resolve appointment using DataLoader
    async appointment(parent: any, _: any, context: GraphQLContext) {
      if (!parent.appointmentId) return null;

      try {
        return await context.dataloaders.appointmentById.load(parent.appointmentId);
      } catch (error) {
        logger.error('Error loading medical record appointment:', error);
        return null;
      }
    }
  },

  // Field resolvers for VitalSigns type
  VitalSigns: {
    // Calculate BMI if height and weight are available
    bmi(parent: any) {
      if (!parent.height || !parent.weight) return null;

      const heightInMeters = parent.height / 100;
      return parseFloat((parent.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }
  }
};

export default medicalRecordsResolvers;
