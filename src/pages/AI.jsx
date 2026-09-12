import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AI = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');

    // Mock AI Response (Gemini API যোগ করতে হবে)
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: `I'm your AI Career Assistant! Here's some help with "${message}". This is a placeholder response. You'll need to integrate Gemini API for real responses.`
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1000);
  };

  const quickActions = [
    'Explain Binary Search',
    'OS Deadlock concept',
    'DFS vs BFS difference',
    'Help with LeetCode problem',
    'Resume tips',
    'Interview preparation'
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🤖 AI Assistant</h1>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setMessage(action)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="bg-white rounded-xl shadow-lg p-6 h-[400px] overflow-y-auto mb-4">
          {chatHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-4">🤖</p>
                <p>Ask me anything about your career journey!</p>
                <p className="text-sm mt-2">I can help with DSA, System Design, Interview Prep, and more.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-1">AI Assistant</p>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about DSA, System Design, Interview Prep..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-2">
          💡 Powered by AI • Your career mentor 24/7
        </p>
      </motion.div>
    </div>
  );
};

export default AI;
