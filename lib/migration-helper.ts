// Migration helper to gradually transition from Supabase to microservices
import { apiClient } from './api-client';
import { supabase, doctorsApi, patientsApi, appointmentsApi, departmentsApi, roomsApi } from './supabase';

// Feature flags to control which APIs to use
const USE_MICROSERVICES = {
  auth: process.env.NEXT_PUBLIC_USE_MICROSERVICES_AUTH === 'true',
  doctors: process.env.NEXT_PUBLIC_USE_MICROSERVICES_DOCTORS === 'true',
  patients: process.env.NEXT_PUBLIC_USE_MICROSERVICES_PATIENTS === 'true',
  appointments: process.env.NEXT_PUBLIC_USE_MICROSERVICES_APPOINTMENTS === 'true',
  departments: process.env.NEXT_PUBLIC_USE_MICROSERVICES_DEPARTMENTS === 'true',
  rooms: process.env.NEXT_PUBLIC_USE_MICROSERVICES_ROOMS === 'true',
};

// Unified API interface that can switch between Supabase and microservices
export const unifiedApi = {
  // Doctor operations
  doctors: {
    getAll: async () => {
      if (USE_MICROSERVICES.doctors) {
        const response = await apiClient.getAllDoctors();
        return response.data || [];
      } else {
        return await doctorsApi.getAllDoctors();
      }
    },

    getById: async (id: string) => {
      if (USE_MICROSERVICES.doctors) {
        const response = await apiClient.getDoctorById(id);
        return response.data;
      } else {
        return await doctorsApi.getDoctorById(id);
      }
    },

    create: async (doctorData: any) => {
      if (USE_MICROSERVICES.doctors) {
        const response = await apiClient.createDoctor(doctorData);
        return response.data;
      } else {
        return await doctorsApi.createDoctor(doctorData);
      }
    },

    update: async (id: string, doctorData: any) => {
      if (USE_MICROSERVICES.doctors) {
        const response = await apiClient.updateDoctor(id, doctorData);
        return response.data;
      } else {
        return await doctorsApi.updateDoctor(id, doctorData);
      }
    },

    delete: async (id: string) => {
      if (USE_MICROSERVICES.doctors) {
        const response = await apiClient.deleteDoctor(id);
        return !response.error;
      } else {
        return await doctorsApi.deleteDoctor(id);
      }
    }
  },

  // Patient operations
  patients: {
    getAll: async () => {
      if (USE_MICROSERVICES.patients) {
        const response = await apiClient.getAllPatients();
        return response.data || [];
      } else {
        return await patientsApi.getAllPatients();
      }
    },

    getById: async (id: string) => {
      if (USE_MICROSERVICES.patients) {
        const response = await apiClient.getPatientById(id);
        return response.data;
      } else {
        return await patientsApi.getPatientById(id);
      }
    },

    create: async (patientData: any) => {
      if (USE_MICROSERVICES.patients) {
        const response = await apiClient.createPatient(patientData);
        return response.data;
      } else {
        return await patientsApi.createPatient(patientData);
      }
    },

    update: async (id: string, patientData: any) => {
      if (USE_MICROSERVICES.patients) {
        const response = await apiClient.updatePatient(id, patientData);
        return response.data;
      } else {
        return await patientsApi.updatePatient(id, patientData);
      }
    },

    delete: async (id: string) => {
      if (USE_MICROSERVICES.patients) {
        const response = await apiClient.deletePatient(id);
        return !response.error;
      } else {
        return await patientsApi.deletePatient(id);
      }
    }
  },

  // Appointment operations
  appointments: {
    getAll: async () => {
      if (USE_MICROSERVICES.appointments) {
        const response = await apiClient.getAllAppointments();
        return response.data || [];
      } else {
        return await appointmentsApi.getAllAppointments();
      }
    },

    getById: async (id: string) => {
      if (USE_MICROSERVICES.appointments) {
        const response = await apiClient.getAppointmentById(id);
        return response.data;
      } else {
        return await appointmentsApi.getAppointmentById(id);
      }
    },

    create: async (appointmentData: any) => {
      if (USE_MICROSERVICES.appointments) {
        const response = await apiClient.createAppointment(appointmentData);
        return response.data;
      } else {
        return await appointmentsApi.createAppointment(appointmentData);
      }
    },

    update: async (id: string, appointmentData: any) => {
      if (USE_MICROSERVICES.appointments) {
        const response = await apiClient.updateAppointment(id, appointmentData);
        return response.data;
      } else {
        return await appointmentsApi.updateAppointment(id, appointmentData);
      }
    },

    delete: async (id: string) => {
      if (USE_MICROSERVICES.appointments) {
        const response = await apiClient.deleteAppointment(id);
        return !response.error;
      } else {
        return await appointmentsApi.deleteAppointment(id);
      }
    }
  },

  // Department operations
  departments: {
    getAll: async () => {
      if (USE_MICROSERVICES.departments) {
        const response = await apiClient.getAllDepartments();
        return response.data || [];
      } else {
        return await departmentsApi.getAllDepartments();
      }
    },

    getById: async (id: string) => {
      if (USE_MICROSERVICES.departments) {
        const response = await apiClient.getDepartmentById(id);
        return response.data;
      } else {
        return await departmentsApi.getDepartmentById(id);
      }
    },

    create: async (departmentData: any) => {
      if (USE_MICROSERVICES.departments) {
        const response = await apiClient.createDepartment(departmentData);
        return response.data;
      } else {
        return await departmentsApi.createDepartment(departmentData);
      }
    },

    update: async (id: string, departmentData: any) => {
      if (USE_MICROSERVICES.departments) {
        const response = await apiClient.updateDepartment(id, departmentData);
        return response.data;
      } else {
        return await departmentsApi.updateDepartment(id, departmentData);
      }
    },

    delete: async (id: string) => {
      if (USE_MICROSERVICES.departments) {
        const response = await apiClient.deleteDepartment(id);
        return !response.error;
      } else {
        return await departmentsApi.deleteDepartment(id);
      }
    }
  },

  // Room operations
  rooms: {
    getAll: async () => {
      if (USE_MICROSERVICES.rooms) {
        const response = await apiClient.getAllRooms();
        return response.data || [];
      } else {
        return await roomsApi.getAllRooms();
      }
    },

    getById: async (id: string) => {
      if (USE_MICROSERVICES.rooms) {
        const response = await apiClient.getRoomById(id);
        return response.data;
      } else {
        return await roomsApi.getRoomById(id);
      }
    },

    create: async (roomData: any) => {
      if (USE_MICROSERVICES.rooms) {
        const response = await apiClient.createRoom(roomData);
        return response.data;
      } else {
        return await roomsApi.createRoom(roomData);
      }
    },

    update: async (id: string, roomData: any) => {
      if (USE_MICROSERVICES.rooms) {
        const response = await apiClient.updateRoom(id, roomData);
        return response.data;
      } else {
        return await roomsApi.updateRoom(id, roomData);
      }
    },

    delete: async (id: string) => {
      if (USE_MICROSERVICES.rooms) {
        const response = await apiClient.deleteRoom(id);
        return !response.error;
      } else {
        return await roomsApi.deleteRoom(id);
      }
    }
  }
};

// Helper function to check if microservices are available
export const checkMicroservicesHealth = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/health`);
    return response.ok;
  } catch (error) {
    console.warn('Microservices not available, falling back to Supabase');
    return false;
  }
};
