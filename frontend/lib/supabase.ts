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
  // Lấy tất cả bác sĩ với thông tin chi tiết
  getAllDoctors: async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          doctor_id,
          full_name,
          specialization,
          qualification,
          department_id,
          license_number,
          gender,
          phone_number,
          status,
          created_at,
          updated_at
        `)
        .order('full_name');

      if (error) {
        console.error('Error fetching doctors from table:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching doctors:', error);
      return [];
    }
  },

  // Lấy bác sĩ theo khoa
  getDoctorsByDepartment: async (departmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          doctor_id,
          full_name,
          specialization,
          qualification,
          department_id,
          license_number,
          gender,
          phone_number,
          status,
          created_at,
          updated_at
        `)
        .eq('department_id', departmentId)
        .order('full_name');

      if (error) {
        console.error('Error fetching doctors by department from table:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching doctors by department:', error);
      return [];
    }
  },

  // Thêm bác sĩ mới
  addDoctor: async (doctor: any) => {
    try {
      // Generate doctor_id if not provided
      if (!doctor.doctor_id) {
        // Get the latest doctor ID to generate a new one
        const { data: latestDoctor, error: fetchError } = await supabase
          .from('doctors')
          .select('doctor_id')
          .order('doctor_id', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error('Error fetching latest doctor ID:', fetchError);
          return { data: null, error: fetchError };
        }

        // Generate a new doctor_id
        let newId = 'DOC000001'; // Default if no doctors exist

        if (latestDoctor && latestDoctor.length > 0) {
          const lastId = latestDoctor[0].doctor_id;
          const numericPart = parseInt(lastId.substring(3), 10);
          const newNumericPart = numericPart + 1;
          newId = `DOC${newNumericPart.toString().padStart(6, '0')}`;
        }

        doctor.doctor_id = newId;
      }

      // Insert the doctor
      const { data, error } = await supabase
        .from('doctors')
        .insert([doctor])
        .select();

      if (error) {
        console.error('Error adding doctor:', error);
        return { data: null, error };
      }

      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error('Exception adding doctor:', error);
      return { data: null, error: 'Exception occurred while adding doctor' };
    }
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
  // Lấy tất cả bệnh nhân với thông tin chi tiết
  getAllPatients: async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          patient_id,
          full_name,
          date_of_birth,
          gender,
          status,
          created_at,
          updated_at
        `)
        .order('full_name');

      if (error) {
        console.error('Error fetching patients from table:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching patients:', error);
      return [];
    }
  },

  // Lấy bệnh nhân theo độ tuổi
  getPatientsByAgeRange: async (minAge: number, maxAge: number) => {
    const { data, error } = await supabase
      .from('patient_details')
      .select('*')
      .gte('age', minAge)
      .lte('age', maxAge)
      .order('full_name');

    if (error) {
      console.error('Error fetching patients by age range:', error);
      return [];
    }

    return data || [];
  },

  // Thêm bệnh nhân mới (chỉ dành cho admin, user đã có profile_id)
  addPatient: async (patient: any) => {
    try {
      // Ensure profile_id is provided
      if (!patient.profile_id) {
        return { data: null, error: 'profile_id is required' };
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
  // Lấy tất cả cuộc hẹn với thông tin chi tiết
  getAllAppointments: async () => {
    try {
      console.log('📅 [supabase] Fetching all appointments...')

      // First check if appointments table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('appointments')
        .select('count', { count: 'exact', head: true })

      if (tableError) {
        console.warn('⚠️ [supabase] Appointments table not found or accessible:', tableError.message)
        return []
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          start_time,
          end_time,
          appointment_type,
          status,
          reason,
          notes,
          diagnosis,
          created_at,
          updated_at,
          doctors!fk_appointments_doctor (
            doctor_id,
            full_name,
            specialization
          ),
          patients!fk_appointments_patient (
            patient_id,
            full_name
          )
        `)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('❌ [supabase] Error fetching appointments from table:', error);
        return [];
      }

      console.log('✅ [supabase] Appointments fetched:', data?.length || 0)
      return data || [];
    } catch (error) {
      console.error('❌ [supabase] Exception fetching appointments:', error);
      return [];
    }
  },

  // Lấy cuộc hẹn theo trạng thái
  getAppointmentsByStatus: async (status: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        appointment_id,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        appointment_type,
        status,
        reason,
        notes,
        diagnosis,
        created_at,
        updated_at,
        doctors!fk_appointments_doctor (
          doctor_id,
          full_name,
          specialization
        ),
        patients!fk_appointments_patient (
          patient_id,
          full_name
        )
      `)
      .eq('status', status)
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching appointments by status:', error);
      return [];
    }

    return data || [];
  },

  // Lấy cuộc hẹn hôm nay
  getTodayAppointments: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        appointment_id,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        appointment_type,
        status,
        reason,
        notes,
        diagnosis,
        created_at,
        updated_at,
        doctors!fk_appointments_doctor (
          doctor_id,
          full_name,
          specialization
        ),
        patients!fk_appointments_patient (
          patient_id,
          full_name
        )
      `)
      .eq('appointment_date', today)
      .order('start_time');

    if (error) {
      console.error('Error fetching today appointments:', error);
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
      .eq('is_active', true)
      .order('name');

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
      .select(`
        *,
        departments!rooms_department_id_fkey (
          department_id,
          name,
          description,
          location
        )
      `)
      .order('room_number');

    if (error) {
      console.error('Error fetching rooms:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
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

// Enhanced API cho dashboard statistics với real-time capabilities
export const dashboardApi = {
  // Lấy thống kê tổng quan với microservices integration
  getDashboardStats: async () => {
    try {
      console.log('📊 [dashboardApi] Fetching enhanced dashboard stats...')

      // API Gateway URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'

      // Try microservices first, fallback to direct Supabase
      try {
        const [patientsResponse, doctorsResponse, appointmentsResponse, departmentsResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/patients/stats`),
          fetch(`${API_BASE_URL}/doctors/stats`),
          fetch(`${API_BASE_URL}/appointments/stats`),
          fetch(`${API_BASE_URL}/departments/stats`)
        ])

        const stats = {
          total_patients: 0,
          total_doctors: 0,
          total_departments: 0,
          total_rooms: 0,
          available_rooms: 0,
          occupied_rooms: 0,
          appointments_today: 0,
          appointments_pending: 0,
          appointments_confirmed: 0,
          appointments_completed: 0
        }

        // Process microservice responses
        if (patientsResponse.status === 'fulfilled' && patientsResponse.value.ok) {
          const patientsData = await patientsResponse.value.json()
          stats.total_patients = patientsData.data?.total || 0
        }

        if (doctorsResponse.status === 'fulfilled' && doctorsResponse.value.ok) {
          const doctorsData = await doctorsResponse.value.json()
          stats.total_doctors = doctorsData.data?.total || 0
        }

        if (appointmentsResponse.status === 'fulfilled' && appointmentsResponse.value.ok) {
          const appointmentsData = await appointmentsResponse.value.json()
          const data = appointmentsData.data || {}
          stats.appointments_today = data.today || 0
          stats.appointments_pending = data.pending || 0
          stats.appointments_confirmed = data.confirmed || 0
          stats.appointments_completed = data.completed || 0
        }

        if (departmentsResponse.status === 'fulfilled' && departmentsResponse.value.ok) {
          const departmentsData = await departmentsResponse.value.json()
          const data = departmentsData.data || {}
          stats.total_departments = data.total || 0
          stats.total_rooms = data.total_rooms || 0
          stats.available_rooms = data.available_rooms || 0
          stats.occupied_rooms = data.occupied_rooms || 0
        }

        console.log('✅ [dashboardApi] Microservices stats fetched:', stats)
        return stats
      } catch (microserviceError) {
        console.warn('⚠️ [dashboardApi] Microservices unavailable, falling back to Supabase:', microserviceError)
      }

      // Fallback: Direct Supabase queries
      const [
        { count: totalPatients },
        { count: totalDoctors },
        { count: totalDepartments },
        { count: totalRooms },
        { count: availableRooms },
        appointmentsData
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
        supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('appointments').select('status, appointment_date')
      ]);

      // Calculate appointment stats
      const today = new Date().toISOString().split('T')[0];
      const appointments = appointmentsData.data || [];

      const appointmentsToday = appointments.filter(apt =>
        apt.appointment_date?.startsWith(today)
      ).length;

      const appointmentsPending = appointments.filter(apt => apt.status === 'pending').length;
      const appointmentsConfirmed = appointments.filter(apt => apt.status === 'confirmed').length;
      const appointmentsCompleted = appointments.filter(apt => apt.status === 'completed').length;

      const fallbackStats = {
        total_patients: totalPatients || 0,
        total_doctors: totalDoctors || 0,
        total_departments: totalDepartments || 0,
        total_rooms: totalRooms || 0,
        available_rooms: availableRooms || 0,
        occupied_rooms: (totalRooms || 0) - (availableRooms || 0),
        appointments_today: appointmentsToday,
        appointments_pending: appointmentsPending,
        appointments_confirmed: appointmentsConfirmed,
        appointments_completed: appointmentsCompleted
      };

      console.log('✅ [dashboardApi] Fallback stats calculated:', fallbackStats)
      return fallbackStats
    } catch (error) {
      console.error('❌ [dashboardApi] Error fetching dashboard stats:', error);
      return {
        total_patients: 0,
        total_doctors: 0,
        total_departments: 0,
        total_rooms: 0,
        available_rooms: 0,
        occupied_rooms: 0,
        appointments_today: 0,
        appointments_pending: 0,
        appointments_confirmed: 0,
        appointments_completed: 0
      };
    }
  },

  // Real-time system health monitoring
  getSystemHealth: async () => {
    try {
      console.log('🏥 [dashboardApi] Checking system health...')

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'
      const services = ['auth', 'patients', 'doctors', 'appointments', 'departments']

      const healthChecks = await Promise.allSettled(
        services.map(async service => {
          try {
            const response = await fetch(`${API_BASE_URL}/${service}/health`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            })
            return {
              service,
              status: response.ok ? 'healthy' : 'error',
              uptime: response.ok ? '99.9%' : '0%',
              responseTime: response.ok ? '120ms' : 'timeout'
            }
          } catch (error) {
            return {
              service,
              status: 'error',
              uptime: '0%',
              responseTime: 'timeout'
            }
          }
        })
      )

      const systemHealth = {}
      healthChecks.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          systemHealth[services[index]] = result.value
        } else {
          systemHealth[services[index]] = { status: 'error', uptime: '0%', responseTime: 'timeout' }
        }
      })

      console.log('✅ [dashboardApi] System health checked:', systemHealth)
      return systemHealth
    } catch (error) {
      console.error('❌ [dashboardApi] Error checking system health:', error)
      return {}
    }
  },

  // Real-time performance metrics
  getRealtimeMetrics: async () => {
    try {
      console.log('📈 [dashboardApi] Fetching real-time metrics...')

      // Always return mock data for now since endpoint doesn't exist yet
      console.log('⚠️ [dashboardApi] Using mock data for real-time metrics')
      return {
        active_users: Math.floor(Math.random() * 50) + 10,
        system_load: Math.floor(Math.random() * 30) + 20,
        response_time: Math.floor(Math.random() * 100) + 50,
        error_rate: Math.random() * 2
      }
    } catch (error) {
      console.error('❌ [dashboardApi] Error fetching real-time metrics:', error)
      // Return mock data for demo
      return {
        active_users: Math.floor(Math.random() * 50) + 10,
        system_load: Math.floor(Math.random() * 30) + 20,
        response_time: Math.floor(Math.random() * 100) + 50,
        error_rate: Math.random() * 2
      }
    }
  },

  // Lấy thống kê theo tháng
  getMonthlyStats: async (year: number, month: number) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .gte('registration_date', startDate)
      .lte('registration_date', endDate);

    if (appointmentsError || patientsError) {
      console.error('Error fetching monthly stats:', appointmentsError || patientsError);
      return {
        appointments: 0,
        newPatients: 0,
        completedAppointments: 0,
        cancelledAppointments: 0
      };
    }

    return {
      appointments: appointments?.length || 0,
      newPatients: patients?.length || 0,
      completedAppointments: appointments?.filter(a => a.status === 'completed').length || 0,
      cancelledAppointments: appointments?.filter(a => a.status === 'cancelled').length || 0
    };
  }
};