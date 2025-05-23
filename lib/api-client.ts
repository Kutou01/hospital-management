// API Client for communicating with microservices through API Gateway
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  user: any;
  token: string;
  refreshToken?: string;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role: 'doctor' | 'patient';
  specialty?: string;
  license_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';

    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || data.error || 'An error occurred',
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: 'Network error occurred',
      };
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);

      // Set cookies for middleware
      if (typeof window !== 'undefined') {
        document.cookie = `auth_token=${response.data.token}; path=/; max-age=86400`; // 24 hours
        document.cookie = `user_role=${response.data.user.role}; path=/; max-age=86400`;
      }
    }

    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<any>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
    });

    this.clearToken();
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/api/users/me');
  }

  // Doctor endpoints
  async getAllDoctors(): Promise<ApiResponse<any[]>> {
    return this.request('/api/doctors');
  }

  async getDoctorById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/doctors/${id}`);
  }

  async createDoctor(doctorData: any): Promise<ApiResponse<any>> {
    return this.request('/api/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  }

  async updateDoctor(id: string, doctorData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData),
    });
  }

  async deleteDoctor(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/doctors/${id}`, {
      method: 'DELETE',
    });
  }

  // Patient endpoints
  async getAllPatients(): Promise<ApiResponse<any[]>> {
    return this.request('/api/patients');
  }

  async getPatientById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/patients/${id}`);
  }

  async createPatient(patientData: any): Promise<ApiResponse<any>> {
    return this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id: string, patientData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment endpoints
  async getAllAppointments(): Promise<ApiResponse<any[]>> {
    return this.request('/api/appointments');
  }

  async getAppointmentById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/appointments/${id}`);
  }

  async createAppointment(appointmentData: any): Promise<ApiResponse<any>> {
    return this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id: string, appointmentData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Department endpoints
  async getAllDepartments(): Promise<ApiResponse<any[]>> {
    return this.request('/api/departments');
  }

  async getDepartmentById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/departments/${id}`);
  }

  async createDepartment(departmentData: any): Promise<ApiResponse<any>> {
    return this.request('/api/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id: string, departmentData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Room endpoints (if available)
  async getAllRooms(): Promise<ApiResponse<any[]>> {
    return this.request('/api/rooms');
  }

  async getRoomById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/rooms/${id}`);
  }

  async createRoom(roomData: any): Promise<ApiResponse<any>> {
    return this.request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id: string, roomData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/rooms/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse, LoginResponse, RegisterData };
