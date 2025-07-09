import { GraphQLContext } from "../context";
/**
 * Appointment GraphQL Resolvers
 * Handles all appointment-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
export declare const appointmentResolvers: {
    Query: {
        appointment(_: any, { id, appointmentId }: {
            id?: string;
            appointmentId?: string;
        }, context: GraphQLContext): Promise<any>;
        appointments(_: any, { filters, limit, offset, sortBy, sortOrder, }: any, context: GraphQLContext): Promise<{
            edges: any;
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: any;
        }>;
        todayAppointments(_: any, { doctorId, departmentId, status }: any, context: GraphQLContext): Promise<any>;
        upcomingAppointments(_: any, { doctorId, patientId, days, limit }: any, context: GraphQLContext): Promise<any>;
        availableSlots(_: any, { doctorId, date, duration, }: {
            doctorId: string;
            date: string;
            duration: number;
        }, context: GraphQLContext): Promise<any[]>;
        appointmentStats(_: any, { doctorId, patientId, departmentId, dateFrom, dateTo }: any, context: GraphQLContext): Promise<any>;
    };
    Mutation: {
        createAppointment(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        updateAppointment(_: any, { id, input }: {
            id: string;
            input: any;
        }, context: GraphQLContext): Promise<any>;
        cancelAppointment(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        confirmAppointment(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<any>;
        rescheduleAppointment(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        checkInAppointment(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<any>;
        completeAppointment(_: any, { id, notes }: {
            id: string;
            notes?: string;
        }, context: GraphQLContext): Promise<any>;
    };
    Appointment: {
        endDateTime(parent: any): string | null;
        doctor(parent: any, _: any, context: GraphQLContext): Promise<any>;
        patient(parent: any, _: any, context: GraphQLContext): Promise<any>;
        department(parent: any, _: any, context: GraphQLContext): Promise<any>;
        isToday(parent: any): boolean;
        isUpcoming(parent: any): boolean;
        isPast(parent: any): boolean;
        canCancel(parent: any): boolean;
        canReschedule(parent: any): boolean;
        timeUntilAppointment(parent: any): number | null;
        waitingTime(parent: any): number | null;
    };
};
export default appointmentResolvers;
//# sourceMappingURL=appointment.resolvers.d.ts.map