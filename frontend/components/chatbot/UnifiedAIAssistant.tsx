'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  Maximize2,
  Minimize2,
  Send,
  MessageCircle,
  Calendar,
  Stethoscope,
  User,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import AIIcon from '@/components/ui/AIIcon';
import { AppointmentEmailService } from '@/lib/services/appointment-email.service';
import { AppointmentPaymentService, getConsultationFee } from '@/lib/services/appointment-payment.service';
import { ChatbotSessionService } from '@/lib/services/chatbot-session.service';

// Types
interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system' | 'emergency';
  content: string;
  timestamp: Date;
  options?: ChatOption[];
  metadata?: any;
}

interface ChatOption {
  id: string;
  label: string;
  value: string;
  action: string;
  iconType?: string;
}

type ChatMode = 'menu' | 'consultation' | 'booking' | 'main';

interface BookingData {
  // Step 1: Patient Info + Symptoms (Combined)
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  symptoms?: string;

  // Step 2: AI Analysis + Specialty Selection (Combined)
  recommendedSpecialties?: any[];
  selectedSpecialty?: string;
  selectedSpecialtyCode?: string;

  // Step 3: Doctor + Time Selection (Combined)
  doctors?: any[];
  selectedDoctor?: any;
  selectedDate?: string;
  selectedTime?: string;
  availableSlots?: any[];

  // Step 4: Payment + Confirmation (Combined)
  bookingSummary?: any;
  paymentUrl?: string;
  appointmentId?: string;

  // Flow control
  step?: 'info_symptoms' | 'specialty_selection' | 'doctor_time' | 'payment_confirm' | 'collect_name' | 'collect_phone' | 'collect_email' | 'collect_symptoms' | 'select_specialty' | 'select_doctor' | 'select_date' | 'select_time' | 'confirm_booking';
  currentSubStep?: string; // For internal step tracking
}

const UnifiedAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('menu');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({ step: 'info_symptoms', currentSubStep: 'name' });
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to render icon based on type
  const renderIcon = (iconType?: string) => {
    switch (iconType) {
      case 'stethoscope': return <Stethoscope className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'clock': return <Clock className="w-4 h-4" />;
      case 'check': return <CheckCircle className="w-4 h-4" />;
      case 'x': return <X className="w-4 h-4" />;
      case 'arrow-left': return <ArrowLeft className="w-4 h-4" />;
      case 'refresh': return <RefreshCw className="w-4 h-4" />;
      case 'message': return <MessageCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { sessionId: newSessionId, userId: newUserId } = await ChatbotSessionService.getOrCreateSession();
        setSessionId(newSessionId);
        setUserId(newUserId);

        // Try to load existing booking data
        const savedBookingData = await ChatbotSessionService.loadBookingData(newSessionId);
        if (savedBookingData) {
          setBookingData(savedBookingData);
          setChatMode('booking');

          // Load conversation history
          const savedMessages = await ChatbotSessionService.loadConversationHistory(newSessionId);
          if (savedMessages.length > 0) {
            setMessages(savedMessages);
          } else {
            showMainMenu();
          }
        } else {
          showMainMenu();
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Fallback to localStorage
        const fallbackSessionId = localStorage.getItem('chatSessionId') || `CHAT-${Date.now()}`;
        const fallbackUserId = localStorage.getItem('chatUserId') || `USER-${Date.now()}`;
        setSessionId(fallbackSessionId);
        setUserId(fallbackUserId);
        showMainMenu();
      }
    };

    initializeSession();
  }, []);

  // Auto-save booking data when it changes
  useEffect(() => {
    const saveBookingData = async () => {
      if (sessionId && chatMode === 'booking' && bookingData.step) {
        try {
          await ChatbotSessionService.saveBookingData(sessionId, bookingData);
        } catch (error) {
          console.error('Failed to save booking data:', error);
        }
      }
    };

    saveBookingData();
  }, [bookingData, sessionId, chatMode]);

  // Auto-save conversation history when messages change
  useEffect(() => {
    const saveConversationHistory = async () => {
      if (sessionId && messages.length > 0) {
        try {
          await ChatbotSessionService.saveConversationHistory(sessionId, messages);
        } catch (error) {
          console.error('Failed to save conversation history:', error);
        }
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveConversationHistory, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, sessionId]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      showMainMenu();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleBackToMenu = () => {
    setChatMode('menu');
    setBookingData({ step: 'info_symptoms', currentSubStep: 'name' });
    showMainMenu();
  };

  const showMainMenu = () => {
    const menuMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: 'Xin chào! Tôi là AI Hỗ Trợ của bệnh viện. Tôi có thể giúp bạn:',
      timestamp: new Date(),
      options: [
        {
          id: 'consultation',
          label: 'Tư vấn sức khỏe',
          value: 'consultation',
          action: 'consultation',
          iconType: 'stethoscope'
        },
        {
          id: 'booking',
          label: 'Đặt lịch khám',
          value: 'booking',
          action: 'booking',
          iconType: 'calendar'
        }
      ]
    };
    setMessages([menuMessage]);
  };

  const handleOptionClick = (option: ChatOption) => {
    // Handle emergency actions first
    if (option.action === 'call') {
      // Open phone dialer
      window.location.href = option.value;
      return;
    }

    if (option.action === 'find_hospital') {
      // Open Google Maps search for nearby hospitals
      window.open('https://www.google.com/maps/search/bệnh+viện+gần+đây', '_blank');
      addBotMessage('🗺️ Đã mở Google Maps để tìm bệnh viện gần nhất. Hãy đến ngay cơ sở y tế gần nhất!');
      return;
    }

    if (option.action === 'emergency') {
      // Show emergency guidance
      const emergencyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'emergency',
        content: `🚨 HƯỚNG DẪN TÌNH HUỐNG KHẨN CẤP

Các dấu hiệu cần đến cấp cứu ngay:
• Đau ngực dữ dội, khó thở
• Sốt cao trên 39°C kèm co giật
• Chảy máu không cầm được
• Bất tỉnh, choáng váng nặng
• Đau bụng dữ dội đột ngột
• Sốt xuất huyết (ban đỏ, chảy máu cam)

Hành động ngay:`,
        timestamp: new Date(),
        options: [
          {
            id: 'call_115',
            label: '📞 Gọi 115 (Cấp cứu)',
            value: 'tel:115',
            action: 'call',
            iconType: 'alert'
          },
          {
            id: 'call_hospital',
            label: '🏥 Gọi bệnh viện',
            value: 'tel:02812345678',
            action: 'call',
            iconType: 'alert'
          },
          {
            id: 'find_hospital',
            label: '🗺️ Tìm bệnh viện gần nhất',
            value: 'find_hospital',
            action: 'find_hospital',
            iconType: 'calendar'
          }
        ]
      };
      setMessages(prev => [...prev, emergencyMessage]);
      return;
    }

    // Add user message for non-emergency actions
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: option.label,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Handle different options
    if (option.action === 'consultation') {
      setChatMode('consultation');
      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: 'Hãy mô tả triệu chứng hoặc vấn đề sức khỏe mà bạn đang gặp phải. Tôi sẽ cung cấp thông tin tham khảo và gợi ý chuyên khoa phù hợp.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } else if (option.action === 'booking') {
      setChatMode('booking');
      handleNewBookingFlow('info_symptoms', '');
    } else if (option.action === 'menu') {
      handleBackToMenu();
    } else if (option.action === 'continue') {
      // Allow user to continue chatting
      return;
    } else if (option.action === 'retry') {
      // Retry last action based on current mode
      if (chatMode === 'consultation') {
        const lastUserMessage = messages.filter(m => m.type === 'user').pop();
        if (lastUserMessage) {
          handleConsultationMessage(lastUserMessage.content);
        }
      } else {
        showMainMenu();
      }
      return;
    } else if (chatMode === 'booking') {
      // Handle NEW booking flow options
      switch (option.action) {
        case 'select_specialty':
          handleNewBookingFlow('specialty_selection', option.value);
          break;
        case 'select_doctor':
          handleNewBookingFlow('doctor_time', option.value);
          break;
        case 'select_time':
          handleNewBookingFlow('doctor_time', option.value);
          break;
        case 'confirm_payment':
          handleNewBookingFlow('payment_confirm', option.value);
          break;
        case 'cancel_booking':
          handleNewBookingFlow('payment_confirm', 'cancel');
          break;
        case 'open_payment':
          // Mở link thanh toán trong tab mới
          window.open(option.value, '_blank');
          addBotMessage('🔗 Link thanh toán đã được mở trong tab mới. Vui lòng hoàn tất thanh toán để xác nhận lịch khám.');
          break;
        case 'restart_booking':
          // Reset và bắt đầu lại flow booking
          setBookingData({});
          setChatMode('main');
          handleBackToMenu();
          break;
        default:
          console.log('Unknown booking action:', option.action);
      }
    }
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    if (chatMode === 'consultation') {
      handleConsultationMessage(message);
    } else if (chatMode === 'booking') {
      handleNewBookingFlow(bookingData.step || 'info_symptoms', message);
    }
  };

  const handleConsultationMessage = async (message: string) => {
    try {
      // Enhanced API call with session management

      // Get or create session ID
      let sessionId = localStorage.getItem('chatSessionId');
      if (!sessionId) {
        sessionId = `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        localStorage.setItem('chatSessionId', sessionId);
      }

      // Get or create user ID
      let userId = localStorage.getItem('chatUserId');
      if (!userId) {
        userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        localStorage.setItem('chatUserId', userId);
      }

      // Call enhanced chatbot API directly
      const ENHANCED_CHATBOT_API_URL = process.env.NEXT_PUBLIC_ENHANCED_CHATBOT_API_URL || 'http://localhost:3021';
      console.log('🔗 Calling enhanced chatbot:', `${ENHANCED_CHATBOT_API_URL}/api/chat`);
      const response = await fetch(`${ENHANCED_CHATBOT_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-user-id': userId
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          userId: userId
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 Enhanced chatbot response:', data);
      console.log('📊 Response status:', response.status, response.ok);

      let botResponse = 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
      let messageType: 'bot' | 'emergency' = 'bot';
      let options: ChatOption[] = [];

      if (data.success) {
        // Handle both old format (data.data) and new format (direct data.response)
        botResponse = data.response || (data.data && (data.data.botResponse || data.data.ai_response || data.data.response)) || botResponse;

        // Check if emergency response - handle both old and new format
        const isEmergency = (data.data && (data.data.emergency || data.data.severity === 'emergency' || data.data.response_source === 'emergency_detection')) ||
                           data.emergency || data.severity === 'emergency' || botResponse.includes('🚨 CẢNH BÁO KHẨN CẤP');
        if (isEmergency) {
          messageType = 'emergency';
          options = [
            {
              id: 'call_emergency',
              label: '📞 Gọi 115',
              value: 'tel:115',
              action: 'call',
              iconType: 'alert'
            },
            {
              id: 'find_hospital',
              label: '🏥 Tìm bệnh viện gần nhất',
              value: 'find_hospital',
              action: 'find_hospital',
              iconType: 'calendar'
            }
          ];
        } else {
          // Normal consultation options
          options = [
            {
              id: 'book_appointment',
              label: 'Đặt lịch khám',
              value: 'booking',
              action: 'booking',
              iconType: 'calendar'
            },
            {
              id: 'continue_chat',
              label: 'Hỏi thêm',
              value: 'continue',
              action: 'continue',
              iconType: 'message'
            },
            {
              id: 'back_menu',
              label: 'Quay lại menu',
              value: 'menu',
              action: 'menu',
              iconType: 'arrow-left'
            }
          ];
        }
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: messageType,
        content: botResponse,
        timestamp: new Date(),
        options: options,
        metadata: {
          responseSource: data.data?.response_source,
          symptoms: data.data?.symptoms,
          severity: data.data?.severity,
          sessionId: data.data?.session_id,
          responseTime: data.data?.response_time_ms
        }
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Consultation error:', error);

      let errorContent = 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.';

      if (error.message?.includes('429') || error.message?.includes('Quá nhiều yêu cầu')) {
        errorContent = '⏰ Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ 1 phút rồi thử lại.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorContent = '🌐 Mất kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
      } else if (error.message?.includes('500')) {
        errorContent = '🔧 Hệ thống đang bảo trì. Vui lòng liên hệ trực tiếp: (028) 1234 5678';
      }

      // Fallback response with enhanced options
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: errorContent,
        timestamp: new Date(),
        options: [
          {
            id: 'retry',
            label: '🔄 Thử lại',
            value: 'retry',
            action: 'retry',
            iconType: 'refresh'
          },
          {
            id: 'back_menu',
            label: '🏠 Quay lại menu',
            value: 'menu',
            action: 'menu',
            iconType: 'arrow-left'
          }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // NEW 4-STEP BOOKING FLOW
  const handleNewBookingFlow = async (step: string, userInput: string) => {
    const newBookingData = { ...bookingData };
    setIsLoading(true);

    try {
      switch (step) {
        case 'info_symptoms':
          await handleInfoAndSymptoms(newBookingData, userInput);
          break;

        case 'specialty_selection':
          await handleSpecialtyAndDoctorSelection(newBookingData, userInput);
          break;

        case 'doctor_time':
          await handleDoctorAndTimeSelection(newBookingData, userInput);
          break;

        case 'payment_confirm':
          await handlePaymentAndConfirmation(newBookingData, userInput);
          break;

        default:
          addBotMessage('Có vẻ như có lỗi xảy ra. Hãy quay lại menu chính để bắt đầu lại.');
      }

      setBookingData(newBookingData);
    } catch (error) {
      console.error('New booking flow error:', error);
      addBotMessage('Xin lỗi, có lỗi xảy ra trong quá trình đặt lịch. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // OLD BOOKING FLOW (will be removed later)
  const handleBookingFlow = async (step: string, userInput: string) => {
    const newBookingData = { ...bookingData };
    setIsLoading(true);

    try {
      const BOOKING_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://localhost:3020';

      switch (step) {
        case 'collect_info':
          // Legacy support - redirect to new flow
          newBookingData.step = 'info_symptoms';
          newBookingData.currentSubStep = 'name';
          await handleInfoAndSymptoms(newBookingData, '');
          break;

        case 'collect_name':
          newBookingData.patientName = userInput;
          newBookingData.step = 'collect_phone';
          addBotMessage(`Cảm ơn ${userInput}! Bây giờ, vui lòng cung cấp số điện thoại liên hệ:`);
          break;

        case 'collect_phone':
          newBookingData.patientPhone = userInput;
          newBookingData.step = 'collect_email';
          addBotMessage('Vui lòng cung cấp địa chỉ email của bạn:');
          break;

        case 'collect_email':
          newBookingData.patientEmail = userInput;
          newBookingData.step = 'collect_symptoms';
          addBotMessage('Cuối cùng, hãy mô tả ngắn gọn lý do khám hoặc triệu chứng bạn đang gặp:');
          break;

        case 'collect_symptoms':
          newBookingData.symptoms = userInput;
          await handleSymptomAnalysis(newBookingData, userInput);
          break;

        case 'select_specialty':
          await handleSpecialtySelection(newBookingData, userInput);
          break;

        case 'select_doctor':
          await handleDoctorSelection(newBookingData, userInput);
          break;

        case 'select_date':
          await handleDateSelection(newBookingData, userInput);
          break;

        case 'select_time':
          await handleTimeSelection(newBookingData, userInput);
          break;

        case 'confirm_booking':
          await handleBookingConfirmation(newBookingData, userInput);
          break;

        default:
          addBotMessage('Có vẻ như có lỗi xảy ra. Hãy quay lại menu chính để bắt đầu lại.');
      }

      setBookingData(newBookingData);
    } catch (error) {
      console.error('Booking flow error:', error);
      addBotMessage('Xin lỗi, có lỗi xảy ra trong quá trình đặt lịch. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1: Combined Info + Symptoms Collection
  const handleInfoAndSymptoms = async (bookingData: BookingData, userInput: string) => {
    const currentSubStep = bookingData.currentSubStep || 'name';

    switch (currentSubStep) {
      case 'name':
        if (!userInput.trim()) {
          addBotMessage('👋 Chào bạn! Để bắt đầu đặt lịch khám, vui lòng cho tôi biết tên của bạn:');
          return;
        }
        bookingData.patientName = userInput.trim();
        bookingData.currentSubStep = 'phone';
        addBotMessage(`Cảm ơn ${userInput}! Vui lòng cung cấp số điện thoại liên hệ:`);
        break;

      case 'phone':
        if (!userInput.trim() || !/^[0-9+\-\s()]{10,15}$/.test(userInput.trim())) {
          addBotMessage('Vui lòng nhập số điện thoại hợp lệ (10-15 chữ số):');
          return;
        }
        bookingData.patientPhone = userInput.trim();
        bookingData.currentSubStep = 'email';
        addBotMessage('Vui lòng cung cấp địa chỉ email của bạn:');
        break;

      case 'email':
        if (!userInput.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput.trim())) {
          addBotMessage('Vui lòng nhập địa chỉ email hợp lệ:');
          return;
        }
        bookingData.patientEmail = userInput.trim();
        bookingData.currentSubStep = 'symptoms';
        addBotMessage('Cuối cùng, hãy mô tả triệu chứng hoặc lý do khám bệnh của bạn:');
        break;

      case 'symptoms':
        if (!userInput.trim()) {
          addBotMessage('Vui lòng mô tả triệu chứng hoặc lý do bạn muốn khám bệnh:');
          return;
        }
        bookingData.symptoms = userInput.trim();

        // Move to next step: AI analysis + specialty selection
        bookingData.step = 'specialty_selection';
        bookingData.currentSubStep = 'analyzing';

        addBotMessage('🔍 Đang phân tích triệu chứng và tìm chuyên khoa phù hợp...');

        // Trigger AI analysis
        await analyzeSymptomAndRecommendSpecialty(bookingData);
        break;
    }
  };

  // AI Analysis function
  const analyzeSymptomAndRecommendSpecialty = async (bookingData: BookingData) => {
    try {
      // Get session info
      let sessionId = localStorage.getItem('chatSessionId') || `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      let userId = localStorage.getItem('chatUserId') || `USER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // Use simple booking API directly for better reliability
      const response = await fetch('/api/chatbot/simple-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'symptom_analysis',
          message: bookingData.symptoms || '',
          session_id: sessionId,
          user_id: userId,
          metadata: {
            booking_data: bookingData,
            patient_info: {
              name: bookingData.patientName,
              phone: bookingData.patientPhone,
              email: bookingData.patientEmail
            }
          }
        })
      });

      const data = await response.json();

      if (data.success && data.data.recommended_specialties) {
        bookingData.recommendedSpecialties = data.data.recommended_specialties;
        bookingData.currentSubStep = 'select_specialty';

        const options: ChatOption[] = data.data.recommended_specialties.slice(0, 4).map((specialty: any) => ({
          id: specialty.specialty_code,
          label: `${specialty.name} - ${specialty.description || ''}`,
          value: specialty.specialty_code,
          action: 'select_specialty'
        }));

        addBotMessage(
          `✅ Phân tích hoàn tất!\n\nDựa trên triệu chứng "${bookingData.symptoms}", tôi khuyến nghị các chuyên khoa sau:\n\nVui lòng chọn chuyên khoa phù hợp:`,
          options
        );
      } else {
        throw new Error('Failed to analyze symptoms');
      }
    } catch (error) {
      console.error('Symptom analysis error:', error);
      addBotMessage('Xin lỗi, có lỗi khi phân tích triệu chứng. Vui lòng thử lại hoặc liên hệ trực tiếp với bệnh viện.');
    }
  };

  // STEP 2: Specialty Selection + Doctor Loading
  const handleSpecialtyAndDoctorSelection = async (bookingData: BookingData, userInput: string) => {
    if (bookingData.currentSubStep === 'select_specialty') {
      // User selected a specialty, now load doctors
      const selectedSpecialty = bookingData.recommendedSpecialties?.find(s => s.specialty_code === userInput);
      if (!selectedSpecialty) {
        addBotMessage('Vui lòng chọn một chuyên khoa từ danh sách trên.');
        return;
      }

      bookingData.selectedSpecialtyCode = userInput;
      bookingData.selectedSpecialty = selectedSpecialty.name;
      bookingData.step = 'doctor_time';
      bookingData.currentSubStep = 'loading_doctors';

      addBotMessage(`✅ Đã chọn chuyên khoa: ${selectedSpecialty.name}\n\n🔍 Đang tìm bác sĩ có sẵn...`);

      // Load doctors for this specialty
      await loadDoctorsForSpecialty(bookingData, userInput);
    }
  };

  // STEP 3: Doctor + Time Selection (Combined)
  const handleDoctorAndTimeSelection = async (bookingData: BookingData, userInput: string) => {
    if (bookingData.currentSubStep === 'select_doctor') {
      // User selected a doctor, now show available dates/times
      const selectedDoctor = bookingData.doctors?.find(d => d.doctor_id === userInput);
      if (!selectedDoctor) {
        addBotMessage('Vui lòng chọn một bác sĩ từ danh sách trên.');
        return;
      }

      bookingData.selectedDoctor = selectedDoctor;
      bookingData.currentSubStep = 'loading_slots';

      addBotMessage(`✅ Đã chọn bác sĩ: ${selectedDoctor.doctor_name}\n\n📅 Đang tải lịch khám có sẵn...`);

      // Load available time slots for next 7 days
      await loadAvailableTimeSlots(bookingData);

    } else if (bookingData.currentSubStep === 'select_time') {
      // User selected a time slot
      const selectedSlot = bookingData.availableSlots?.find(slot =>
        slot.start_time === userInput || slot.slot_id === userInput
      );

      if (!selectedSlot) {
        addBotMessage('Vui lòng chọn một khung giờ từ danh sách trên.');
        return;
      }

      bookingData.selectedTime = selectedSlot.start_time;
      bookingData.selectedDate = selectedSlot.date;
      bookingData.step = 'payment_confirm';
      bookingData.currentSubStep = 'generating_summary';

      addBotMessage(`✅ Đã chọn thời gian: ${selectedSlot.time_display}\n\n📋 Đang tạo tóm tắt đặt lịch...`);

      // Generate booking summary and payment
      await generateBookingSummary(bookingData);
    }
  };

  // Helper: Load doctors for selected specialty
  const loadDoctorsForSpecialty = async (bookingData: BookingData, specialtyCode: string) => {
    try {
      const sessionId = localStorage.getItem('chatSessionId') || `CHAT-${Date.now()}`;
      const userId = localStorage.getItem('chatUserId') || `USER-${Date.now()}`;

      // Try simple booking API directly
      const response = await fetch('/api/chatbot/simple-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'get_doctors',
          message: `Tìm bác sĩ chuyên khoa ${specialtyCode}`,
          session_id: sessionId,
          user_id: userId,
          metadata: {
            specialty_code: specialtyCode,
            booking_data: bookingData
          }
        })
      });

      const data = await response.json();
      if (data.success && data.data.doctors && data.data.doctors.length > 0) {
        bookingData.doctors = data.data.doctors;
        bookingData.currentSubStep = 'select_doctor';

        const options: ChatOption[] = data.data.doctors.slice(0, 5).map((doctor: any) => ({
          id: doctor.doctor_id,
          label: `👨‍⚕️ ${doctor.doctor_name}\n📋 ${doctor.specialty_name || 'Bác sĩ'}`,
          value: doctor.doctor_id,
          action: 'select_doctor'
        }));

        addBotMessage(
          `🏥 Danh sách bác sĩ chuyên khoa ${bookingData.selectedSpecialty}:\n\nVui lòng chọn bác sĩ bạn muốn khám:`,
          options
        );
      } else {
        addBotMessage('Xin lỗi, hiện tại không có bác sĩ nào có sẵn cho chuyên khoa này. Vui lòng thử lại sau hoặc chọn chuyên khoa khác.');
      }
    } catch (error) {
      console.error('Load doctors error:', error);
      addBotMessage('Có lỗi khi tải danh sách bác sĩ. Vui lòng thử lại.');
    }
  };

  // Helper: Load available time slots for selected doctor
  const loadAvailableTimeSlots = async (bookingData: BookingData) => {
    try {
      const sessionId = localStorage.getItem('chatSessionId') || `CHAT-${Date.now()}`;
      const userId = localStorage.getItem('chatUserId') || `USER-${Date.now()}`;

      // Generate next 7 days for availability check
      const availableDates = [];
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        availableDates.push(date.toISOString().split('T')[0]);
      }

      // Use simple booking API
      const response = await fetch('/api/chatbot/simple-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'get_time_slots',
          message: `Lấy lịch khám có sẵn cho bác sĩ ${bookingData.selectedDoctor?.doctor_name}`,
          session_id: sessionId,
          user_id: userId,
          metadata: {
            booking_data: bookingData,
            doctor_id: bookingData.selectedDoctor?.doctor_id,
            dates: availableDates
          }
        })
      });

      const data = await response.json();
      if (data.success && data.data.available_slots && data.data.available_slots.length > 0) {
        bookingData.availableSlots = data.data.available_slots;
        bookingData.currentSubStep = 'select_time';

        const timeOptions: ChatOption[] = data.data.available_slots.slice(0, 8).map((slot: any) => ({
          id: slot.slot_id || slot.start_time,
          label: `📅 ${slot.date_display || slot.date}\n⏰ ${slot.time_display || `${slot.start_time} - ${slot.end_time}`}`,
          value: slot.start_time,
          action: 'select_time'
        }));

        addBotMessage(
          `📅 Lịch khám có sẵn cho bác sĩ ${bookingData.selectedDoctor?.doctor_name}:\n\nVui lòng chọn thời gian phù hợp:`,
          timeOptions
        );
      } else {
        addBotMessage('Xin lỗi, bác sĩ này hiện không có lịch trống trong 7 ngày tới. Vui lòng chọn bác sĩ khác hoặc thử lại sau.');
      }
    } catch (error) {
      console.error('Load time slots error:', error);
      addBotMessage('Có lỗi khi tải lịch khám. Vui lòng thử lại.');
    }
  };

  // Helper: Generate booking summary and payment
  const generateBookingSummary = async (bookingData: BookingData) => {
    try {
      const sessionId = localStorage.getItem('chatSessionId') || `CHAT-${Date.now()}`;
      const userId = localStorage.getItem('chatUserId') || `USER-${Date.now()}`;

      // Create PayOS payment directly - v2.0
      const appointmentId = `APT${Date.now().toString().slice(-6)}`;
      console.log('🚀 CHATBOT v2.0: Creating PayOS payment directly, bypassing simple-booking');
      const paymentResponse = await fetch('/api/payment/create-payos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentId,
          amount: 200000, // 200k VND consultation fee
          patientInfo: {
            name: bookingData.patientName,
            phone: bookingData.patientPhone,
            email: bookingData.patientEmail
          },
          serviceInfo: {
            specialty: bookingData.selectedSpecialty || 'Khám tổng quát',
            doctorName: bookingData.selectedDoctor?.doctor_name || 'Bác sĩ',
            date: bookingData.selectedDate || 'N/A',
            time: bookingData.selectedTime || 'N/A'
          }
        })
      });

      const data = await paymentResponse.json();
      if (data.success && data.data.paymentUrl) {
        bookingData.appointmentId = appointmentId;
        bookingData.paymentUrl = data.data.paymentUrl;
        // Store order code for reference
        bookingData.currentSubStep = 'confirm_payment';

        const consultationFee = getConsultationFee(bookingData.selectedSpecialtyCode || 'GENERAL');

        const confirmOptions: ChatOption[] = [
          {
            id: 'confirm_payment',
            label: '💳 Thanh toán ngay',
            value: 'confirm_payment',
            action: 'confirm_payment',
            iconType: 'check'
          },
          {
            id: 'cancel_booking',
            label: '❌ Hủy đặt lịch',
            value: 'cancel',
            action: 'cancel_booking'
          }
        ];

        const summaryMessage = `
🎉 TÓM TẮT ĐẶT LỊCH KHÁM

🆔 Mã lịch hẹn: ${appointmentId}

👤 Bệnh nhân: ${bookingData.patientName}
📞 SĐT: ${bookingData.patientPhone}
📧 Email: ${bookingData.patientEmail}

🏥 Thông tin khám:
👨‍⚕️ Bác sĩ: ${bookingData.selectedDoctor?.doctor_name}
🩺 Chuyên khoa: ${bookingData.selectedSpecialty}
📅 Ngày khám: ${bookingData.selectedDate}
⏰ Giờ khám: ${bookingData.selectedTime}
📝 Triệu chứng: ${bookingData.symptoms}

💰 Phí khám: ${AppointmentPaymentService.formatAmount(consultationFee)}

✅ Đã tạo link thanh toán PayOS thành công!
Vui lòng xác nhận để tiến hành thanh toán:`;

        addBotMessage(summaryMessage, confirmOptions);
      } else {
        throw new Error('Failed to generate booking summary');
      }
    } catch (error) {
      console.error('Generate booking summary error:', error);
      addBotMessage('Có lỗi khi tạo tóm tắt đặt lịch. Vui lòng thử lại.');
    }
  };

  // STEP 4: Payment + Confirmation
  const handlePaymentAndConfirmation = async (bookingData: BookingData, userInput: string) => {
    if (userInput === 'confirm_payment') {
      if (bookingData.paymentUrl) {
        // Open payment in new tab
        window.open(bookingData.paymentUrl, '_blank');
        addBotMessage(`
💳 Link thanh toán đã được mở trong tab mới

Vui lòng hoàn tất thanh toán để xác nhận lịch khám.

📋 Mã lịch hẹn: ${bookingData.appointmentId}

Sau khi thanh toán thành công, bạn sẽ nhận được email xác nhận chi tiết.

✅ Cảm ơn bạn đã sử dụng dịch vụ đặt lịch online!`);

        // Reset for next booking
        bookingData.step = 'info_symptoms';
        bookingData.currentSubStep = 'name';
      } else {
        addBotMessage('Có lỗi khi tạo link thanh toán. Vui lòng thử lại.');
      }
    } else if (userInput === 'cancel') {
      // Cancel booking
      addBotMessage('Đã hủy đặt lịch. Bạn có muốn đặt lịch mới không?');
      bookingData.step = 'info_symptoms';
      bookingData.currentSubStep = 'name';
    }
  };

  // Helper function to add bot message
  const addBotMessage = (content: string, options?: ChatOption[]) => {
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, botMessage]);
  };

  // Step 1: Collect basic info
  const handleCollectInfo = async (bookingData: BookingData) => {
    bookingData.step = 'collect_name';
    addBotMessage('Để đặt lịch khám, tôi cần một số thông tin từ bạn. Trước tiên, vui lòng cho biết họ tên đầy đủ của bạn:');
  };

  // Step 2: Analyze symptoms with AI
  const handleSymptomAnalysis = async (bookingData: BookingData, symptoms: string) => {
    try {
      // Use simple booking API directly for better reliability
      const response = await fetch('/api/chatbot/simple-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'symptom_analysis',
          message: symptoms,
          session_id: sessionId,
          user_id: userId,
          metadata: { booking_data: bookingData }
        })
      });

      const data = await response.json();
      if (data.success && data.data.recommended_specialties) {
        bookingData.recommendedSpecialties = data.data.recommended_specialties;
        bookingData.step = 'select_specialty';

        const options: ChatOption[] = data.data.recommended_specialties.map((specialty: any, index: number) => ({
          id: specialty.specialty_code,
          label: specialty.name,
          value: specialty.specialty_code,
          action: 'select_specialty'
        }));

        // Create a friendly response message
        const aiResponse = `Dựa trên triệu chứng "${symptoms}", tôi gợi ý các chuyên khoa sau cho bạn:`;
        addBotMessage(aiResponse, options);
      } else {
        throw new Error('Invalid response from symptom analysis');
      }
    } catch (error) {
      console.error('Symptom analysis error:', error);
      addBotMessage('Xin lỗi, không thể phân tích triệu chứng. Vui lòng thử lại.');
    }
  };

  // Step 3: Handle specialty selection and get doctors
  const handleSpecialtySelection = async (bookingData: BookingData, specialtyCode: string) => {
    try {
      const response = await fetch('/api/chatbot/unified-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tôi chọn chuyên khoa ${specialtyCode}`,
          chat_type: 'booking',
          session_id: sessionId,
          user_id: userId,
          metadata: { step: 'get_doctors', booking_data: bookingData, specialty_code: specialtyCode }
        })
      });

      const data = await response.json();
      if (data.success && data.data.doctors) {
        bookingData.selectedSpecialtyCode = specialtyCode;
        bookingData.doctors = data.data.doctors;
        bookingData.step = 'select_doctor';

        const options: ChatOption[] = data.data.doctors.slice(0, 5).map((doctor: any) => ({
          id: doctor.doctor_id,
          label: `${doctor.doctor_name} - ${doctor.specialty_name || 'Bác sĩ'}`,
          value: doctor.doctor_id,
          action: 'select_doctor',
          iconType: 'user'
        }));

        addBotMessage(data.data.ai_response, options);
      } else {
        throw new Error('No doctors found');
      }
    } catch (error) {
      console.error('Specialty selection error:', error);
      addBotMessage('Xin lỗi, không thể lấy danh sách bác sĩ. Vui lòng thử lại.');
    }
  };

  // Step 4: Handle doctor selection
  const handleDoctorSelection = async (bookingData: BookingData, doctorId: string) => {
    try {
      const selectedDoctor = bookingData.doctors?.find(d => d.doctor_id === doctorId);
      if (selectedDoctor) {
        bookingData.selectedDoctor = selectedDoctor;
        bookingData.step = 'select_date';

        // Generate next 7 days as options
        const dateOptions: ChatOption[] = [];
        for (let i = 1; i <= 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          const displayDate = date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          dateOptions.push({
            id: dateStr,
            label: displayDate,
            value: dateStr,
            action: 'select_date',
            iconType: 'calendar'
          });
        }

        addBotMessage(
          `Bạn đã chọn ${selectedDoctor.doctor_name}. Vui lòng chọn ngày khám:`,
          dateOptions
        );
      }
    } catch (error) {
      console.error('Doctor selection error:', error);
      addBotMessage('Xin lỗi, có lỗi khi chọn bác sĩ. Vui lòng thử lại.');
    }
  };

  // Step 5: Handle date selection and get time slots
  const handleDateSelection = async (bookingData: BookingData, selectedDate: string) => {
    try {
      const response = await fetch('/api/chatbot/unified-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tôi chọn ngày ${selectedDate}`,
          chat_type: 'booking',
          session_id: sessionId,
          user_id: userId,
          metadata: {
            step: 'get_time_slots',
            booking_data: bookingData,
            doctor_id: bookingData.selectedDoctor?.doctor_id,
            date: selectedDate
          }
        })
      });

      const data = await response.json();
      if (data.success && data.data.available_slots) {
        bookingData.selectedDate = selectedDate;
        bookingData.availableSlots = data.data.available_slots;
        bookingData.step = 'select_time';

        const timeOptions: ChatOption[] = data.data.available_slots.map((slot: any) => ({
          id: slot.slot_id || slot.start_time,
          label: slot.time_display || `${slot.start_time} - ${slot.end_time}`,
          value: slot.start_time,
          action: 'select_time',
          iconType: 'clock'
        }));

        addBotMessage(data.data.ai_response, timeOptions);
      } else {
        throw new Error('No time slots available');
      }
    } catch (error) {
      console.error('Date selection error:', error);
      addBotMessage('Xin lỗi, không thể lấy khung giờ trống. Vui lòng thử ngày khác.');
    }
  };

  // Step 6: Handle time selection
  const handleTimeSelection = async (bookingData: BookingData, selectedTime: string) => {
    try {
      // Set selected time
      bookingData.selectedTime = selectedTime;
      bookingData.step = 'confirm_booking';

      // Create PayOS payment directly - v2.0
      const appointmentId = `APT${Date.now().toString().slice(-6)}`;
      console.log('🚀 CHATBOT v2.0: Creating PayOS payment for time selection, bypassing simple-booking');
      const paymentResponse = await fetch('/api/payment/create-payos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentId,
          amount: 200000, // 200k VND consultation fee
          patientInfo: {
            name: bookingData.patientName,
            phone: bookingData.patientPhone,
            email: bookingData.patientEmail
          },
          serviceInfo: {
            specialty: bookingData.selectedSpecialty || 'Khám tổng quát',
            doctorName: bookingData.selectedDoctor?.doctor_name || 'Bác sĩ',
            date: bookingData.selectedDate || 'N/A',
            time: selectedTime
          }
        })
      });

      const data = await paymentResponse.json();
      if (data.success && data.data.paymentUrl) {
        bookingData.appointmentId = appointmentId;
        bookingData.paymentUrl = data.data.paymentUrl;

        const confirmOptions: ChatOption[] = [
          {
            id: 'confirm_yes',
            label: '💳 Thanh toán ngay',
            value: 'yes',
            action: 'confirm_booking',
            iconType: 'check'
          },
          {
            id: 'confirm_no',
            label: '❌ Hủy và đặt lại',
            value: 'no',
            action: 'cancel_booking',
            iconType: 'x'
          }
        ];

        const summaryText = `
🎉 ĐẶT LỊCH KHÁM THÀNH CÔNG!

🆔 Mã lịch hẹn: ${appointmentId}

👤 Bệnh nhân: ${bookingData.patientName}
📞 Điện thoại: ${bookingData.patientPhone}
📧 Email: ${bookingData.patientEmail}
🩺 Triệu chứng: ${bookingData.symptoms}

🏥 Chi tiết khám:
👨‍⚕️ Bác sĩ: ${bookingData.selectedDoctor?.doctor_name}
🩺 Chuyên khoa: ${bookingData.selectedSpecialty}
📅 Ngày khám: ${new Date(bookingData.selectedDate!).toLocaleDateString('vi-VN')}
⏰ Giờ khám: ${selectedTime}

💰 Phí khám: 200.000 VNĐ

✅ Đã tạo link thanh toán PayOS thành công!
Vui lòng thanh toán để hoàn tất đặt lịch:`;

        addBotMessage(summaryText, confirmOptions);
      } else {
        throw new Error('Failed to create booking summary');
      }
    } catch (error) {
      console.error('Time selection error:', error);
      addBotMessage('Xin lỗi, có lỗi khi tạo thông tin đặt lịch. Vui lòng thử lại.');
    }
  };

  // Step 7: Handle booking confirmation
  const handleBookingConfirmation = async (bookingData: BookingData, confirmation: string) => {
    try {
      if (confirmation === 'no') {
        // Reset booking flow
        bookingData.step = 'info_symptoms';
        bookingData.currentSubStep = 'name';
        addBotMessage('Đã hủy đặt lịch. Bạn có muốn đặt lịch mới không?');
        return;
      }

      // Redirect directly to PayOS payment URL
      if (bookingData.paymentUrl) {
        addBotMessage(`
🎉 CHUYỂN HƯỚNG ĐẾN THANH TOÁN

Đang chuyển bạn đến trang thanh toán PayOS...
Vui lòng hoàn tất thanh toán để xác nhận lịch hẹn.

📱 Mã lịch hẹn: ${bookingData.appointmentId}
💰 Số tiền: 200.000 VNĐ`);

        // Redirect to PayOS
        setTimeout(() => {
          window.open(bookingData.paymentUrl, '_blank');
        }, 1000);
        return;
      }

      // Fallback: Create PayOS payment if no URL exists
      addBotMessage('Có lỗi với link thanh toán. Đang tạo lại...');
    } catch (error) {
      console.error('Booking confirmation error:', error);
      addBotMessage('Có lỗi khi xác nhận đặt lịch. Vui lòng thử lại.');
    }
  };

  return (
    <>
      {/* AI Assistant Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
          <div
            onClick={handleOpen}
            className="cursor-pointer transition-all duration-500 hover:scale-110 flex flex-col items-center justify-center group relative"
            style={{
              animation: 'bounce 3s ease-in-out infinite'
            }}
          >
            {/* Modern floating container */}
            <div className="relative">
              {/* Soft floating rings */}
              <div className="absolute -inset-4 rounded-full border border-blue-400/20 animate-ping"></div>
              <div className="absolute -inset-2 rounded-full border border-emerald-400/15 animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              {/* Main button container */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:shadow-3xl touch-manipulation"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
                }}
              >
                <AIIcon 
                  size={64} 
                  showText={false} 
                  useCustomImage={true}
                  customImagePath="/images/aichatbot.jpeg"
                />
              </div>
              
              {/* Soft glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/10 via-emerald-400/10 to-purple-400/10 blur-2xl animate-pulse"></div>
              
              {/* Modern text label */}
              <div 
                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-xl transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)'
                }}
              >
                <span className="text-sm font-bold text-white whitespace-nowrap drop-shadow-sm">AI Hỗ Trợ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed z-50 ${isFullscreen ? 'inset-2 sm:inset-6' : 'bottom-4 right-4 sm:bottom-8 sm:right-8'}`}>
          <div
            className={`bg-white/80 backdrop-blur-xl rounded-[16px] sm:rounded-[24px] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-700 ${
              isFullscreen
                ? 'w-full h-full'
                : 'w-[calc(100vw-2rem)] max-w-[400px] h-[calc(100vh-2rem)] max-h-[650px] sm:w-[400px] sm:h-[650px]'
            }`}
            style={{
              boxShadow: '0 32px 64px -12px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 50%, rgba(236, 254, 255, 0.9) 100%)'
            }}
          >
            {/* Header */}
            <div
              className="p-6 text-white flex items-center justify-between rounded-t-[24px] relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(16, 185, 129, 0.8) 50%, rgba(139, 92, 246, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Background blur overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-purple-500/20 backdrop-blur-sm"></div>

              <div className="flex items-center space-x-4 relative z-10">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                    <AIIcon
                      size={32}
                      showText={false}
                      useCustomImage={true}
                      customImagePath="/images/aichatbot.jpeg"
                    />
                  </div>
                  {/* Soft breathing effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse"></div>
                  <div className="absolute -inset-1 rounded-full border border-white/10 animate-ping"></div>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white drop-shadow-lg">AI Hỗ Trợ</h3>
                  <p className="text-sm text-white/80 font-medium">
                    {chatMode === 'consultation' ? '🩺 Tư vấn sức khỏe' :
                     chatMode === 'booking' ? '📅 Đặt lịch khám' :
                     '🏥 Hỗ trợ bệnh viện'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 relative z-10">
                {/* Back to Menu */}
                {chatMode !== 'menu' && (
                  <button
                    onClick={handleBackToMenu}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg"
                    title="Quay lại menu"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg"
                  title={isFullscreen ? "Thu nhỏ" : "Mở rộng"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 p-6 overflow-y-auto relative"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(240, 249, 255, 0.05) 50%, rgba(236, 254, 255, 0.1) 100%)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-end space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl border-2 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-purple-500 border-white/30'
                        : message.type === 'emergency'
                        ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-red-300/50 animate-pulse'
                        : 'bg-gradient-to-br from-emerald-400 via-blue-400 to-purple-500 border-white/30'
                    }`}
                    style={{
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                    }}>
                      {message.type === 'user' ? (
                        <User className="w-5 h-5 text-white drop-shadow-sm" />
                      ) : message.type === 'emergency' ? (
                        <AlertTriangle className="w-6 h-6 text-white drop-shadow-sm" />
                      ) : (
                        <AIIcon
                          size={28}
                          showText={false}
                          useCustomImage={true}
                          customImagePath="/images/aichatbot.jpeg"
                        />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`max-w-sm ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`relative p-5 rounded-[24px] shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                          message.type === 'user'
                            ? 'text-white rounded-br-[8px]'
                            : 'text-gray-800 rounded-bl-[8px]'
                        }`}
                        style={{
                          background: message.type === 'user'
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)'
                            : message.type === 'emergency'
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                          backdropFilter: 'blur(20px)',
                          border: message.type === 'user'
                            ? '1px solid rgba(255, 255, 255, 0.2)'
                            : message.type === 'emergency'
                            ? '2px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid rgba(59, 130, 246, 0.1)',
                          boxShadow: message.type === 'user'
                            ? '0 16px 40px rgba(59, 130, 246, 0.3)'
                            : message.type === 'emergency'
                            ? '0 16px 40px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.2)'
                            : '0 16px 40px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {/* Soft message tail */}
                        <div
                          className={`absolute bottom-0 w-6 h-6 ${
                            message.type === 'user' ? 'right-0' : 'left-0'
                          }`}
                          style={{
                            background: message.type === 'user'
                              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)'
                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                            borderRadius: message.type === 'user' ? '0 0 0 24px' : '0 0 24px 0',
                            transform: 'translateY(50%)'
                          }}
                        ></div>

                        <p className={`text-sm leading-relaxed whitespace-pre-wrap relative z-10 font-medium ${
                          message.type === 'emergency' ? 'text-white font-semibold' : ''
                        }`}>{message.content}</p>

                        {/* Timestamp */}
                        <div className={`text-xs mt-3 opacity-60 font-medium ${
                          message.type === 'user' ? 'text-white' : 'text-gray-600'
                        }`}>
                          {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Options */}
                      {message.options && (
                        <div className="mt-4 space-y-3">
                          {message.options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleOptionClick(option)}
                              className={`w-full p-5 text-left rounded-full border transition-all duration-400 flex items-center space-x-4 shadow-lg hover:shadow-2xl hover:scale-105 group relative overflow-hidden ${
                                option.action === 'call' ? 'animate-pulse' : ''
                              }`}
                              style={{
                                background: option.action === 'call'
                                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)'
                                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                                backdropFilter: 'blur(20px)',
                                border: option.action === 'call'
                                  ? '2px solid rgba(239, 68, 68, 0.3)'
                                  : '1px solid rgba(59, 130, 246, 0.2)',
                                boxShadow: option.action === 'call'
                                  ? '0 8px 32px rgba(239, 68, 68, 0.3)'
                                  : '0 8px 32px rgba(59, 130, 246, 0.15)'
                              }}
                              onMouseEnter={(e) => {
                                if (option.action === 'call') {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)';
                                } else {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)';
                                }
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                if (option.action === 'call') {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)';
                                } else {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)';
                                }
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {/* Ripple effect background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>

                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg relative z-10 ${
                                option.action === 'call'
                                  ? 'bg-gradient-to-br from-white to-red-100 text-red-600'
                                  : 'bg-gradient-to-br from-blue-500 to-emerald-500'
                              }`}>
                                {renderIcon(option.iconType)}
                              </div>
                              <span className={`text-sm font-semibold relative z-10 ${
                                option.action === 'call'
                                  ? 'text-white group-hover:text-red-100'
                                  : 'text-gray-800 group-hover:text-gray-900'
                              }`}>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-end space-x-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 border-2 border-white/30"
                    style={{
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                    }}>
                      <AIIcon
                        size={28}
                        showText={false}
                        useCustomImage={true}
                        customImagePath="/images/aichatbot.jpeg"
                      />
                    </div>
                    <div
                      className="p-5 rounded-[24px] rounded-bl-[8px] shadow-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div className="flex space-x-2 items-center">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-600 ml-2 font-medium">AI đang suy nghĩ...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            {chatMode !== 'menu' && (
              <div
                className="p-4 sm:p-6 relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderTop: '1px solid rgba(59, 130, 246, 0.1)'
                }}
              >
                <div className="flex space-x-2 sm:space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={
                        chatMode === 'consultation'
                          ? "Mô tả triệu chứng của bạn..."
                          : "Nhập thông tin..."
                      }
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium text-gray-800 placeholder-gray-500 border-0 rounded-full focus:outline-none focus:ring-0 transition-all duration-300 touch-manipulation"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage(inputValue);
                        }
                      }}
                      onFocus={(e) => {
                        e.target.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.2)';
                        e.target.style.transform = 'scale(1.02)';
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.1)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={isLoading || !inputValue.trim()}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 flex items-center justify-center shadow-xl touch-manipulation"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-4 text-center font-medium opacity-70">
                  ⚠️ Chỉ tư vấn cơ bản, không thay thế việc khám bác sĩ
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedAIAssistant;
