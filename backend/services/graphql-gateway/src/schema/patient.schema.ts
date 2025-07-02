import { gql } from 'apollo-server-express';

/**
 * GraphQL Schema for Patient entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const patientTypeDefs = gql`
  # Patient-specific scalars
  scalar PatientID
  scalar BloodType
  scalar Height
  scalar Weight

  # Enums
  enum PatientStatus {
    ACTIVE
    INACTIVE
    DECEASED
    TRANSFERRED
  }

  enum BloodGroup {
    A_POSITIVE
    A_NEGATIVE
    B_POSITIVE
    B_NEGATIVE
    AB_POSITIVE
    AB_NEGATIVE
    O_POSITIVE
    O_NEGATIVE
    UNKNOWN
  }

  enum MaritalStatus {
    SINGLE
    MARRIED
    DIVORCED
    WIDOWED
    SEPARATED
  }

  enum InsuranceType {
    SOCIAL_INSURANCE
    PRIVATE_INSURANCE
    COMPANY_INSURANCE
    SELF_PAY
    GOVERNMENT
  }

  # Core Patient Type
  type Patient {
    # Basic Information
    id: UUID!
    patientId: PatientID!
    profileId: UUID!
    fullName: String!
    email: String!
    phoneNumber: PhoneNumber
    
    # Personal Information
    gender: Gender!
    dateOfBirth: Date!
    age: Int!
    address: String
    emergencyContact: EmergencyContact
    maritalStatus: MaritalStatus
    occupation: String
    
    # Medical Information
    bloodType: BloodGroup
    height: Height
    weight: Weight
    bmi: Float
    allergies: [String!]
    chronicConditions: [String!]
    currentMedications: [String!]
    
    # Insurance Information
    insuranceType: InsuranceType
    insuranceNumber: String
    insuranceProvider: String
    insuranceExpiryDate: Date
    
    # Status
    isActive: Boolean!
    status: PatientStatus!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    lastVisit: DateTime
    
    # Relationships
    appointments(
      status: AppointmentStatus
      dateFrom: Date
      dateTo: Date
      limit: Int = 10
      offset: Int = 0
    ): AppointmentConnection!
    medicalRecords(
      limit: Int = 10
      offset: Int = 0
      dateFrom: Date
      dateTo: Date
    ): MedicalRecordConnection!
    prescriptions(
      active: Boolean
      limit: Int = 10
      offset: Int = 0
    ): PrescriptionConnection!
    payments(
      status: String
      limit: Int = 10
      offset: Int = 0
    ): PaymentConnection!
    
    # Computed Fields
    totalAppointments: Int!
    upcomingAppointments: Int!
    completedAppointments: Int!
    totalSpent: Float!
    lastAppointment: Appointment
    nextAppointment: Appointment
    primaryDoctor: Doctor
    visitFrequency: Float # visits per month
  }

  # Emergency Contact
  type EmergencyContact {
    name: String!
    relationship: String!
    phoneNumber: PhoneNumber!
    address: String
  }

  # Patient Medical Summary
  type PatientMedicalSummary {
    patientId: PatientID!
    totalVisits: Int!
    lastVisitDate: DateTime
    chronicConditions: [String!]!
    allergies: [String!]!
    currentMedications: [String!]!
    vitalSigns: LatestVitalSigns
    labResults: [LatestLabResult!]!
    diagnoses: [String!]!
    treatments: [String!]!
    riskFactors: [String!]!
  }

  type LatestVitalSigns {
    bloodPressure: String
    heartRate: Int
    temperature: Float
    respiratoryRate: Int
    oxygenSaturation: Float
    recordedAt: DateTime!
  }

  type LatestLabResult {
    testName: String!
    value: String!
    unit: String
    normalRange: String
    status: String # NORMAL, HIGH, LOW, CRITICAL
    recordedAt: DateTime!
  }

  # Patient Statistics
  type PatientStats {
    patientId: PatientID!
    totalAppointments: Int!
    completedAppointments: Int!
    cancelledAppointments: Int!
    noShowAppointments: Int!
    totalSpent: Float!
    averageSpentPerVisit: Float!
    visitFrequency: Float! # visits per month
    lastVisitDate: DateTime
    nextAppointmentDate: DateTime
    preferredDoctors: [Doctor!]!
    mostVisitedDepartments: [Department!]!
  }

  # Connection types
  type PatientConnection {
    edges: [PatientEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PatientEdge {
    node: Patient!
    cursor: String!
  }

  type MedicalRecordConnection {
    edges: [MedicalRecordEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MedicalRecordEdge {
    node: MedicalRecord!
    cursor: String!
  }

  type PrescriptionConnection {
    edges: [PrescriptionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PrescriptionEdge {
    node: Prescription!
    cursor: String!
  }

  type PaymentConnection {
    edges: [PaymentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PaymentEdge {
    node: Payment!
    cursor: String!
  }

  # Input Types
  input PatientFilters {
    search: String
    status: PatientStatus
    isActive: Boolean
    gender: Gender
    ageMin: Int
    ageMax: Int
    bloodType: BloodGroup
    insuranceType: InsuranceType
    hasChronicConditions: Boolean
    lastVisitFrom: Date
    lastVisitTo: Date
    registeredFrom: Date
    registeredTo: Date
  }

  input CreatePatientInput {
    fullName: String!
    email: String!
    phoneNumber: PhoneNumber!
    gender: Gender!
    dateOfBirth: Date!
    address: String
    emergencyContact: EmergencyContactInput
    maritalStatus: MaritalStatus
    occupation: String
    bloodType: BloodGroup
    height: Height
    weight: Weight
    allergies: [String!]
    chronicConditions: [String!]
    currentMedications: [String!]
    insuranceType: InsuranceType
    insuranceNumber: String
    insuranceProvider: String
    insuranceExpiryDate: Date
  }

  input UpdatePatientInput {
    fullName: String
    phoneNumber: PhoneNumber
    address: String
    emergencyContact: EmergencyContactInput
    maritalStatus: MaritalStatus
    occupation: String
    bloodType: BloodGroup
    height: Height
    weight: Weight
    allergies: [String!]
    chronicConditions: [String!]
    currentMedications: [String!]
    insuranceType: InsuranceType
    insuranceNumber: String
    insuranceProvider: String
    insuranceExpiryDate: Date
    isActive: Boolean
    status: PatientStatus
  }

  input EmergencyContactInput {
    name: String!
    relationship: String!
    phoneNumber: PhoneNumber!
    address: String
  }

  # Queries
  extend type Query {
    # Single patient queries
    patient(id: UUID, patientId: PatientID): Patient
    patientByProfile(profileId: UUID!): Patient
    
    # Multiple patients queries
    patients(
      filters: PatientFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "createdAt"
      sortOrder: String = "DESC"
    ): PatientConnection!
    
    # Search patients
    searchPatients(
      query: String!
      filters: PatientFilters
      limit: Int = 20
      offset: Int = 0
    ): PatientConnection!
    
    # Patient medical summary
    patientMedicalSummary(patientId: PatientID!): PatientMedicalSummary!
    
    # Patient statistics
    patientStats(patientId: PatientID!): PatientStats!
    
    # Patient appointments with doctor
    patientDoctorHistory(
      patientId: PatientID!
      doctorId: DoctorID!
      limit: Int = 10
    ): [Appointment!]!
    
    # Patients by doctor
    doctorPatients(
      doctorId: DoctorID!
      limit: Int = 20
      offset: Int = 0
    ): PatientConnection!
    
    # Recent patients
    recentPatients(
      days: Int = 30
      limit: Int = 20
    ): [Patient!]!
  }

  # Mutations
  extend type Mutation {
    # Patient management
    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(id: UUID!, input: UpdatePatientInput!): Patient!
    deletePatient(id: UUID!): Boolean!
    activatePatient(id: UUID!): Patient!
    deactivatePatient(id: UUID!): Patient!
    
    # Patient medical information
    updatePatientMedicalInfo(
      id: UUID!
      bloodType: BloodGroup
      height: Height
      weight: Weight
      allergies: [String!]
      chronicConditions: [String!]
      currentMedications: [String!]
    ): Patient!
    
    # Patient insurance
    updatePatientInsurance(
      id: UUID!
      insuranceType: InsuranceType
      insuranceNumber: String
      insuranceProvider: String
      insuranceExpiryDate: Date
    ): Patient!
    
    # Emergency contact
    updateEmergencyContact(
      id: UUID!
      emergencyContact: EmergencyContactInput!
    ): Patient!
  }

  # Subscriptions
  extend type Subscription {
    # Patient status changes
    patientStatusChanged(patientId: PatientID): Patient!
    patientUpdated(patientId: PatientID): Patient!
    
    # Patient appointments
    patientAppointmentUpdated(patientId: PatientID!): Appointment!
    
    # New medical records
    patientMedicalRecordAdded(patientId: PatientID!): MedicalRecord!
    
    # New prescriptions
    patientPrescriptionAdded(patientId: PatientID!): Prescription!
  }
`;

export default patientTypeDefs;
