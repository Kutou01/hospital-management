interface Symptom {
    symptom_id: string;
    name_vi: string;
    name_en?: string;
    description: string;
    severity_level: number;
    category: string;
    keywords: string[];
}
interface HealthConsultationResult {
    symptoms_detected: Symptom[];
    recommended_specialty: string;
    confidence_score: number;
    urgency_level: string;
    reasoning: string;
    preparation_advice: string;
    general_advice: string[];
    should_see_doctor: boolean;
}
export declare class HealthAdvisorService {
    private supabase;
    private genAI;
    private model;
    constructor();
    /**
     * Phân tích triệu chứng từ text người dùng nhập với Enhanced Analysis
     */
    analyzeSymptoms(userInput: string): Promise<HealthConsultationResult>;
    /**
     * Lấy câu hỏi follow-up thông minh
     */
    private getIntelligentFollowup;
    /**
     * Tạo phản hồi theo ngữ cảnh
     */
    private generateContextualResponse;
    /**
     * Xác định loại ngữ cảnh dựa trên pattern
     */
    private determineContextType;
    /**
     * Xây dựng phản hồi chi tiết
     */
    private buildDetailedResponse;
    /**
     * Lưu lịch sử phân tích
     */
    private saveAnalysisHistory;
    /**
     * Tìm pattern phân tích chi tiết từ Enhanced Analysis
     */
    private findEnhancedAnalysisPattern;
    /**
     * Tạo phản hồi chi tiết từ Enhanced Analysis
     */
    private generateEnhancedResponse;
    /**
     * Phát hiện triệu chứng từ text
     */
    private detectSymptomsFromText;
    /**
     * Tìm khuyến nghị chuyên khoa dựa trên triệu chứng
     */
    private findSpecialtyRecommendation;
    /**
     * Lấy lời khuyên chuẩn bị khám bệnh
     */
    private getPreparationAdvice;
    /**
     * Lấy lời khuyên chung dựa trên triệu chứng
     */
    private getGeneralAdviceBySymptoms;
    /**
     * Kiểm tra xem câu hỏi có thuộc lĩnh vực y tế không
     */
    private isHealthRelatedQuestion;
    /**
     * Trả về response cho câu hỏi ngoài lĩnh vực
     */
    private getOutOfScopeResponse;
    /**
     * Lấy lời khuyên sức khỏe chung
     */
    private getGeneralHealthAdvice;
    /**
     * Kiểm tra có cần khám bác sĩ ngay lập tức không
     */
    private shouldSeeDoctorImmediately;
    /**
     * Lấy danh sách chuyên khoa có sẵn
     */
    getAvailableSpecialties(): Promise<string[]>;
    /**
     * Lấy lời khuyên chăm sóc sau điều trị
     */
    getPostTreatmentAdvice(specialty: string): Promise<string[]>;
    /**
     * Phân tích với Gemini AI
     */
    private analyzeWithGemini;
    /**
     * Tạo câu trả lời thông minh với Gemini AI
     */
    private generateIntelligentResponse;
    /**
     * Kiểm tra triệu chứng cấp cứu từ database training data
     */
    private checkEmergencySymptoms;
    /**
     * Chat conversation với Gemini AI - method chính cho chatbot
     */
    chatWithAI(userMessage: string, conversationHistory?: string[]): Promise<string>;
}
export {};
//# sourceMappingURL=health-advisor.service.d.ts.map