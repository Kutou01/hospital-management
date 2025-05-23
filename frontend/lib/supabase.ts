import { createClient } from '@supabase/supabase-js';

// Lấy URL và API key từ biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Kiểm tra biến môi trường
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types cho authentication
export interface User {
  user_id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  profile_id?: string;
  created_at: string;
  last_login?: string;
}

export interface LoginSession {
  session_id: number;
  user_id: string;
  login_time: string;
  logout_time?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  session_token?: string;
  is_active: boolean;
}

// Authentication API
export const authApi = {
  // Đăng nhập
  login: async (email: string, password: string) => {
    try {
      // Tìm user theo email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return { user: null, error: 'Email hoặc mật khẩu không đúng' };
      }

      // Trong thực tế, bạn sẽ cần hash password và so sánh
      // Hiện tại tôi sẽ dùng password đơn giản cho demo
      const validPasswords = {
        'admin@hospital.com': 'admin123',
        'doctor@hospital.com': 'doctor123',
        'patient@hospital.com': 'patient123'
      };

      if (validPasswords[email as keyof typeof validPasswords] !== password) {
        return { user: null, error: 'Email hoặc mật khẩu không đúng' };
      }

      // Tạo session token
      const sessionToken = Math.random().toString(36).substring(2, 15) +
                          Math.random().toString(36).substring(2, 15);

      // Lưu login session
      const { error: sessionError } = await supabase
        .from('login_sessions')
        .insert([{
          user_id: user.user_id,
          session_token: sessionToken,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : '',
          device_info: {
            platform: typeof window !== 'undefined' ? navigator.platform : '',
            language: typeof window !== 'undefined' ? navigator.language : ''
          }
        }]);

      if (sessionError) {
        console.error('Error creating session:', sessionError);
      }

      // Cập nhật last_login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', user.user_id);

      return {
        user: user as User,
        sessionToken,
        error: null
      };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: 'Đã xảy ra lỗi không mong muốn' };
    }
  },

  // Đăng ký
  register: async (userData: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role: 'doctor' | 'patient';
    // Thêm các trường khác tùy theo role
    specialty?: string;
    license_number?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
  }) => {
    try {
      // Kiểm tra email đã tồn tại chưa
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        return { user: null, error: 'Email đã được sử dụng' };
      }

      // Tạo user_id
      const userIdPrefix = userData.role === 'doctor' ? 'DOC' : 'PAT';
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const userId = userIdPrefix + randomNum;

      // Tạo profile_id cho doctor hoặc patient
      let profileId = null;
      if (userData.role === 'doctor') {
        profileId = 'DOC' + randomNum;

        // Thêm vào bảng doctors
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert([{
            doctor_id: profileId,
            full_name: userData.full_name,
            specialty: userData.specialty || '',
            license_number: userData.license_number || '',
            gender: userData.gender || 'Male',
            phone_number: userData.phone_number || '',
            email: userData.email
          }]);

        if (doctorError) {
          console.error('Error creating doctor profile:', doctorError);
          return { user: null, error: 'Lỗi tạo hồ sơ bác sĩ' };
        }
      } else if (userData.role === 'patient') {
        profileId = 'PAT' + randomNum;

        // Thêm vào bảng patients
        const { error: patientError } = await supabase
          .from('patients')
          .insert([{
            patient_id: profileId,
            full_name: userData.full_name,
            dateofbirth: userData.date_of_birth || null,
            gender: userData.gender || 'Male',
            phone_number: userData.phone_number || '',
            email: userData.email,
            address: userData.address || '',
            registration_date: new Date().toISOString().split('T')[0]
          }]);

        if (patientError) {
          console.error('Error creating patient profile:', patientError);
          return { user: null, error: 'Lỗi tạo hồ sơ bệnh nhân' };
        }
      }

      // Tạo user trong bảng users
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          user_id: userId,
          email: userData.email,
          password_hash: '$2b$10$rQZ8kHWKQVz7QGQvQGQvQO', // Trong thực tế cần hash password
          role: userData.role,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          profile_id: profileId
        }])
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return { user: null, error: 'Lỗi tạo tài khoản' };
      }

      return { user: newUser as User, error: null };
    } catch (error) {
      console.error('Register error:', error);
      return { user: null, error: 'Đã xảy ra lỗi không mong muốn' };
    }
  },

  // Đăng xuất
  logout: async (sessionToken: string) => {
    try {
      const { error } = await supabase
        .from('login_sessions')
        .update({
          logout_time: new Date().toISOString(),
          is_active: false
        })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Logout error:', error);
        return { error: 'Lỗi đăng xuất' };
      }

      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: 'Đã xảy ra lỗi không mong muốn' };
    }
  },

  // Lấy thông tin user từ session token
  getUserFromSession: async (sessionToken: string) => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('login_sessions')
        .select(`
          *,
          users (*)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        return { user: null, error: 'Session không hợp lệ' };
      }

      return { user: session.users as User, error: null };
    } catch (error) {
      console.error('Get user from session error:', error);
      return { user: null, error: 'Đã xảy ra lỗi không mong muốn' };
    }
  },

  // Lấy lịch sử đăng nhập của user
  getLoginHistory: async (userId: string, limit: number = 10) => {
    try {
      const { data: sessions, error } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching login history:', error);
        return { sessions: [], error: 'Lỗi lấy lịch sử đăng nhập' };
      }

      return { sessions: sessions as LoginSession[], error: null };
    } catch (error) {
      console.error('Get login history error:', error);
      return { sessions: [], error: 'Đã xảy ra lỗi không mong muốn' };
    }
  }
};

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
    // Generate a unique doctor_id if not provided
    if (!doctor.doctor_id) {
      // Format: DOCXXXXXX where X is a random digit (must be exactly 6 digits)
      const randomDigits = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
      doctor.doctor_id = 'DOC' + randomDigits;
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
    try {
      // Get the latest patient ID to generate a new one
      const { data: latestPatient, error: fetchError } = await supabase
        .from('patients')
        .select('patient_id')
        .order('patient_id', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching latest patient ID:', fetchError);
        return null;
      }

      // Generate a new patient_id
      let newId = 'PAT000001'; // Default if no patients exist

      if (latestPatient && latestPatient.length > 0) {
        const lastId = latestPatient[0].patient_id;
        const numericPart = parseInt(lastId.substring(3), 10);
        const newNumericPart = numericPart + 1;
        newId = `PAT${newNumericPart.toString().padStart(6, '0')}`;
      }

      // Add the ID to the patient object
      const patientWithId = {
        ...patient,
        patient_id: newId
      };

      // Insert the patient with the generated ID
      const { data, error } = await supabase
        .from('patients')
        .insert([patientWithId])
        .select();

      if (error) {
        console.error('Error adding patient:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Exception adding patient:', error);
      return null;
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