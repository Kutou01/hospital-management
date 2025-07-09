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
    doctorId: DoctorID!
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
    isActive: Boolean!
    status: DoctorStatus!

    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!

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
    doctorId: DoctorID!
    hospitalName: String!
    position: String!
    startDate: Date!
    endDate: Date
    description: String
    isCurrent: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Doctor Review (mapped to doctor_reviews table)
  type DoctorReview {
    id: UUID! # maps to review_id
    doctorId: DoctorID! # maps to doctor_id
    patientId: PatientID! # maps to patient_id
    appointmentId: UUID # maps to appointment_id
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
    createdAt: DateTime! # maps to created_at
    updatedAt: DateTime! # maps to updated_at
    # Relationships
    doctor: Doctor!
    patient: Patient!
    appointment: Appointment
  }

  # Doctor Schedule (mapped to doctor_schedules table)
  type DoctorSchedule {
    id: UUID! # maps to schedule_id
    doctorId: DoctorID! # maps to doctor_id
    # Schedule Details
    dayOfWeek: Int! # maps to day_of_week (0=Sunday, 1=Monday, etc.)
    startTime: String! # maps to start_time (HH:MM format)
    endTime: String! # maps to end_time (HH:MM format)
    # Availability
    isAvailable: Boolean! # maps to is_available
    maxAppointments: Int # maps to max_appointments
    slotDuration: Int # maps to slot_duration (minutes)
    # Break Time
    breakStartTime: String # maps to break_start_time
    breakEndTime: String # maps to break_end_time
    # Location
    room: Room # maps to room_id
    # Additional Info
    notes: String # maps to notes
    scheduleType: String # maps to schedule_type
    # Timestamps
    createdAt: DateTime! # maps to created_at
    updatedAt: DateTime! # maps to updated_at
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
    isActive: Boolean! # maps to is_active
    # Timestamps
    createdAt: DateTime! # maps to created_at
    updatedAt: DateTime! # maps to updated_at
    # Relationships
    department: Department
  }

  # Doctor Statistics
  type DoctorStats {
    doctorId: DoctorID!
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
    isActive: Boolean
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
    isActive: Boolean
    status: DoctorStatus
  }

  input CreateDoctorExperienceInput {
    doctorId: DoctorID!
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
    doctorId: DoctorID!
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

  input CreateDoctorReviewInput {
    doctorId: DoctorID!
    patientId: PatientID!
    appointmentId: UUID

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
    doctor(id: UUID, doctorId: DoctorID): Doctor
    doctorByProfile(profileId: UUID!): Doctor

    # Multiple doctors queries
    doctors(
      filters: DoctorFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "createdAt"
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
    doctorAvailability(doctorId: DoctorID!, date: Date!): [AvailableSlot!]!

    # Doctor statistics
    doctorStats(doctorId: DoctorID!): DoctorStats!

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
      doctorId: DoctorID!
      limit: Int = 10
      offset: Int = 0
    ): [DoctorReview!]!

    # Doctor schedule
    doctorSchedule(doctorId: DoctorID!, date: Date): [DoctorSchedule!]!

    # Rooms
    room(id: UUID!): Room
    rooms(
      departmentId: String
      roomType: String
      isActive: Boolean = true
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

    # Doctor reviews
    createDoctorReview(input: CreateDoctorReviewInput!): DoctorReview!
    updateDoctorReview(id: UUID!, rating: Int, comment: String): DoctorReview!
    deleteDoctorReview(id: UUID!): Boolean!
  }

  # Subscriptions
  extend type Subscription {
    # Doctor status changes
    doctorStatusChanged(doctorId: DoctorID): Doctor!
    doctorAvailabilityChanged(doctorId: DoctorID): Doctor!

    # Doctor schedule changes
    doctorScheduleUpdated(doctorId: DoctorID): DoctorSchedule!

    # New reviews
    doctorReviewAdded(doctorId: DoctorID): DoctorReview!
  }

  # Available time slot
  type AvailableSlot {
    startTime: DateTime!
    endTime: DateTime!
    isAvailable: Boolean!
    appointmentId: UUID
    reason: String # If not available
  }
`;

export default doctorTypeDefs;
