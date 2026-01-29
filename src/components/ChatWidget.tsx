import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MessageSquare, X, Send, Image as ImageIcon, Video, Maximize2, Download, Camera, Library, MoreHorizontal, LifeBuoy } from 'lucide-react';
import { ChatMessage, UserRole } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { LiveSupport } from './LiveSupport';

export interface ChatWidgetHandle {
  open: (initialMessage?: string) => void;
}

const BotAvatar = ({ className }: { className: string }) => {
  const [error, setError] = useState(false);
  if (error) return <LifeBuoy className={className} />;
  return <img src="/tech-triage-logo.png" className={`${className} object-contain`} alt="Bot" onError={() => setError(true)} />;
};

export const ChatWidget = forwardRef<ChatWidgetHandle, object>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLiveVideoActive, setIsLiveVideoActive] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [, setSessionSummary] = useState('');
  const [input, setInput] = useState('');
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: UserRole.MODEL,
      text: "Hi there! How can I help you today?",
      timestamp: Date.now()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowImageMenu(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    if (showImageMenu || showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageMenu, showOptionsMenu]);

  useImperativeHandle(ref, () => ({
    open: (initialMessage?: string) => {
      setIsOpen(true);
      setIsSessionEnded(false);
      if (initialMessage && initialMessage.trim().length > 0) {
        // Set the message as pre-filled input instead of sending it
        setInput(initialMessage);
      }
    }
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowImageMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadTranscript = () => {
    const text = messages.map(m => `[${m.role}] ${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TechTriage-Transcript-${Date.now()}.txt`;
    a.click();
    setShowOptionsMenu(false);
  };

  const handleSend = async (messageOverride?: string) => {
    const textToSend = typeof messageOverride === 'string' ? messageOverride : input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: UserRole.USER,
      text: textToSend,
      image: selectedImage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const tempImage = selectedImage; 
    setSelectedImage(undefined);
    setIsLoading(true);

    try {
      const { text, functionCall } = await sendMessageToGemini([...messages, userMsg], userMsg.text, tempImage);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: UserRole.MODEL,
        text: text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

      if (functionCall?.name === 'endSession') {
        setIsSessionEnded(true);
        setSessionSummary(functionCall.args.summary as string);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: UserRole.MODEL,
        text: "I'm having trouble connecting. Please try again.",
        isError: true,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLiveVideoActive) return <LiveSupport onClose={() => setIsLiveVideoActive(false)} />;

  return (
    <div 
      className={`fixed z-[60] transition-all duration-300 flex flex-col font-sans ${
        isFullScreen ? 'inset-0 w-full h-full bg-white' : 
        isOpen ? 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] h-full sm:h-[650px]' : 
        'bottom-6 right-6 w-auto h-auto pointer-events-none'
      }`}
    >
      {isOpen && (
        <div className={`flex flex-col bg-white shadow-2xl overflow-hidden border border-gray-200 transition-all duration-300 pointer-events-auto relative ${
          isFullScreen ? 'w-full h-full rounded-none' : 'w-full h-full rounded-t-xl sm:rounded-2xl'
        }`}>
          <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-900 rounded-lg flex items-center justify-center text-cta-500 overflow-hidden">
                <BotAvatar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-brand-900 text-sm">TechTriage Bot</h3>
                <div className="text-xs text-gray-500">The team can also help</div>
              </div>
            </div>
            <div className="flex items-center gap-2 relative">
                <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>

                {showOptionsMenu && (
                  <div ref={optionsMenuRef} className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up">
                    <button onClick={() => { setIsFullScreen(!isFullScreen); setShowOptionsMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-brand-900 text-sm font-medium">
                      <Maximize2 className="w-4 h-4" /> {isFullScreen ? 'Minimize window' : 'Expand window'}
                    </button>
                    <button onClick={handleDownloadTranscript} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-brand-900 text-sm font-medium">
                      <Download className="w-4 h-4" /> Download transcript
                    </button>
                  </div>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            <div className="text-xs text-center text-gray-400 font-medium py-2">Today</div>
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === UserRole.USER ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                {msg.role === UserRole.MODEL && (
                   <div className="w-6 h-6 rounded-full bg-brand-900 flex items-center justify-center text-cta-500 shrink-0 mb-1 overflow-hidden">
                     <BotAvatar className="w-4 h-4" />
                   </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === UserRole.USER ? 'bg-brand-900 text-white rounded-tr-sm' : 'bg-white text-brand-900 rounded-tl-sm border border-gray-100'
                }`}>
                  {msg.image && <img src={msg.image} className="w-full h-auto rounded-lg mb-3 border border-gray-100" />}
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-[10px] mt-1 ${msg.role === UserRole.USER ? 'text-white/50' : 'text-gray-400'}`}>
                    {msg.role === UserRole.MODEL ? 'TechTriage Bot • ' : ''}
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
               <div className="flex justify-start items-end gap-2">
                 <div className="w-6 h-6 rounded-full bg-brand-900 flex items-center justify-center text-cta-500 shrink-0 mb-1 overflow-hidden">
                   <BotAvatar className="w-4 h-4" />
                 </div>
                 <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 shadow-sm">
                   <div className="flex gap-1">
                     <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                     <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   </div>
                 </div>
               </div>
            )}
            
            {messages.length < 3 && !isLoading && (
              <div className="flex flex-wrap gap-2 mt-4 ml-8">
                 <button onClick={() => handleSend("I'd like to speak to a technical expert.")} className="bg-white border border-cta-500 text-brand-900 hover:bg-cta-500/10 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                   Speak to an expert
                 </button>
                 <button onClick={() => handleSend("What are your pricing plans?")} className="bg-white border border-cta-500 text-brand-900 hover:bg-cta-500/10 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                   Pricing
                 </button>
                 <button onClick={() => handleSend("I have a broken device and need to start a triage session.")} className="bg-white border border-cta-500 text-brand-900 hover:bg-cta-500/10 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                   Start Triage
                 </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {!isSessionEnded && (
            <div className="px-4 py-2 bg-gray-50">
              <button 
                onClick={() => setIsLiveVideoActive(true)}
                className="w-full bg-cta-500 hover:bg-cta-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-all"
              >
                <Video className="w-4 h-4" /> Initiate Live Video Feed
              </button>
            </div>
          )}

          <div className="p-4 bg-white border-t border-gray-100 relative">
             {selectedImage && (
                <div className="absolute bottom-full left-4 mb-2 flex gap-3 animate-fade-in-up">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group shadow-lg">
                    <img src={selectedImage} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedImage(undefined)}
                      className="absolute top-1 right-1 bg-brand-900/80 text-white p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

             {showImageMenu && (
                <div ref={menuRef} className="absolute bottom-16 left-4 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 w-48 animate-fade-in-up">
                  <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all text-brand-900 text-sm font-medium">
                     <Camera className="w-4 h-4 text-gray-500" /> Take Photo
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all text-brand-900 text-sm font-medium">
                     <Library className="w-4 h-4 text-gray-500" /> Photo Library
                  </button>
                </div>
              )}

            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                 <input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder="Type a message..." 
                    className="w-full bg-gray-50 border-none rounded-full px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-cta-500/50 pr-10 text-brand-900 placeholder:text-gray-400" 
                  />
                  <button 
                    onClick={() => setShowImageMenu(!showImageMenu)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-900 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
              </div>
              
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

              <button 
                onClick={() => handleSend()} 
                disabled={(!input.trim() && !selectedImage) || isLoading} 
                className="p-3 bg-brand-900 text-white rounded-full hover:bg-brand-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button 
          aria-label="Open Chat"
          onClick={() => setIsOpen(true)} 
          className="bg-[#1F2937] text-white px-8 py-5 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-3 font-bold text-lg pointer-events-auto hover:bg-[#374151]"
        >
          <MessageSquare className="w-6 h-6" />
          Need Help?
        </button>
      )}
    </div>
  );
});
