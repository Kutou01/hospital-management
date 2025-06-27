export interface FriendlyResponse {
    empathy: string;
    safety_warning?: string;
    explanation: string;
    advice: string[];
    medical_recommendation: string;
    follow_up_question: string;
    severity: 'normal' | 'high' | 'emergency';
}
export declare class FriendlyFormatter {
    /**
     * Format AI response thành cấu trúc thân thiện
     */
    static formatResponse(aiResponse: string, severity?: 'normal' | 'high' | 'emergency'): string;
    /**
     * Parse AI response thành các phần
     */
    private static parseAndFormat;
    /**
     * Tạo lời đồng cảm phù hợp
     */
    private static generateEmpathy;
    /**
     * Tạo cảnh báo an toàn cho tình huống cấp cứu
     */
    private static generateSafetyWarning;
    /**
     * Trích xuất phần giải thích
     */
    private static extractExplanation;
    /**
     * Trích xuất lời khuyên
     */
    private static extractAdvice;
    /**
     * Trích xuất khuyến nghị y tế
     */
    private static extractMedicalRecommendation;
    /**
     * Tạo câu hỏi theo dõi
     */
    private static generateFollowUpQuestion;
    /**
     * Xây dựng phản hồi thân thiện hoàn chỉnh
     */
    private static buildFriendlyResponse;
    /**
     * Thêm wrapper thân thiện cho response đơn giản
     */
    private static addFriendlyWrapper;
    /**
     * Detect severity từ nội dung
     */
    static detectSeverity(content: string): 'normal' | 'high' | 'emergency';
}
//# sourceMappingURL=friendly-formatter.d.ts.map