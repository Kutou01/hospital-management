'use client';

import { useState } from 'react';

export default function TestChatbot() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testChatbot = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setResponse('');
    
    try {
      console.log('Testing chatbot with message:', message);
      
      const res = await fetch('http://localhost:3020/api/health/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversation_history: []
        }),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Response data:', data);
      
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Chatbot API</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Tin nhắn test:
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập triệu chứng để test..."
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        
        <button
          onClick={testChatbot}
          disabled={loading || !message.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Đang gửi...' : 'Test Chatbot'}
        </button>
        
        {response && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Response:
            </label>
            <pre className="p-4 bg-gray-100 rounded-lg overflow-auto text-sm">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
