import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/ai.service';
import toast from 'react-hot-toast';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const loadHistory = useCallback((historyItems) => {
    const msgs = (historyItems || []).map((h, i) => ({
      id: i,
      role: h.role,
      content: h.content,
      functionCalls: h.functionCalls || null,
    }));
    setMessages(msgs);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), role: 'USER', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const data = await sendChatMessage({ message: text, history });

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ASSISTANT',
        content: data.response,
        functionCalls: data.functionCalls,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast.error('AI chat is temporarily unavailable');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ASSISTANT',
          content: "I'm having trouble connecting right now. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isTyping, sendMessage, clearChat, loadHistory };
};
