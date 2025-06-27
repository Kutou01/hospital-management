import { Request, Response } from 'express';
import { HealthAdvisorService } from '../services/health-advisor.service';
import logger from '../utils/logger';

export class HealthAdvisorController {
  private healthAdvisorService: HealthAdvisorService;

  constructor() {
    this.healthAdvisorService = new HealthAdvisorService();
  }

  /**
   * POST /api/health/analyze-symptoms
   * Phân tích triệu chứng và đưa ra khuyến nghị
   */
  async analyzeSymptoms(req: Request, res: Response): Promise<void> {
    try {
      const { symptoms, user_input } = req.body;

      if (!user_input || typeof user_input !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Vui lòng mô tả triệu chứng của bạn',
          error: 'user_input is required and must be a string'
        });
        return;
      }

      logger.info('Analyzing symptoms for user input:', { user_input });

      const result = await this.healthAdvisorService.analyzeSymptoms(user_input);

      res.json({
        success: true,
        message: 'Phân tích triệu chứng thành công',
        data: {
          consultation_result: result,
          recommendations: {
            specialty: result.recommended_specialty,
            urgency: result.urgency_level,
            should_see_doctor_immediately: result.should_see_doctor
          },
          advice: {
            preparation: result.preparation_advice,
            general: result.general_advice,
            reasoning: result.reasoning
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in analyzeSymptoms:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi phân tích triệu chứng',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/health/specialties
   * Lấy danh sách chuyên khoa có sẵn
   */
  async getAvailableSpecialties(req: Request, res: Response): Promise<void> {
    try {
      const specialties = await this.healthAdvisorService.getAvailableSpecialties();

      res.json({
        success: true,
        message: 'Lấy danh sách chuyên khoa thành công',
        data: {
          specialties,
          total: specialties.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in getAvailableSpecialties:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách chuyên khoa',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/health/post-treatment-advice
   * Lấy lời khuyên chăm sóc sau điều trị
   */
  async getPostTreatmentAdvice(req: Request, res: Response): Promise<void> {
    try {
      const { specialty } = req.body;

      if (!specialty || typeof specialty !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp thông tin chuyên khoa',
          error: 'specialty is required and must be a string'
        });
        return;
      }

      const advice = await this.healthAdvisorService.getPostTreatmentAdvice(specialty);

      res.json({
        success: true,
        message: 'Lấy lời khuyên chăm sóc sau điều trị thành công',
        data: {
          specialty,
          advice,
          total_advice: advice.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in getPostTreatmentAdvice:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy lời khuyên chăm sóc',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/health/quick-consultation
   * Tư vấn nhanh dựa trên triệu chứng đơn giản
   */
  async quickConsultation(req: Request, res: Response): Promise<void> {
    try {
      const { symptoms_text, age, gender } = req.body;

      if (!symptoms_text) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng mô tả triệu chứng',
          error: 'symptoms_text is required'
        });
        return;
      }

      // Phân tích triệu chứng
      const analysis = await this.healthAdvisorService.analyzeSymptoms(symptoms_text);

      // Tạo response đơn giản cho chatbot
      const response = this.generateChatbotResponse(analysis);

      res.json({
        success: true,
        message: 'Tư vấn nhanh thành công',
        data: {
          chatbot_response: response,
          detailed_analysis: analysis,
          user_info: { age, gender }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in quickConsultation:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tư vấn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/health/emergency-symptoms
   * Lấy danh sách triệu chứng cần cấp cứu
   */
  async getEmergencySymptoms(req: Request, res: Response): Promise<void> {
    try {
      const emergencySymptoms = [
        {
          symptom: 'Đau ngực dữ dội',
          description: 'Đau ngực như bị đè nặng, lan ra tay trái, cổ, hàm',
          action: 'Gọi cấp cứu 115 ngay lập tức'
        },
        {
          symptom: 'Khó thở nghiêm trọng',
          description: 'Không thể nói được câu hoàn chỉnh, môi tím',
          action: 'Đến cấp cứu ngay lập tức'
        },
        {
          symptom: 'Đột quỵ',
          description: 'Méo miệng, yếu liệt một bên, nói khó, đau đầu dữ dội',
          action: 'Gọi cấp cứu 115 ngay'
        },
        {
          symptom: 'Sốt cao trên 39°C',
          description: 'Sốt cao kèm co giật, mê sảng',
          action: 'Đến bệnh viện ngay'
        },
        {
          symptom: 'Chảy máu không cầm được',
          description: 'Chảy máu nhiều, không thể cầm máu',
          action: 'Ép cầm máu và đến cấp cứu'
        }
      ];

      res.json({
        success: true,
        message: 'Danh sách triệu chứng cấp cứu',
        data: {
          emergency_symptoms: emergencySymptoms,
          emergency_hotline: '115',
          note: 'Khi gặp các triệu chứng này, hãy tìm kiếm sự trợ giúp y tế ngay lập tức'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in getEmergencySymptoms:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Tạo response cho chatbot dễ hiểu
   */
  private generateChatbotResponse(analysis: any): string {
    // Nếu là câu hỏi ngoài lĩnh vực, chỉ trả về reasoning
    if (analysis.recommended_specialty === '' && analysis.confidence_score === 0) {
      return analysis.reasoning;
    }

    let response = '';

    if (analysis.symptoms_detected.length > 0) {
      response += `Dựa trên triệu chứng bạn mô tả, tôi nhận thấy: ${analysis.symptoms_detected.map((s: any) => s.name_vi).join(', ')}.\n\n`;
    }

    response += `${analysis.reasoning}\n\n`;

    if (analysis.should_see_doctor) {
      response += `⚠️ **Khuyến nghị**: Bạn nên đến khám bác sĩ chuyên khoa **${analysis.recommended_specialty}** sớm nhất có thể.\n\n`;
    } else {
      response += `💡 **Khuyến nghị**: Bạn có thể đặt lịch khám chuyên khoa **${analysis.recommended_specialty}** để được tư vấn chi tiết.\n\n`;
    }

    response += `📋 **Chuẩn bị khám bệnh**: ${analysis.preparation_advice}\n\n`;

    if (analysis.general_advice.length > 0) {
      response += `🏥 **Lời khuyên chung**:\n`;
      analysis.general_advice.forEach((advice: string, index: number) => {
        response += `${index + 1}. ${advice}\n`;
      });
    }

    return response;
  }

  /**
   * POST /api/health/chat
   * Chat với Gemini AI - endpoint chính cho chatbot
   */
  async chatWithAI(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversation_history } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tin nhắn',
          error: 'message is required and must be a string'
        });
        return;
      }

      logger.info('Processing chat message:', { message });

      const response = await this.healthAdvisorService.chatWithAI(message, conversation_history);

      res.json({
        success: true,
        message: 'Chat thành công',
        data: {
          user_message: message,
          ai_response: response,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in chatWithAI:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xử lý tin nhắn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/health/test
   * Test endpoint để kiểm tra service
   */
  async testHealthService(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        message: 'Health Advisor Service đang hoạt động bình thường',
        data: {
          service: 'Health Advisor Service',
          version: '1.0.0',
          features: [
            'Phân tích triệu chứng',
            'Khuyến nghị chuyên khoa',
            'Lời khuyên chuẩn bị khám bệnh',
            'Chăm sóc sau điều trị',
            'Tư vấn cấp cứu',
            'Chat với Gemini AI'
          ]
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in testHealthService:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
