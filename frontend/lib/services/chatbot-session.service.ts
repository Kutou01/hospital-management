import { createClient } from '@supabase/supabase-js';

/**
 * Chatbot Session Service
 * Manages session persistence for chatbot conversations and booking flow
 */

interface ChatSession {
  session_id: string;
  user_id: string;
  chat_mode: 'menu' | 'consultation' | 'booking';
  booking_data?: BookingData;
  conversation_history?: ChatMessage[];
  created_at: string;
  updated_at: string;
  expires_at: string;
  status: 'active' | 'completed' | 'expired';
}

interface BookingData {
  // Step 1: Patient Info + Symptoms
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  symptoms?: string;
  
  // Step 2: AI Analysis + Specialty Selection
  recommendedSpecialties?: any[];
  selectedSpecialty?: string;
  selectedSpecialtyCode?: string;
  
  // Step 3: Doctor + Time Selection
  doctors?: any[];
  selectedDoctor?: any;
  selectedDate?: string;
  selectedTime?: string;
  availableSlots?: any[];
  
  // Step 4: Payment + Confirmation
  bookingSummary?: any;
  paymentUrl?: string;
  appointmentId?: string;
  
  // Flow control
  step?: string;
  currentSubStep?: string;
}

interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system' | 'emergency';
  content: string;
  timestamp: Date;
  options?: any[];
  metadata?: any;
}

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class ChatbotSessionService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  /**
   * Create a new chat session
   */
  static async createSession(userId: string, chatMode: string = 'menu'): Promise<string> {
    try {
      const sessionId = `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();

      const { error } = await supabase
        .from('chat_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          chat_mode: chatMode,
          booking_data: {},
          conversation_history: [],
          expires_at: expiresAt,
          status: 'active'
        });

      if (error) {
        console.error('Failed to create chat session:', error);
        // Fallback to localStorage
        localStorage.setItem('chatSessionId', sessionId);
        return sessionId;
      }

      localStorage.setItem('chatSessionId', sessionId);
      localStorage.setItem('chatUserId', userId);
      
      return sessionId;
    } catch (error) {
      console.error('Create session error:', error);
      // Fallback to localStorage
      const sessionId = `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem('chatSessionId', sessionId);
      return sessionId;
    }
  }

  /**
   * Get existing session or create new one
   */
  static async getOrCreateSession(): Promise<{ sessionId: string; userId: string }> {
    let sessionId = localStorage.getItem('chatSessionId');
    let userId = localStorage.getItem('chatUserId') || `USER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    if (sessionId) {
      // Check if session is still valid
      const isValid = await this.isSessionValid(sessionId);
      if (isValid) {
        return { sessionId, userId };
      }
    }

    // Create new session
    sessionId = await this.createSession(userId);
    return { sessionId, userId };
  }

  /**
   * Check if session is still valid
   */
  static async isSessionValid(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('expires_at, status')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        return false;
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      return data.status === 'active' && expiresAt > now;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Save booking data to session
   */
  static async saveBookingData(sessionId: string, bookingData: BookingData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          booking_data: bookingData,
          chat_mode: 'booking',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to save booking data:', error);
        // Fallback to localStorage
        localStorage.setItem(`bookingData_${sessionId}`, JSON.stringify(bookingData));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Save booking data error:', error);
      // Fallback to localStorage
      localStorage.setItem(`bookingData_${sessionId}`, JSON.stringify(bookingData));
      return false;
    }
  }

  /**
   * Load booking data from session
   */
  static async loadBookingData(sessionId: string): Promise<BookingData | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('booking_data')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        // Fallback to localStorage
        const localData = localStorage.getItem(`bookingData_${sessionId}`);
        return localData ? JSON.parse(localData) : null;
      }

      return data.booking_data || null;
    } catch (error) {
      console.error('Load booking data error:', error);
      // Fallback to localStorage
      const localData = localStorage.getItem(`bookingData_${sessionId}`);
      return localData ? JSON.parse(localData) : null;
    }
  }

  /**
   * Save conversation history
   */
  static async saveConversationHistory(sessionId: string, messages: ChatMessage[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          conversation_history: messages,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to save conversation history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Save conversation history error:', error);
      return false;
    }
  }

  /**
   * Load conversation history
   */
  static async loadConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('conversation_history')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        return [];
      }

      return data.conversation_history || [];
    } catch (error) {
      console.error('Load conversation history error:', error);
      return [];
    }
  }

  /**
   * Complete session (mark as completed)
   */
  static async completeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to complete session:', error);
        return false;
      }

      // Clear localStorage
      localStorage.removeItem('chatSessionId');
      localStorage.removeItem(`bookingData_${sessionId}`);

      return true;
    } catch (error) {
      console.error('Complete session error:', error);
      return false;
    }
  }

  /**
   * Cleanup expired sessions (should be called periodically)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('session_id');

      if (error) {
        console.error('Failed to cleanup expired sessions:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    active: number;
    completed: number;
    expired: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (error || !data) {
        return { active: 0, completed: 0, expired: 0 };
      }

      const stats = data.reduce((acc, session) => {
        acc[session.status as keyof typeof acc]++;
        return acc;
      }, { active: 0, completed: 0, expired: 0 });

      return stats;
    } catch (error) {
      console.error('Get session stats error:', error);
      return { active: 0, completed: 0, expired: 0 };
    }
  }
}
