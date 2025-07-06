/**
 * Intelligent Session Service
 * Quản lý phiên thông minh với auto-extension và recovery
 */

interface IntelligentSession {
  session_id: string;
  user_id: string;
  status: 'active' | 'idle' | 'expired' | 'completed' | 'abandoned' | 'recovered';
  created_at: string;
  expires_at: string;
  current_step: string;
  conversation_context: Record<string, any>;
  emergency_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  session_token?: string;
}

interface SessionActivity {
  session_id: string;
  activity_type: 'message_sent' | 'message_received' | 'typing_start' | 'typing_stop' | 
                 'focus_gained' | 'focus_lost' | 'heartbeat' | 'booking_step' | 'emergency_detected';
  metadata?: Record<string, any>;
}

interface SessionAnalytics {
  session_id: string;
  status: string;
  duration_minutes: number;
  activity_score: number;
  idle_minutes: number;
  metrics: Record<string, any>;
  activity_distribution: Record<string, number>;
  emergency_level: string;
  conversation_progress: Record<string, any>;
}

export class IntelligentSessionService {
  private static readonly API_BASE = '/api/intelligent-sessions';
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private static readonly ACTIVITY_BUFFER_SIZE = 10;
  
  private static currentSession: IntelligentSession | null = null;
  private static heartbeatTimer: NodeJS.Timeout | null = null;
  private static activityBuffer: SessionActivity[] = [];
  private static isTyping = false;
  private static lastActivity = Date.now();

  /**
   * Tạo session mới với intelligent features
   */
  static async createSession(userId: string, sessionType: string = 'consultation'): Promise<IntelligentSession> {
    try {
      const response = await fetch(`${this.API_BASE}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          session_type: sessionType,
          metadata: {
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const session = await response.json();
      this.currentSession = session;
      
      // Start intelligent monitoring
      this.startIntelligentMonitoring();
      
      console.log('✅ Intelligent session created:', session.session_id);
      return session;

    } catch (error) {
      console.error('❌ Failed to create intelligent session:', error);
      throw error;
    }
  }

  /**
   * Lấy session hiện tại hoặc khôi phục
   */
  static async getOrRecoverSession(userId: string): Promise<IntelligentSession | null> {
    try {
      // Try to recover session first
      const recovered = await this.recoverSession(userId);
      if (recovered) {
        this.currentSession = recovered;
        this.startIntelligentMonitoring();
        return recovered;
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get or recover session:', error);
      return null;
    }
  }

  /**
   * Khôi phục session cho user
   */
  static async recoverSession(userId: string): Promise<IntelligentSession | null> {
    try {
      const response = await fetch(`${this.API_BASE}/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      if (response.status === 404) {
        return null; // No recoverable session
      }

      if (!response.ok) {
        throw new Error(`Failed to recover session: ${response.statusText}`);
      }

      const session = await response.json();
      console.log('🔄 Session recovered:', session.session_id);
      return session;

    } catch (error) {
      console.error('❌ Failed to recover session:', error);
      return null;
    }
  }

  /**
   * Ghi lại hoạt động người dùng
   */
  static async recordActivity(activityType: SessionActivity['activity_type'], metadata?: Record<string, any>) {
    if (!this.currentSession) return;

    const activity: SessionActivity = {
      session_id: this.currentSession.session_id,
      activity_type: activityType,
      metadata
    };

    // Buffer activities to reduce API calls
    this.activityBuffer.push(activity);
    this.lastActivity = Date.now();

    // Send buffered activities if buffer is full
    if (this.activityBuffer.length >= this.ACTIVITY_BUFFER_SIZE) {
      await this.flushActivityBuffer();
    }
  }

  /**
   * Flush activity buffer
   */
  private static async flushActivityBuffer() {
    if (this.activityBuffer.length === 0) return;

    try {
      const activities = [...this.activityBuffer];
      this.activityBuffer = [];

      // Send all buffered activities
      for (const activity of activities) {
        await fetch(`${this.API_BASE}/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activity)
        });
      }

    } catch (error) {
      console.error('❌ Failed to flush activity buffer:', error);
      // Re-add failed activities to buffer
      this.activityBuffer.unshift(...this.activityBuffer);
    }
  }

  /**
   * Bắt đầu intelligent monitoring
   */
  private static startIntelligentMonitoring() {
    // Stop existing monitoring
    this.stopIntelligentMonitoring();

    // Start heartbeat
    this.heartbeatTimer = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    // Monitor user interactions
    this.setupActivityListeners();

    console.log('🧠 Intelligent monitoring started');
  }

  /**
   * Dừng intelligent monitoring
   */
  private static stopIntelligentMonitoring() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.removeActivityListeners();
    console.log('🛑 Intelligent monitoring stopped');
  }

  /**
   * Gửi heartbeat
   */
  private static async sendHeartbeat() {
    if (!this.currentSession) return;

    // Check if user is idle
    const idleTime = Date.now() - this.lastActivity;
    const isIdle = idleTime > 5 * 60 * 1000; // 5 minutes

    await this.recordActivity('heartbeat', {
      idle_time_ms: idleTime,
      is_idle: isIdle,
      page_visible: !document.hidden
    });

    // Flush any pending activities
    await this.flushActivityBuffer();
  }

  /**
   * Setup activity listeners
   */
  private static setupActivityListeners() {
    // Message input events
    document.addEventListener('input', this.handleInputActivity);
    document.addEventListener('keydown', this.handleKeyActivity);
    
    // Focus events
    window.addEventListener('focus', this.handleFocusGained);
    window.addEventListener('blur', this.handleFocusLost);
    
    // Visibility events
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Mouse activity
    document.addEventListener('click', this.handleClickActivity);
    document.addEventListener('scroll', this.handleScrollActivity);
  }

  /**
   * Remove activity listeners
   */
  private static removeActivityListeners() {
    document.removeEventListener('input', this.handleInputActivity);
    document.removeEventListener('keydown', this.handleKeyActivity);
    window.removeEventListener('focus', this.handleFocusGained);
    window.removeEventListener('blur', this.handleFocusLost);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('click', this.handleClickActivity);
    document.removeEventListener('scroll', this.handleScrollActivity);
  }

  /**
   * Event handlers
   */
  private static handleInputActivity = async (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.matches('input[type="text"], textarea')) {
      if (!this.isTyping) {
        this.isTyping = true;
        await this.recordActivity('typing_start');
        
        // Auto-stop typing after 3 seconds of inactivity
        setTimeout(async () => {
          if (this.isTyping) {
            this.isTyping = false;
            await this.recordActivity('typing_stop');
          }
        }, 3000);
      }
    }
  };

  private static handleKeyActivity = async (event: KeyboardEvent) => {
    if (event.key === 'Enter' && this.isTyping) {
      this.isTyping = false;
      await this.recordActivity('typing_stop');
    }
  };

  private static handleFocusGained = async () => {
    await this.recordActivity('focus_gained');
  };

  private static handleFocusLost = async () => {
    await this.recordActivity('focus_lost');
  };

  private static handleVisibilityChange = async () => {
    if (document.hidden) {
      await this.recordActivity('focus_lost');
    } else {
      await this.recordActivity('focus_gained');
    }
  };

  private static handleClickActivity = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.matches('button, a, [role="button"]')) {
      await this.recordActivity('message_sent', {
        element_type: target.tagName.toLowerCase(),
        element_text: target.textContent?.slice(0, 50)
      });
    }
  };

  private static handleScrollActivity = async () => {
    // Throttle scroll events
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(async () => {
      await this.recordActivity('heartbeat', {
        scroll_position: window.scrollY,
        page_height: document.body.scrollHeight
      });
    }, 1000);
  };

  private static scrollTimeout: NodeJS.Timeout;

  /**
   * Lấy analytics cho session
   */
  static async getSessionAnalytics(): Promise<SessionAnalytics | null> {
    if (!this.currentSession) return null;

    try {
      const response = await fetch(`${this.API_BASE}/${this.currentSession.session_id}/analytics`);
      
      if (!response.ok) {
        throw new Error(`Failed to get analytics: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Failed to get session analytics:', error);
      return null;
    }
  }

  /**
   * Hoàn thành session
   */
  static async completeSession(completionData?: Record<string, any>) {
    if (!this.currentSession) return;

    try {
      await this.flushActivityBuffer();
      
      await fetch(`${this.API_BASE}/${this.currentSession.session_id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData)
      });

      this.stopIntelligentMonitoring();
      this.currentSession = null;

      console.log('✅ Session completed');

    } catch (error) {
      console.error('❌ Failed to complete session:', error);
    }
  }

  /**
   * Lấy session hiện tại
   */
  static getCurrentSession(): IntelligentSession | null {
    return this.currentSession;
  }

  /**
   * Kiểm tra session có active không
   */
  static isSessionActive(): boolean {
    if (!this.currentSession) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.currentSession.expires_at);
    
    return now < expiresAt && this.currentSession.status === 'active';
  }
}
