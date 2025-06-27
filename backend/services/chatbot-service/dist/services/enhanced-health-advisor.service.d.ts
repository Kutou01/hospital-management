interface EnhancedSymptom {
    symptom_id: string;
    name_vi: string;
    name_en?: string;
    description: string;
    severity_level: number;
    category: string;
    keywords: string[];
}
interface Disease {
    disease_id: string;
    name_vi: string;
    name_en?: string;
    description: string;
    specialty: string;
    severity_level: number;
    common_symptoms: string[];
    risk_factors: string[];
    treatment_approach: string;
    prevention_tips: string[];
    when_to_see_doctor: string;
    emergency_signs: string[];
}
interface HealthcareFacility {
    facility_id: string;
    name_vi: string;
    type: string;
    address: string;
    city: string;
    phone: string;
    specialties: string[];
    services: string[];
    rating: number;
    emergency_service: boolean;
}
interface Doctor {
    doctor_id: string;
    full_name: string;
    title: string;
    specialty: string;
    sub_specialty?: string;
    facility_id: string;
    experience_years: number;
    consultation_fee: number;
    rating: number;
    bio: string;
}
interface TriageResult {
    urgency_level: number;
    urgency_label: string;
    time_to_see_doctor: number;
    recommended_action: string;
    warning_signs: string[];
    triage_score: number;
}
interface ComprehensiveHealthResponse {
    symptoms_detected: EnhancedSymptom[];
    diseases_suggested: Disease[];
    triage_result: TriageResult;
    recommended_specialty: string;
    recommended_doctors: Doctor[];
    recommended_facilities: HealthcareFacility[];
    intelligent_answer: string;
    follow_up_questions: string[];
    context_aware_suggestions: string[];
    medication_info?: any;
    prevention_tips: string[];
    lifestyle_recommendations: string[];
    confidence_score: number;
    urgency_level: string;
    should_see_doctor: boolean;
    estimated_wait_time?: number;
}
export declare class EnhancedHealthAdvisorService {
    private supabase;
    private genAI;
    private model;
    constructor();
    /**
     * Main method for comprehensive health consultation
     */
    getComprehensiveHealthAdvice(userInput: string, userId?: string, sessionId?: string): Promise<ComprehensiveHealthResponse>;
    /**
     * Enhanced symptom detection using multiple data sources
     */
    private detectSymptoms;
    /**
     * Advanced triage system using multiple scoring methods
     */
    private performAdvancedTriage;
    /**
     * Search intelligent QA database for relevant responses
     */
    private searchIntelligentQA;
    /**
     * Classify user intent using pattern matching
     */
    private classifyIntent;
    private isHealthRelatedQuestion;
    private getOutOfScopeResponse;
    private getConversationContext;
    private updateConversationContext;
    private suggestDiseases;
    private findHealthcareProviders;
    private getAdditionalHealthInfo;
    private generateIntelligentResponse;
    private buildGeminiPrompt;
    private getFallbackResponse;
    private calculateSymptomRelevance;
    private calculateTriageScore;
    private calculateOverallConfidence;
    private determineSpecialty;
    private mapIntentToSpecialty;
    private generateFollowUpQuestions;
    private generateContextAwareSuggestions;
}
export {};
//# sourceMappingURL=enhanced-health-advisor.service.d.ts.map