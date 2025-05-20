import { createClient } from '@supabase/supabase-js';

// Lấy URL và API key từ biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Các hàm tương tác với bảng doctors
export const doctorsApi = {
  // Lấy tất cả bác sĩ
  getAllDoctors: async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, departments(*)')
      .order('full_name');

    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }

    return data || [];
  },

  // Thêm bác sĩ mới
  addDoctor: async (doctor: any) => {
    const { data, error } = await supabase
      .from('doctors')
      .insert([doctor])
      .select();

    if (error) {
      console.error('Error adding doctor:', error);
      return null;
    }

    return data?.[0] || null;
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
      return null;
    }

    return data?.[0] || null;
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
  // Lấy tất cả bệnh nhân
  getAllPatients: async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching patients:', error);
      return [];
    }

    return data || [];
  },

  // Thêm bệnh nhân mới
  addPatient: async (patient: any) => {
    const { data, error } = await supabase
      .from('patients')
      .insert([patient])
      .select();

    if (error) {
      console.error('Error adding patient:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Cập nhật thông tin bệnh nhân
  updatePatient: async (id: any, updates: any) => {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('patientid', id)
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
      .eq('patientid', id);

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
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
      .select();

    if (error) {
      console.error('Error adding appointment:', error);
      return null;
    }

    return data?.[0] || null;
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
    const { data, error } = await supabase
      .from('departments')
      .insert([department])
      .select();

    if (error) {
      console.error('Error adding department:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Cập nhật thông tin phòng ban
  updateDepartment: async (id: number, updates: any) => {
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
  deleteDepartment: async (id: number) => {
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
    const { data, error } = await supabase
      .from('rooms')
      .insert([room])
      .select();

    if (error) {
      console.error('Error adding room:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Cập nhật thông tin phòng
  updateRoom: async (id: number, updates: any) => {
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
  deleteRoom: async (id: number) => {
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