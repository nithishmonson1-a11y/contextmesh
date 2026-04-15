'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIdentity } from '@/hooks/useIdentity';
import { NameEntry } from '@/components/ui/NameEntry';

interface Props {
  params: { id: string; token: string };
}

export default function JoinPage({ params }: Props) {
  const { id: conversationId, token } = params;
  const router = useRouter();
  const { id: userId, name: userName, saveName, isLoaded } = useIdentity();
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const joinConversation = async (name: string, uid: string) => {
    setJoining(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          invite_token: token,
          user_id: uid,
          user_name: name,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        router.replace(`/chat/${conversationId}`);
      }
    } catch {
      setError('Failed to join. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (userName && userId) {
      joinConversation(userName, userId);
    } else {
      setShowNameEntry(true);
    }
  }, [isLoaded]);

  const handleNameSubmit = (newName: string) => {
    saveName(newName);
    setShowNameEntry(false);
    joinConversation(newName, userId);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-sm font-medium" style={{ color: '#C4714A' }}>{error}</p>
          <a href="/" className="text-sm underline" style={{ color: '#4A8B7F' }}>
            Start a new conversation
          </a>
        </div>
      </div>
    );
  }

  if (joining) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm" style={{ color: '#A8A29E' }}>Joining conversation…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {showNameEntry && <NameEntry onSubmit={handleNameSubmit} />}
      {!showNameEntry && (
        <p className="text-sm" style={{ color: '#A8A29E' }}>Loading…</p>
      )}
    </div>
  );
}
