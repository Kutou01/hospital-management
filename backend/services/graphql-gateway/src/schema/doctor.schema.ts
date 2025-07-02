import { gql } from 'apollo-server-express';

/**
 * GraphQL Schema for Doctor entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const doctorTypeDefs = gql`
  # Scalar types for Vietnamese data
  scalar Date
  scalar DateTime
  scalar PhoneNumber
  scalar LicenseNumber
  scalar DoctorID
  scalar UUID

  # Enums
  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  enum DoctorStatus {
    ACTIVE
    INACTIVE
    ON_LEAVE
    SUSPENDED
  }

  enum AppointmentStatus {
    SCHEDULED
    CONFIRMED
    IN_PROGRESS
    COMPLETED
    CANCELLED
    NO_SHOW
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

  # Doctor Schedule
  type DoctorSchedule {
    id: UUID!
    doctorId: DoctorID!
    dayOfWeek: Int! # 0=Sunday, 1=Monday, etc.
    startTime: String! # HH:MM format
    endTime: String! # HH:MM format
    isAvailable: Boolean!
    maxAppointments: Int
    slotDuration: Int # minutes
    breakStartTime: String
    breakEndTime: String
    room: Room
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Doctor Review
  type DoctorReview {
    id: UUID!
    doctorId: DoctorID!
    patientId: String!
    appointmentId: UUID
    rating: Int! # 1-5 stars
    comment: String
    isAnonymous: Boolean!
    isVerified: Boolean!
    createdAt: DateTime!
    
    # Relationships
    patient: Patient
    appointment: Appointment
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

  type AppointmentConnection {
    edges: [AppointmentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AppointmentEdge {
    node: Appointment!
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

  # Pagination Info
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
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
    appointmentId: UUID
    rating: Int!
    comment: String
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
    doctorAvailability(
      doctorId: DoctorID!
      date: Date!
    ): [AvailableSlot!]!
    
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
    updateDoctorExperience(id: UUID!, input: UpdateDoctorExperienceInput!): DoctorExperience!
    deleteDoctorExperience(id: UUID!): Boolean!
    
    # Doctor schedule
    createDoctorSchedule(input: CreateDoctorScheduleInput!): DoctorSchedule!
    updateDoctorSchedule(id: UUID!, input: UpdateDoctorScheduleInput!): DoctorSchedule!
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
    
    # Appointment updates for doctor
    doctorAppointmentUpdated(doctorId: DoctorID!): Appointment!
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
