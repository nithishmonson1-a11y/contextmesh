'use client';
import { useState, useEffect } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useConversation } from '@/hooks/useConversation';
import { useMessages } from '@/hooks/useMessages';
import { NameEntry } from '@/components/ui/NameEntry';
import { MessageList } from './MessageList';
import { ComposeBar } from './ComposeBar';
import { InviteBanner } from './InviteBanner';
import { InsightPanel } from './InsightPanel';

interface PendingMessage {
  id: string;
  raw_content: string;
  sent_at: string;
}

interface Props {
  conversationId: string;
}

export function ChatScreen({ conversationId }: Props) {
  const { id: userId, name: userName, saveName, isLoaded } = useIdentity();
  const { conversation, loading: convLoading, error: convError, refetch } = useConversation(conversationId);
  const { messages, loading: msgsLoading } = useMessages(conversationId);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [showNameEntry, setShowNameEntry] = useState(false);

  // Show name entry if user has no name yet
  useEffect(() => {
    if (isLoaded && !userName) setShowNameEntry(true);
  }, [isLoaded, userName]);

  // Remove pending messages when real message from self arrives
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender_id === userId) {
      setPendingMessages((prev) => {
        if (prev.length === 0) return prev;
        return prev.slice(1); // remove oldest pending
      });
    }
  }, [messages.length]);

  // Refetch conversation when participants join
  useEffect(() => {
    if (!conversation) return;
    if (conversation.participant_ids.length < 2) {
      const interval = setInterval(refetch, 4000);
      return () => clearInterval(interval);
    }
  }, [conversation?.participant_ids.length]);

  const handleNameSubmit = (newName: string) => {
    saveName(newName);
    setShowNameEntry(false);
  };

  const handleSend = async (rawContent: string) => {
    if (!userName || !userId) return;

    const tempId = `pending-${Date.now()}`;
    setPendingMessages((prev) => [
      ...prev,
      { id: tempId, raw_content: rawContent, sent_at: new Date().toISOString() },
    ]);

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        sender_id: userId,
        sender_name: userName,
        raw_content: rawContent,
      }),
    });
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const inviteUrl = conversation
    ? `${appUrl}/join/${conversationId}/${conversation.invite_token}`
    : '';

  const isCreator = conversation?.participant_ids[0] === userId;
  const hasSecondParticipant = (conversation?.participant_ids.length ?? 0) >= 2;
  const otherName = conversation?.participant_names.find((_, i) => conversation.participant_ids[i] !== userId);

  const isLoading = !isLoaded || convLoading;
  const canChat = isLoaded && !!userName && hasSecondParticipant;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm" style={{ color: '#A8A29E' }}>Loading…</p>
      </div>
    );
  }

  if (convError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-coral">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {showNameEntry && <NameEntry onSubmit={handleNameSubmit} />}

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#E8E4DC' }}
      >
        <div className="flex items-center gap-2">
          <a href="/" className="font-serif text-lg text-ink">ContextMesh</a>
          {otherName && (
            <span className="text-sm" style={{ color: '#A8A29E' }}>
              · {userName} &amp; {otherName}
            </span>
          )}
        </div>
        {hasSecondParticipant && (
          <InsightPanel conversationId={conversationId} messageCount={messages.length} />
        )}
      </div>

      {/* Invite banner (creator only, before second participant) */}
      {isCreator && !hasSecondParticipant && <InviteBanner inviteUrl={inviteUrl} />}

      {/* Waiting state */}
      {!hasSecondParticipant && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-ink">Waiting for someone to join…</p>
            <p className="text-xs" style={{ color: '#A8A29E' }}>
              Share the link above. This page will update when they arrive.
            </p>
          </div>
        </div>
      )}

      {/* Chat */}
      {hasSecondParticipant && (
        <>
          <MessageList messages={messages} pendingMessages={pendingMessages} userId={userId} />
          <ComposeBar onSend={handleSend} disabled={!userName} />
        </>
      )}
    </div>
  );
}
