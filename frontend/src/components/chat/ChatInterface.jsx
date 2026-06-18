import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { SUGGESTED_CHAT_QUESTIONS } from '../../utils/constants';

const TypingIndicator = () => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10 }}>
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: '#111',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>AI</div>
    <div style={{ background: '#f5f5f5', border: '0.5px solid #ececec', borderRadius: 14, borderTopLeftRadius: 4, padding: '10px 14px' }}>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 16 }}>
        {[0, 150, 300].map((d) => (
          <div key={d} className="animate-bounce" style={{ width: 6, height: 6, background: '#ccc', borderRadius: '50%', animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

export default function ChatInterface({ messages = [], isTyping = false, onSend, onClear }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 10rem)', maxHeight: 700, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '0.5px solid #ececec' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
          }}>AI</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>FinSight AI</p>
            <p style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
              Online
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="btn-ghost" style={{ fontSize: 12 }}>Clear chat</button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 4 }}>Ask me anything about your finances</p>
              <p style={{ fontSize: 12, color: '#aaa' }}>I can analyze your spending, budgets, subscriptions, and more.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 400 }}>
              {SUGGESTED_CHAT_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => onSend(q)}
                  style={{
                    fontSize: 12, textAlign: 'left', padding: '10px 12px',
                    background: '#f5f5f5', border: '0.5px solid #e8e8e8',
                    borderRadius: 8, color: '#555', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#ebebeb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={onSend} isTyping={isTyping} />
    </div>
  );
}
