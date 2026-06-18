import { useState } from 'react';

export default function ChatInput({ onSend, isTyping }) {
  const [text, setText] = useState('');

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: 14, borderTop: '0.5px solid #ececec', background: '#fff' }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask about your finances... (Enter to send)"
        rows={1}
        disabled={isTyping}
        className="input-field"
        style={{ flex: 1, resize: 'none', minHeight: 40, maxHeight: 120 }}
        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
      />
      <button
        onClick={send}
        disabled={!text.trim() || isTyping}
        className="btn-primary"
        style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0, opacity: (!text.trim() || isTyping) ? 0.4 : 1 }}
      >
        {isTyping ? (
          <svg style={{ width: 14, height: 14 }} className="animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        ) : (
          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        )}
      </button>
    </div>
  );
}
