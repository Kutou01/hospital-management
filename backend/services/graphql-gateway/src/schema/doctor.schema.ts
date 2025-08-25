import { gql } from "graphql-tag";

/**
 * GraphQL Schema for Doctor entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const doctorTypeDefs = gql`
  # Doctor-specific enums only (common scalars defined in base schema)
  enum DoctorStatus {
    ACTIVE
    INACTIVE
    ON_LEAVE
    SUSPENDED
  }

  # Core Doctor Type
  type Doctor {
    # Basic Information
    id: UUID!
    doctor_id: DoctorID!
    profileId: UUID!
    fullName: String!
    email: String!
    phoneNumber: PhoneNumber

    # Professional Information
    specialization: String!
    licenseNumber: LicenseNumber!
    yearsOfExperience: Int!
    consultationFee: Float
    bio: String
    photoUrl: String

    # Personal Information
    gender: Gender
    dateOfBirth: Date
    address: String

    # Status
    is_active: Boolean!
    status: DoctorStatus!

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!

    # Relationships
    department: Department
    experiences: [DoctorExperience!]!
    schedule: [DoctorSchedule!]!
    appointments(
      status: AppointmentStatus
      dateFrom: Date
      dateTo: Date
      limit: Int = 10
      offset: Int = 0
    ): AppointmentConnection!
    reviews(limit: Int = 10, offset: Int = 0): ReviewConnection!

    # Computed Fields
    averageRating: Float
    totalPatients: Int
    totalAppointments: Int
    upcomingAppointments: Int
    completedAppointments: Int
    availableToday: Boolean!
    nextAvailableSlot: DateTime
  }

  # Doctor Experience
  type DoctorExperience {
    id: UUID!
    doctor_id: DoctorID!
    hospitalName: String!
    position: String!
    startDate: Date!
    endDate: Date
    description: String
    isCurrent: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Doctor Review (mapped to doctor_reviews table)
  type DoctorReview {
    id: UUID! # maps to review_id
    doctor_id: DoctorID! # maps to doctor_id
    patient_id: PatientID! # maps to patient_id
    appointment_id: UUID # maps to appointment_id
    # Review Content
    rating: Int! # maps to rating (1-5)
    comment: String # maps to comment
    # Review Details
    serviceQuality: Int # maps to service_quality
    communication: Int # maps to communication
    punctuality: Int # maps to punctuality
    facilities: Int # maps to facilities
    # Status
    isVerified: Boolean! # maps to is_verified
    isAnonymous: Boolean! # maps to is_anonymous
    # Timestamps
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
    # Relationships
    doctor: Doctor!
    patient: Patient!
    appointment: Appointment
  }

  # Enhanced Doctor Schedule (mapped to doctor_work_schedules_enhanced table)
  type DoctorSchedule {
    id: UUID! # maps to schedule_id
    doctor_id: DoctorID! # maps to doctor_id
    templateId: UUID # maps to template_id
    # Schedule Details
    dayOfWeek: Int! # maps to day_of_week (0=Sunday, 1=Monday, etc.)
    startTime: String! # maps to start_time (HH:MM format)
    endTime: String! # maps to end_time (HH:MM format)
    # Enhanced Break System
    breakPeriods: [BreakPeriod!]! # maps to break_periods JSONB
    # Appointment Configuration
    slotDuration: Int! # maps to slot_duration (minutes)
    bufferTime: Int # maps to buffer_time (minutes between appointments)
    maxAppointments: Int # maps to max_appointments
    # Availability Settings
    isAvailable: Boolean! # maps to is_available
    availabilityType: ScheduleAvailabilityType! # maps to availability_type
    # Department Rules
    departmentRules: JSON # maps to department_rules JSONB
    # Effective Period
    effectiveFrom: Date # maps to effective_from
    effectiveTo: Date # maps to effective_to
    # Status
    is_active: Boolean! # maps to is_active
    # Relationships
    template: DoctorScheduleTemplate # maps to template_id
    # Timestamps
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
    # Relationships
    doctor: Doctor!
  }

  # Room Type (mapped to rooms table)
  type Room {
    id: UUID! # maps to room_id
    roomNumber: String! # maps to room_number
    roomType: String! # maps to room_type
    departmentId: String # maps to department_id
    # Capacity
    capacity: Int! # maps to capacity
    currentOccupancy: Int! # maps to current_occupancy
    # Details
    floorNumber: Int # maps to floor_number
    amenities: [String!] # maps to amenities
    dailyRate: Float # maps to daily_rate
    status: String! # maps to status
    description: String # maps to description
    # Equipment
    equipmentIds: [String!] # maps to equipment_ids
    location: String # maps to location (jsonb)
    notes: String # maps to notes
    # Status
    is_active: Boolean! # maps to is_active
    # Timestamps
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
    # Relationships
    department: Department
  }

  # Doctor Statistics
  type DoctorStats {
    doctor_id: DoctorID!
    totalAppointments: Int!
    completedAppointments: Int!
    cancelledAppointments: Int!
    totalPatients: Int!
    averageRating: Float
    totalReviews: Int!
    upcomingAppointments: Int!
    todayAppointments: Int!
    thisWeekAppointments: Int!
    thisMonthAppointments: Int!
    revenue: DoctorRevenue
    performance: DoctorPerformance
  }

  type DoctorRevenue {
    today: Float!
    thisWeek: Float!
    thisMonth: Float!
    thisYear: Float!
    currency: String! # VND
  }

  type DoctorPerformance {
    punctualityScore: Float # 0-100
    patientSatisfactionScore: Float # 0-100
    appointmentCompletionRate: Float # 0-100
    averageConsultationTime: Int # minutes
  }

  # Connection types for pagination
  type DoctorConnection {
    edges: [DoctorEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type DoctorEdge {
    node: Doctor!
    cursor: String!
  }

  type ReviewConnection {
    edges: [ReviewEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ReviewEdge {
    node: DoctorReview!
    cursor: String!
  }

  # Input Types
  input DoctorFilters {
    search: String
    specialization: String
    departmentId: UUID
    status: DoctorStatus
    is_active: Boolean
    minRating: Float
    maxConsultationFee: Float
    availableToday: Boolean
    gender: Gender
    minExperience: Int
    maxExperience: Int
  }

  input CreateDoctorInput {
    fullName: String!
    email: String!
    phoneNumber: PhoneNumber!
    specialization: String!
    licenseNumber: LicenseNumber!
    yearsOfExperience: Int!
    departmentId: UUID!
    gender: Gender
    dateOfBirth: Date
    address: String
    bio: String
    consultationFee: Float
  }

  input UpdateDoctorInput {
    fullName: String
    phoneNumber: PhoneNumber
    specialization: String
    yearsOfExperience: Int
    departmentId: UUID
    address: String
    bio: String
    consultationFee: Float
    is_active: Boolean
    status: DoctorStatus
  }

  input CreateDoctorExperienceInput {
    doctor_id: DoctorID!
    hospitalName: String!
    position: String!
    startDate: Date!
    endDate: Date
    description: String
    isCurrent: Boolean = false
  }

  input UpdateDoctorExperienceInput {
    hospitalName: String
    position: String
    startDate: Date
    endDate: Date
    description: String
    isCurrent: Boolean
  }

  input CreateDoctorScheduleInput {
    doctor_id: DoctorID!
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
    isAvailable: Boolean = true
    maxAppointments: Int
    slotDuration: Int = 30
    breakStartTime: String
    breakEndTime: String
    roomId: UUID
  }

  input UpdateDoctorScheduleInput {
    dayOfWeek: Int
    startTime: String
    endTime: String
    isAvailable: Boolean
    maxAppointments: Int
    slotDuration: Int
    breakStartTime: String
    breakEndTime: String
    roomId: UUID
  }

  # Enhanced Schedule Input Types
  input CreateDoctorScheduleEnhancedInput {
    doctor_id: DoctorID!
    templateId: UUID
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
    breakPeriods: [BreakPeriodInput!]!
    slotDuration: Int = 30
    bufferTime: Int = 5
    maxAppointments: Int = 16
    isAvailable: Boolean = true
    availabilityType: ScheduleAvailabilityType = REGULAR
    departmentRules: JSON
    effectiveFrom: Date
    effectiveTo: Date
    is_active: Boolean = true
  }

  input UpdateDoctorScheduleEnhancedInput {
    templateId: UUID
    dayOfWeek: Int
    startTime: String
    endTime: String
    breakPeriods: [BreakPeriodInput!]
    slotDuration: Int
    bufferTime: Int
    maxAppointments: Int
    isAvailable: Boolean
    availabilityType: ScheduleAvailabilityType
    departmentRules: JSON
    effectiveFrom: Date
    effectiveTo: Date
    is_active: Boolean
  }

  input BreakPeriodInput {
    startTime: String!
    endTime: String!
    breakType: String!
  }

  input CreateScheduleTemplateInput {
    templateName: String!
    departmentId: String
    description: String
    defaultStartTime: String!
    defaultEndTime: String!
    defaultBreakStart: String
    defaultBreakEnd: String
    defaultSlotDuration: Int = 30
    defaultBufferTime: Int = 5
    maxAppointmentsPerDay: Int = 16
    workingDays: [Int!]!
    is_active: Boolean = true
  }

  input UpdateScheduleTemplateInput {
    templateName: String
    description: String
    defaultStartTime: String
    defaultEndTime: String
    defaultBreakStart: String
    defaultBreakEnd: String
    defaultSlotDuration: Int
    defaultBufferTime: Int
    maxAppointmentsPerDay: Int
    workingDays: [Int!]
    is_active: Boolean
  }

  input CreateScheduleExceptionInput {
    doctor_id: DoctorID!
    exceptionDate: Date!
    exceptionType: ScheduleExceptionType!
    isAvailable: Boolean = false
    reason: String
    overrideStartTime: String
    overrideEndTime: String
    overrideBreakPeriods: [BreakPeriodInput!]
    overrideMaxAppointments: Int
  }

  input UpdateScheduleExceptionInput {
    exceptionType: ScheduleExceptionType
    isAvailable: Boolean
    reason: String
    overrideStartTime: String
    overrideEndTime: String
    overrideBreakPeriods: [BreakPeriodInput!]
    overrideMaxAppointments: Int
  }

  input CreateDoctorReviewInput {
    doctor_id: DoctorID!
    patient_id: PatientID!
    appointment_id: UUID

    # Review Content
    rating: Int! # 1-5 stars
    comment: String

    # Review Details
    serviceQuality: Int # 1-5 stars
    communication: Int # 1-5 stars
    punctuality: Int # 1-5 stars
    facilities: Int # 1-5 stars
    # Settings
    isAnonymous: Boolean = false
  }

  # Queries
  extend type Query {
    # Single doctor queries
    doctor(id: UUID, doctor_id: DoctorID): Doctor
    doctorByProfile(profileId: UUID!): Doctor

    # Multiple doctors queries
    doctors(
      filters: DoctorFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "created_at"
      sortOrder: String = "DESC"
    ): DoctorConnection!

    # Search doctors
    searchDoctors(
      query: String!
      filters: DoctorFilters
      limit: Int = 20
      offset: Int = 0
    ): DoctorConnection!

    # Doctor availability
    doctorAvailability(doctor_id: DoctorID!, date: Date!): [AvailableSlot!]!

    # Doctor statistics
    doctorStats(doctor_id: DoctorID!): DoctorStats!

    # Department doctors
    departmentDoctors(
      departmentId: UUID!
      limit: Int = 20
      offset: Int = 0
    ): DoctorConnection!

    # Available doctors
    availableDoctors(
      date: Date!
      time: String
      specialization: String
      limit: Int = 20
    ): [Doctor!]!

    # Doctor reviews
    doctorReviews(
      doctor_id: DoctorID!
      limit: Int = 10
      offset: Int = 0
    ): [DoctorReview!]!

    # Enhanced Doctor schedule queries
    doctorSchedule(doctor_id: DoctorID!, date: Date): [DoctorSchedule!]!
    doctorScheduleEnhanced(
      doctor_id: DoctorID!
      weekStartDate: Date
    ): [DoctorSchedule!]!
    doctorScheduleTemplates(departmentId: String): [DoctorScheduleTemplate!]!
    doctorScheduleExceptions(
      doctor_id: DoctorID!
      dateFrom: Date
      dateTo: Date
    ): [DoctorScheduleException!]!
    doctorAppointmentSlots(
      doctor_id: DoctorID!
      date: Date!
    ): [DoctorAppointmentSlot!]!

    # Enhanced availability queries
    doctorWeeklyAvailability(doctor_id: DoctorID!, weekStartDate: Date!): JSON
    doctorAvailabilityOptimized(
      doctor_id: DoctorID!
      startDate: Date
      endDate: Date
    ): JSON
    bulkDoctorAvailability(doctorIds: [DoctorID!]!, date: Date!): JSON

    # Rooms
    room(id: UUID!): Room
    rooms(
      departmentId: String
      roomType: String
      is_active: Boolean = true
      limit: Int = 20
    ): [Room!]!
  }

  # Mutations
  extend type Mutation {
    # Doctor management
    createDoctor(input: CreateDoctorInput!): Doctor!
    updateDoctor(id: UUID!, input: UpdateDoctorInput!): Doctor!
    deleteDoctor(id: UUID!): Boolean!
    activateDoctor(id: UUID!): Doctor!
    deactivateDoctor(id: UUID!): Doctor!

    # Doctor experience
    addDoctorExperience(input: CreateDoctorExperienceInput!): DoctorExperience!
    updateDoctorExperience(
      id: UUID!
      input: UpdateDoctorExperienceInput!
    ): DoctorExperience!
    deleteDoctorExperience(id: UUID!): Boolean!

    # Doctor schedule
    createDoctorSchedule(input: CreateDoctorScheduleInput!): DoctorSchedule!
    updateDoctorSchedule(
      id: UUID!
      input: UpdateDoctorScheduleInput!
    ): DoctorSchedule!
    deleteDoctorSchedule(id: UUID!): Boolean!

    # Enhanced Doctor schedule mutations
    createDoctorScheduleEnhanced(
      input: CreateDoctorScheduleEnhancedInput!
    ): DoctorSchedule!
    updateDoctorScheduleEnhanced(
      id: UUID!
      input: UpdateDoctorScheduleEnhancedInput!
    ): DoctorSchedule!
    deleteDoctorScheduleEnhanced(id: UUID!): Boolean!

    # Schedule template mutations
    createScheduleTemplate(
      input: CreateScheduleTemplateInput!
    ): DoctorScheduleTemplate!
    updateScheduleTemplate(
      id: UUID!
      input: UpdateScheduleTemplateInput!
    ): DoctorScheduleTemplate!

    # Schedule exception mutations
    createScheduleException(
      input: CreateScheduleExceptionInput!
    ): DoctorScheduleException!
    updateScheduleException(
      id: UUID!
      input: UpdateScheduleExceptionInput!
    ): DoctorScheduleException!
    deleteScheduleException(id: UUID!): Boolean!

    # Appointment slot mutations
    generateDoctorSlots(
      doctor_id: DoctorID!
      startDate: Date!
      endDate: Date!
    ): Int!
    blockAppointmentSlot(slotId: UUID!, reason: String!): DoctorAppointmentSlot!
    unblockAppointmentSlot(slotId: UUID!): DoctorAppointmentSlot!

    # Doctor reviews
    createDoctorReview(input: CreateDoctorReviewInput!): DoctorReview!
    updateDoctorReview(id: UUID!, rating: Int, comment: String): DoctorReview!
    deleteDoctorReview(id: UUID!): Boolean!
  }

  # Subscriptions
  extend type Subscription {
    # Doctor status changes
    doctorStatusChanged(doctor_id: DoctorID): Doctor!
    doctorAvailabilityChanged(doctor_id: DoctorID): Doctor!

    # Doctor schedule changes
    doctorScheduleUpdated(doctor_id: DoctorID): DoctorSchedule!

    # New reviews
    doctorReviewAdded(doctor_id: DoctorID): DoctorReview!
  }

  # Enhanced Schedule Types
  type DoctorScheduleTemplate {
    id: UUID! # maps to template_id
    templateName: String! # maps to template_name
    departmentId: String # maps to department_id
    description: String # maps to description
    defaultStartTime: String! # maps to default_start_time
    defaultEndTime: String! # maps to default_end_time
    defaultBreakStart: String # maps to default_break_start
    defaultBreakEnd: String # maps to default_break_end
    defaultSlotDuration: Int # maps to default_slot_duration
    defaultBufferTime: Int # maps to default_buffer_time
    maxAppointmentsPerDay: Int # maps to max_appointments_per_day
    workingDays: [Int!]! # maps to working_days array
    is_active: Boolean! # maps to is_active
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
  }

  type BreakPeriod {
    startTime: String! # HH:MM format
    endTime: String! # HH:MM format
    breakType: String! # lunch, snack, rest, etc.
  }

  type DoctorScheduleException {
    id: UUID! # maps to exception_id
    doctor_id: DoctorID! # maps to doctor_id
    exceptionDate: Date! # maps to exception_date
    exceptionType: ScheduleExceptionType! # maps to exception_type
    isAvailable: Boolean! # maps to is_available
    reason: String # maps to reason
    # Override fields for special schedules
    overrideStartTime: String # maps to override_start_time
    overrideEndTime: String # maps to override_end_time
    overrideBreakPeriods: [BreakPeriod!] # maps to override_break_periods
    overrideMaxAppointments: Int # maps to override_max_appointments
    approvedBy: UUID # maps to approved_by
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
  }

  type DoctorAppointmentSlot {
    id: UUID! # maps to slot_id
    doctor_id: DoctorID! # maps to doctor_id
    slotDate: Date! # maps to slot_date
    startTime: String! # maps to start_time
    endTime: String! # maps to end_time
    durationMinutes: Int! # maps to duration_minutes
    slotType: SlotType! # maps to slot_type
    isAvailable: Boolean! # maps to is_available
    isBlocked: Boolean! # maps to is_blocked
    blockReason: String # maps to block_reason
    maxBookings: Int! # maps to max_bookings
    currentBookings: Int! # maps to current_bookings
    generatedFromScheduleId: UUID # maps to generated_from_schedule_id
    generationTimestamp: DateTime # maps to generation_timestamp
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
  }

  # Enums for Enhanced Scheduling
  enum ScheduleAvailabilityType {
    REGULAR
    EMERGENCY
    CONSULTATION
    SURGERY
  }

  enum ScheduleExceptionType {
    HOLIDAY
    LEAVE
    SICK_LEAVE
    SPECIAL_SCHEDULE
    EMERGENCY_DUTY
  }

  enum SlotType {
    REGULAR
    EMERGENCY
    FOLLOW_UP
    CONSULTATION
  }

  # Available time slot
  type AvailableSlot {
    startTime: DateTime!
    endTime: DateTime!
    isAvailable: Boolean!
    appointment_id: UUID
    reason: String # If not available
    slotType: SlotType
    durationMinutes: Int
  }
`;

export default doctorTypeDefs;
