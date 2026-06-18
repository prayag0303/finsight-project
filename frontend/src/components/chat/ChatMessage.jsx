export default function ChatMessage({ message }) {
  const isUser = message.role === 'USER';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 10 }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: '#111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 2,
        }}>
          AI
        </div>
      )}
      <div style={{
        maxWidth: '80%',
        borderRadius: 14,
        padding: '10px 14px',
        fontSize: 13,
        lineHeight: 1.6,
        ...(isUser
          ? { background: '#111', color: '#fff', borderTopRightRadius: 4 }
          : {
              background: '#f5f5f5',
              border: '0.5px solid #ececec',
              color: message.isError ? '#dc2626' : '#333',
              borderTopLeftRadius: 4,
            }
        ),
      }}>
        {message.content}
        {message.functionCalls?.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '0.5px solid #e0e0e0' }}>
            {message.functionCalls.map((fc, i) => (
              <p key={i} style={{ fontSize: 10, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>⚡</span> Called <code style={{ color: '#555' }}>{fc.name}</code>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
