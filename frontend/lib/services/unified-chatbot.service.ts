/**
 * Unified Chatbot Service
 * Consolidates all chatbot functionality into a single, optimized service
 * Replaces fragmented architecture with streamlined approach
 */

import { vietnameseNLPService } from './enhanced-vietnamese-nlp.service';
import { payOSService } from './enhanced-payos.service';
import { errorHandler } from './error-handling.service';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Interfaces
export interface ChatMessage {
  message: string;
  sessionId?: string;
  userId?: string;
  conversationHistory?: any[];
  metadata?: any;
}

export interface ChatResponse {
  success: boolean;
  data: {
    ai_response: string;
    response_source: string;
    intent?: string;
    confidence?: number;
    emergency?: boolean;
    emergency_level?: string;
    next_step?: string;
    booking_data?: any;
    payment_url?: string;
    appointment_id?: string;
  };
  error?: string;
}

export interface BookingSession {
  session_id: string;
  step: 'symptoms' | 'doctor_selection' | 'time_selection' | 'patient_info' | 'confirmation' | 'payment';
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  symptoms?: string;
  selected_specialty?: string;
  selected_doctor?: any;
  selected_date?: string;
  selected_time?: string;
  appointment_id?: string;
  created_at: string;
  updated_at: string;
}

export class UnifiedChatbotService {
  private static instance: UnifiedChatbotService;
  private sessionCache = new Map<string, BookingSession>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  public static getInstance(): UnifiedChatbotService {
    if (!UnifiedChatbotService.instance) {
      UnifiedChatbotService.instance = new UnifiedChatbotService();
    }
    return UnifiedChatbotService.instance;
  }

  /**
   * Main chat processing method
   */
  public async processMessage(request: ChatMessage): Promise<ChatResponse> {
    console.log('🤖 [Unified Chatbot] Processing message:', request.message);

    try {
      // Step 1: Analyze message with Vietnamese NLP
      const analysis = vietnameseNLPService.analyzeMedicalText(request.message);
      
      console.log('📊 [Unified Chatbot] NLP Analysis:', {
        symptoms: analysis.detectedSymptoms,
        emergency: analysis.isEmergency,
        specialty: analysis.recommendedSpecialty
      });

      // Step 2: Handle emergency cases immediately
      if (analysis.isEmergency && analysis.emergencyMessage) {
        return {
          success: true,
          data: {
            ai_response: analysis.emergencyMessage,
            response_source: 'emergency_detection',
            emergency: true,
            emergency_level: analysis.emergencyLevel,
            intent: 'emergency',
            confidence: 0.95
          }
        };
      }

      // Step 3: Determine intent and route to appropriate handler
      const intent = this.determineIntent(request.message, analysis);
      
      switch (intent) {
        case 'book_appointment':
          return await this.handleBookingFlow(request, analysis);
        
        case 'symptom_consultation':
          return await this.handleSymptomConsultation(request, analysis);
        
        case 'general_inquiry':
          return await this.handleGeneralInquiry(request, analysis);
        
        default:
          return await this.handleUnknownIntent(request);
      }

    } catch (error) {
      console.error('❌ [Unified Chatbot] Processing error:', error);
      
      const chatbotError = errorHandler.createError(
        'CHATBOT_PROCESSING_FAILED',
        'Failed to process chat message',
        error
      );

      return {
        success: false,
        data: {
          ai_response: chatbotError.userMessage,
          response_source: 'error_handler'
        },
        error: chatbotError.message
      };
    }
  }

  /**
   * Determine user intent from message and NLP analysis
   */
  private determineIntent(message: string, analysis: any): string {
    const messageLower = message.toLowerCase();
    
    // Booking keywords
    const bookingKeywords = ['đặt lịch', 'book', 'hẹn khám', 'khám bệnh', 'đăng ký khám'];
    if (bookingKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'book_appointment';
    }

    // Symptom consultation (has symptoms but no booking intent)
    if (analysis.detectedSymptoms.length > 0) {
      return 'symptom_consultation';
    }

    // General inquiry
    const generalKeywords = ['thông tin', 'giờ làm việc', 'địa chỉ', 'liên hệ', 'bác sĩ'];
    if (generalKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'general_inquiry';
    }

    return 'unknown';
  }

  /**
   * Handle booking flow
   */
  private async handleBookingFlow(request: ChatMessage, analysis: any): Promise<ChatResponse> {
    console.log('📅 [Unified Chatbot] Handling booking flow');

    try {
      // Get or create booking session
      const sessionId = request.sessionId || `session-${Date.now()}`;
      let session = this.getSession(sessionId);

      if (!session) {
        session = this.createSession(sessionId);
      }

      // Update session with symptoms if detected
      if (analysis.detectedSymptoms.length > 0) {
        session.symptoms = request.message;
        session.selected_specialty = analysis.recommendedSpecialty;
      }

      // Determine next step in booking flow
      const nextStep = this.determineBookingStep(session, request.message);
      
      switch (nextStep) {
        case 'doctor_selection':
          return await this.handleDoctorSelection(session, analysis);
        
        case 'time_selection':
          return await this.handleTimeSelection(session);
        
        case 'patient_info':
          return await this.handlePatientInfo(session, request.message);
        
        case 'confirmation':
          return await this.handleBookingConfirmation(session);
        
        default:
          return await this.handleSymptomCollection(session);
      }

    } catch (error) {
      console.error('❌ [Unified Chatbot] Booking flow error:', error);
      
      return {
        success: false,
        data: {
          ai_response: 'Xin lỗi, có lỗi trong quá trình đặt lịch. Vui lòng thử lại.',
          response_source: 'booking_error'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle symptom consultation (without booking)
   */
  private async handleSymptomConsultation(request: ChatMessage, analysis: any): Promise<ChatResponse> {
    console.log('🩺 [Unified Chatbot] Handling symptom consultation');

    const response = `Dựa trên triệu chứng bạn mô tả, tôi khuyên bạn nên khám chuyên khoa ${analysis.recommendedSpecialty}. 

Các triệu chứng được phát hiện: ${analysis.detectedSymptoms.join(', ')}

Bạn có muốn đặt lịch khám với bác sĩ chuyên khoa này không?`;

    return {
      success: true,
      data: {
        ai_response: response,
        response_source: 'symptom_consultation',
        intent: 'symptom_consultation',
        confidence: analysis.confidence,
        next_step: 'ask_booking_intent'
      }
    };
  }

  /**
   * Handle general inquiries
   */
  private async handleGeneralInquiry(request: ChatMessage, analysis: any): Promise<ChatResponse> {
    console.log('ℹ️ [Unified Chatbot] Handling general inquiry');

    const response = `Xin chào! Tôi là AI hỗ trợ của bệnh viện. Tôi có thể giúp bạn:

• Đặt lịch khám bệnh
• Tư vấn về triệu chứng
• Thông tin về các chuyên khoa
• Hướng dẫn thanh toán

Bạn cần hỗ trợ gì ạ?`;

    return {
      success: true,
      data: {
        ai_response: response,
        response_source: 'general_inquiry',
        intent: 'general_inquiry',
        confidence: 0.8
      }
    };
  }

  /**
   * Handle unknown intents
   */
  private async handleUnknownIntent(request: ChatMessage): Promise<ChatResponse> {
    console.log('❓ [Unified Chatbot] Handling unknown intent');

    const response = `Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn. 

Tôi có thể hỗ trợ bạn:
• Đặt lịch khám bệnh
• Tư vấn về triệu chứng sức khỏe
• Thông tin về bệnh viện

Vui lòng mô tả rõ hơn về vấn đề bạn cần hỗ trợ.`;

    return {
      success: true,
      data: {
        ai_response: response,
        response_source: 'unknown_intent',
        intent: 'clarification_needed',
        confidence: 0.3
      }
    };
  }

  /**
   * Session management methods
   */
  private getSession(sessionId: string): BookingSession | null {
    const session = this.sessionCache.get(sessionId);
    if (session && Date.now() - new Date(session.updated_at).getTime() < this.cacheTimeout) {
      return session;
    }
    return null;
  }

  private createSession(sessionId: string): BookingSession {
    const session: BookingSession = {
      session_id: sessionId,
      step: 'symptoms',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.sessionCache.set(sessionId, session);
    return session;
  }

  private updateSession(session: BookingSession): void {
    session.updated_at = new Date().toISOString();
    this.sessionCache.set(session.session_id, session);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessionCache.entries()) {
      if (now - new Date(session.updated_at).getTime() > this.cacheTimeout) {
        this.sessionCache.delete(sessionId);
      }
    }
    console.log('🧹 [Unified Chatbot] Cleaned up expired sessions');
  }

  /**
   * Placeholder methods for booking flow steps
   */
  private determineBookingStep(session: BookingSession, message: string): string {
    // Implementation would determine the next step based on session state
    return 'doctor_selection';
  }

  private async handleDoctorSelection(session: BookingSession, analysis: any): Promise<ChatResponse> {
    // Implementation would handle doctor selection
    return {
      success: true,
      data: {
        ai_response: 'Đang tìm bác sĩ phù hợp...',
        response_source: 'doctor_selection'
      }
    };
  }

  private async handleTimeSelection(session: BookingSession): Promise<ChatResponse> {
    // Implementation would handle time slot selection
    return {
      success: true,
      data: {
        ai_response: 'Vui lòng chọn thời gian khám...',
        response_source: 'time_selection'
      }
    };
  }

  private async handlePatientInfo(session: BookingSession, message: string): Promise<ChatResponse> {
    // Implementation would handle patient information collection
    return {
      success: true,
      data: {
        ai_response: 'Vui lòng cung cấp thông tin cá nhân...',
        response_source: 'patient_info'
      }
    };
  }

  private async handleBookingConfirmation(session: BookingSession): Promise<ChatResponse> {
    // Implementation would handle booking confirmation
    return {
      success: true,
      data: {
        ai_response: 'Xác nhận đặt lịch...',
        response_source: 'booking_confirmation'
      }
    };
  }

  private async handleSymptomCollection(session: BookingSession): Promise<ChatResponse> {
    // Implementation would handle symptom collection
    return {
      success: true,
      data: {
        ai_response: 'Vui lòng mô tả triệu chứng của bạn...',
        response_source: 'symptom_collection'
      }
    };
  }
}

// Export singleton instance
export const unifiedChatbot = UnifiedChatbotService.getInstance();
