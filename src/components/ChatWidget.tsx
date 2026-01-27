import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export interface ChatWidgetHandle {
  open: (message?: string) => void;
  close: () => void;
}

export const ChatWidget = forwardRef<ChatWidgetHandle>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  useImperativeHandle(ref, () => ({
    open: (initialMessage?: string) => {
      setIsOpen(true);
      if (initialMessage) {
        setMessage(initialMessage);
      }
    },
    close: () => {
      setIsOpen(false);
    }
  }));

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cta-500 hover:bg-cta-600 text-white rounded-full shadow-lg shadow-cta-500/30 flex items-center justify-center transition-all z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
      <div className="bg-brand-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cta-500 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold">TechTriage Support</div>
            <div className="text-xs text-white/60">We're here to help</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%] mb-4">
          <p className="text-sm text-gray-700">Hi there! How can I help you today with your home tech or systems?</p>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-cta-500"
          />
          <button className="w-10 h-10 bg-cta-500 hover:bg-cta-600 text-white rounded-full flex items-center justify-center transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ChatWidget.displayName = 'ChatWidget';
