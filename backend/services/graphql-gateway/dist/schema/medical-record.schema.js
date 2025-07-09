"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicalRecordTypeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
/**
 * GraphQL Schema for Medical Record entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
exports.medicalRecordTypeDefs = (0, graphql_tag_1.gql) `
  # Medical Record-specific enums
  enum MedicalRecordStatus {
    ACTIVE
    ARCHIVED
    DELETED
  }

  enum LabResultStatus {
    PENDING
    COMPLETED
    CANCELLED
  }

  # Input Types
  input MedicalRecordFilters {
    patientId: PatientID
    doctorId: DoctorID
    appointmentId: UUID
    status: MedicalRecordStatus
    visitDateFrom: Date
    visitDateTo: Date
    diagnosis: String
  }

  input CreateMedicalRecordInput {
    patientId: PatientID!
    doctorId: DoctorID!
    appointmentId: UUID
    visitDate: Date!
    chiefComplaint: String
    historyOfPresentIllness: String
    physicalExamination: String
    diagnosis: String
    treatment: String
    prescription: String
    followUpInstructions: String
    vitalSigns: VitalSignsInput
  }

  input UpdateMedicalRecordInput {
    chiefComplaint: String
    historyOfPresentIllness: String
    physicalExamination: String
    diagnosis: String
    treatment: String
    prescription: String
    followUpInstructions: String
    vitalSigns: VitalSignsInput
    status: MedicalRecordStatus
  }

  input VitalSignsInput {
    # Blood Pressure
    bloodPressureSystolic: Int
    bloodPressureDiastolic: Int

    # Core Vitals
    heartRate: Int
    temperature: Float
    respiratoryRate: Int
    oxygenSaturation: Float

    # Physical Measurements
    height: Float
    weight: Float

    # Metadata
    recordedBy: String!
    notes: String
  }

  input CreateLabResultInput {
    recordId: UUID!
    testName: String!
    testType: String!
    resultValue: String
    referenceRange: String
    unit: String
    testDate: Date!
    resultDate: Date
    labTechnician: String
    notes: String
  }

  input UpdateLabResultInput {
    testName: String
    testType: String
    resultValue: String
    referenceRange: String
    unit: String
    testDate: Date
    resultDate: Date
    labTechnician: String
    notes: String
    status: LabResultStatus
  }

  # Core Medical Record Type
  type MedicalRecord {
    id: UUID!
    patientId: PatientID!
    doctorId: DoctorID!
    appointmentId: UUID

    # Record Information
    visitDate: Date!
    chiefComplaint: String
    historyOfPresentIllness: String
    physicalExamination: String
    diagnosis: String
    treatment: String
    prescription: String
    followUpInstructions: String

    # Status
    status: MedicalRecordStatus!

    # Vital Signs
    vitalSigns: VitalSigns

    # Lab Results
    labResults: [LabResult!]!

    # Attachments
    attachments: [MedicalAttachment!]!

    # Relationships
    patient: Patient!
    doctor: Doctor!
    appointment: Appointment

    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Vital Signs (mapped to vital_signs_history table)
  type VitalSigns {
    # Blood Pressure
    bloodPressureSystolic: Int # maps to blood_pressure_systolic
    bloodPressureDiastolic: Int # maps to blood_pressure_diastolic
    # Core Vitals
    heartRate: Int # maps to heart_rate
    temperature: Float # maps to temperature
    respiratoryRate: Int # maps to respiratory_rate
    oxygenSaturation: Float # maps to oxygen_saturation
    # Physical Measurements
    height: Float # maps to height
    weight: Float # maps to weight
    bmi: Float # maps to bmi (calculated field)
    # Metadata
    recordedAt: DateTime! # maps to recorded_at
    recordedBy: String! # maps to recorded_by
    notes: String # maps to notes
  }

  # Lab Result
  type LabResult {
    id: UUID!
    recordId: UUID!
    testName: String!
    testType: String!
    resultValue: String
    referenceRange: String
    unit: String
    testDate: Date!
    resultDate: Date
    labTechnician: String
    notes: String
    status: LabResultStatus!
    isAbnormal: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Medical Attachment
  type MedicalAttachment {
    id: UUID!
    recordId: UUID!
    fileName: String!
    fileUrl: String!
    fileType: String!
    fileSize: Int!
    description: String
    uploadedBy: String!
    createdAt: DateTime!
  }

  # Connection types
  type MedicalRecordConnection {
    edges: [MedicalRecordEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MedicalRecordEdge {
    node: MedicalRecord!
    cursor: String!
  }

  # Queries
  extend type Query {
    # Single medical record
    medicalRecord(id: UUID!): MedicalRecord

    # Multiple medical records with filters
    medicalRecords(
      filters: MedicalRecordFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "visitDate"
      sortOrder: String = "DESC"
    ): MedicalRecordConnection!

    # Doctor medical records
    doctorMedicalRecords(
      doctorId: DoctorID!
      limit: Int = 20
      offset: Int = 0
      dateFrom: Date
      dateTo: Date
    ): MedicalRecordConnection!

    # Search medical records
    searchMedicalRecords(
      query: String!
      filters: MedicalRecordFilters
      limit: Int = 20
      offset: Int = 0
    ): MedicalRecordConnection!

    # Lab results query
    labResults(
      patientId: PatientID!
      testType: String
      limit: Int = 20
      offset: Int = 0
      dateFrom: Date
      dateTo: Date
    ): [LabResult!]!

    # Note: patientMedicalRecords query is defined in patient.schema.ts
    # to maintain proper context and avoid conflicts
  }

  # Mutations
  extend type Mutation {
    # Medical Record management
    createMedicalRecord(input: CreateMedicalRecordInput!): MedicalRecord!
    updateMedicalRecord(
      id: UUID!
      input: UpdateMedicalRecordInput!
    ): MedicalRecord!
    deleteMedicalRecord(id: UUID!): Boolean!

    # Lab Results
    addLabResult(input: CreateLabResultInput!): LabResult!
    updateLabResult(id: UUID!, input: UpdateLabResultInput!): LabResult!
    deleteLabResult(id: UUID!): Boolean!

    # Medical Record Attachments
    addMedicalAttachment(
      recordId: UUID!
      file: Upload!
      description: String
    ): MedicalAttachment!
    deleteMedicalAttachment(id: UUID!): Boolean!
  }

  # Subscriptions
  extend type Subscription {
    # Medical record updates
    medicalRecordUpdated(recordId: UUID): MedicalRecord!
    medicalRecordCreated(patientId: PatientID): MedicalRecord!

    # Lab result updates
    labResultAdded(recordId: UUID): LabResult!
    labResultUpdated(recordId: UUID): LabResult!
  }
`;
exports.default = exports.medicalRecordTypeDefs;
//# sourceMappingURL=medical-record.schema.js.map