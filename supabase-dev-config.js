// ============================================================================
// SUPABASE CONFIGURATION FOR DEVELOPMENT SCHEMA
// ============================================================================
// File: lib/supabase-dev.js

import { createClient } from '@supabase/supabase-js'

// Sử dụng cùng project nhưng với schema khác
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client cho development với schema hospital_dev
export const supabaseDev = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'hospital_dev'  // Sử dụng schema development
  }
})

// Service client cho development
export const supabaseDevService = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'hospital_dev'
  }
})

// ============================================================================
// HELPER FUNCTIONS CHO DEVELOPMENT
// ============================================================================

// Function để switch giữa production và development
export const getSupabaseClient = (isDevelopment = false) => {
  if (isDevelopment || process.env.NODE_ENV === 'development') {
    return supabaseDev
  }
  
  // Import production client
  const { supabase } = require('./supabase')
  return supabase
}

// Function để get service client
export const getSupabaseServiceClient = (isDevelopment = false) => {
  if (isDevelopment || process.env.NODE_ENV === 'development') {
    return supabaseDevService
  }
  
  // Import production service client
  const { supabaseService } = require('./supabase')
  return supabaseService
}

// ============================================================================
// CHATBOT SERVICE CONFIGURATION
// ============================================================================

// Configuration cho chatbot service sử dụng dev schema
export const chatbotDevConfig = {
  supabaseUrl,
  supabaseServiceKey,
  schema: 'hospital_dev',
  tables: {
    appointments: 'hospital_dev.appointments',
    patients: 'hospital_dev.patients',
    doctors: 'hospital_dev.doctors',
    chatbot_sessions: 'hospital_dev.chatbot_appointment_sessions',
    available_slots: 'hospital_dev.doctor_available_slots',
    booking_history: 'hospital_dev.chatbot_booking_history',
    training_data: 'hospital_dev.chatbot_training_data',
    specialties: 'hospital_dev.specialties',
    departments: 'hospital_dev.departments'
  },
  functions: {
    getAvailableSlots: 'hospital_dev.get_available_slots_for_chatbot',
    createAppointment: 'hospital_dev.create_appointment_from_chatbot'
  }
}

// ============================================================================
// ENVIRONMENT VARIABLES SETUP
// ============================================================================

/*
Thêm vào .env.local:

# Development mode flag
NEXT_PUBLIC_DEV_MODE=true
NODE_ENV=development

# Existing Supabase config (giữ nguyên)
NEXT_PUBLIC_SUPABASE_URL=your-existing-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-existing-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-existing-service-key

# Development schema
NEXT_PUBLIC_DEV_SCHEMA=hospital_dev
*/

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Trong component React
import { getSupabaseClient } from '@/lib/supabase-dev'

const MyComponent = () => {
  const supabase = getSupabaseClient(true) // true = use dev schema
  
  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients') // Sẽ query từ hospital_dev.patients
      .select('*')
  }
}

// Trong API route
import { getSupabaseServiceClient } from '@/lib/supabase-dev'

export default async function handler(req, res) {
  const supabase = getSupabaseServiceClient(true)
  
  const { data, error } = await supabase
    .from('appointments') // Sẽ query từ hospital_dev.appointments
    .insert(appointmentData)
}

// Trong chatbot service
import { chatbotDevConfig } from '@/lib/supabase-dev'

const supabase = createClient(
  chatbotDevConfig.supabaseUrl, 
  chatbotDevConfig.supabaseServiceKey,
  { db: { schema: chatbotDevConfig.schema } }
)
*/
