'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIdentity } from '@/hooks/useIdentity';
import { NameEntry } from '@/components/ui/NameEntry';

export default function LandingPage() {
  const router = useRouter();
  const { id, name, saveName, isLoaded } = useIdentity();
  const [creating, setCreating] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    if (!name) {
      setShowNameEntry(true);
    } else {
      createConversation(name);
    }
  };

  const createConversation = async (userName: string) => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: id, creator_name: userName }),
      });
      const text = await res.text();
      let conv: any;
      try {
        conv = JSON.parse(text);
      } catch {
        setError(`Server error (${res.status}): ${text.slice(0, 200)}`);
        return;
      }
      if (conv.id) {
        router.push(`/chat/${conv.id}`);
      } else {
        setError(conv.error ?? 'Unknown error');
      }
    } catch (e: any) {
      setError(`Network error: ${e?.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleNameSubmit = (newName: string) => {
    saveName(newName);
    setShowNameEntry(false);
    createConversation(newName);
  };

  if (!isLoaded) return null;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {showNameEntry && (
        <NameEntry onSubmit={handleNameSubmit} onClose={() => setShowNameEntry(false)} />
      )}

      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="font-serif text-4xl text-ink tracking-tight">ContextMesh</h1>
          <p className="text-stone-600 text-base leading-relaxed" style={{ color: '#78716C' }}>
            Chat where AI silently makes every message clearer —<br />
            calibrated to who you&apos;re talking to.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={creating}
            className="w-full bg-ink text-background font-sans text-sm font-medium py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {creating ? 'Starting…' : 'Start a conversation'}
          </button>

          {error && (
            <p className="text-xs font-medium" style={{ color: '#C4714A' }}>{error}</p>
          )}

          <p className="text-xs" style={{ color: '#A8A29E' }}>
            Share the link. Your contact joins in seconds. No install required.
          </p>
        </div>

        <div className="pt-4 border-t border-stone" style={{ borderColor: '#E8E4DC' }}>
          <p className="text-xs" style={{ color: '#A8A29E' }}>
            {name ? (
              <>Signed in as <span className="text-ink font-medium">{name}</span></>
            ) : (
              'You&apos;ll be asked for your name before starting.'
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
