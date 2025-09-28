/**
 * Doctor Aggregate Root - Provider Staff Management
 * Clean Architecture + DDD Implementation
 * Schema: doctor_schema
 */

import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { DoctorId } from '../value-objects/DoctorId';
import { MedicalCredentials } from '../value-objects/MedicalCredentials';
import { WorkSchedule } from '../value-objects/WorkSchedule';
import { Specialization } from '../entities/Specialization';
import { DoctorCredential } from '../entities/DoctorCredential';
import { DoctorCertification } from '../entities/DoctorCertification';
import { DoctorAvailability } from '../entities/DoctorAvailability';
import { DoctorReview } from '../entities/DoctorReview';
import { DoctorRegisteredEvent } from '../events/DoctorRegisteredEvent';
import { DoctorCredentialVerifiedEvent } from '../events/DoctorCredentialVerifiedEvent';
import { DoctorScheduleUpdatedEvent } from '../events/DoctorScheduleUpdatedEvent';

export interface DoctorProps {
  id: DoctorId;
  userId: string; // Reference to auth_schema.user_profiles
  medicalCredentials: MedicalCredentials;
  workSchedule: WorkSchedule;
  specializations: Specialization[];
  credentials: DoctorCredential[];
  certifications: DoctorCertification[];
  availability: DoctorAvailability[];
  reviews: DoctorReview[];
  consultationFee: number;
  yearsOfExperience: number;
  rating: number;
  totalPatients: number;
  isAcceptingNewPatients: boolean;
  isActive: boolean;
  registrationDate: Date;
  lastActiveDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Doctor extends AggregateRoot<DoctorProps> {
  private constructor(props: DoctorProps) {
    super(props);
  }

  // Factory method for creating new doctors
  public static create(
    userId: string,
    medicalCredentials: MedicalCredentials,
    workSchedule: WorkSchedule,
    specializations: Specialization[],
    consultationFee: number,
    yearsOfExperience: number
  ): Doctor {
    const doctorId = DoctorId.generate(specializations[0]?.code || 'GEN');
    const now = new Date();

    // Validate minimum requirements
    if (specializations.length === 0) {
      throw new Error('Bác sĩ phải có ít nhất một chuyên khoa');
    }

    if (consultationFee < 0) {
      throw new Error('Phí khám không được âm');
    }

    if (yearsOfExperience < 0) {
      throw new Error('Số năm kinh nghiệm không được âm');
    }

    const doctor = new Doctor({
      id: doctorId,
      userId,
      medicalCredentials,
      workSchedule,
      specializations,
      credentials: [],
      certifications: [],
      availability: [],
      reviews: [],
      consultationFee,
      yearsOfExperience,
      rating: 0,
      totalPatients: 0,
      isAcceptingNewPatients: true,
      isActive: true,
      registrationDate: now,
      createdAt: now,
      updatedAt: now
    });

    // Domain event for doctor registration
    doctor.addDomainEvent(new DoctorRegisteredEvent(doctorId, userId, medicalCredentials));

    return doctor;
  }

  // Factory method for reconstituting from persistence
  public static reconstitute(props: DoctorProps): Doctor {
    return new Doctor(props);
  }

  // Getters
  public get id(): DoctorId {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get medicalCredentials(): MedicalCredentials {
    return this.props.medicalCredentials;
  }

  public get workSchedule(): WorkSchedule {
    return this.props.workSchedule;
  }

  public get specializations(): Specialization[] {
    return this.props.specializations.slice();
  }

  public get credentials(): DoctorCredential[] {
    return this.props.credentials.slice();
  }

  public get certifications(): DoctorCertification[] {
    return this.props.certifications.slice();
  }

  public get availability(): DoctorAvailability[] {
    return this.props.availability.slice();
  }

  public get reviews(): DoctorReview[] {
    return this.props.reviews.slice();
  }

  public get consultationFee(): number {
    return this.props.consultationFee;
  }

  public get yearsOfExperience(): number {
    return this.props.yearsOfExperience;
  }

  public get rating(): number {
    return this.props.rating;
  }

  public get totalPatients(): number {
    return this.props.totalPatients;
  }

  public get isAcceptingNewPatients(): boolean {
    return this.props.isAcceptingNewPatients;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get registrationDate(): Date {
    return this.props.registrationDate;
  }

  public get lastActiveDate(): Date | undefined {
    return this.props.lastActiveDate;
  }

  // Business methods
  public updateMedicalCredentials(credentials: MedicalCredentials): void {
    this.props.medicalCredentials = credentials;
    this.props.updatedAt = new Date();
  }

  public updateWorkSchedule(schedule: WorkSchedule): void {
    this.props.workSchedule = schedule;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new DoctorScheduleUpdatedEvent(this.props.id, schedule));
  }

  public addSpecialization(specialization: Specialization): void {
    // Check if specialization already exists
    const exists = this.props.specializations.some(s => s.code === specialization.code);
    if (exists) {
      throw new Error('Chuyên khoa này đã tồn tại');
    }

    this.props.specializations.push(specialization);
    this.props.updatedAt = new Date();
  }

  public removeSpecialization(specializationCode: string): void {
    if (this.props.specializations.length <= 1) {
      throw new Error('Bác sĩ phải có ít nhất một chuyên khoa');
    }

    this.props.specializations = this.props.specializations.filter(
      s => s.code !== specializationCode
    );
    this.props.updatedAt = new Date();
  }

  public addCredential(credential: DoctorCredential): void {
    // Check for duplicate credentials
    const exists = this.props.credentials.some(c => 
      c.credentialType === credential.credentialType && 
      c.credentialNumber === credential.credentialNumber
    );

    if (exists) {
      throw new Error('Chứng chỉ này đã tồn tại');
    }

    this.props.credentials.push(credential);
    this.props.updatedAt = new Date();

    // If credential is verified, emit event
    if (credential.isVerified()) {
      this.addDomainEvent(new DoctorCredentialVerifiedEvent(this.props.id, credential));
    }
  }

  public verifyCredential(credentialId: string, verifiedBy: string): void {
    const credential = this.props.credentials.find(c => c.id === credentialId);
    if (!credential) {
      throw new Error('Không tìm thấy chứng chỉ');
    }

    credential.verify(verifiedBy);
    this.props.updatedAt = new Date();

    this.addDomainEvent(new DoctorCredentialVerifiedEvent(this.props.id, credential));
  }

  public addCertification(certification: DoctorCertification): void {
    this.props.certifications.push(certification);
    this.props.updatedAt = new Date();
  }

  public setAvailability(availability: DoctorAvailability[]): void {
    this.props.availability = availability;
    this.props.updatedAt = new Date();
  }

  public addReview(review: DoctorReview): void {
    this.props.reviews.push(review);
    this.recalculateRating();
    this.props.updatedAt = new Date();
  }

  public updateConsultationFee(fee: number): void {
    if (fee < 0) {
      throw new Error('Phí khám không được âm');
    }

    this.props.consultationFee = fee;
    this.props.updatedAt = new Date();
  }

  public incrementPatientCount(): void {
    this.props.totalPatients += 1;
    this.props.updatedAt = new Date();
  }

  public setAcceptingNewPatients(accepting: boolean): void {
    this.props.isAcceptingNewPatients = accepting;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public updateLastActive(): void {
    this.props.lastActiveDate = new Date();
    this.props.updatedAt = new Date();
  }

  // Professional validation methods
  public hasValidLicense(): boolean {
    return this.props.credentials.some(c => 
      c.credentialType === 'medical_license' && 
      c.isVerified() && 
      !c.isExpired()
    );
  }

  public hasBoardCertification(): boolean {
    return this.props.credentials.some(c => 
      c.credentialType === 'board_certification' && 
      c.isVerified() && 
      !c.isExpired()
    );
  }

  public isQualifiedToTreat(specializationCode: string): boolean {
    return this.props.specializations.some(s => s.code === specializationCode) &&
           this.hasValidLicense();
  }

  public canPrescribeMedication(): boolean {
    return this.hasValidLicense() && this.props.isActive;
  }

  public canPerformSurgery(): boolean {
    return this.hasValidLicense() && 
           this.hasBoardCertification() &&
           this.props.yearsOfExperience >= 5;
  }

  // Vietnamese healthcare specific methods
  public hasVietnameseMedicalLicense(): boolean {
    return this.props.credentials.some(c => 
      c.credentialType === 'medical_license' && 
      c.credentialNumber.startsWith('VN-') &&
      c.isVerified() && 
      !c.isExpired()
    );
  }

  public isRegisteredWithMOH(): boolean {
    // Ministry of Health registration check
    return this.hasVietnameseMedicalLicense();
  }

  public canTreatInternationalPatients(): boolean {
    return this.hasValidLicense() && 
           this.props.yearsOfExperience >= 3 &&
           this.props.rating >= 4.0;
  }

  // Availability methods
  public isAvailableOn(date: Date): boolean {
    return this.props.availability.some(avail => 
      avail.isAvailableOn(date) && avail.hasCapacity()
    );
  }

  public getAvailabilityOn(date: Date): DoctorAvailability[] {
    return this.props.availability.filter(avail => avail.isAvailableOn(date));
  }

  public hasAvailableSlots(date: Date): boolean {
    const dayAvailability = this.getAvailabilityOn(date);
    return dayAvailability.some(avail => avail.hasCapacity());
  }

  // Review and rating methods
  public getAverageRating(): number {
    return this.props.rating;
  }

  public getTotalReviews(): number {
    return this.props.reviews.length;
  }

  public getRecentReviews(limit: number = 10): DoctorReview[] {
    return this.props.reviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  public getPositiveReviewsPercentage(): number {
    if (this.props.reviews.length === 0) return 0;
    
    const positiveReviews = this.props.reviews.filter(r => r.rating >= 4).length;
    return (positiveReviews / this.props.reviews.length) * 100;
  }

  // Experience and seniority methods
  public getSeniorityLevel(): 'junior' | 'mid' | 'senior' | 'expert' {
    if (this.props.yearsOfExperience < 3) return 'junior';
    if (this.props.yearsOfExperience < 7) return 'mid';
    if (this.props.yearsOfExperience < 15) return 'senior';
    return 'expert';
  }

  public isExperiencedIn(specializationCode: string): boolean {
    const specialization = this.props.specializations.find(s => s.code === specializationCode);
    return !!specialization && this.props.yearsOfExperience >= 3;
  }

  // Schedule and workload methods
  public getWorkingHoursPerWeek(): number {
    return this.props.workSchedule.getTotalHoursPerWeek();
  }

  public isOverloaded(): boolean {
    const hoursPerWeek = this.getWorkingHoursPerWeek();
    const patientsPerWeek = this.props.totalPatients / 52; // Rough estimate
    return hoursPerWeek > 60 || patientsPerWeek > 100;
  }

  public canTakeMorePatients(): boolean {
    return this.props.isAcceptingNewPatients && 
           this.props.isActive && 
           !this.isOverloaded();
  }

  // Private methods
  private recalculateRating(): void {
    if (this.props.reviews.length === 0) {
      this.props.rating = 0;
      return;
    }

    const totalRating = this.props.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.props.rating = Math.round((totalRating / this.props.reviews.length) * 10) / 10;
  }

  // Audit methods
  public getAuditInfo(): object {
    return {
      doctorId: this.props.id.value,
      userId: this.props.userId,
      licenseNumber: this.props.medicalCredentials.licenseNumber,
      specializations: this.props.specializations.map(s => s.name),
      yearsOfExperience: this.props.yearsOfExperience,
      rating: this.props.rating,
      totalPatients: this.props.totalPatients,
      consultationFee: this.props.consultationFee,
      isActive: this.props.isActive,
      isAcceptingNewPatients: this.props.isAcceptingNewPatients,
      hasValidLicense: this.hasValidLicense(),
      registrationDate: this.props.registrationDate,
      lastActiveDate: this.props.lastActiveDate
    };
  }

  public equals(other: Doctor): boolean {
    return this.props.id.equals(other.props.id);
  }
}
