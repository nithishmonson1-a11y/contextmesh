'use client';
import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';

interface PendingMessage {
  id: string;
  raw_content: string;
  sent_at: string;
}

interface Props {
  messages: Message[];
  pendingMessages: PendingMessage[];
  userId: string;
}

export function MessageList({ messages, pendingMessages, userId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingMessages.length]);

  if (messages.length === 0 && pendingMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: '#A8A29E' }}>
          No messages yet. Say something.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} isSelf={msg.sender_id === userId} />
      ))}

      {pendingMessages.map((pending) => (
        <MessageBubble
          key={pending.id}
          message={{
            id: pending.id,
            conversation_id: '',
            sender_id: userId,
            sender_name: '',
            raw_content: pending.raw_content,
            refined_content: pending.raw_content,
            refinement_delta: 0,
            sent_at: pending.sent_at,
          }}
          isSelf
          isPending
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
