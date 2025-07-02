import { gql } from 'apollo-server-express';

/**
 * GraphQL Schema for Appointment entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const appointmentTypeDefs = gql`
  # Appointment-specific scalars
  scalar AppointmentID
  scalar Time

  # Enums
  enum AppointmentType {
    CONSULTATION
    FOLLOW_UP
    EMERGENCY
    SURGERY
    DIAGNOSTIC
    VACCINATION
    HEALTH_CHECKUP
    TELEMEDICINE
  }

  enum AppointmentPriority {
    LOW
    NORMAL
    HIGH
    URGENT
    EMERGENCY
  }

  enum PaymentStatus {
    PENDING
    PAID
    PARTIALLY_PAID
    REFUNDED
    CANCELLED
  }

  # Core Appointment Type
  type Appointment {
    # Basic Information
    id: UUID!
    appointmentId: AppointmentID!
    doctorId: DoctorID!
    patientId: PatientID!
    
    # Scheduling Information
    scheduledDate: Date!
    scheduledTime: Time!
    scheduledDateTime: DateTime!
    duration: Int! # minutes
    endDateTime: DateTime!
    
    # Appointment Details
    type: AppointmentType!
    priority: AppointmentPriority!
    status: AppointmentStatus!
    reason: String
    notes: String
    symptoms: [String!]
    
    # Location
    room: Room
    department: Department
    
    # Payment Information
    consultationFee: Float!
    additionalFees: Float
    totalAmount: Float!
    paymentStatus: PaymentStatus!
    paymentMethod: String
    
    # Status Tracking
    checkedInAt: DateTime
    startedAt: DateTime
    completedAt: DateTime
    cancelledAt: DateTime
    cancellationReason: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    doctor: Doctor!
    patient: Patient!
    medicalRecord: MedicalRecord
    prescription: Prescription
    payment: Payment
    followUpAppointment: Appointment
    parentAppointment: Appointment
    
    # Computed Fields
    isToday: Boolean!
    isUpcoming: Boolean!
    isPast: Boolean!
    canCancel: Boolean!
    canReschedule: Boolean!
    timeUntilAppointment: Int # minutes
    waitingTime: Int # minutes if checked in
  }

  # Appointment Slot
  type AppointmentSlot {
    startTime: DateTime!
    endTime: DateTime!
    duration: Int!
    isAvailable: Boolean!
    doctorId: DoctorID!
    room: Room
    maxAppointments: Int
    currentAppointments: Int
    appointmentType: AppointmentType
  }

  # Appointment Statistics
  type AppointmentStats {
    date: Date!
    totalAppointments: Int!
    scheduledAppointments: Int!
    confirmedAppointments: Int!
    completedAppointments: Int!
    cancelledAppointments: Int!
    noShowAppointments: Int!
    averageWaitTime: Float # minutes
    averageConsultationTime: Float # minutes
    revenue: Float!
    occupancyRate: Float # percentage
  }

  # Daily Schedule
  type DailySchedule {
    date: Date!
    doctorId: DoctorID!
    appointments: [Appointment!]!
    availableSlots: [AppointmentSlot!]!
    totalSlots: Int!
    bookedSlots: Int!
    availableSlots: Int!
    workingHours: WorkingHours!
  }

  type WorkingHours {
    startTime: Time!
    endTime: Time!
    breakStartTime: Time
    breakEndTime: Time
    isWorkingDay: Boolean!
  }

  # Connection types
  type AppointmentConnection {
    edges: [AppointmentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AppointmentEdge {
    node: Appointment!
    cursor: String!
  }

  # Input Types
  input AppointmentFilters {
    doctorId: DoctorID
    patientId: PatientID
    departmentId: UUID
    status: AppointmentStatus
    type: AppointmentType
    priority: AppointmentPriority
    paymentStatus: PaymentStatus
    dateFrom: Date
    dateTo: Date
    timeFrom: Time
    timeTo: Time
    room: String
  }

  input CreateAppointmentInput {
    doctorId: DoctorID!
    patientId: PatientID!
    scheduledDate: Date!
    scheduledTime: Time!
    duration: Int = 30
    type: AppointmentType = CONSULTATION
    priority: AppointmentPriority = NORMAL
    reason: String
    notes: String
    symptoms: [String!]
    roomId: UUID
  }

  input UpdateAppointmentInput {
    scheduledDate: Date
    scheduledTime: Time
    duration: Int
    type: AppointmentType
    priority: AppointmentPriority
    reason: String
    notes: String
    symptoms: [String!]
    roomId: UUID
    status: AppointmentStatus
  }

  input RescheduleAppointmentInput {
    appointmentId: AppointmentID!
    newDate: Date!
    newTime: Time!
    reason: String
  }

  input CancelAppointmentInput {
    appointmentId: AppointmentID!
    reason: String!
    refundRequested: Boolean = false
  }

  input CheckInInput {
    appointmentId: AppointmentID!
    actualArrivalTime: DateTime
    symptoms: [String!]
    notes: String
  }

  # Queries
  extend type Query {
    # Single appointment queries
    appointment(id: UUID, appointmentId: AppointmentID): Appointment
    
    # Multiple appointments queries
    appointments(
      filters: AppointmentFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "scheduledDateTime"
      sortOrder: String = "ASC"
    ): AppointmentConnection!
    
    # Today's appointments
    todayAppointments(
      doctorId: DoctorID
      departmentId: UUID
      status: AppointmentStatus
    ): [Appointment!]!
    
    # Upcoming appointments
    upcomingAppointments(
      doctorId: DoctorID
      patientId: PatientID
      days: Int = 7
      limit: Int = 20
    ): [Appointment!]!
    
    # Available slots
    availableSlots(
      doctorId: DoctorID!
      date: Date!
      duration: Int = 30
    ): [AppointmentSlot!]!
    
    # Doctor's daily schedule
    doctorDailySchedule(
      doctorId: DoctorID!
      date: Date!
    ): DailySchedule!
    
    # Department appointments
    departmentAppointments(
      departmentId: UUID!
      date: Date
      status: AppointmentStatus
      limit: Int = 50
    ): [Appointment!]!
    
    # Appointment statistics
    appointmentStats(
      date: Date
      doctorId: DoctorID
      departmentId: UUID
    ): AppointmentStats!
    
    # Patient appointment history
    patientAppointmentHistory(
      patientId: PatientID!
      limit: Int = 20
      offset: Int = 0
    ): AppointmentConnection!
    
    # Doctor appointment history
    doctorAppointmentHistory(
      doctorId: DoctorID!
      dateFrom: Date
      dateTo: Date
      limit: Int = 20
      offset: Int = 0
    ): AppointmentConnection!
    
    # Conflicting appointments
    conflictingAppointments(
      doctorId: DoctorID!
      date: Date!
      startTime: Time!
      endTime: Time!
    ): [Appointment!]!
    
    # Waiting queue
    waitingQueue(
      doctorId: DoctorID
      departmentId: UUID
      date: Date
    ): [Appointment!]!
  }

  # Mutations
  extend type Mutation {
    # Appointment management
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: UUID!, input: UpdateAppointmentInput!): Appointment!
    deleteAppointment(id: UUID!): Boolean!
    
    # Appointment status changes
    confirmAppointment(id: UUID!): Appointment!
    rescheduleAppointment(input: RescheduleAppointmentInput!): Appointment!
    cancelAppointment(input: CancelAppointmentInput!): Appointment!
    
    # Check-in process
    checkInPatient(input: CheckInInput!): Appointment!
    startAppointment(id: UUID!): Appointment!
    completeAppointment(id: UUID!, notes: String): Appointment!
    markNoShow(id: UUID!, reason: String): Appointment!
    
    # Bulk operations
    bulkRescheduleAppointments(
      appointmentIds: [UUID!]!
      newDate: Date!
      reason: String
    ): [Appointment!]!
    
    bulkCancelAppointments(
      appointmentIds: [UUID!]!
      reason: String!
    ): [Appointment!]!
    
    # Emergency appointment
    createEmergencyAppointment(
      doctorId: DoctorID!
      patientId: PatientID!
      reason: String!
      priority: AppointmentPriority = EMERGENCY
    ): Appointment!
    
    # Follow-up appointment
    scheduleFollowUp(
      parentAppointmentId: UUID!
      scheduledDate: Date!
      scheduledTime: Time!
      reason: String
    ): Appointment!
  }

  # Subscriptions
  extend type Subscription {
    # Appointment updates
    appointmentUpdated(appointmentId: AppointmentID): Appointment!
    appointmentStatusChanged(appointmentId: AppointmentID): Appointment!
    
    # Doctor appointments
    doctorAppointmentUpdated(doctorId: DoctorID!): Appointment!
    doctorScheduleChanged(doctorId: DoctorID!): DailySchedule!
    
    # Patient appointments
    patientAppointmentUpdated(patientId: PatientID!): Appointment!
    
    # Department appointments
    departmentAppointmentUpdated(departmentId: UUID!): Appointment!
    
    # Real-time queue updates
    waitingQueueUpdated(doctorId: DoctorID): [Appointment!]!
    
    # New appointments
    newAppointmentCreated(doctorId: DoctorID): Appointment!
    
    # Appointment reminders
    appointmentReminder(patientId: PatientID): Appointment!
  }
`;

export default appointmentTypeDefs;
