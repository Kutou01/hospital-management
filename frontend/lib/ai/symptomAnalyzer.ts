// Symptom Analysis Engine
// Rule-based system for analyzing symptoms and providing recommendations

export interface SymptomAnalysis {
    specialty: string;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    confidence: number;
    suggestedDoctors: string[];
    estimatedWaitTime: string;
    recommendations: string[];
    followUpInstructions: string[];
}

export interface SymptomPattern {
    keywords: string[];
    specialty: string;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    confidence: number;
    relatedSymptoms?: string[];
    redFlags?: string[];
}

// Comprehensive symptom database
const symptomDatabase: Record<string, SymptomPattern[]> = {
    vi: [
        // Cấp cứu - Emergency
        {
            keywords: ['đau ngực dữ dội', 'khó thở nặng', 'bất tỉnh', 'co giật', 'xuất huyết nặng', 'đau bụng dữ dội'],
            specialty: 'Cấp cứu',
            urgency: 'emergency',
            confidence: 0.95,
            redFlags: ['đau ngực', 'khó thở', 'bất tỉnh'],
            recommendations: ['Gọi cấp cứu ngay lập tức', 'Không tự di chuyển', 'Giữ bình tĩnh']
        },
        
        // Tim mạch - Cardiology
        {
            keywords: ['đau ngực', 'hồi hộp', 'khó thở khi gắng sức', 'chóng mặt', 'ngất xỉu', 'phù chân'],
            specialty: 'Tim mạch',
            urgency: 'high',
            confidence: 0.85,
            relatedSymptoms: ['mệt mỏi', 'đau vai trái', 'buồn nôn'],
            recommendations: ['Nghỉ ngơi', 'Tránh gắng sức', 'Theo dõi huyết áp']
        },
        
        // Thần kinh - Neurology
        {
            keywords: ['đau đầu', 'nhức đầu', 'đau nửa đầu', 'chóng mặt', 'tê tay chân', 'yếu liệt'],
            specialty: 'Thần kinh',
            urgency: 'medium',
            confidence: 0.80,
            relatedSymptoms: ['buồn nôn', 'nhạy cảm ánh sáng', 'rối loạn thị giác'],
            recommendations: ['Nghỉ ngơi trong phòng tối', 'Tránh stress', 'Uống đủ nước']
        },
        
        // Tiêu hóa - Gastroenterology
        {
            keywords: ['đau bụng', 'buồn nôn', 'nôn', 'tiêu chảy', 'táo bón', 'ợ hơi', 'đầy bụng'],
            specialty: 'Tiêu hóa',
            urgency: 'medium',
            confidence: 0.75,
            relatedSymptoms: ['sốt nhẹ', 'mất cảm giác ngon miệng', 'khó tiêu'],
            recommendations: ['Ăn nhẹ', 'Uống nhiều nước', 'Tránh thức ăn cay nóng']
        },
        
        // Hô hấp - Pulmonology
        {
            keywords: ['ho', 'khó thở', 'đau họng', 'sốt', 'cảm lạnh', 'nghẹt mũi', 'chảy nước mũi'],
            specialty: 'Hô hấp',
            urgency: 'medium',
            confidence: 0.80,
            relatedSymptoms: ['mệt mỏi', 'đau đầu', 'ớn lạnh'],
            recommendations: ['Nghỉ ngơi', 'Uống nước ấm', 'Giữ ấm cơ thể']
        },
        
        // Da liễu - Dermatology
        {
            keywords: ['phát ban', 'ngứa', 'mụn', 'viêm da', 'nổi mề đay', 'khô da', 'tróc da'],
            specialty: 'Da liễu',
            urgency: 'low',
            confidence: 0.70,
            recommendations: ['Giữ da sạch', 'Tránh gãi', 'Dùng kem dưỡng ẩm']
        },
        
        // Cơ xương khớp - Orthopedics
        {
            keywords: ['đau lưng', 'đau khớp', 'đau cơ', 'cứng khớp', 'sưng khớp', 'khó cử động'],
            specialty: 'Cơ xương khớp',
            urgency: 'low',
            confidence: 0.75,
            recommendations: ['Nghỉ ngơi', 'Chườm nóng/lạnh', 'Tập vật lý trị liệu nhẹ']
        },
        
        // Mắt - Ophthalmology
        {
            keywords: ['đau mắt', 'mờ mắt', 'khô mắt', 'đỏ mắt', 'chảy nước mắt', 'nhìn đôi'],
            specialty: 'Mắt',
            urgency: 'medium',
            confidence: 0.80,
            recommendations: ['Nghỉ mắt', 'Tránh ánh sáng mạnh', 'Không dụi mắt']
        },
        
        // Tai mũi họng - ENT
        {
            keywords: ['đau tai', 'ù tai', 'chảy máu mũi', 'nghẹt mũi', 'đau họng', 'khàn tiếng'],
            specialty: 'Tai mũi họng',
            urgency: 'low',
            confidence: 0.75,
            recommendations: ['Súc miệng nước muối', 'Giữ ấm cổ họng', 'Tránh nói to']
        }
    ],
    
    en: [
        // Emergency
        {
            keywords: ['severe chest pain', 'severe breathing difficulty', 'unconscious', 'seizure', 'heavy bleeding'],
            specialty: 'Emergency',
            urgency: 'emergency',
            confidence: 0.95,
            redFlags: ['chest pain', 'breathing difficulty', 'unconscious'],
            recommendations: ['Call emergency immediately', 'Do not move', 'Stay calm']
        },
        
        // Cardiology
        {
            keywords: ['chest pain', 'palpitations', 'shortness of breath', 'dizziness', 'fainting', 'leg swelling'],
            specialty: 'Cardiology',
            urgency: 'high',
            confidence: 0.85,
            relatedSymptoms: ['fatigue', 'left arm pain', 'nausea'],
            recommendations: ['Rest', 'Avoid exertion', 'Monitor blood pressure']
        },
        
        // Neurology
        {
            keywords: ['headache', 'migraine', 'dizziness', 'numbness', 'weakness', 'paralysis'],
            specialty: 'Neurology',
            urgency: 'medium',
            confidence: 0.80,
            relatedSymptoms: ['nausea', 'light sensitivity', 'vision problems'],
            recommendations: ['Rest in dark room', 'Avoid stress', 'Stay hydrated']
        }
    ]
};

// Doctor database with specialties and availability
const doctorDatabase = {
    vi: {
        'Cấp cứu': [
            { name: 'BS. Nguyễn Cấp Cứu', waitTime: '0 phút', available: true },
            { name: 'BS. Trần Khẩn Cấp', waitTime: '5 phút', available: true }
        ],
        'Tim mạch': [
            { name: 'BS. Lê Tim Mạch', waitTime: '30 phút', available: true },
            { name: 'BS. Phạm Huyết Áp', waitTime: '45 phút', available: true },
            { name: 'BS. Hoàng Nhịp Tim', waitTime: '60 phút', available: false }
        ],
        'Thần kinh': [
            { name: 'BS. Vũ Thần Kinh', waitTime: '25 phút', available: true },
            { name: 'BS. Đặng Đau Đầu', waitTime: '40 phút', available: true }
        ],
        'Tiêu hóa': [
            { name: 'BS. Bùi Tiêu Hóa', waitTime: '20 phút', available: true },
            { name: 'BS. Lý Dạ Dày', waitTime: '35 phút', available: true }
        ],
        'Hô hấp': [
            { name: 'BS. Mai Phổi', waitTime: '15 phút', available: true },
            { name: 'BS. Chu Hô Hấp', waitTime: '30 phút', available: true }
        ],
        'Da liễu': [
            { name: 'BS. Đinh Da Liễu', waitTime: '40 phút', available: true }
        ],
        'Cơ xương khớp': [
            { name: 'BS. Dương Xương Khớp', waitTime: '50 phút', available: true }
        ],
        'Mắt': [
            { name: 'BS. Lâm Nhãn Khoa', waitTime: '35 phút', available: true }
        ],
        'Tai mũi họng': [
            { name: 'BS. Tô TMH', waitTime: '25 phút', available: true }
        ]
    }
};

export class SymptomAnalyzer {
    private language: 'vi' | 'en';
    
    constructor(language: 'vi' | 'en' = 'vi') {
        this.language = language;
    }
    
    analyzeSymptoms(symptoms: string): SymptomAnalysis {
        const normalizedSymptoms = symptoms.toLowerCase().trim();
        const patterns = symptomDatabase[this.language] || symptomDatabase.vi;
        
        let bestMatch: SymptomPattern | null = null;
        let highestScore = 0;
        
        // Find best matching pattern
        for (const pattern of patterns) {
            const score = this.calculateMatchScore(normalizedSymptoms, pattern);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = pattern;
            }
        }
        
        if (!bestMatch || highestScore < 0.3) {
            return this.getDefaultAnalysis();
        }
        
        // Get available doctors for the specialty
        const doctors = this.getAvailableDoctors(bestMatch.specialty);
        const estimatedWaitTime = this.calculateWaitTime(bestMatch.urgency, doctors);
        
        return {
            specialty: bestMatch.specialty,
            urgency: bestMatch.urgency,
            confidence: Math.min(bestMatch.confidence * highestScore, 0.95),
            suggestedDoctors: doctors.slice(0, 3).map(d => d.name),
            estimatedWaitTime,
            recommendations: bestMatch.recommendations || this.getDefaultRecommendations(bestMatch.urgency),
            followUpInstructions: this.getFollowUpInstructions(bestMatch.urgency)
        };
    }
    
    private calculateMatchScore(symptoms: string, pattern: SymptomPattern): number {
        let score = 0;
        let matchCount = 0;
        
        // Check main keywords
        for (const keyword of pattern.keywords) {
            if (symptoms.includes(keyword)) {
                score += 1;
                matchCount++;
            }
        }
        
        // Bonus for related symptoms
        if (pattern.relatedSymptoms) {
            for (const relatedSymptom of pattern.relatedSymptoms) {
                if (symptoms.includes(relatedSymptom)) {
                    score += 0.5;
                }
            }
        }
        
        // High penalty for red flags without emergency classification
        if (pattern.redFlags && pattern.urgency !== 'emergency') {
            for (const redFlag of pattern.redFlags) {
                if (symptoms.includes(redFlag)) {
                    score += 2; // Boost emergency-related patterns
                }
            }
        }
        
        return matchCount > 0 ? score / pattern.keywords.length : 0;
    }
    
    private getAvailableDoctors(specialty: string) {
        const doctors = doctorDatabase.vi[specialty] || [];
        return doctors.filter(d => d.available).sort((a, b) => {
            const timeA = parseInt(a.waitTime);
            const timeB = parseInt(b.waitTime);
            return timeA - timeB;
        });
    }
    
    private calculateWaitTime(urgency: string, doctors: any[]): string {
        if (urgency === 'emergency') return '0 phút';
        if (doctors.length === 0) return 'Không có bác sĩ trực';
        
        const fastestDoctor = doctors[0];
        const baseWaitTime = parseInt(fastestDoctor.waitTime) || 30;
        
        switch (urgency) {
            case 'high': return `${Math.max(baseWaitTime - 10, 5)} phút`;
            case 'medium': return `${baseWaitTime} phút`;
            case 'low': return `${baseWaitTime + 15} phút`;
            default: return `${baseWaitTime} phút`;
        }
    }
    
    private getDefaultRecommendations(urgency: string): string[] {
        const recommendations = {
            vi: {
                emergency: ['Gọi cấp cứu ngay', 'Không tự di chuyển', 'Giữ bình tĩnh'],
                high: ['Đến bệnh viện sớm', 'Nghỉ ngơi', 'Theo dõi triệu chứng'],
                medium: ['Đặt lịch khám trong tuần', 'Nghỉ ngơi đầy đủ', 'Uống đủ nước'],
                low: ['Theo dõi triệu chứng', 'Nghỉ ngơi', 'Có thể tự khám tại nhà']
            }
        };
        
        return recommendations.vi[urgency] || recommendations.vi.medium;
    }
    
    private getFollowUpInstructions(urgency: string): string[] {
        const instructions = {
            vi: {
                emergency: ['Theo dõi sát tại bệnh viện'],
                high: ['Tái khám sau 1-2 ngày', 'Gọi cấp cứu nếu triệu chứng nặng hơn'],
                medium: ['Tái khám sau 3-5 ngày nếu không cải thiện', 'Theo dõi triệu chứng'],
                low: ['Tái khám sau 1 tuần nếu không cải thiện', 'Tự theo dõi tại nhà']
            }
        };
        
        return instructions.vi[urgency] || instructions.vi.medium;
    }
    
    private getDefaultAnalysis(): SymptomAnalysis {
        return {
            specialty: 'Khám tổng quát',
            urgency: 'medium',
            confidence: 0.5,
            suggestedDoctors: ['BS. Tổng quát'],
            estimatedWaitTime: '30 phút',
            recommendations: ['Mô tả rõ hơn triệu chứng', 'Đặt lịch khám tổng quát'],
            followUpInstructions: ['Theo dõi triệu chứng', 'Tái khám nếu cần']
        };
    }
    
    // Get smart scheduling suggestions
    getSmartSchedulingSuggestions(specialty: string): {
        bestTimes: string[];
        avoidTimes: string[];
        estimatedCrowdLevel: Record<string, 'low' | 'medium' | 'high'>;
    } {
        // Based on typical hospital patterns
        return {
            bestTimes: ['8:00-9:00', '14:00-15:00', '16:00-17:00'],
            avoidTimes: ['9:00-11:00', '13:00-14:00'],
            estimatedCrowdLevel: {
                '8:00-9:00': 'low',
                '9:00-11:00': 'high',
                '11:00-12:00': 'medium',
                '13:00-14:00': 'high',
                '14:00-15:00': 'low',
                '15:00-16:00': 'medium',
                '16:00-17:00': 'low'
            }
        };
    }
}
