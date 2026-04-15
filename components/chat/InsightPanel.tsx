'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  conversationId: string;
  messageCount: number;
}

export function InsightPanel({ conversationId, messageCount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastFetchedAt = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    if (messageCount < 2) return;
    if (insight && messageCount - lastFetchedAt.current < 10) return;

    setLoading(true);
    fetch(`/api/insight?conversation_id=${conversationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.insight) {
          setInsight(data.insight);
          lastFetchedAt.current = messageCount;
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, conversationId, messageCount]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="text-xs transition-opacity hover:opacity-80"
        style={{ color: '#4A8B7F' }}
      >
        {isOpen ? 'Hide insight' : 'Communication insight'}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-7 z-10 w-72 rounded-xl p-4 shadow-sm border"
          style={{ backgroundColor: '#EAF3F1', borderColor: '#B8D4CF' }}
        >
          {loading ? (
            <p className="text-xs italic" style={{ color: '#78716C' }}>Observing…</p>
          ) : insight ? (
            <p className="font-serif text-sm italic leading-relaxed" style={{ color: '#1C1917' }}>
              &ldquo;{insight}&rdquo;
            </p>
          ) : (
            <p className="text-xs" style={{ color: '#A8A29E' }}>
              Not enough messages yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
