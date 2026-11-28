import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Bot,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  generateAiAssistantResponse,
  QUICK_PROMPTS,
} from '../../services/aiRiderAssistantService';
import './AiRiderAssistant.css';

export default function AiRiderAssistant() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'Hey Rider! 👋 I am your BIKER CAFE AI Assistant. Looking for track helmets, sport touring shells, head circumference sizing, or showroom availability in Arni?',
    },
  ]);

  const messagesEndRef = useRef(null);

  const msgIdCounter = useRef(1);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (pathname.startsWith('/admin')) return null;

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    msgIdCounter.current += 1;
    const userMsgId = `usr-${msgIdCounter.current}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      msgIdCounter.current += 1;
      const botMsgId = `bot-${msgIdCounter.current}`;
      const response = generateAiAssistantResponse(query);
      const botMsg = {
        id: botMsgId,
        sender: 'bot',
        text: response.text,
        action: response.action,
        product: response.product,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 350);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          className="ai-floating-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Shopping Assistant"
        >
          <Sparkles size={16} style={{ color: 'var(--red-bright)' }} />
          <span>AI Rider Assistant</span>
        </button>
      )}

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="ai-chat-drawer" role="dialog" aria-label="AI Shopping Assistant">
          <div className="ai-chat-header">
            <div className="ai-chat-header__title">
              <div className="ai-chat-header__icon">
                <Bot size={18} />
              </div>
              <div>
                <h3>Rider Assistant</h3>
                <span>BIKER CAFE AI · Official Specs</span>
              </div>
            </div>
            <button
              type="button"
              className="ai-chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message ai-message--${msg.sender}`}>
                <div className="ai-message__bubble">{msg.text}</div>
                {msg.action && (
                  msg.action.isExternal ? (
                    <a
                      href={msg.action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-message__action"
                    >
                      <span>{msg.action.label}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <Link
                      to={msg.action.url}
                      className="ai-message__action"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{msg.action.label}</span>
                      <ChevronRight size={12} />
                    </Link>
                  )
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="ai-chat-quick-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ai-quick-btn"
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="ai-chat-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask about helmet fit, specs, or models..."
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={!input.trim()}
              aria-label="Send query"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
