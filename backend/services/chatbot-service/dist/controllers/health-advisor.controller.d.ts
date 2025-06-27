import { Request, Response } from 'express';
export declare class HealthAdvisorController {
    private healthAdvisorService;
    constructor();
    /**
     * POST /api/health/analyze-symptoms
     * Phân tích triệu chứng và đưa ra khuyến nghị
     */
    analyzeSymptoms(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/health/specialties
     * Lấy danh sách chuyên khoa có sẵn
     */
    getAvailableSpecialties(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/health/post-treatment-advice
     * Lấy lời khuyên chăm sóc sau điều trị
     */
    getPostTreatmentAdvice(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/health/quick-consultation
     * Tư vấn nhanh dựa trên triệu chứng đơn giản
     */
    quickConsultation(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/health/emergency-symptoms
     * Lấy danh sách triệu chứng cần cấp cứu
     */
    getEmergencySymptoms(req: Request, res: Response): Promise<void>;
    /**
     * Tạo response cho chatbot dễ hiểu
     */
    private generateChatbotResponse;
    /**
     * POST /api/health/chat
     * Chat với Gemini AI - endpoint chính cho chatbot
     */
    chatWithAI(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/health/test
     * Test endpoint để kiểm tra service
     */
    testHealthService(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=health-advisor.controller.d.ts.map