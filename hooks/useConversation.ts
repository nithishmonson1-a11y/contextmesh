'use client';
import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/types';

export function useConversation(conversationId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversations?id=${conversationId}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setConversation(data);
    } catch (e) {
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { conversation, loading, error, refetch: fetch_ };
}
