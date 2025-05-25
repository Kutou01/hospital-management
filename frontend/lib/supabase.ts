import { supabaseClient } from './supabase-client';

// Export the client-side Supabase client
export const supabase = supabaseClient;

// Types for new database structure
export interface Profile {
  id: string;
  full_name: string;
  phone_number?: string;
  role: 'admin' | 'doctor' | 'patient';
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  profile_data?: any;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// Note: Authentication is now handled by Supabase Auth
// Use the supabaseAuth service from /lib/auth/supabase-auth.ts instead



// Các hàm tương tác với bảng doctors
export const doctorsApi = {
  // Lấy tất cả bác sĩ với thông tin từ profiles
  getAllDoctors: async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        departments(*),
        profiles!inner(full_name, phone_number, email_verified)
      `)
      .order('full_name');

    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }

    return data || [];
  },

  // Thêm bác sĩ mới (chỉ dành cho admin, user đã có auth_user_id)
  addDoctor: async (doctor: any) => {
    // Generate a unique doctor_id if not provided
    if (!doctor.doctor_id) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      doctor.doctor_id = 'DOC' + randomDigits;
    }

    // Ensure auth_user_id is provided
    if (!doctor.auth_user_id) {
      return { data: null, error: 'auth_user_id is required' };
    }

    const { data, error } = await supabase
      .from('doctors')
      .insert([doctor])
      .select();

    if (error) {
      console.error('Error adding doctor:', error);
      return { data: null, error };
    }

    return { data: data?.[0] || null, error: null };
  },

  // Cập nhật thông tin bác sĩ
  updateDoctor: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('doctor_id', id)
      .select();

    if (error) {
      console.error('Error updating doctor:', error);
      return { data: null, error };
    }

    return { data: data?.[0] || null, error: null };
  },

  // Xóa bác sĩ
  deleteDoctor: async (id: string) => {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('doctor_id', id);

    if (error) {
      console.error('Error deleting doctor:', error);
      return false;
    }

    return true;
  }
};

// Các hàm tương tác với bảng patients
export const patientsApi = {
  // Lấy tất cả bệnh nhân với thông tin từ profiles
  getAllPatients: async () => {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        profiles!inner(full_name, phone_number, email_verified)
      `)
      .order('full_name');

    if (error) {
      console.error('Error fetching patients:', error);
      return [];
    }

    return data || [];
  },

  // Thêm bệnh nhân mới (chỉ dành cho admin, user đã có auth_user_id)
  addPatient: async (patient: any) => {
    try {
      // Generate a unique patient_id if not provided
      if (!patient.patient_id) {
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        patient.patient_id = 'PAT' + randomDigits;
      }

      // Ensure auth_user_id is provided
      if (!patient.auth_user_id) {
        return { data: null, error: 'auth_user_id is required' };
      }

      // Insert the patient
      const { data, error } = await supabase
        .from('patients')
        .insert([patient])
        .select();

      if (error) {
        console.error('Error adding patient:', error);
        return { data: null, error };
      }

      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error('Exception adding patient:', error);
      return { data: null, error: 'Exception occurred' };
    }
  },

  // Cập nhật thông tin bệnh nhân
  updatePatient: async (id: any, updates: any) => {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('patient_id', id)
      .select();

    if (error) {
      console.error('Error updating patient:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Xóa bệnh nhân
  deletePatient: async (id: any) => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('patient_id', id);

    if (error) {
      console.error('Error deleting patient:', error);
      return false;
    }

    return true;
  }
};

// Các hàm tương tác với bảng appointment
export const appointmentsApi = {
  // Lấy tất cả cuộc hẹn
  getAllAppointments: async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients!inner(*), doctors!inner(*)')
      .order('appointment_date');

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    return data || [];
  },

  // Thêm cuộc hẹn mới
  addAppointment: async (appointment: any) => {
    try {
      // Get the latest appointment ID to generate a new one
      const { data: latestAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('appointment_id')
        .order('appointment_id', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching latest appointment ID:', fetchError);
        return null;
      }

      // Generate a new appointment_id
      let newId = 'APT000001'; // Default if no appointments exist

      if (latestAppointment && latestAppointment.length > 0) {
        const lastId = latestAppointment[0].appointment_id;
        const numericPart = parseInt(lastId.substring(3), 10);
        const newNumericPart = numericPart + 1;
        newId = `APT${newNumericPart.toString().padStart(6, '0')}`;
      }

      // Add the ID to the appointment object
      const appointmentWithId = {
        ...appointment,
        appointment_id: newId
      };

      // Insert the appointment with the generated ID
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentWithId])
        .select();

      if (error) {
        console.error('Error adding appointment:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Exception adding appointment:', error);
      return null;
    }
  },

  // Cập nhật thông tin cuộc hẹn
  updateAppointment: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('appointment_id', id)
      .select();

    if (error) {
      console.error('Error updating appointment:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Xóa cuộc hẹn
  deleteAppointment: async (id: string) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('appointment_id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }

    return true;
  }
};

// Các hàm tương tác với bảng department
export const departmentsApi = {
  // Lấy tất cả phòng ban
  getAllDepartments: async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('department_name');

    if (error) {
      console.error('Error fetching departments:', error);
      return [];
    }

    return data || [];
  },

  // Thêm phòng ban mới
  addDepartment: async (department: any) => {
    try {
      // Get the latest department ID to generate a new one
      const { data: latestDepartment, error: fetchError } = await supabase
        .from('departments')
        .select('department_id')
        .order('department_id', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching latest department ID:', fetchError);
        return null;
      }

      // Generate a new department_id
      let newId = 'DEP000001'; // Default if no departments exist

      if (latestDepartment && latestDepartment.length > 0) {
        const lastId = latestDepartment[0].department_id;
        const numericPart = parseInt(lastId.substring(3), 10);
        const newNumericPart = numericPart + 1;
        newId = `DEP${newNumericPart.toString().padStart(6, '0')}`;
      }

      // Add the ID to the department object
      const departmentWithId = {
        ...department,
        department_id: newId
      };

      // Insert the department with the generated ID
      const { data, error } = await supabase
        .from('departments')
        .insert([departmentWithId])
        .select();

      if (error) {
        console.error('Error adding department:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Exception adding department:', error);
      return null;
    }
  },

  // Cập nhật thông tin phòng ban
  updateDepartment: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('department_id', id)
      .select();

    if (error) {
      console.error('Error updating department:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Xóa phòng ban
  deleteDepartment: async (id: string) => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('department_id', id);

    if (error) {
      console.error('Error deleting department:', error);
      return false;
    }

    return true;
  }
};

// Các hàm tương tác với bảng rooms
export const roomsApi = {
  // Lấy tất cả phòng
  getAllRooms: async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, departments(*)')
      .order('room_number');

    if (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }

    return data || [];
  },

  // Thêm phòng mới
  addRoom: async (room: any) => {
    try {
      // Get the latest room ID to generate a new one
      const { data: latestRoom, error: fetchError } = await supabase
        .from('rooms')
        .select('room_id')
        .order('room_id', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching latest room ID:', fetchError);
        return null;
      }

      // Generate a new room_id
      let newId = 'ROM000001'; // Default if no rooms exist

      if (latestRoom && latestRoom.length > 0) {
        const lastId = latestRoom[0].room_id;
        const numericPart = parseInt(lastId.substring(3), 10);
        const newNumericPart = numericPart + 1;
        newId = `ROM${newNumericPart.toString().padStart(6, '0')}`;
      }

      // Add the ID to the room object
      const roomWithId = {
        ...room,
        room_id: newId
      };

      // Insert the room with the generated ID
      const { data, error } = await supabase
        .from('rooms')
        .insert([roomWithId])
        .select();

      if (error) {
        console.error('Error adding room:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Exception adding room:', error);
      return null;
    }
  },

  // Cập nhật thông tin phòng
  updateRoom: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('room_id', id)
      .select();

    if (error) {
      console.error('Error updating room:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Xóa phòng
  deleteRoom: async (id: string) => {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('room_id', id);

    if (error) {
      console.error('Error deleting room:', error);
      return false;
    }

    return true;
  }
};