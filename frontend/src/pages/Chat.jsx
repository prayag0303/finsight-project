import { Component, useEffect } from 'react';
import ChatInterface from '../components/chat/ChatInterface';
import { useChat } from '../hooks/useChat';
import api from '../services/api';

class ChatErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(err) {
    return { error: err };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card p-8 text-center" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <p style={{ fontWeight: 600, color: '#dc2626' }}>Chat failed to load</p>
          <p style={{ fontSize: 13, color: '#aaa' }}>{this.state.error.message}</p>
          <button
            className="btn-secondary"
            style={{ fontSize: 12, marginTop: 8 }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ChatPage() {
  const { messages, isTyping, sendMessage, clearChat, loadHistory } = useChat();

  useEffect(() => {
    api.get('/ai/chat/history')
      .then((r) => loadHistory(r.data.data))
      .catch(() => {
        // History unavailable — start with empty chat
      });
  }, []);

  return (
    <div style={{ height: 'calc(100vh - 6rem)', display: 'flex', flexDirection: 'column' }}>
      <ChatInterface
        messages={messages}
        isTyping={isTyping}
        onSend={sendMessage}
        onClear={clearChat}
      />
    </div>
  );
}

export default function Chat() {
  return (
    <ChatErrorBoundary>
      <ChatPage />
    </ChatErrorBoundary>
  );
}
