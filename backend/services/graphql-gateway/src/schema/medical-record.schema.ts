import { gql } from "graphql-tag";

/**
 * GraphQL Schema for Medical Record entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const medicalRecordTypeDefs = gql`
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
    patient_id: PatientID
    doctor_id: DoctorID
    appointment_id: UUID
    status: MedicalRecordStatus
    visitDateFrom: Date
    visitDateTo: Date
    diagnosis: String
  }

  input CreateMedicalRecordInput {
    patient_id: PatientID!
    doctor_id: DoctorID!
    appointment_id: UUID
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
    recorded_by: String!
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

  # Simplified Medical Record Type
  type MedicalRecord {
    id: UUID!
    patient_id: PatientID!
    doctor_id: DoctorID!
    appointment_id: UUID

    # Simplified Record Information
    visitDate: Date!
    symptoms: String # Replaces: chiefComplaint + historyOfPresentIllness
    examinationNotes: String # Replaces: physicalExamination
    diagnosis: String
    treatment: String # Replaces: treatment + followUpInstructions
    medications: String # Simple text instead of complex prescription system
    notes: String

    # Status
    status: MedicalRecordStatus!

    # Simplified Vital Signs (embedded)
    basicVitals: BasicVitalSigns

    # Attachments (keep for file uploads)
    attachments: [MedicalAttachment!]!

    # Relationships
    patient: Patient!
    doctor: Doctor!
    appointment: Appointment

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Simplified Basic Vital Signs (embedded in medical record)
  type BasicVitalSigns {
    temperature: Float # Celsius
    bloodPressure: String # "120/80" format
    heartRate: Int # BPM
    weight: Float # KG
    height: Float # CM
  }

  # REMOVED: LabResult type - lab results now stored as simple text in medical records

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
    created_at: DateTime!
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
      doctor_id: DoctorID!
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
      patient_id: PatientID!
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
    medicalRecordCreated(patient_id: PatientID): MedicalRecord!

    # Lab result updates
    labResultAdded(recordId: UUID): LabResult!
    labResultUpdated(recordId: UUID): LabResult!
  }
`;

export default medicalRecordTypeDefs;
