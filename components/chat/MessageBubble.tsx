'use client';
import { useState } from 'react';
import { Message } from '@/types';
import { DiffView } from '@/components/ui/DiffView';

interface Props {
  message: Message;
  isSelf: boolean;
  isPending?: boolean;
}

export function MessageBubble({ message, isSelf, isPending }: Props) {
  const [showOriginal, setShowOriginal] = useState(false);
  const showToggle = !isSelf && !isPending && message.refinement_delta > 0.1;

  return (
    <div className={`flex flex-col max-w-[75%] ${isSelf ? 'items-end self-end' : 'items-start self-start'}`}>
      <div
        className={`px-4 py-2.5 rounded-2xl message-arrive ${
          isSelf
            ? 'bg-ink text-background rounded-br-sm'
            : 'rounded-bl-sm'
        } ${isPending ? 'opacity-60' : ''}`}
        style={
          !isSelf
            ? { backgroundColor: '#E8E4DC', color: '#1C1917' }
            : {}
        }
      >
        {isPending ? (
          <span className="text-[15px] leading-relaxed italic opacity-70">Sending…</span>
        ) : showOriginal ? (
          <DiffView raw={message.raw_content} refined={message.refined_content} />
        ) : (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.refined_content}</p>
        )}
      </div>

      {showToggle && (
        <button
          onClick={() => setShowOriginal((v) => !v)}
          className="mt-1 text-[11px] transition-opacity hover:opacity-80"
          style={{ color: '#A8A29E' }}
        >
          {showOriginal ? 'see refined' : 'see original'}
        </button>
      )}
    </div>
  );
}
