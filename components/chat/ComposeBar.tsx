'use client';
import { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function ComposeBar({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setText('');
    setSending(true);
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex items-end gap-3 px-4 py-3 border-t"
      style={{ borderColor: '#E8E4DC', backgroundColor: '#F8F6F1' }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        disabled={disabled || sending}
        className="flex-1 resize-none bg-stone rounded-xl px-4 py-2.5 text-[15px] text-ink leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal placeholder:text-stone-400 disabled:opacity-50 overflow-hidden"
        style={{ backgroundColor: '#E8E4DC', minHeight: '44px' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-background transition-opacity
          ${sending ? 'pulse-send' : ''}
          ${!text.trim() || disabled ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-90'}
        `}
        style={{ backgroundColor: '#4A8B7F' }}
        aria-label="Send"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}
