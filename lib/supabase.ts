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
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }

    return data || [];
  },

  // Thêm bác sĩ mới
  addDoctor: async (doctor) => {
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
  updateDoctor: async (id, updates) => {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating doctor:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Xóa bác sĩ
  deleteDoctor: async (id) => {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);

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
  addPatient: async (patient) => {
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
  updatePatient: async (id, updates) => {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating patient:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Xóa bệnh nhân
  deletePatient: async (id) => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting patient:', error);
      return false;
    }

    return true;
  }
};

// Các hàm tương tác với bảng appointments
export const appointmentsApi = {
  // Lấy tất cả cuộc hẹn
  getAllAppointments: async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(*), doctors(*)')
      .order('appointment_date');

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    return data || [];
  },

  // Thêm cuộc hẹn mới
  addAppointment: async (appointment) => {
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
  updateAppointment: async (id, updates) => {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating appointment:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Xóa cuộc hẹn
  deleteAppointment: async (id) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }

    return true;
  }
};
