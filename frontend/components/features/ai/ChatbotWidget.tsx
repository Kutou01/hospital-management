'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Calendar, Stethoscope, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type?: 'text' | 'quick-reply' | 'booking-link';
    quickReplies?: string[];
    bookingData?: {
        specialty: string;
        urgency: 'low' | 'medium' | 'high';
        suggestedDoctors?: string[];
    };
}

interface ChatbotWidgetProps {
    language?: 'vi' | 'en';
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ language = 'vi' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>(language);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const translations = {
        vi: {
            title: 'HealthblockBot',
            subtitle: 'Trợ lý y tế thông minh',
            placeholder: 'Nhập câu hỏi của bạn...',
            send: 'Gửi',
            greeting: 'Xin chào! Tôi là HealthblockBot. Tôi có thể giúp bạn:',
            options: [
                '📅 Đặt lịch khám',
                '🩺 Tư vấn triệu chứng',
                '🏥 Thông tin bệnh viện',
                '💊 Hướng dẫn thuốc'
            ],
            typing: 'Đang nhập...'
        },
        en: {
            title: 'HealthblockBot',
            subtitle: 'Smart Medical Assistant',
            placeholder: 'Type your question...',
            send: 'Send',
            greeting: 'Hello! I\'m HealthblockBot. I can help you with:',
            options: [
                '📅 Book Appointment',
                '🩺 Symptom Consultation',
                '🏥 Hospital Information',
                '💊 Medication Guide'
            ],
            typing: 'Typing...'
        }
    };

    const t = translations[currentLanguage];

    // Initialize with greeting message
    useEffect(() => {
        if (messages.length === 0) {
            const greetingMessage: Message = {
                id: 'greeting',
                text: t.greeting,
                sender: 'bot',
                timestamp: new Date(),
                type: 'quick-reply',
                quickReplies: t.options
            };
            setMessages([greetingMessage]);
        }
    }, [currentLanguage]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Simulate bot response delay
        setTimeout(() => {
            const botResponse = generateBotResponse(text);
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1000 + Math.random() * 1000);
    };

    const generateBotResponse = (userInput: string): Message => {
        const input = userInput.toLowerCase();
        
        // Symptom analysis patterns
        const symptomPatterns = {
            vi: {
                'đau đầu|nhức đầu|đau nửa đầu': {
                    specialty: 'Thần kinh',
                    urgency: 'medium' as const,
                    response: 'Tôi hiểu bạn đang bị đau đầu. Dựa trên triệu chứng này, tôi khuyên bạn nên khám tại khoa Thần kinh. Mức độ khẩn cấp: Trung bình.',
                    doctors: ['BS. Nguyễn Văn A', 'BS. Trần Thị B']
                },
                'đau bụng|đau dạ dày|buồn nôn': {
                    specialty: 'Tiêu hóa',
                    urgency: 'medium' as const,
                    response: 'Triệu chứng đau bụng có thể liên quan đến hệ tiêu hóa. Tôi khuyên bạn khám tại khoa Tiêu hóa.',
                    doctors: ['BS. Lê Văn C', 'BS. Phạm Thị D']
                },
                'ho|sốt|khó thở': {
                    specialty: 'Hô hấp',
                    urgency: 'high' as const,
                    response: 'Triệu chứng hô hấp cần được khám ngay. Mức độ khẩn cấp: Cao. Vui lòng đặt lịch sớm nhất có thể.',
                    doctors: ['BS. Hoàng Văn E', 'BS. Vũ Thị F']
                }
            },
            en: {
                'headache|migraine|head pain': {
                    specialty: 'Neurology',
                    urgency: 'medium' as const,
                    response: 'I understand you have a headache. Based on this symptom, I recommend seeing a Neurologist. Urgency level: Medium.',
                    doctors: ['Dr. Nguyen Van A', 'Dr. Tran Thi B']
                },
                'stomach pain|nausea|abdominal pain': {
                    specialty: 'Gastroenterology',
                    urgency: 'medium' as const,
                    response: 'Stomach pain may be related to digestive issues. I recommend seeing a Gastroenterologist.',
                    doctors: ['Dr. Le Van C', 'Dr. Pham Thi D']
                },
                'cough|fever|breathing difficulty': {
                    specialty: 'Pulmonology',
                    urgency: 'high' as const,
                    response: 'Respiratory symptoms need immediate attention. Urgency level: High. Please book an appointment as soon as possible.',
                    doctors: ['Dr. Hoang Van E', 'Dr. Vu Thi F']
                }
            }
        };

        // Check for symptom patterns
        for (const [pattern, data] of Object.entries(symptomPatterns[currentLanguage])) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(input)) {
                return {
                    id: Date.now().toString(),
                    text: data.response,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'booking-link',
                    bookingData: {
                        specialty: data.specialty,
                        urgency: data.urgency,
                        suggestedDoctors: data.doctors
                    }
                };
            }
        }

        // Booking patterns
        if (currentLanguage === 'vi') {
            if (input.includes('đặt lịch') || input.includes('book') || input.includes('hẹn khám')) {
                return {
                    id: Date.now().toString(),
                    text: 'Tôi sẽ giúp bạn đặt lịch khám. Bạn có triệu chứng gì không? Hoặc bạn muốn khám khoa nào?',
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'quick-reply',
                    quickReplies: ['Khám tổng quát', 'Tim mạch', 'Thần kinh', 'Tiêu hóa', 'Hô hấp']
                };
            }

            if (input.includes('giờ làm việc') || input.includes('thời gian')) {
                return {
                    id: Date.now().toString(),
                    text: 'Bệnh viện làm việc:\n🕐 Thứ 2-6: 7:00 - 17:00\n🕐 Thứ 7: 7:00 - 12:00\n🕐 Chủ nhật: Cấp cứu 24/7\n\nThời gian ít đông đúc nhất: 8:00-9:00 và 14:00-15:00',
                    sender: 'bot',
                    timestamp: new Date()
                };
            }
        }

        // Default responses
        const defaultResponses = {
            vi: [
                'Tôi hiểu bạn cần hỗ trợ. Bạn có thể mô tả rõ hơn triệu chứng hoặc vấn đề của mình không?',
                'Để tôi có thể hỗ trợ tốt hơn, bạn có thể cho biết bạn cần tư vấn về vấn đề gì?',
                'Tôi sẵn sàng giúp bạn. Vui lòng mô tả chi tiết hơn về tình trạng sức khỏe của bạn.'
            ],
            en: [
                'I understand you need assistance. Could you describe your symptoms or concerns in more detail?',
                'To better assist you, could you tell me what you need consultation about?',
                'I\'m ready to help you. Please describe your health condition in more detail.'
            ]
        };

        const responses = defaultResponses[currentLanguage];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        return {
            id: Date.now().toString(),
            text: randomResponse,
            sender: 'bot',
            timestamp: new Date()
        };
    };

    const handleQuickReply = (reply: string) => {
        handleSendMessage(reply);
    };

    const handleBookingAction = (bookingData: any) => {
        // Navigate to booking page with pre-filled data
        const params = new URLSearchParams({
            specialty: bookingData.specialty,
            urgency: bookingData.urgency
        });
        window.open(`/patient/booking?${params.toString()}`, '_blank');
    };

    return (
        <>
            {/* Chat Widget Button */}
            <motion.div
                className="fixed bottom-6 right-6 z-50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 }}
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
                    size="lg"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                </Button>
            </motion.div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed bottom-24 right-6 w-96 h-[500px] z-40"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="h-full shadow-2xl border-0">
                            {/* Header */}
                            <CardHeader className="bg-blue-600 text-white rounded-t-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{t.title}</h3>
                                        <p className="text-sm opacity-90">{t.subtitle}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentLanguage(currentLanguage === 'vi' ? 'en' : 'vi')}
                                            className="text-white hover:bg-blue-700 text-xs"
                                        >
                                            {currentLanguage === 'vi' ? 'EN' : 'VI'}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Messages */}
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <div className="h-80 overflow-y-auto p-4 space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}>
                                                    {message.sender === 'user' ? 
                                                        <User className="h-4 w-4 text-white" /> : 
                                                        <Bot className="h-4 w-4 text-gray-600" />
                                                    }
                                                </div>
                                                <div className={`rounded-lg p-3 ${
                                                    message.sender === 'user' 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                                                    
                                                    {/* Quick Replies */}
                                                    {message.quickReplies && (
                                                        <div className="mt-2 space-y-1">
                                                            {message.quickReplies.map((reply, index) => (
                                                                <Button
                                                                    key={index}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleQuickReply(reply)}
                                                                    className="w-full text-left justify-start text-xs"
                                                                >
                                                                    {reply}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Booking Action */}
                                                    {message.bookingData && (
                                                        <div className="mt-2">
                                                            <Button
                                                                onClick={() => handleBookingAction(message.bookingData)}
                                                                className="w-full text-xs"
                                                                size="sm"
                                                            >
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {currentLanguage === 'vi' ? 'Đặt lịch ngay' : 'Book Now'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Typing indicator */}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <Bot className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <div className="bg-gray-100 rounded-lg p-3">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <Input
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder={t.placeholder}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={() => handleSendMessage(inputText)}
                                            disabled={!inputText.trim()}
                                            size="sm"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatbotWidget;
