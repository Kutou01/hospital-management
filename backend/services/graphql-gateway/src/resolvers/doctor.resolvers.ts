import { GraphQLContext } from '../context';
import { requireAuth, requireOwnership } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import logger from '@hospital/shared/dist/utils/logger';

/**
 * Doctor GraphQL Resolvers
 * Handles all doctor-related queries, mutations, and subscriptions
 */
export const doctorResolvers = {
  Query: {
    // Get single doctor
    async doctor(
      _: any,
      { id, doctorId }: { id?: string; doctorId?: string },
      context: GraphQLContext
    ) {
      try {
        const identifier = id || doctorId;
        if (!identifier) {
          throw new Error('Cần cung cấp ID hoặc mã bác sĩ');
        }

        logger.debug('Fetching doctor:', { identifier, requestId: context.requestId });

        const response = await context.restApi.getDoctor(identifier);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Không thể lấy thông tin bác sĩ');
        }

        return response.data;
      } catch (error) {
        logger.error('Error fetching doctor:', error);
        throw error;
      }
    },

    // Get multiple doctors with filtering and pagination
    async doctors(
      _: any,
      { 
        filters, 
        limit = 20, 
        offset = 0, 
        sortBy = 'createdAt', 
        sortOrder = 'DESC' 
      }: {
        filters?: any;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: string;
      },
      context: GraphQLContext
    ) {
      try {
        logger.debug('Fetching doctors:', { 
          filters, 
          limit, 
          offset, 
          sortBy, 
          sortOrder,
          requestId: context.requestId 
        });

        const params = {
          page: Math.floor(offset / limit) + 1,
          limit,
          ...filters
        };

        const response = await context.restApi.getDoctors(params);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Không thể lấy danh sách bác sĩ');
        }

        // Transform to GraphQL Connection format
        const doctors = Array.isArray(response.data) ? response.data : [];
        const totalCount = response.pagination?.total || doctors.length;

        return {
          edges: doctors.map((doctor: any, index: number) => ({
            node: doctor,
            cursor: Buffer.from(`${offset + index}`).toString('base64')
          })),
          pageInfo: {
            hasNextPage: response.pagination?.hasNext || false,
            hasPreviousPage: response.pagination?.hasPrev || false,
            startCursor: doctors.length > 0 ? Buffer.from(`${offset}`).toString('base64') : null,
            endCursor: doctors.length > 0 ? Buffer.from(`${offset + doctors.length - 1}`).toString('base64') : null
          },
          totalCount
        };
      } catch (error) {
        logger.error('Error fetching doctors:', error);
        throw error;
      }
    },

    // Search doctors
    async searchDoctors(
      _: any,
      { 
        query, 
        filters, 
        limit = 20, 
        offset = 0 
      }: {
        query: string;
        filters?: any;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext
    ) {
      try {
        logger.debug('Searching doctors:', { 
          query, 
          filters, 
          limit, 
          offset,
          requestId: context.requestId 
        });

        const params = {
          page: Math.floor(offset / limit) + 1,
          limit,
          search: query,
          ...filters
        };

        const response = await context.restApi.getDoctors(params);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Không thể tìm kiếm bác sĩ');
        }

        // Transform to GraphQL Connection format
        const doctors = Array.isArray(response.data) ? response.data : [];
        const totalCount = response.pagination?.total || doctors.length;

        return {
          edges: doctors.map((doctor: any, index: number) => ({
            node: doctor,
            cursor: Buffer.from(`${offset + index}`).toString('base64')
          })),
          pageInfo: {
            hasNextPage: response.pagination?.hasNext || false,
            hasPreviousPage: response.pagination?.hasPrev || false,
            startCursor: doctors.length > 0 ? Buffer.from(`${offset}`).toString('base64') : null,
            endCursor: doctors.length > 0 ? Buffer.from(`${offset + doctors.length - 1}`).toString('base64') : null
          },
          totalCount
        };
      } catch (error) {
        logger.error('Error searching doctors:', error);
        throw error;
      }
    },

    // Get doctor availability
    async doctorAvailability(
      _: any,
      { doctorId, date }: { doctorId: string; date: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug('Fetching doctor availability:', { 
          doctorId, 
          date,
          requestId: context.requestId 
        });

        const response = await context.restApi.getAvailableSlots(doctorId, date);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Không thể lấy lịch trống của bác sĩ');
        }

        return response.data || [];
      } catch (error) {
        logger.error('Error fetching doctor availability:', error);
        throw error;
      }
    },

    // Get doctor statistics
    async doctorStats(
      _: any,
      { doctorId }: { doctorId: string },
      context: GraphQLContext
    ) {
      try {
        // Use DataLoader for optimization
        const stats = await context.dataloaders.doctorStats.load(doctorId);
        
        if (!stats) {
          throw new Error('Không thể lấy thống kê bác sĩ');
        }

        return stats;
      } catch (error) {
        logger.error('Error fetching doctor stats:', error);
        throw error;
      }
    }
  },

  Mutation: {
    // Create new doctor
    async createDoctor(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        // Require authentication and admin role
        if (!context.user) {
          throw new Error('Yêu cầu xác thực');
        }

        if (context.user.role !== 'admin') {
          throw new Error('Chỉ admin mới có thể tạo bác sĩ mới');
        }

        logger.debug('Creating doctor:', { 
          input: { ...input, email: input.email }, 
          userId: context.user.id,
          requestId: context.requestId 
        });

        const response = await context.restApi.createDoctor(input);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Không thể tạo bác sĩ mới');
        }

        // Clear relevant caches
        context.dataloaders.doctorById.clear(response.data.id);
        if (input.departmentId) {
          context.dataloaders.doctorsByDepartment.clear(input.departmentId);
        }

        return response.data;
      } catch (error) {
        logger.error('Error creating doctor:', error);
        throw error;
      }
    },

    // Update doctor
    async updateDoctor(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      try {
        // Require authentication
        if (!context.user) {
          throw new Error('Yêu cầu xác thực');
        }

        // Check permissions (admin or the doctor themselves)
        if (context.user.role !== 'admin' && context.user.doctorId !== id) {
          throw new Error('Không có quyền cập nhật thông tin bác sĩ này');
        }

        logger.debug('Updating doctor:', { 
          id, 
          input, 
          userId: context.user.id,
          requestId: context.requestId 
        });

        const response = await context.restApi.updateDoctor(id, input);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Không thể cập nhật thông tin bác sĩ');
        }

        // Clear relevant caches
        context.dataloaders.doctorById.clear(id);
        if (input.departmentId) {
          context.dataloaders.doctorsByDepartment.clear(input.departmentId);
        }

        return response.data;
      } catch (error) {
        logger.error('Error updating doctor:', error);
        throw error;
      }
    },

    // Delete doctor (soft delete)
    async deleteDoctor(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        // Require admin role
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Chỉ admin mới có thể xóa bác sĩ');
        }

        logger.debug('Deleting doctor:', { 
          id, 
          userId: context.user.id,
          requestId: context.requestId 
        });

        const response = await context.restApi.deleteDoctor(id);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Không thể xóa bác sĩ');
        }

        // Clear all related caches
        context.dataloaders.doctorById.clear(id);
        
        return true;
      } catch (error) {
        logger.error('Error deleting doctor:', error);
        throw error;
      }
    }
  },

  // Field resolvers for Doctor type
  Doctor: {
    // Resolve department using DataLoader
    async department(parent: any, _: any, context: GraphQLContext) {
      if (!parent.departmentId) return null;
      
      try {
        return await context.dataloaders.departmentById.load(parent.departmentId);
      } catch (error) {
        logger.error('Error loading doctor department:', error);
        return null;
      }
    },

    // Resolve appointments using DataLoader
    async appointments(
      parent: any, 
      { status, dateFrom, dateTo, limit = 10, offset = 0 }: any,
      context: GraphQLContext
    ) {
      try {
        const appointments = await context.dataloaders.appointmentsByDoctor.load(parent.doctorId || parent.id);
        
        // Apply filters
        let filteredAppointments = appointments || [];
        
        if (status) {
          filteredAppointments = filteredAppointments.filter((apt: any) => apt.status === status);
        }
        
        if (dateFrom) {
          filteredAppointments = filteredAppointments.filter((apt: any) => 
            new Date(apt.scheduledDate) >= new Date(dateFrom)
          );
        }
        
        if (dateTo) {
          filteredAppointments = filteredAppointments.filter((apt: any) => 
            new Date(apt.scheduledDate) <= new Date(dateTo)
          );
        }

        // Apply pagination
        const paginatedAppointments = filteredAppointments.slice(offset, offset + limit);
        
        return {
          edges: paginatedAppointments.map((appointment: any, index: number) => ({
            node: appointment,
            cursor: Buffer.from(`${offset + index}`).toString('base64')
          })),
          pageInfo: {
            hasNextPage: offset + limit < filteredAppointments.length,
            hasPreviousPage: offset > 0,
            startCursor: paginatedAppointments.length > 0 ? Buffer.from(`${offset}`).toString('base64') : null,
            endCursor: paginatedAppointments.length > 0 ? Buffer.from(`${offset + paginatedAppointments.length - 1}`).toString('base64') : null
          },
          totalCount: filteredAppointments.length
        };
      } catch (error) {
        logger.error('Error loading doctor appointments:', error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 0
        };
      }
    },

    // Resolve reviews using DataLoader
    async reviews(
      parent: any,
      { limit = 10, offset = 0 }: any,
      context: GraphQLContext
    ) {
      try {
        const reviews = await context.dataloaders.doctorReviews.load(parent.doctorId || parent.id);
        
        // Apply pagination
        const paginatedReviews = (reviews || []).slice(offset, offset + limit);
        
        return {
          edges: paginatedReviews.map((review: any, index: number) => ({
            node: review,
            cursor: Buffer.from(`${offset + index}`).toString('base64')
          })),
          pageInfo: {
            hasNextPage: offset + limit < (reviews || []).length,
            hasPreviousPage: offset > 0,
            startCursor: paginatedReviews.length > 0 ? Buffer.from(`${offset}`).toString('base64') : null,
            endCursor: paginatedReviews.length > 0 ? Buffer.from(`${offset + paginatedReviews.length - 1}`).toString('base64') : null
          },
          totalCount: (reviews || []).length
        };
      } catch (error) {
        logger.error('Error loading doctor reviews:', error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 0
        };
      }
    },

    // Computed fields
    async averageRating(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
        return stats?.averageRating || 0;
      } catch (error) {
        logger.error('Error loading doctor average rating:', error);
        return 0;
      }
    },

    async totalPatients(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
        return stats?.totalPatients || 0;
      } catch (error) {
        logger.error('Error loading doctor total patients:', error);
        return 0;
      }
    },

    async totalAppointments(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
        return stats?.totalAppointments || 0;
      } catch (error) {
        logger.error('Error loading doctor total appointments:', error);
        return 0;
      }
    },

    async upcomingAppointments(parent: any, _: any, context: GraphQLContext) {
      try {
        const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
        return stats?.upcomingAppointments || 0;
      } catch (error) {
        logger.error('Error loading doctor upcoming appointments:', error);
        return 0;
      }
    },

    async availableToday(parent: any, _: any, context: GraphQLContext) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const slots = await context.dataloaders.availableSlots.load(`${parent.doctorId || parent.id}:${today}`);
        return (slots || []).some((slot: any) => slot.isAvailable);
      } catch (error) {
        logger.error('Error checking doctor availability today:', error);
        return false;
      }
    }
  }
};

export default doctorResolvers;
