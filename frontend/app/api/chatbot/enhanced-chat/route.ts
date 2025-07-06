import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversation_history, user_id } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Message is required',
        error: 'INVALID_INPUT'
      }, { status: 400 });
    }

    // Call unified enhanced chatbot API
    // Use enhanced chatbot API with fixed Vietnamese NLP
    const CHATBOT_API_URL = process.env.NEXT_PUBLIC_ENHANCED_CHATBOT_API_URL || 'http://localhost:3021';

    const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        message,
        conversation_history,
        user_id
      }),
    });

    if (!response.ok) {
      throw new Error(`Chatbot service error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Enhanced chat API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Có lỗi xảy ra trong hệ thống tư vấn',
      error: error.message || 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Enhanced Chat API is running',
    endpoints: {
      chat: 'POST /api/chatbot/enhanced-chat',
      feedback: 'POST /api/chatbot/feedback',
      analytics: 'GET /api/chatbot/analytics'
    }
  });
}
