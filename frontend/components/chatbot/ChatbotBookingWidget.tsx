'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Calendar, Clock, User, Stethoscope, Send, Loader2 } from 'lucide-react';
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
  selected_specialty?: string;
  selected_doctor_id?: string;
  doctor_name?: string;
  specialty_name?: string;
  selected_date?: string;
  selected_time?: string;
  symptoms?: string;
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

const ChatbotBookingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<BookingSession | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ morning: TimeSlot[], afternoon: TimeSlot[] }>({ morning: [], afternoon: [] });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotApiUrl = process.env.NEXT_PUBLIC_CHATBOT_BOOKING_API || 'http://localhost:3005/api';

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  const initializeChat = async () => {
    try {
      // Load specialties
      const response = await fetch(`${chatbotApiUrl}/specialties`);
      const data = await response.json();
      
      if (data.success) {
        setSpecialties(data.data);
        
        // Add welcome message
        addBotMessage(
          'Xin chào! Tôi là trợ lý ảo của bệnh viện. Tôi sẽ giúp bạn đặt lịch khám bệnh. 👋',
          data.data.map((specialty: Specialty) => ({
            id: specialty.specialty_id,
            label: specialty.name_vi,
            value: specialty.specialty_id,
            action: 'select_specialty'
          }))
        );
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      addBotMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  const addBotMessage = (content: string, options?: ChatOption[]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, message]);
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

  const createSession = async (patientId: string = 'PAT-TEST-001') => {
    try {
      const response = await fetch(`${chatbotApiUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId })
      });
      
      const data = await response.json();
      if (data.success) {
        setSession(data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
    return null;
  };

  const updateSession = async (updates: Partial<BookingSession>) => {
    if (!session) return;
    
    try {
      const response = await fetch(`${chatbotApiUrl}/session/${session.session_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (data.success) {
        setSession(prev => ({ ...prev, ...data.data }));
        return data.data;
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const handleOptionClick = async (option: ChatOption) => {
    setIsLoading(true);
    addUserMessage(option.label);

    try {
      switch (option.action) {
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
        case 'confirm_booking':
          await handleBookingConfirmation();
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
    const response = await fetch(`${chatbotApiUrl}/doctors?specialty_id=${specialtyId}`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      setDoctors(data.data);
      addBotMessage(
        `Bạn đã chọn chuyên khoa: ${specialtyName}. Vui lòng chọn bác sĩ:`,
        data.data.map((doctor: Doctor) => ({
          id: doctor.doctor_id,
          label: `${doctor.doctor_name} - ${doctor.experience_years} năm kinh nghiệm - ${doctor.consultation_fee.toLocaleString()}đ`,
          value: doctor.doctor_id,
          action: 'select_doctor'
        }))
      );
    } else {
      addBotMessage('Hiện tại không có bác sĩ nào trong chuyên khoa này. Vui lòng chọn chuyên khoa khác.');
    }
  };

  const handleDoctorSelection = async (doctorId: string, doctorLabel: string) => {
    await updateSession({
      step: 'selecting_date',
      doctor_id: doctorId
    });

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
    await updateSession({
      step: 'selecting_time',
      date: date
    });

    // Load time slots for selected doctor and date
    const doctorId = session?.selected_doctor_id;
    if (!doctorId) return;

    const response = await fetch(`${chatbotApiUrl}/slots/${doctorId}/${date}`);
    const data = await response.json();
    
    if (data.success && (data.data.morning.length > 0 || data.data.afternoon.length > 0)) {
      setTimeSlots(data.data);
      
      const allSlots = [...data.data.morning, ...data.data.afternoon];
      addBotMessage(
        `Bạn đã chọn ngày: ${dateLabel}. Vui lòng chọn giờ khám:`,
        allSlots.map((slot: TimeSlot) => ({
          id: slot.slot_id,
          label: `${slot.time_display} ${slot.is_morning ? '(Sáng)' : '(Chiều)'}`,
          value: slot.start_time,
          action: 'select_time'
        }))
      );
    } else {
      addBotMessage('Ngày này không có lịch trống. Vui lòng chọn ngày khác.');
    }
  };

  const handleTimeSelection = async (time: string, timeLabel: string) => {
    await updateSession({
      step: 'confirming',
      time: time
    });

    // Show booking summary
    const summary = `
📋 **Thông tin đặt lịch:**
👨‍⚕️ Bác sĩ: ${session?.doctor_name}
🏥 Chuyên khoa: ${session?.specialty_name}
📅 Ngày: ${session?.selected_date}
⏰ Giờ: ${timeLabel}

Bạn có muốn xác nhận đặt lịch này không?
    `;

    addBotMessage(summary, [
      {
        id: 'confirm',
        label: '✅ Xác nhận đặt lịch',
        value: 'confirm',
        action: 'confirm_booking'
      },
      {
        id: 'cancel',
        label: '❌ Hủy và đặt lại',
        value: 'cancel',
        action: 'restart'
      }
    ]);
  };

  const handleBookingConfirmation = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${chatbotApiUrl}/appointment/${session.session_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const appointmentInfo = data.data.appointment_info;
        addBotMessage(`
🎉 **Đặt lịch thành công!**

📋 Mã lịch hẹn: ${data.data.appointment_id}
👨‍⚕️ Bác sĩ: ${appointmentInfo.doctor_name}
🏥 Chuyên khoa: ${appointmentInfo.specialty}
📅 Ngày: ${appointmentInfo.appointment_date}
⏰ Giờ: ${appointmentInfo.start_time} - ${appointmentInfo.end_time}
💰 Chi phí: ${appointmentInfo.consultation_fee?.toLocaleString()}đ

Vui lòng đến đúng giờ và mang theo giấy tờ tùy thân. Cảm ơn bạn đã sử dụng dịch vụ! 🙏
        `);
        
        // Reset session
        setSession(null);
      } else {
        addBotMessage(`Có lỗi khi đặt lịch: ${data.message}`);
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      addBotMessage('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
    }
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
      {/* Chat Widget Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5" />
              <span className="font-semibold">Trợ lý đặt lịch</span>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-blue-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Options */}
                  {message.options && message.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.options.map((option) => (
                        <Button
                          key={option.id}
                          onClick={() => handleOptionClick(option)}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2 whitespace-normal"
                          disabled={isLoading}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default ChatbotBookingWidget;
