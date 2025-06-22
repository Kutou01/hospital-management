// Smart Recommendations Engine
// Provides intelligent suggestions for appointments, health packages, and follow-ups

export interface TimeSlotRecommendation {
    time: string;
    crowdLevel: 'low' | 'medium' | 'high';
    waitTime: string;
    availability: number; // 0-100%
    reason: string;
}

export interface HealthPackageRecommendation {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    suitableFor: string[];
    includes: string[];
    priority: 'high' | 'medium' | 'low';
    discount?: number;
}

export interface FollowUpReminder {
    type: 'checkup' | 'medication' | 'test' | 'lifestyle';
    title: string;
    description: string;
    dueDate: Date;
    urgency: 'high' | 'medium' | 'low';
    specialty?: string;
}

export interface PatientProfile {
    age: number;
    gender: 'male' | 'female';
    medicalHistory: string[];
    lastVisit?: Date;
    chronicConditions?: string[];
    riskFactors?: string[];
}

export class SmartRecommendationEngine {
    private language: 'vi' | 'en';
    
    constructor(language: 'vi' | 'en' = 'vi') {
        this.language = language;
    }
    
    // Get optimal appointment times based on historical data
    getOptimalAppointmentTimes(specialty: string, date: Date): TimeSlotRecommendation[] {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Base time slots
        const timeSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30'
        ];
        
        // Crowd patterns based on specialty and day
        const crowdPatterns = this.getCrowdPatterns(specialty, dayOfWeek);
        
        return timeSlots.map(time => {
            const crowdLevel = this.calculateCrowdLevel(time, crowdPatterns, isWeekend);
            const waitTime = this.estimateWaitTime(crowdLevel, specialty);
            const availability = this.calculateAvailability(time, specialty, dayOfWeek);
            
            return {
                time,
                crowdLevel,
                waitTime,
                availability,
                reason: this.getRecommendationReason(crowdLevel, time, this.language)
            };
        }).sort((a, b) => {
            // Sort by crowd level (low first), then by availability
            const crowdScore = { low: 3, medium: 2, high: 1 };
            if (crowdScore[a.crowdLevel] !== crowdScore[b.crowdLevel]) {
                return crowdScore[b.crowdLevel] - crowdScore[a.crowdLevel];
            }
            return b.availability - a.availability;
        });
    }
    
    // Recommend health packages based on patient profile
    recommendHealthPackages(profile: PatientProfile): HealthPackageRecommendation[] {
        const packages: HealthPackageRecommendation[] = [];
        
        // Age-based recommendations
        if (profile.age >= 40) {
            packages.push({
                id: 'comprehensive-40plus',
                name: this.language === 'vi' ? 'Gói khám sức khỏe tổng quát 40+' : 'Comprehensive Health Package 40+',
                description: this.language === 'vi' 
                    ? 'Khám sức khỏe toàn diện cho người trên 40 tuổi'
                    : 'Complete health screening for people over 40',
                price: 2500000,
                duration: '3-4 giờ',
                suitableFor: ['40+ tuổi', 'Khám định kỳ', 'Phát hiện sớm bệnh lý'],
                includes: [
                    'Khám nội tổng quát',
                    'Xét nghiệm máu tổng quát',
                    'X-quang phổi',
                    'Siêu âm bụng tổng quát',
                    'Điện tim',
                    'Đo mật độ xương'
                ],
                priority: 'high'
            });
        }
        
        if (profile.age >= 50) {
            packages.push({
                id: 'cardiac-screening',
                name: this.language === 'vi' ? 'Gói tầm soát tim mạch' : 'Cardiac Screening Package',
                description: this.language === 'vi' 
                    ? 'Tầm soát các bệnh lý tim mạch'
                    : 'Comprehensive cardiac health screening',
                price: 1800000,
                duration: '2-3 giờ',
                suitableFor: ['50+ tuổi', 'Có yếu tố nguy cơ tim mạch'],
                includes: [
                    'Khám tim mạch',
                    'Điện tim',
                    'Siêu âm tim',
                    'Test gắng sức',
                    'Xét nghiệm lipid máu'
                ],
                priority: 'high'
            });
        }
        
        // Gender-specific recommendations
        if (profile.gender === 'female' && profile.age >= 35) {
            packages.push({
                id: 'womens-health',
                name: this.language === 'vi' ? 'Gói khám sức khỏe phụ nữ' : 'Women\'s Health Package',
                description: this.language === 'vi' 
                    ? 'Khám sức khỏe chuyên biệt cho phụ nữ'
                    : 'Specialized health screening for women',
                price: 2200000,
                duration: '2-3 giờ',
                suitableFor: ['Phụ nữ 35+', 'Khám phụ khoa định kỳ'],
                includes: [
                    'Khám phụ khoa',
                    'Siêu âm vú',
                    'Tầm soát ung thư cổ tử cung',
                    'Xét nghiệm hormone',
                    'Đo mật độ xương'
                ],
                priority: 'medium'
            });
        }
        
        // Chronic condition-based recommendations
        if (profile.chronicConditions?.includes('diabetes')) {
            packages.push({
                id: 'diabetes-monitoring',
                name: this.language === 'vi' ? 'Gói theo dõi tiểu đường' : 'Diabetes Monitoring Package',
                description: this.language === 'vi' 
                    ? 'Theo dõi và quản lý bệnh tiểu đường'
                    : 'Comprehensive diabetes management and monitoring',
                price: 1500000,
                duration: '2 giờ',
                suitableFor: ['Bệnh nhân tiểu đường', 'Tiền tiểu đường'],
                includes: [
                    'Khám nội tiết',
                    'Xét nghiệm HbA1c',
                    'Xét nghiệm glucose',
                    'Khám mắt',
                    'Khám chân tiểu đường'
                ],
                priority: 'high',
                discount: 10
            });
        }
        
        // Basic package for young adults
        if (profile.age < 35) {
            packages.push({
                id: 'basic-young-adult',
                name: this.language === 'vi' ? 'Gói khám cơ bản người trẻ' : 'Basic Young Adult Package',
                description: this.language === 'vi' 
                    ? 'Khám sức khỏe cơ bản cho người trẻ'
                    : 'Basic health screening for young adults',
                price: 1200000,
                duration: '1-2 giờ',
                suitableFor: ['18-35 tuổi', 'Khám sức khỏe định kỳ'],
                includes: [
                    'Khám nội tổng quát',
                    'Xét nghiệm máu cơ bản',
                    'X-quang phổi',
                    'Điện tim'
                ],
                priority: 'medium'
            });
        }
        
        return packages.sort((a, b) => {
            const priorityScore = { high: 3, medium: 2, low: 1 };
            return priorityScore[b.priority] - priorityScore[a.priority];
        });
    }
    
    // Generate follow-up reminders based on medical history
    generateFollowUpReminders(profile: PatientProfile, lastVisit?: Date): FollowUpReminder[] {
        const reminders: FollowUpReminder[] = [];
        const now = new Date();
        
        // General checkup reminder
        if (lastVisit) {
            const monthsSinceLastVisit = this.getMonthsDifference(lastVisit, now);
            
            if (monthsSinceLastVisit >= 12) {
                reminders.push({
                    type: 'checkup',
                    title: this.language === 'vi' ? 'Khám sức khỏe định kỳ' : 'Annual Health Checkup',
                    description: this.language === 'vi' 
                        ? 'Đã hơn 1 năm kể từ lần khám cuối. Nên khám sức khỏe định kỳ.'
                        : 'It\'s been over a year since your last visit. Time for annual checkup.',
                    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
                    urgency: 'medium'
                });
            }
        }
        
        // Chronic condition reminders
        if (profile.chronicConditions) {
            for (const condition of profile.chronicConditions) {
                switch (condition.toLowerCase()) {
                    case 'diabetes':
                        reminders.push({
                            type: 'checkup',
                            title: this.language === 'vi' ? 'Tái khám tiểu đường' : 'Diabetes Follow-up',
                            description: this.language === 'vi' 
                                ? 'Cần tái khám và kiểm tra HbA1c định kỳ'
                                : 'Regular diabetes checkup and HbA1c monitoring needed',
                            dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 3 months
                            urgency: 'high',
                            specialty: 'Nội tiết'
                        });
                        break;
                        
                    case 'hypertension':
                        reminders.push({
                            type: 'checkup',
                            title: this.language === 'vi' ? 'Kiểm tra huyết áp' : 'Blood Pressure Check',
                            description: this.language === 'vi' 
                                ? 'Theo dõi huyết áp và điều chỉnh thuốc nếu cần'
                                : 'Monitor blood pressure and adjust medication if needed',
                            dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 2 months
                            urgency: 'medium',
                            specialty: 'Tim mạch'
                        });
                        break;
                }
            }
        }
        
        // Age-based screening reminders
        if (profile.age >= 50) {
            reminders.push({
                type: 'test',
                title: this.language === 'vi' ? 'Tầm soát ung thư đại tràng' : 'Colorectal Cancer Screening',
                description: this.language === 'vi' 
                    ? 'Nên tầm soát ung thư đại tràng định kỳ từ 50 tuổi'
                    : 'Regular colorectal cancer screening recommended from age 50',
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month
                urgency: 'medium'
            });
        }
        
        if (profile.gender === 'female' && profile.age >= 40) {
            reminders.push({
                type: 'test',
                title: this.language === 'vi' ? 'Chụp X-quang vú' : 'Mammography',
                description: this.language === 'vi' 
                    ? 'Tầm soát ung thư vú định kỳ cho phụ nữ trên 40'
                    : 'Regular breast cancer screening for women over 40',
                dueDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
                urgency: 'medium'
            });
        }
        
        return reminders.sort((a, b) => {
            const urgencyScore = { high: 3, medium: 2, low: 1 };
            if (urgencyScore[a.urgency] !== urgencyScore[b.urgency]) {
                return urgencyScore[b.urgency] - urgencyScore[a.urgency];
            }
            return a.dueDate.getTime() - b.dueDate.getTime();
        });
    }
    
    // Private helper methods
    private getCrowdPatterns(specialty: string, dayOfWeek: number): Record<string, number> {
        // Crowd multipliers for different times (1.0 = normal, >1.0 = more crowded)
        const basePattern = {
            '08:00': 0.7, '08:30': 0.8, '09:00': 1.2, '09:30': 1.3,
            '10:00': 1.4, '10:30': 1.3, '11:00': 1.1, '11:30': 0.9,
            '14:00': 1.2, '14:30': 1.0, '15:00': 0.8, '15:30': 0.7,
            '16:00': 0.6, '16:30': 0.5
        };
        
        // Adjust for day of week
        const dayMultiplier = dayOfWeek === 1 ? 1.3 : dayOfWeek === 5 ? 1.2 : 1.0;
        
        const adjustedPattern: Record<string, number> = {};
        for (const [time, multiplier] of Object.entries(basePattern)) {
            adjustedPattern[time] = multiplier * dayMultiplier;
        }
        
        return adjustedPattern;
    }
    
    private calculateCrowdLevel(time: string, patterns: Record<string, number>, isWeekend: boolean): 'low' | 'medium' | 'high' {
        const multiplier = patterns[time] || 1.0;
        const adjustedMultiplier = isWeekend ? multiplier * 0.6 : multiplier;
        
        if (adjustedMultiplier < 0.8) return 'low';
        if (adjustedMultiplier < 1.2) return 'medium';
        return 'high';
    }
    
    private estimateWaitTime(crowdLevel: 'low' | 'medium' | 'high', specialty: string): string {
        const baseWaitTimes = {
            'Cấp cứu': { low: 5, medium: 10, high: 20 },
            'Tim mạch': { low: 15, medium: 30, high: 45 },
            'Thần kinh': { low: 20, medium: 35, high: 50 },
            default: { low: 15, medium: 25, high: 40 }
        };
        
        const waitTimes = baseWaitTimes[specialty] || baseWaitTimes.default;
        return `${waitTimes[crowdLevel]} phút`;
    }
    
    private calculateAvailability(time: string, specialty: string, dayOfWeek: number): number {
        // Simulate availability based on time and specialty
        const hour = parseInt(time.split(':')[0]);
        let availability = 100;
        
        // Reduce availability during peak hours
        if (hour >= 9 && hour <= 11) availability -= 30;
        if (hour >= 14 && hour <= 15) availability -= 20;
        
        // Weekend adjustment
        if (dayOfWeek === 0 || dayOfWeek === 6) availability -= 40;
        
        return Math.max(availability, 20);
    }
    
    private getRecommendationReason(crowdLevel: 'low' | 'medium' | 'high', time: string, language: 'vi' | 'en'): string {
        const reasons = {
            vi: {
                low: `Thời gian ít đông đúc, chờ ít`,
                medium: `Thời gian bình thường`,
                high: `Thời gian đông đúc, có thể chờ lâu`
            },
            en: {
                low: `Less crowded time, shorter wait`,
                medium: `Normal busy time`,
                high: `Peak time, longer wait expected`
            }
        };
        
        return reasons[language][crowdLevel];
    }
    
    private getMonthsDifference(date1: Date, date2: Date): number {
        const months = (date2.getFullYear() - date1.getFullYear()) * 12;
        return months - date1.getMonth() + date2.getMonth();
    }
}
