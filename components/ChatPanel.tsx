'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useStore } from '@/lib/store';
import { sendChatMessage } from '@/lib/groq';
import { nanoid, formatTimestamp } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function ChatPanel() {
  const {
    chunks,
    chatMessages,
    addChatMessage,
    isChatLoading,
    setIsChatLoading,
    settings,
  } = useStore();

  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, streamingContent]);

  const send = useCallback(async (message?: string) => {
    const text = (message ?? input).trim();
    if (!text || isChatLoading) return;

    if (!message) setInput('');

    const userMsg = {
      id: nanoid(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    setIsChatLoading(true);
    setStreamingContent('');

    const history = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let full = '';
    try {
      full = await sendChatMessage(text, history, chunks, settings, (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      });

      addChatMessage({
        id: nanoid(),
        role: 'assistant',
        content: full,
        timestamp: Date.now(),
      });
    } catch (e) {
      addChatMessage({
        id: nanoid(),
        role: 'assistant',
        content: `Error: ${(e as Error).message}`,
        timestamp: Date.now(),
      });
    } finally {
      setStreamingContent('');
      setIsChatLoading(false);
    }
  }, [input, isChatLoading, chatMessages, chunks, settings, addChatMessage, setIsChatLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="panel chat-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <MessageSquare size={16} className="panel-icon" />
          <h2 className="panel-title">Chat</h2>
        </div>
        <span className="hint">{chatMessages.length} messages</span>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {chatMessages.length === 0 && !isChatLoading ? (
          <div className="empty-state">
            <MessageSquare size={28} className="empty-icon" />
            <p>Click a suggestion or type a question.</p>
            <p className="hint">Full transcript context is always included.</p>
          </div>
        ) : (
          <div className="messages-list">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-meta">
                  <span className="message-role">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                  <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                </div>
                <div className="message-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isChatLoading && streamingContent && (
              <div className="message message-assistant streaming">
                <div className="message-meta">
                  <span className="message-role">Assistant</span>
                  <span className="streaming-indicator">●</span>
                </div>
                <div className="message-content">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                </div>
              </div>
            )}
            {isChatLoading && !streamingContent && (
              <div className="message message-assistant">
                <div className="message-meta">
                  <span className="message-role">Assistant</span>
                </div>
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about the conversation…"
          className="chat-input"
          rows={2}
          disabled={isChatLoading}
        />
        <button
          className="send-btn"
          onClick={() => send()}
          disabled={isChatLoading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}