import logger from "@hospital/shared/dist/utils/logger";
import { GraphQLContext } from "../context";

/**
 * Department GraphQL Resolvers
 * Handles all department-related queries, mutations, and subscriptions
 */
export const departmentResolvers = {
  Query: {
    // Get single department
    async department(
      _: any,
      { id, departmentId }: { id?: string; departmentId?: string },
      context: GraphQLContext
    ) {
      try {
        const identifier = id || departmentId;
        if (!identifier) {
          throw new Error("Cần cung cấp ID hoặc mã khoa");
        }

        logger.debug("Fetching department:", {
          identifier,
          requestId: context.requestId,
        });

        // Query Supabase directly for department data
        const { data, error } = await context.supabase
          .from("departments")
          .select("*")
          .or(`department_id.eq.${identifier},id.eq.${identifier}`)
          .single();

        if (error) {
          logger.error("Error fetching department from Supabase:", error);
          throw new Error("Không thể lấy thông tin khoa");
        }

        if (!data) {
          throw new Error("Không tìm thấy khoa");
        }

        // Transform database fields to GraphQL schema
        return {
          id: data.id || data.department_id,
          departmentId: data.department_id,
          name: data.department_name,
          nameVi: data.department_name,
          nameEn: data.department_name, // TODO: Add English name field to database
          description: data.description,
          code: data.department_code,
          type: data.type || "General",
          floor: data.floor,
          building: data.building || data.location,
          phoneNumber: data.phone_number,
          email: data.email,
          status: data.is_active ? "ACTIVE" : "INACTIVE",
          isActive: data.is_active,
          emergencyAvailable: data.emergency_available || false,
          totalRooms: data.total_rooms || 0,
          availableRooms: data.available_rooms || 0,
          totalBeds: data.total_beds || 0,
          availableBeds: data.available_beds || 0,
          maxPatients: data.max_patients || 100,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          currentPatients: 0, // TODO: Calculate from appointments
          todayAppointments: 0, // TODO: Calculate from appointments
          availabilityRate: 100.0, // TODO: Calculate
          occupancyRate: 0.0, // TODO: Calculate
        };
      } catch (error) {
        logger.error("Error fetching department:", error);
        throw error;
      }
    },

    // Get all departments
    async departments(
      _: any,
      {
        filters = {},
        limit = 20,
        offset = 0,
        sortBy = "department_name",
        sortOrder = "ASC",
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
        logger.debug("Fetching departments:", {
          filters,
          limit,
          offset,
          sortBy,
          sortOrder,
          requestId: context.requestId,
        });

        if (!context.supabase) {
          logger.error("Supabase client not available in context");
          throw new Error("Database connection not available");
        }

        let query = context.supabase.from("departments").select("*");

        // Apply filters
        if (filters.search) {
          query = query.or(
            `department_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          );
        }

        if (filters.isActive !== undefined) {
          query = query.eq("is_active", filters.isActive);
        }

        if (filters.type) {
          query = query.eq("type", filters.type);
        }

        if (filters.floor) {
          query = query.eq("floor", filters.floor);
        }

        if (filters.building) {
          query = query.ilike("location", `%${filters.building}%`);
        }

        // Apply sorting
        const ascending = sortOrder.toUpperCase() === "ASC";
        query = query.order(sortBy, { ascending });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        logger.debug("Supabase query result:", {
          hasData: !!data,
          dataLength: data?.length,
          error: error?.message,
          requestId: context.requestId,
        });

        if (error) {
          logger.error("Error fetching departments from Supabase:", error);
          return []; // Return empty array instead of throwing error
        }

        if (!data) {
          logger.warn("No departments found");
          return [];
        }

        // Transform database fields to GraphQL schema
        return data.map((dept: any) => ({
          id: dept.id || dept.department_id,
          departmentId: dept.department_id,
          name: dept.department_name,
          nameVi: dept.department_name,
          nameEn: dept.department_name, // TODO: Add English name field to database
          description: dept.description,
          code: dept.department_code,
          type: dept.type || "General",
          floor: dept.floor,
          building: dept.building || dept.location,
          phoneNumber: dept.phone_number,
          email: dept.email,
          status: dept.is_active ? "ACTIVE" : "INACTIVE",
          isActive: dept.is_active,
          emergencyAvailable: dept.emergency_available || false,
          totalRooms: dept.total_rooms || 0,
          availableRooms: dept.available_rooms || 0,
          totalBeds: dept.total_beds || 0,
          availableBeds: dept.available_beds || 0,
          maxPatients: dept.max_patients || 100,
          createdAt: dept.created_at,
          updatedAt: dept.updated_at,
          currentPatients: 0, // TODO: Calculate from appointments
          todayAppointments: 0, // TODO: Calculate from appointments
          availabilityRate: 100.0, // TODO: Calculate
          occupancyRate: 0.0, // TODO: Calculate
        }));
      } catch (error) {
        logger.error("Error fetching departments:", error);
        throw error;
      }
    },

    // Get department statistics
    async departmentStats(
      _: any,
      { departmentId }: { departmentId: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching department stats:", {
          departmentId,
          requestId: context.requestId,
        });

        // TODO: Implement actual statistics calculation
        // For now, return mock data
        return {
          departmentId,
          totalDoctors: 0,
          activeDoctors: 0,
          totalRooms: 0,
          availableRooms: 0,
          totalEquipment: 0,
          operationalEquipment: 0,
          todayAppointments: 0,
          thisWeekAppointments: 0,
          thisMonthAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          totalPatients: 0,
          newPatients: 0,
          returningPatients: 0,
          revenue: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            thisYear: 0,
            currency: "VND",
          },
          averageWaitTime: 0,
          averageConsultationTime: 0,
          patientSatisfactionScore: 0,
          occupancyRate: 0,
        };
      } catch (error) {
        logger.error("Error fetching department stats:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // Create department
    async createDepartment(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Creating department:", {
          input,
          requestId: context.requestId,
        });

        // TODO: Implement department creation
        throw new Error("Chức năng tạo khoa chưa được triển khai");
      } catch (error) {
        logger.error("Error creating department:", error);
        throw error;
      }
    },

    // Update department
    async updateDepartment(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Updating department:", {
          id,
          input,
          requestId: context.requestId,
        });

        // TODO: Implement department update
        throw new Error("Chức năng cập nhật khoa chưa được triển khai");
      } catch (error) {
        logger.error("Error updating department:", error);
        throw error;
      }
    },

    // Delete department
    async deleteDepartment(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Deleting department:", {
          id,
          requestId: context.requestId,
        });

        // TODO: Implement department deletion
        throw new Error("Chức năng xóa khoa chưa được triển khai");
      } catch (error) {
        logger.error("Error deleting department:", error);
        throw error;
      }
    },
  },

  // Field resolvers for Department type
  Department: {
    // Resolve head doctor using DataLoader
    async head(parent: any, _: any, context: GraphQLContext) {
      if (!parent.headDoctorId) return null;

      try {
        return await context.dataloaders.doctorById.load(parent.headDoctorId);
      } catch (error) {
        logger.error("Error loading department head doctor:", error);
        return null;
      }
    },

    // Resolve doctors in department
    async doctors(parent: any, args: any, context: GraphQLContext) {
      try {
        // TODO: Implement doctors loading for department
        return {
          nodes: [],
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      } catch (error) {
        logger.error("Error loading department doctors:", error);
        return {
          nodes: [],
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
    },

    // Resolve rooms in department
    async rooms(parent: any, args: any, context: GraphQLContext) {
      try {
        // TODO: Implement rooms loading for department
        return [];
      } catch (error) {
        logger.error("Error loading department rooms:", error);
        return [];
      }
    },

    // Resolve equipment in department
    async equipment(parent: any, args: any, context: GraphQLContext) {
      try {
        // TODO: Implement equipment loading for department
        return [];
      } catch (error) {
        logger.error("Error loading department equipment:", error);
        return [];
      }
    },

    // Resolve appointments in department
    async appointments(parent: any, args: any, context: GraphQLContext) {
      try {
        // TODO: Implement appointments loading for department
        return {
          nodes: [],
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      } catch (error) {
        logger.error("Error loading department appointments:", error);
        return {
          nodes: [],
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
    },
  },
};

export default departmentResolvers;
