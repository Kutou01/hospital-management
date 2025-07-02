'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Calendar, Clock, User, Stethoscope, Send, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types
interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  options?: ChatOption[];
}

interface ChatOption {
  id: string;
  label: string;
  value: string;
  action: string;
}

interface BookingSession {
  session_id: string;
  current_step: string;
  // Bước 1: Thông tin bệnh nhân
  patient_name?: string;
  patient_age?: number;
  patient_phone?: string;
  patient_email?: string;
  is_returning_patient?: boolean;
  patient_history?: string;
  // Bước 2: Triệu chứng và tư vấn
  symptoms?: string;
  symptom_details?: string;
  urgency_level?: 'emergency' | 'urgent' | 'normal';
  ai_recommendation?: string;
  // Bước 3: Lựa chọn lịch khám
  selected_specialty?: string;
  doctor_id?: string;
  doctor_name?: string;
  specialty_name?: string;
  date?: string;
  selected_time?: string;
  selected_time_display?: string;
  start_time?: string;
  end_time?: string;
  // Bước 4: Xác nhận và thanh toán
  consultation_fee?: number;
  payment_method?: string;
  confirmation_code?: string;
  // Metadata
  notes?: string;
  expires_at: string;
}

interface Specialty {
  specialty_id: string;
  name_vi: string;
  description?: string;
}

interface Doctor {
  doctor_id: string;
  doctor_name: string;
  specialty_name: string;
  consultation_fee: number;
  experience_years: number;
}

interface TimeSlot {
  slot_id: string;
  time_display: string;
  start_time: string;
  end_time: string;
  is_morning: boolean;
}

interface ChatbotBookingWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ChatbotBookingWidget: React.FC<ChatbotBookingWidgetProps> = ({ isOpen: externalIsOpen, onClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<BookingSession | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ morning: TimeSlot[], afternoon: TimeSlot[] }>({ morning: [], afternoon: [] });

  // Progress tracking
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Tối ưu từ 5 bước xuống 4 bước

  // Form states cho từng bước
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [patientFormData, setPatientFormData] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    symptoms: '',
    isReturning: false
  });

  // Auto-save khi dữ liệu thay đổi
  useEffect(() => {
    if (patientFormData.name || patientFormData.phone || patientFormData.symptoms) {
      saveToLocalStorage({
        patientFormData,
        currentStep,
        session
      });
    }
  }, [patientFormData, currentStep, session]);

  const stepLabels = [
    'Thông tin cơ bản',
    'Phân tích triệu chứng',
    'Chọn lịch khám',
    'Xác nhận đặt lịch'
  ];

  // Auto-save functionality
  const saveToLocalStorage = (data: any) => {
    try {
      const saveData = {
        ...data,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      };
      localStorage.setItem('chatbot_booking_draft', JSON.stringify(saveData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('chatbot_booking_draft');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.expires > Date.now()) {
          return data;
        } else {
          localStorage.removeItem('chatbot_booking_draft');
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  };

  const clearSavedData = () => {
    localStorage.removeItem('chatbot_booking_draft');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  // Sử dụng API nội bộ của Next.js
  const chatbotApiUrl = '/api/chatbot';

  // Debug logging
  console.log('Environment variables:', {
    NEXT_PUBLIC_CHATBOT_BOOKING_API: process.env.NEXT_PUBLIC_CHATBOT_BOOKING_API,
    chatbotApiUrl: chatbotApiUrl
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      console.log('Initializing chat for the first time');

      // Thử khôi phục session từ localStorage
      const savedSession = localStorage.getItem('chatbot_booking_session');
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          // Kiểm tra session chưa hết hạn
          if (new Date(parsedSession.expires_at) > new Date()) {
            setSession(parsedSession);
            console.log('Session restored from localStorage:', parsedSession);
          } else {
            localStorage.removeItem('chatbot_booking_session');
            console.log('Session expired, removed from localStorage');
          }
        } catch (error) {
          console.error('Error parsing saved session:', error);
          localStorage.removeItem('chatbot_booking_session');
        }
      }

      isInitializedRef.current = true;
      initializeChat();
    } else if (!isOpen) {
      // Reset when closing
      console.log('Resetting chat state');
      isInitializedRef.current = false;
      setMessages([]);
      setSession(null);
      setSpecialties([]);
      setDoctors([]);
      setTimeSlots({ morning: [], afternoon: [] });
    }
  }, [isOpen]);

  const initializeChat = async () => {
    // Prevent multiple initializations
    if (messages.length > 0) {
      console.log('Chat already initialized, skipping');
      return;
    }

    try {
      console.log('Initializing AI booking chat');

      // Kiểm tra dữ liệu đã lưu
      const savedData = loadFromLocalStorage();

      if (savedData) {
        // Có dữ liệu đã lưu - hỏi có muốn tiếp tục không
        addBotMessage(`💾 **Tìm thấy thông tin đặt lịch đã lưu**

📅 Lưu lúc: ${new Date(savedData.timestamp).toLocaleString('vi-VN')}
📋 Bước: ${savedData.currentStep ? stepLabels[savedData.currentStep - 1] : 'Chưa xác định'}

Bạn có muốn tiếp tục với thông tin đã lưu không?`, [
          {
            id: 'continue_saved',
            label: '✅ Tiếp tục với thông tin đã lưu',
            value: 'continue',
            action: 'restore_saved_data'
          },
          {
            id: 'start_new',
            label: '🆕 Bắt đầu mới',
            value: 'new',
            action: 'start_fresh'
          }
        ]);
        return;
      }

      // Bước 1: Chào hỏi và thu thập thông tin bệnh nhân
      const welcomeMessage = `🤖 **Xin chào! Tôi là trợ lý đặt lịch khám bệnh AI.**

🏥 **Tôi sẽ giúp bạn:**
• Thu thập thông tin cơ bản
• Phân tích triệu chứng và tư vấn chuyên khoa
• Đề xuất bác sĩ và lịch khám phù hợp
• Hỗ trợ đặt lịch và thanh toán

📝 **Để bắt đầu, tôi cần một số thông tin cơ bản về bạn.**

💾 *Thông tin sẽ được lưu tự động để bạn có thể tiếp tục sau*

Bạn đã từng khám tại bệnh viện chúng tôi chưa?`;

      addBotMessage(welcomeMessage, [
        {
          id: 'returning_patient',
          label: '✅ Đã từng khám (Bệnh nhân cũ)',
          value: 'returning',
          action: 'patient_type'
        },
        {
          id: 'new_patient',
          label: '🆕 Chưa từng khám (Bệnh nhân mới)',
          value: 'new',
          action: 'patient_type'
        }
      ]);

    } catch (error) {
      console.error('Error initializing chat:', error);
      addBotMessage(`❌ **Xin lỗi, có lỗi khi khởi tạo hệ thống.**

🔧 **Vui lòng:**
• Kiểm tra kết nối mạng
• Refresh trang và thử lại
• Liên hệ hỗ trợ: 1900-xxxx

Lỗi: ${error.message}`);
    }
  };

  const addBotMessage = (content: string, options?: ChatOption[]) => {
    const message: ChatMessage = {
      id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      options
    };

    console.log('Adding bot message:', message.id, content.substring(0, 50) + '...');
    setMessages(prev => {
      // Check if message with same content already exists
      const exists = prev.some(msg => msg.content === content && msg.type === 'bot');
      if (exists) {
        console.log('Message already exists, skipping');
        return prev;
      }
      return [...prev, message];
    });
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const clearSession = () => {
    setSession(null);
    localStorage.removeItem('chatbot_booking_session');
    console.log('Session cleared');
  };

  const createSession = async (patientId: string = 'PAT-TEST-001') => {
    try {
      // Tạo session ID local trước
      const sessionId = `CHAT-APPT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newSession = {
        session_id: sessionId,
        patient_id: patientId,
        step: 'selecting_patient_type',
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };

      // Lưu local trước
      setSession(newSession);
      localStorage.setItem('chatbot_booking_session', JSON.stringify(newSession));

      console.log('Session created locally:', newSession);

      // Thử gọi API để tạo trên server (optional)
      try {
        const response = await fetch(`${chatbotApiUrl}?endpoint=session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patientId })
        });

        const data = await response.json();
        if (data.success && data.data) {
          // Cập nhật với data từ server nếu có
          const serverSession = { ...newSession, ...data.data };
          setSession(serverSession);
          localStorage.setItem('chatbot_booking_session', JSON.stringify(serverSession));
          return serverSession;
        }
      } catch (apiError) {
        console.warn('API session creation failed, using local session:', apiError);
      }

      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const updateSession = async (updates: Partial<BookingSession>) => {
    if (!session) {
      console.error('No session to update');
      return;
    }

    try {
      // Cập nhật session local trước
      const updatedSession = { ...session, ...updates };
      setSession(updatedSession);

      // Lưu vào localStorage để đảm bảo persistence
      localStorage.setItem('chatbot_booking_session', JSON.stringify(updatedSession));

      console.log('✅ Session updated locally:', {
        session_id: updatedSession.session_id,
        patient_name: updatedSession.patient_name,
        doctor_name: updatedSession.doctor_name,
        selected_time: updatedSession.selected_time,
        updates: updates
      });

      // Gọi API để cập nhật trên server (optional, có thể fail)
      try {
        const response = await fetch(`${chatbotApiUrl}?endpoint=update-session&session_id=${session.session_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        const data = await response.json();
        if (data.success && data.data) {
          // Nếu server trả về data khác, cập nhật lại
          const serverSession = { ...updatedSession, ...data.data };
          setSession(serverSession);
          localStorage.setItem('chatbot_booking_session', JSON.stringify(serverSession));
        }
      } catch (apiError) {
        console.warn('API update failed, but local session is updated:', apiError);
      }

      return updatedSession;
    } catch (error) {
      console.error('Error updating session:', error);
      return session;
    }
  };

  const handleOptionClick = async (option: ChatOption) => {
    setIsLoading(true);
    addUserMessage(option.label);

    try {
      switch (option.action) {
        case 'restore_saved_data':
          handleRestoreSavedData();
          break;
        case 'start_fresh':
          handleStartFresh();
          break;
        case 'patient_type':
          await handlePatientType(option.value, option.label);
          break;
        case 'collect_patient_info':
          handleCollectPatientInfo();
          break;
        case 'collect_symptom_details':
          handleCollectSymptomDetails();
          break;
        case 'analyze_symptoms':
          await handleSymptomAnalysis();
          break;
        case 'select_specialty':
          await handleSpecialtySelection(option.value, option.label);
          break;
        case 'select_doctor':
          await handleDoctorSelection(option.value, option.label);
          break;
        case 'select_date':
          await handleDateSelection(option.value, option.label);
          break;
        case 'select_time':
          await handleTimeSelection(option.value, option.label);
          break;
        case 'show_patient_form':
          handleShowPatientForm();
          break;
        case 'show_booking_review':
          handleShowBookingReview();
          break;
        case 'confirm_booking':
          await handleBookingConfirmation();
          break;
        case 'cancel_booking':
          handleBookingCancellation();
          break;
        case 'restart_booking':
          handleRestartBooking();
          break;
        default:
          addBotMessage('Tôi không hiểu lựa chọn này. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error handling option:', error);
      addBotMessage('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== RESTORE & START FRESH HANDLERS =====
  const handleRestoreSavedData = () => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      // Khôi phục dữ liệu
      if (savedData.patientFormData) {
        setPatientFormData(savedData.patientFormData);
      }
      if (savedData.currentStep) {
        setCurrentStep(savedData.currentStep);
      }

      addBotMessage(`✅ **Đã khôi phục thông tin thành công!**

📋 Tiếp tục từ bước: **${stepLabels[savedData.currentStep - 1] || 'Bước 1'}**

🔄 Bạn có thể tiếp tục quá trình đặt lịch từ đây.`, [
        {
          id: 'continue_process',
          label: '▶️ Tiếp tục quy trình',
          value: 'continue',
          action: savedData.currentStep === 1 ? 'collect_patient_info' : 'analyze_symptoms'
        },
        {
          id: 'edit_info',
          label: '✏️ Chỉnh sửa thông tin',
          value: 'edit',
          action: 'collect_patient_info'
        }
      ]);
    } else {
      addBotMessage('❌ Không tìm thấy dữ liệu đã lưu. Bắt đầu quy trình mới.');
      handleStartFresh();
    }
  };

  const handleStartFresh = () => {
    // Xóa dữ liệu cũ
    clearSavedData();
    setCurrentStep(1);
    setPatientFormData({
      name: '',
      age: '',
      phone: '',
      email: '',
      symptoms: '',
      isReturning: false
    });

    // Bắt đầu quy trình mới
    const welcomeMessage = `🆕 **Bắt đầu quy trình đặt lịch mới**

📝 **Để bắt đầu, tôi cần một số thông tin cơ bản về bạn.**

Bạn đã từng khám tại bệnh viện chúng tôi chưa?`;

    addBotMessage(welcomeMessage, [
      {
        id: 'returning_patient',
        label: '✅ Đã từng khám (Bệnh nhân cũ)',
        value: 'returning',
        action: 'patient_type'
      },
      {
        id: 'new_patient',
        label: '🆕 Chưa từng khám (Bệnh nhân mới)',
        value: 'new',
        action: 'patient_type'
      }
    ]);
  };

  // ===== BƯỚC 1: TIẾP NHẬN THÔNG TIN BỆNH NHÂN =====
  const handlePatientType = async (patientType: string, label: string) => {
    const isReturning = patientType === 'returning';

    // Tạo session mới nếu chưa có
    let currentSession = session;
    if (!currentSession) {
      console.log('Creating new session for patient type selection');
      currentSession = await createSession();
      if (!currentSession) {
        addBotMessage('❌ Không thể tạo phiên đặt lịch. Vui lòng thử lại.');
        return;
      }
    }

    console.log('Current session before update:', currentSession);

    // Cập nhật session và progress - sử dụng currentSession thay vì session global
    const updatedSession = {
      ...currentSession,
      step: 'collecting_patient_info',
      is_returning_patient: isReturning
    };

    setSession(updatedSession);
    localStorage.setItem('chatbot_booking_session', JSON.stringify(updatedSession));
    setCurrentStep(1);

    console.log('Session updated for patient type:', updatedSession);

    if (isReturning) {
      // Bệnh nhân cũ - form đơn giản hơn
      setPatientFormData(prev => ({ ...prev, isReturning: true }));
      setShowPatientForm(true);

      addBotMessage(`✅ **Bạn là bệnh nhân cũ**

📝 **Vui lòng cung cấp thông tin để tra cứu và đặt lịch:**

💡 *Chỉ cần số điện thoại và triệu chứng hiện tại*`);
    } else {
      // Bệnh nhân mới - form đầy đủ
      setPatientFormData(prev => ({ ...prev, isReturning: false }));
      setShowPatientForm(true);

      addBotMessage(`🆕 **Chào mừng bệnh nhân mới!**

📝 **Vui lòng điền đầy đủ thông tin bên dưới:**

⚡ *Tất cả trong một form - nhanh chóng và tiện lợi*

💾 *Thông tin sẽ được lưu tự động để bạn có thể tiếp tục sau*`);
    }
  };

  const handleCollectPatientInfo = () => {
    setShowPatientForm(true);
    addBotMessage(`📝 **Vui lòng điền thông tin vào form bên dưới:**

⚠️ **Lưu ý:**
• Thông tin sẽ được bảo mật tuyệt đối
• Chỉ sử dụng cho mục đích khám chữa bệnh
• Bạn có thể cập nhật thông tin bất kỳ lúc nào

💡 **Sau khi điền xong, nhấn nút "Xác nhận thông tin"**`);
  };

  const handleCollectSymptomDetails = () => {
    addBotMessage(`📋 **Để AI phân tích chính xác hơn, vui lòng cho biết thêm:**

🕐 **Thời gian xuất hiện triệu chứng:**
• Khi nào bắt đầu? (hôm nay, hôm qua, tuần trước...)
• Triệu chứng có thường xuyên không?

📊 **Mức độ nghiêm trọng:**
• Đau/khó chịu mức độ nào? (1-10)
• Có ảnh hưởng đến sinh hoạt hàng ngày không?

🔍 **Chi tiết bổ sung:**
• Có triệu chứng kèm theo nào khác không?
• Đã dùng thuốc gì chưa? Có hiệu quả không?
• Có tiền sử bệnh lý liên quan không?

Vui lòng mô tả chi tiết để AI có thể đưa ra đánh giá chính xác nhất:`, [
      {
        id: 'detailed_symptoms',
        label: '📝 Nhập chi tiết triệu chứng',
        value: 'detailed_form',
        action: 'show_detailed_symptom_form'
      },
      {
        id: 'skip_details',
        label: '⏭️ Bỏ qua, phân tích với thông tin hiện tại',
        value: 'skip',
        action: 'analyze_symptoms'
      }
    ]);
  };

  // ===== BƯỚC 2: PHÂN TÍCH TRIỆU CHỨNG VÀ TƯ VẤN =====
  const handleSymptomAnalysis = async () => {
    // Kiểm tra triệu chứng từ session hoặc form data
    const symptoms = session?.symptoms || patientFormData.symptoms;

    if (!symptoms || symptoms.trim() === '') {
      addBotMessage('❌ Vui lòng cung cấp thông tin triệu chứng trước khi phân tích.');
      setShowPatientForm(true);
      return;
    }

    // Hiển thị loading với animation
    addBotMessage(`🔍 **Đang phân tích triệu chứng của bạn...**

🤖 **AI đang xử lý thông tin:**
• Phân tích triệu chứng: "${symptoms}"
• Đánh giá mức độ cấp thiết
• Gợi ý chuyên khoa phù hợp
• Tìm kiếm bác sĩ phù hợp

⏳ **Vui lòng đợi trong giây lát...**

🔄 *Đang xử lý* ⚡ *Phân tích* 🎯 *Đề xuất*`);

    // Simulate AI analysis với thời gian thực tế
    setTimeout(async () => {
      const analysisResult = await analyzeSymptoms(symptoms);

      await updateSession({
        step: 'specialty_recommendation',
        ai_recommendation: analysisResult.recommendation,
        urgency_level: analysisResult.urgency,
        symptoms: symptoms // Đảm bảo symptoms được lưu
      });

      showSpecialtyRecommendation(analysisResult);
    }, 3000); // Tăng thời gian để có cảm giác AI đang xử lý
  };

  const analyzeSymptoms = async (symptoms: string) => {
    // AI Analysis với logic thông minh hơn - xử lý nhiều triệu chứng
    const symptomLower = symptoms.toLowerCase();

    // Từ khóa khẩn cấp
    const emergencyKeywords = [
      'đau ngực dữ dội', 'khó thở', 'chảy máu nhiều', 'sốt cao', 'bất tỉnh',
      'đau đầu dữ dội', 'buồn nôn và nôn', 'đau bụng dữ dội', 'đau gan dữ dội'
    ];

    // Từ khóa cấp thiết
    const urgentKeywords = [
      'sốt', 'đau đầu kéo dài', 'đau bụng kéo dài', 'tiêu chảy',
      'ho kéo dài', 'mệt mỏi', 'chóng mặt', 'đau gan'
    ];

    // Mapping chuyên khoa chi tiết hơn với priority
    const specialtyMapping = {
      // Tiêu hóa - Priority cao
      'đau gan': { specialty: 'Tiêu hóa', priority: 10, confidence: 0.9 },
      'gan': { specialty: 'Tiêu hóa', priority: 9, confidence: 0.85 },
      'đau bụng': { specialty: 'Tiêu hóa', priority: 8, confidence: 0.8 },
      'đi ngoài': { specialty: 'Tiêu hóa', priority: 7, confidence: 0.8 },
      'tiêu chảy': { specialty: 'Tiêu hóa', priority: 8, confidence: 0.85 },
      'táo bón': { specialty: 'Tiêu hóa', priority: 6, confidence: 0.8 },
      'buồn nôn': { specialty: 'Tiêu hóa', priority: 7, confidence: 0.75 },
      'nôn': { specialty: 'Tiêu hóa', priority: 8, confidence: 0.8 },

      // Hô hấp
      'ho': { specialty: 'Hô hấp', priority: 7, confidence: 0.8 },
      'khó thở': { specialty: 'Hô hấp', priority: 9, confidence: 0.9 },
      'đau họng': { specialty: 'Hô hấp', priority: 6, confidence: 0.75 },
      'sổ mũi': { specialty: 'Hô hấp', priority: 5, confidence: 0.7 },

      // Tim mạch
      'đau ngực': { specialty: 'Tim mạch', priority: 9, confidence: 0.9 },
      'hồi hộp': { specialty: 'Tim mạch', priority: 7, confidence: 0.8 },
      'tim đập nhanh': { specialty: 'Tim mạch', priority: 8, confidence: 0.85 },

      // Thần kinh
      'đau đầu': { specialty: 'Thần kinh', priority: 7, confidence: 0.8 },
      'chóng mặt': { specialty: 'Thần kinh', priority: 6, confidence: 0.75 },
      'mất ngủ': { specialty: 'Thần kinh', priority: 5, confidence: 0.7 },

      // Da liễu
      'phát ban': { specialty: 'Da liễu', priority: 8, confidence: 0.85 },
      'ngứa': { specialty: 'Da liễu', priority: 6, confidence: 0.75 },
      'mụn': { specialty: 'Da liễu', priority: 5, confidence: 0.7 },

      // Nội tiết
      'tiểu nhiều': { specialty: 'Nội tiết', priority: 8, confidence: 0.85 },
      'khát nước': { specialty: 'Nội tiết', priority: 7, confidence: 0.8 },
      'mệt mỏi': { specialty: 'Nội tiết', priority: 5, confidence: 0.6 }
    };

    // Phân tích tất cả triệu chứng được tìm thấy
    let foundSymptoms = [];
    let specialtyScores = {};

    for (const [symptom, info] of Object.entries(specialtyMapping)) {
      if (symptomLower.includes(symptom)) {
        foundSymptoms.push({
          symptom,
          specialty: info.specialty,
          priority: info.priority,
          confidence: info.confidence
        });

        // Tính điểm cho mỗi chuyên khoa
        if (!specialtyScores[info.specialty]) {
          specialtyScores[info.specialty] = {
            totalScore: 0,
            symptoms: [],
            maxConfidence: 0
          };
        }

        specialtyScores[info.specialty].totalScore += info.priority;
        specialtyScores[info.specialty].symptoms.push(symptom);
        specialtyScores[info.specialty].maxConfidence = Math.max(
          specialtyScores[info.specialty].maxConfidence,
          info.confidence
        );
      }
    }

    // Tìm chuyên khoa có điểm cao nhất
    let recommendedSpecialty = 'Nội tổng hợp';
    let confidence = 0.6;
    let maxScore = 0;
    let matchedSymptoms = [];

    for (const [specialty, data] of Object.entries(specialtyScores)) {
      if (data.totalScore > maxScore) {
        maxScore = data.totalScore;
        recommendedSpecialty = specialty;
        confidence = data.maxConfidence;
        matchedSymptoms = data.symptoms;
      }
    }

    // Phân tích mức độ cấp thiết
    let urgency = 'normal';
    let urgencyReason = '';

    if (emergencyKeywords.some(keyword => symptomLower.includes(keyword))) {
      urgency = 'emergency';
      urgencyReason = 'Triệu chứng có dấu hiệu nguy hiểm cần khám ngay';
    } else if (urgentKeywords.some(keyword => symptomLower.includes(keyword))) {
      urgency = 'urgent';
      urgencyReason = 'Triệu chứng cần được khám sớm trong 1-2 ngày';
    } else {
      urgencyReason = 'Triệu chứng ở mức bình thường, có thể đặt lịch khám thường';
    }

    // Tăng confidence nếu có nhiều triệu chứng liên quan
    if (matchedSymptoms.length > 1) {
      confidence = Math.min(0.95, confidence + (matchedSymptoms.length * 0.05));
    }

    return {
      urgency,
      urgencyReason,
      recommendation: recommendedSpecialty,
      confidence,
      matchedSymptoms,
      foundSymptoms,
      allSpecialties: Object.keys(specialtyScores),
      analysisDetails: `Phân tích ${foundSymptoms.length} triệu chứng: ${matchedSymptoms.join(', ') || 'triệu chứng tổng quát'}`
    };
  };

  const showSpecialtyRecommendation = (analysis: any) => {
    // Icons và text theo mức độ cấp thiết
    let urgencyIcon, urgencyText, urgencyColor;

    switch (analysis.urgency) {
      case 'emergency':
        urgencyIcon = '🚨';
        urgencyText = 'KHẨN CẤP - CẦN KHÁM NGAY';
        urgencyColor = 'text-red-600';
        break;
      case 'urgent':
        urgencyIcon = '⚠️';
        urgencyText = 'CẦN KHÁM GẤP';
        urgencyColor = 'text-orange-600';
        break;
      default:
        urgencyIcon = '✅';
        urgencyText = 'KHÁM BÌNH THƯỜNG';
        urgencyColor = 'text-green-600';
    }

    setCurrentStep(3); // Chuyển sang bước chọn lịch khám

    // Tạo thông tin chi tiết về triệu chứng được phân tích
    const symptomDetails = analysis.foundSymptoms && analysis.foundSymptoms.length > 0
      ? analysis.foundSymptoms.map(s => `• ${s.symptom} → ${s.specialty}`).join('\n')
      : `• ${analysis.matchedSymptoms.join(', ')} → ${analysis.recommendation}`;

    const message = `🤖 **KẾT QUẢ PHÂN TÍCH AI HOÀN TẤT**

${urgencyIcon} **Mức độ cấp thiết:** ${urgencyText}
💡 **Lý do:** ${analysis.urgencyReason}

🔍 **Triệu chứng đã phân tích:**
${symptomDetails}

🏥 **Chuyên khoa được đề xuất chính:** ${analysis.recommendation}
📊 **Độ tin cậy:** ${(analysis.confidence * 100).toFixed(0)}%

${analysis.allSpecialties && analysis.allSpecialties.length > 1 ?
  `🎯 **Các chuyên khoa liên quan khác:** ${analysis.allSpecialties.filter(s => s !== analysis.recommendation).join(', ')}` : ''
}

${analysis.urgency === 'emergency' ?
  '🚨 **CẢNH BÁO:** Triệu chứng có dấu hiệu nguy hiểm. Tôi sẽ ưu tiên tìm lịch khám NGAY LẬP TỨC!' :
  analysis.urgency === 'urgent' ?
  '⚠️ **LƯU Ý:** Triệu chứng cần được khám sớm. Tôi sẽ tìm lịch khám trong 1-2 ngày tới.' :
  '✅ **THÔNG TIN:** Triệu chứng ở mức bình thường. Bạn có thể chọn lịch khám phù hợp.'
}

**Bạn muốn khám chuyên khoa nào?**`;

    const buttons = [
      {
        id: 'accept_recommendation',
        label: `✅ Khám ${analysis.recommendation} (Đề xuất chính)`,
        value: analysis.recommendation,
        action: 'select_specialty'
      }
    ];

    // Thêm các chuyên khoa liên quan khác
    if (analysis.allSpecialties && analysis.allSpecialties.length > 1) {
      analysis.allSpecialties.forEach(specialty => {
        if (specialty !== analysis.recommendation) {
          buttons.push({
            id: `specialty_${specialty.toLowerCase().replace(/\s+/g, '_')}`,
            label: `🏥 Khám ${specialty}`,
            value: specialty,
            action: 'select_specialty'
          });
        }
      });
    }

    // Thêm tùy chọn khác
    buttons.push({
      id: 'choose_different',
      label: '🔄 Xem tất cả chuyên khoa',
      value: 'show_all_specialties',
      action: 'select_specialty'
    });

    // Thêm nút khẩn cấp nếu cần
    if (analysis.urgency === 'emergency') {
      buttons.unshift({
        id: 'emergency_booking',
        label: '🚨 ĐẶT LỊCH KHẨN CẤP',
        value: 'emergency',
        action: 'select_specialty'
      });
    }

    addBotMessage(message, buttons);
  };

  const handleSubmitPatientForm = async () => {
    // Validation khác nhau cho bệnh nhân cũ/mới
    if (patientFormData.isReturning) {
      if (!patientFormData.phone || !patientFormData.symptoms) {
        addBotMessage('❌ Vui lòng điền số điện thoại và triệu chứng.');
        return;
      }
    } else {
      if (!patientFormData.name || !patientFormData.age || !patientFormData.phone || !patientFormData.symptoms) {
        addBotMessage('❌ Vui lòng điền đầy đủ thông tin bắt buộc.');
        return;
      }
    }

    // Tạo session nếu chưa có
    let currentSession = session;
    if (!currentSession) {
      console.log('🔄 Creating session for patient form submission');
      currentSession = await createSession();
      if (!currentSession) {
        addBotMessage('❌ Không thể tạo phiên đặt lịch. Vui lòng thử lại.');
        return;
      }
    }

    // Cập nhật session với thông tin bệnh nhân
    console.log('💾 Saving patient data to session:', {
      name: patientFormData.name,
      phone: patientFormData.phone,
      email: patientFormData.email,
      symptoms: patientFormData.symptoms
    });

    await updateSession({
      step: 'analyzing_symptoms',
      patient_name: patientFormData.isReturning ? `Bệnh nhân cũ (${patientFormData.phone})` : patientFormData.name,
      patient_age: patientFormData.age ? parseInt(patientFormData.age) : null,
      patient_phone: patientFormData.phone,
      patient_email: patientFormData.email,
      symptoms: patientFormData.symptoms
    });

    // Ẩn form và chuyển bước
    setShowPatientForm(false);
    setCurrentStep(2);

    // Hiển thị thông tin đã nhận
    const infoDisplay = patientFormData.isReturning
      ? `📞 Số điện thoại: ${patientFormData.phone}\n🩺 Triệu chứng: ${patientFormData.symptoms}`
      : `👤 Họ tên: ${patientFormData.name}\n🎂 Tuổi: ${patientFormData.age}\n📞 Số điện thoại: ${patientFormData.phone}\n${patientFormData.email ? `📧 Email: ${patientFormData.email}\n` : ''}🩺 Triệu chứng: ${patientFormData.symptoms}`;

    addBotMessage(`✅ **Cảm ơn bạn đã cung cấp thông tin!**

📋 **Thông tin đã nhận:**
${infoDisplay}

🤖 **Bước tiếp theo:** AI sẽ phân tích triệu chứng và đề xuất chuyên khoa phù hợp.

⏱️ *Quá trình phân tích sẽ mất vài giây...*

💡 **Tùy chọn:** Bạn có thể bổ sung thêm thông tin để AI phân tích chính xác hơn.`, [
      {
        id: 'start_analysis',
        label: '🚀 Phân tích ngay với thông tin hiện tại',
        value: 'analyze',
        action: 'analyze_symptoms'
      },
      {
        id: 'add_details',
        label: '📝 Bổ sung chi tiết triệu chứng',
        value: 'details',
        action: 'collect_symptom_details'
      },
      {
        id: 'edit_info',
        label: '✏️ Sửa thông tin cơ bản',
        value: 'edit',
        action: 'collect_patient_info'
      }
    ]);
  };

  // ===== BƯỚC 3: ĐỀ XUẤT LỊCH KHÁM =====
  const handleSpecialtySelection = async (specialtyId: string, specialtyName: string) => {
    // Create session if not exists
    let currentSession = session;
    if (!currentSession) {
      currentSession = await createSession();
      if (!currentSession) {
        addBotMessage('Không thể tạo phiên đặt lịch. Vui lòng thử lại.');
        return;
      }
    }

    // Update session with specialty
    await updateSession({
      step: 'selecting_doctor',
      specialty: specialtyId
    });

    // Load doctors for this specialty
    try {
      const response = await fetch(`${chatbotApiUrl}?endpoint=doctors&specialty_id=${specialtyId}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setDoctors(data.data);
      } else {
        // Fallback với mock data sử dụng doctor IDs thực tế từ database
        const mockDoctors = [
          {
            doctor_id: 'CARD-DOC-202506-001',
            doctor_name: 'BS. Nguyễn Văn A',
            specialty_name: specialtyName,
            consultation_fee: 500000,
            experience_years: 15
          },
          {
            doctor_id: 'CARD-DOC-202506-002',
            doctor_name: 'BS. Trần Thị B',
            specialty_name: specialtyName,
            consultation_fee: 400000,
            experience_years: 10
          },
          {
            doctor_id: 'CARD-DOC-202506-003',
            doctor_name: 'BS. Lê Văn C',
            specialty_name: specialtyName,
            consultation_fee: 600000,
            experience_years: 20
          }
        ];
        setDoctors(mockDoctors);
        console.log('Using mock doctors data');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Sử dụng mock data khi có lỗi - với doctor IDs thực tế
      const mockDoctors = [
        {
          doctor_id: 'CARD-DOC-202506-001',
          doctor_name: 'BS. Nguyễn Văn A',
          specialty_name: specialtyName,
          consultation_fee: 500000,
          experience_years: 15
        },
        {
          doctor_id: 'CARD-DOC-202506-002',
          doctor_name: 'BS. Trần Thị B',
          specialty_name: specialtyName,
          consultation_fee: 400000,
          experience_years: 10
        }
      ];
      setDoctors(mockDoctors);
    }

    // Sử dụng doctors state thay vì data.data - với doctor IDs thực tế
    const currentDoctors = doctors.length > 0 ? doctors : [
      {
        doctor_id: 'CARD-DOC-202506-001',
        doctor_name: 'BS. Nguyễn Văn A',
        specialty_name: specialtyName,
        consultation_fee: 500000,
        experience_years: 15
      },
      {
        doctor_id: 'CARD-DOC-202506-002',
        doctor_name: 'BS. Trần Thị B',
        specialty_name: specialtyName,
        consultation_fee: 400000,
        experience_years: 10
      }
    ];

    // Tạo danh sách bác sĩ với thông tin chi tiết
    const doctorOptions = currentDoctors.map((doctor: any) => {
        const experienceText = doctor.experience_years > 1 ? `${doctor.experience_years} năm kinh nghiệm` : `${doctor.experience_years} năm kinh nghiệm`;
        const feeText = doctor.consultation_fee ? `${doctor.consultation_fee.toLocaleString()}đ` : 'Liên hệ';

        return {
          id: doctor.doctor_id,
          label: `👨‍⚕️ ${doctor.doctor_name}\n📚 ${experienceText} | 💰 ${feeText}`,
          value: doctor.doctor_id,
          action: 'select_doctor'
        };
      });

    // Kiểm tra và hiển thị danh sách bác sĩ
    if (currentDoctors.length > 0) {
      addBotMessage(
        `✅ Bạn đã chọn chuyên khoa: **${specialtyName}**

👨‍⚕️ Danh sách bác sĩ có sẵn (${currentDoctors.length} bác sĩ):`,
        doctorOptions
      );
    } else {
      addBotMessage(`❌ Hiện tại không có bác sĩ nào trong chuyên khoa **${specialtyName}**.

🔄 Vui lòng:
• Chọn chuyên khoa khác
• Thử lại sau
• Liên hệ hỗ trợ: 1900-xxxx

Bạn có muốn chọn chuyên khoa khác không?`, [
        {
          id: 'back_to_specialties',
          label: '🔙 Chọn chuyên khoa khác',
          value: 'restart',
          action: 'restart_booking'
        }
      ]);
    }
  };

  const handleDoctorSelection = async (doctorId: string, doctorLabel: string) => {
    console.log('🔍 DEBUG: Selecting doctor:', doctorId, doctorLabel);
    console.log('🔍 DEBUG: Current session before doctor selection:', session);

    // Tìm thông tin bác sĩ để lưu tên
    const selectedDoctor = doctors.find(d => d.doctor_id === doctorId);

    const updatedSession = await updateSession({
      step: 'selecting_date',
      doctor_id: doctorId,
      doctor_name: selectedDoctor?.doctor_name || doctorLabel,
      specialty_name: selectedDoctor?.specialty_name,
      consultation_fee: selectedDoctor?.consultation_fee
    });

    console.log('🔍 DEBUG: Session after doctor selection:', updatedSession);
    console.log('🔍 DEBUG: Doctor ID being saved:', doctorId);

    // Generate next 7 days (excluding weekends)
    const dates = [];
    const today = new Date();
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

    while (dates.length < 5) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        dates.push({
          id: currentDate.toISOString().split('T')[0],
          label: currentDate.toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          value: currentDate.toISOString().split('T')[0],
          action: 'select_date'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    addBotMessage(
      `Bạn đã chọn: ${doctorLabel}. Vui lòng chọn ngày khám:`,
      dates
    );
  };

  const handleDateSelection = async (date: string, dateLabel: string) => {
    console.log('Selecting date:', date, dateLabel);
    console.log('Current session before update:', session);

    // Cập nhật session và đợi kết quả
    const updatedSession = await updateSession({
      step: 'selecting_time',
      date: date
    });

    // Sử dụng session đã được cập nhật
    const currentSession = updatedSession || session;
    const doctorId = currentSession?.doctor_id;
    console.log('Doctor ID from updated session:', doctorId);
    console.log('Updated session:', currentSession);

    if (!doctorId) {
      console.error('No doctor ID found in session:', currentSession);
      addBotMessage('❌ Không tìm thấy thông tin bác sĩ. Vui lòng chọn lại bác sĩ.');
      return;
    }

    const apiUrl = `${chatbotApiUrl}?endpoint=slots&doctor_id=${doctorId}&date=${date}`;
    console.log('Fetching time slots from:', apiUrl);

    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log('Time slots response:', data);
    
    if (data.success && (data.data.morning.length > 0 || data.data.afternoon.length > 0)) {
      setTimeSlots(data.data);

      // Tạo message với time slots được phân chia theo buổi
      let timeMessage = `✅ Bạn đã chọn ngày: **${dateLabel}**\n\n⏰ **Chọn giờ khám phù hợp:**\n\n`;

      if (data.data.morning.length > 0) {
        timeMessage += `🌅 **Buổi sáng:**\n`;
        data.data.morning.forEach((slot: TimeSlot) => {
          timeMessage += `• ${slot.time_display}\n`;
        });
        timeMessage += '\n';
      }

      if (data.data.afternoon.length > 0) {
        timeMessage += `🌇 **Buổi chiều:**\n`;
        data.data.afternoon.forEach((slot: TimeSlot) => {
          timeMessage += `• ${slot.time_display}\n`;
        });
      }

      const allSlots = [...data.data.morning, ...data.data.afternoon];
      addBotMessage(
        timeMessage,
        allSlots.map((slot: TimeSlot) => ({
          id: slot.slot_id,
          label: `${slot.time_display} ${slot.is_morning ? '🌅' : '🌇'}`,
          value: slot.start_time,
          action: 'select_time'
        }))
      );
    } else {
      addBotMessage(`❌ **Ngày ${dateLabel} không có lịch trống**\n\n🔄 Vui lòng:\n• Chọn ngày khác\n• Thử bác sĩ khác\n• Liên hệ hỗ trợ: 1900-xxxx`, [
        {
          id: 'back_to_dates',
          label: '📅 Chọn ngày khác',
          value: 'back',
          action: 'select_date'
        }
      ]);
    }
  };

  const handleTimeSelection = async (time: string, timeLabel: string) => {
    // Parse time để lấy start_time và end_time
    const [startTime, endTime] = timeLabel.split(' - ');

    await updateSession({
      step: 'confirming_booking',
      selected_time: startTime,
      selected_time_display: timeLabel,
      start_time: startTime,
      end_time: endTime
    });

    setCurrentStep(4); // Chuyển sang bước xác nhận cuối

    // Tìm thông tin bác sĩ để hiển thị chi tiết
    const selectedDoctor = doctors.find(d => d.doctor_id === session?.doctor_id);
    const feeText = selectedDoctor?.consultation_fee ? `${selectedDoctor.consultation_fee.toLocaleString()}đ` : 'Liên hệ';

    // Hiển thị tóm tắt đặt lịch để xác nhận
    const summary = `✅ **XÁC NHẬN THÔNG TIN ĐẶT LỊCH**

👤 **Thông tin bệnh nhân:**
• Họ tên: ${session?.patient_name}
• Tuổi: ${session?.patient_age}
• Số điện thoại: ${session?.patient_phone}
${session?.patient_email ? `• Email: ${session.patient_email}` : ''}

🩺 **Triệu chứng:** ${session?.symptoms}

👨‍⚕️ **Thông tin khám:**
• Bác sĩ: ${session?.doctor_name}
• Chuyên khoa: ${session?.specialty_name}
• Ngày khám: ${session?.date}
• Giờ khám: ${timeLabel}
• Chi phí: ${feeText}

⚠️ **Lưu ý quan trọng:**
• Vui lòng đến đúng giờ hẹn
• Mang theo giấy tờ tùy thân
• Có thể hủy/đổi lịch trước 24h

**Vui lòng kiểm tra kỹ thông tin trước khi xác nhận:**

⚠️ **LƯU Ý QUAN TRỌNG:**
• Sau khi xác nhận, lịch khám sẽ được tạo ngay lập tức
• Bạn sẽ nhận được mã xác nhận qua SMS/Email
• Có thể hủy/đổi lịch trước 24h qua hotline
• Vui lòng đến đúng giờ và mang theo giấy tờ tùy thân

**Bạn có chắc chắn muốn đặt lịch này không?**`;

    addBotMessage(summary, [
      {
        id: 'final_review',
        label: '📋 Xem lại thông tin chi tiết',
        value: 'review',
        action: 'show_booking_review'
      },
      {
        id: 'confirm_final',
        label: '✅ XÁC NHẬN ĐẶT LỊCH NGAY',
        value: 'confirm',
        action: 'confirm_booking'
      },
      {
        id: 'edit_info',
        label: '✏️ Sửa thông tin',
        value: 'edit',
        action: 'restart_booking'
      },
      {
        id: 'cancel_booking',
        label: '❌ Hủy đặt lịch',
        value: 'cancel',
        action: 'cancel_booking'
      }
    ]);

    // Cập nhật session với consultation fee
    await updateSession({
      consultation_fee: selectedDoctor?.consultation_fee
    });
  };

  const handleBookingConfirmation = async () => {
    if (!session) {
      addBotMessage('❌ Không tìm thấy thông tin phiên đặt lịch.');
      return;
    }

    try {
      console.log('🔍 DEBUG: Session before booking:', JSON.stringify(session, null, 2));
      console.log('🔍 DEBUG: Patient name:', session.patient_name);
      console.log('🔍 DEBUG: Doctor name:', session.doctor_name);
      console.log('🔍 DEBUG: Selected time:', session.selected_time);
      console.log('🔍 DEBUG: Selected time display:', session.selected_time_display);
      console.log('🔍 DEBUG: Doctor ID:', session.doctor_id);

      // Validate required data before booking
      const missingData = [];
      if (!session.patient_name) missingData.push('Tên bệnh nhân');
      if (!session.patient_phone) missingData.push('Số điện thoại');
      if (!session.doctor_id) missingData.push('Bác sĩ');
      if (!session.date) missingData.push('Ngày khám');
      if (!session.selected_time && !session.start_time) missingData.push('Giờ khám');

      if (missingData.length > 0) {
        console.error('❌ Missing required data:', missingData);
        addBotMessage(`❌ **Thiếu thông tin bắt buộc:**\n\n${missingData.map(item => `• ${item}`).join('\n')}\n\nVui lòng bắt đầu lại quy trình đặt lịch.`, [
          {
            id: 'restart_booking',
            label: '🔄 Bắt đầu lại',
            value: 'restart',
            action: 'restart_booking'
          }
        ]);
        return;
      }

      const bookingData = {
        session_id: session.session_id,
        patient_name: session.patient_name,
        patient_phone: session.patient_phone,
        patient_email: session.patient_email,
        doctor_id: session.doctor_id,
        appointment_date: session.date,
        start_time: session.start_time || session.selected_time,
        end_time: session.end_time || calculateEndTime(session.selected_time || '09:00'),
        symptoms: session.symptoms,
        appointment_type: 'consultation',
        status: 'scheduled',
        reason: session.symptoms || 'Khám bệnh qua chatbot'
      };

      console.log('Booking data to send:', bookingData);

      const response = await fetch(`${chatbotApiUrl}?endpoint=book-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (data.success) {
        // Get appointment data from response
        const appointment = data.data.appointment;

        // Use data from both session and appointment response
        const patientName = session.patient_name || bookingData.patient_name || 'Không có tên';
        const doctorName = session.doctor_name || 'Không có tên bác sĩ';
        const appointmentDate = session.date || appointment?.appointment_date || 'Không có ngày';
        const appointmentTime = session.selected_time_display ||
                               `${appointment?.start_time || 'Không có giờ'} - ${appointment?.end_time || ''}`;
        const patientPhone = session.patient_phone || bookingData.patient_phone || 'Không có SĐT';

        console.log('📋 Success message data:', {
          patientName,
          doctorName,
          appointmentDate,
          appointmentTime,
          patientPhone,
          sessionData: session,
          appointmentData: appointment
        });

        addBotMessage(`🎉 **ĐẶT LỊCH THÀNH CÔNG!**

📋 **Thông tin lịch khám:**
• Mã xác nhận: **${data.data.confirmation_code}**
• Bệnh nhân: ${patientName}
• Bác sĩ: ${doctorName}
• Ngày khám: ${appointmentDate}
• Giờ khám: ${appointmentTime}
• Loại khám: Tư vấn qua chatbot

📧 **Thông báo đã được gửi qua:**
• SMS: ${patientPhone}
${session.patient_email ? `• Email: ${session.patient_email}` : ''}

⚠️ **Lưu ý quan trọng:**
• Vui lòng đến đúng giờ hẹn
• Mang theo giấy tờ tùy thân
• Có thể hủy/đổi lịch trước 24h

🏥 **Cảm ơn bạn đã sử dụng dịch vụ!**`, [
          {
            id: 'new_booking',
            label: '🆕 Đặt lịch mới',
            value: 'restart',
            action: 'restart_booking'
          }
        ]);

        // Reset session và xóa dữ liệu đã lưu
        setSession(null);
        clearSavedData();
        setCurrentStep(1);
      } else {
        addBotMessage(`❌ **Đặt lịch thất bại**

Lỗi: ${data.error}

🔄 Vui lòng thử lại hoặc liên hệ hỗ trợ: 1900-xxxx`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      addBotMessage('❌ Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
    }
  };

  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 30); // 30 minutes appointment
    return endDate.toTimeString().slice(0, 5);
  };

  // Navigation functions
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Logic để quay lại bước trước
      switch (currentStep - 1) {
        case 1:
          setShowPatientForm(true);
          break;
        case 2:
          // Quay lại phân tích triệu chứng
          break;
        case 3:
          // Quay lại chọn lịch
          break;
      }
    }
  };

  const skipCurrentStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      addBotMessage(`⏭️ **Đã bỏ qua bước ${stepLabels[currentStep - 1]}**\n\nChuyển sang: **${stepLabels[currentStep]}**`);
    }
  };

  // Progress Bar Component
  const ProgressBar = () => (
    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Bước {currentStep}/{totalSteps}: {stepLabels[currentStep - 1]}
        </span>
        <span className="text-xs text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex justify-between flex-1 text-xs text-gray-500">
          {stepLabels.map((label, index) => (
            <span
              key={index}
              className={`${index < currentStep ? 'text-blue-600 font-medium' : ''}`}
            >
              {index + 1}
            </span>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex space-x-2 ml-4">
          {currentStep > 1 && (
            <Button
              onClick={goToPreviousStep}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
            >
              ← Quay lại
            </Button>
          )}

          {currentStep < totalSteps && currentStep !== 1 && (
            <Button
              onClick={skipCurrentStep}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-gray-500"
            >
              Bỏ qua →
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const handleShowBookingReview = () => {
    if (!session) {
      addBotMessage('❌ Không tìm thấy thông tin phiên đặt lịch.');
      return;
    }

    const selectedDoctor = doctors.find(d => d.doctor_id === session?.doctor_id);
    const feeText = selectedDoctor?.consultation_fee ? `${selectedDoctor.consultation_fee.toLocaleString()}đ` : 'Liên hệ';

    const reviewMessage = `📋 **THÔNG TIN ĐẶT LỊCH CHI TIẾT**

👤 **THÔNG TIN BỆNH NHÂN:**
• Họ tên: ${session.patient_name}
• Tuổi: ${session.patient_age} tuổi
• Số điện thoại: ${session.patient_phone}
${session.patient_email ? `• Email: ${session.patient_email}` : ''}

🩺 **TRIỆU CHỨNG & PHÂN TÍCH:**
• Triệu chứng: ${session.symptoms}
• Mức độ cấp thiết: ${session.urgency_level || 'Bình thường'}
• AI đề xuất: ${session.ai_recommendation || session.specialty_name}

👨‍⚕️ **THÔNG TIN LỊCH KHÁM:**
• Bác sĩ: ${session.doctor_name}
• Chuyên khoa: ${session.specialty_name}
• Ngày khám: ${session.date}
• Giờ khám: ${session.selected_time}
• Thời gian dự kiến: 30 phút
• Chi phí khám: ${feeText}

🏥 **THÔNG TIN BỆNH VIỆN:**
• Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM
• Hotline: 1900-xxxx
• Email: info@hospital.com

💳 **THANH TOÁN:**
• Phương thức: Thanh toán tại quầy
• Có thể thanh toán online sau khi đặt lịch

**Tất cả thông tin đã chính xác chưa?**`;

    addBotMessage(reviewMessage, [
      {
        id: 'confirm_after_review',
        label: '✅ Thông tin chính xác - ĐẶT LỊCH',
        value: 'confirm',
        action: 'confirm_booking'
      },
      {
        id: 'edit_patient_info',
        label: '✏️ Sửa thông tin bệnh nhân',
        value: 'edit_patient',
        action: 'collect_patient_info'
      },
      {
        id: 'change_doctor',
        label: '👨‍⚕️ Đổi bác sĩ/thời gian',
        value: 'change_doctor',
        action: 'select_doctor'
      },
      {
        id: 'cancel_booking',
        label: '❌ Hủy đặt lịch',
        value: 'cancel',
        action: 'cancel_booking'
      }
    ]);
  };

  const handleBookingCancellation = () => {
    setSession(null);
    clearSavedData();
    setCurrentStep(1);
    addBotMessage('❌ **Đặt lịch đã được hủy**\n\nBạn có thể bắt đầu lại quy trình đặt lịch bất kỳ lúc nào.', [
      {
        id: 'restart',
        label: '🔄 Bắt đầu lại',
        value: 'restart',
        action: 'restart_booking'
      }
    ]);
  };

  const handleRestartBooking = () => {
    setSession(null);
    setSpecialties([]);
    setDoctors([]);
    setTimeSlots({ morning: [], afternoon: [] });

    // Khởi tạo lại chatbot
    initializeChat();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    setInputValue('');

    // Simple response for free text
    addBotMessage('Cảm ơn bạn đã nhắn tin. Hiện tại tôi chỉ hỗ trợ đặt lịch qua các lựa chọn có sẵn. Vui lòng chọn từ menu bên trên.');
  };

  return (
    <>
      <style jsx>{`
        .user-message {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 18px 18px 4px 18px;
          box-shadow: 0 2px 8px rgba(8, 145, 178, 0.3);
          max-width: 80%;
        }

        .bot-message {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #1e293b;
          padding: 12px 16px;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          max-width: 85%;
        }

        .option-button {
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #0891b2;
          color: #0891b2;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .option-button:hover {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
        }

        .option-button:active {
          transform: translateY(0);
        }
      `}</style>

      {/* AI Assistant Buttons */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
          {/* Đặt lịch AI Button */}
          <div className="flex flex-col items-center">
            <Button
              onClick={() => setInternalIsOpen(true)}
              className="h-16 w-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl border-2 border-white"
              size="icon"
            >
              <Calendar className="h-7 w-7 text-white" />
            </Button>
            <span className="text-xs text-gray-700 mt-2 font-semibold bg-white px-3 py-1.5 rounded-full shadow-md border">
              🗓️ Đặt lịch AI
            </span>
          </div>

          {/* Tư vấn AI Button */}
          <div className="flex flex-col items-center">
            <Button
              onClick={() => {
                // Redirect to existing chat system or open consultation
                console.log('Opening AI Consultation...');
              }}
              className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl border-2 border-white"
              size="icon"
            >
              <Stethoscope className="h-7 w-7 text-white" />
            </Button>
            <span className="text-xs text-gray-700 mt-2 font-semibold bg-white px-3 py-1.5 rounded-full shadow-md border">
              🩺 Tư vấn AI
            </span>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className={`fixed shadow-2xl z-50 flex flex-col border-0 overflow-hidden ${
          isFullscreen
            ? 'inset-4 w-auto h-auto'
            : 'bottom-6 right-6 sm:right-24 w-[95vw] sm:w-96 h-[85vh] sm:h-[650px] max-w-md'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-lg">Trợ lý đặt lịch AI</span>
                <div className="text-xs text-teal-100">Hỗ trợ đặt lịch khám bệnh</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Debug Session Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Current session:', session);
                  console.log('Current step:', currentStep);
                  console.log('Messages count:', messages.length);
                  addBotMessage(`🔧 **DEBUG INFO**\n\nSession ID: ${session?.session_id || 'None'}\nDoctor ID: ${session?.doctor_id || 'None'}\nStep: ${session?.step || 'None'}\nDate: ${session?.date || 'None'}`);
                }}
                className="text-white hover:bg-white/20 p-1"
              >
                🔧
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 transition-colors"
                title={isFullscreen ? "Thu nhỏ" : "Mở rộng"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              {/* Close Button */}
              <Button
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setInternalIsOpen(false);
                  }
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-red-500/20 transition-colors"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {session && (
            <div className="px-4 pt-3 bg-white border-b border-gray-100">
              <ProgressBar />
            </div>
          )}

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.type === 'user'
                      ? 'user-message'
                      : 'bot-message'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Options */}
                  {message.options && message.options.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {message.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleOptionClick(option)}
                          disabled={isLoading}
                          className="option-button disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="whitespace-pre-wrap">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 p-4 rounded-2xl flex items-center space-x-3 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                  <span className="text-teal-700 font-medium">Đang xử lý yêu cầu...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Patient Information Form */}
          {showPatientForm && (
            <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  📝 Thông tin bệnh nhân
                </h3>

                <div className="space-y-3">
                  {/* Hiển thị khác nhau cho bệnh nhân cũ/mới */}
                  {patientFormData.isReturning ? (
                    // Form cho bệnh nhân cũ - chỉ cần SĐT
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 mb-3">
                        🔍 Chúng tôi sẽ tra cứu thông tin của bạn qua số điện thoại
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📞 Số điện thoại đã đăng ký *
                        </label>
                        <Input
                          value={patientFormData.phone}
                          onChange={(e) => setPatientFormData({...patientFormData, phone: e.target.value})}
                          placeholder="0901234567"
                          type="tel"
                          className="w-full"
                        />
                      </div>
                    </div>
                  ) : (
                    // Form đầy đủ cho bệnh nhân mới
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          👤 Họ và tên *
                        </label>
                        <Input
                          value={patientFormData.name}
                          onChange={(e) => setPatientFormData({...patientFormData, name: e.target.value})}
                          placeholder="Nhập họ và tên đầy đủ"
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            🎂 Tuổi *
                          </label>
                          <Input
                            value={patientFormData.age}
                            onChange={(e) => setPatientFormData({...patientFormData, age: e.target.value})}
                            placeholder="Tuổi"
                            type="number"
                            min="1"
                            max="120"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            📞 Số điện thoại *
                          </label>
                          <Input
                            value={patientFormData.phone}
                            onChange={(e) => setPatientFormData({...patientFormData, phone: e.target.value})}
                            placeholder="0901234567"
                            type="tel"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📧 Email (tùy chọn)
                        </label>
                        <Input
                          value={patientFormData.email}
                          onChange={(e) => setPatientFormData({...patientFormData, email: e.target.value})}
                          placeholder="email@example.com"
                          type="email"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🩺 Triệu chứng hiện tại *
                    </label>
                    <textarea
                      value={patientFormData.symptoms}
                      onChange={(e) => setPatientFormData({...patientFormData, symptoms: e.target.value})}
                      placeholder="Mô tả chi tiết triệu chứng, thời gian xuất hiện, mức độ..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                    <Button
                      onClick={handleSubmitPatientForm}
                      disabled={
                        patientFormData.isReturning
                          ? (!patientFormData.phone || !patientFormData.symptoms)
                          : (!patientFormData.name || !patientFormData.age || !patientFormData.phone || !patientFormData.symptoms)
                      }
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-sm sm:text-base"
                    >
                      ✅ {patientFormData.isReturning ? 'Tra cứu & Tiếp tục' : 'Xác nhận thông tin'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPatientForm(false);
                        setCurrentStep(1);
                      }}
                      variant="outline"
                      className="px-4 text-sm sm:text-base"
                    >
                      ❌ Hủy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn hoặc chọn từ menu..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="flex-1 border-2 border-teal-200 focus:border-teal-500 rounded-xl px-4 py-2"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={isLoading || !inputValue.trim()}
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              💡 Sử dụng các nút bên trên để đặt lịch nhanh chóng
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default ChatbotBookingWidget;
