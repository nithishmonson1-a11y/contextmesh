'use client';
import { useState, useRef, useEffect } from 'react';

interface Props {
  onSubmit: (name: string) => void;
  onClose?: () => void;
}

export function NameEntry({ onSubmit, onClose }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    onSubmit(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm px-4">
      <div className="bg-background rounded-xl p-8 w-full max-w-sm shadow-lg border border-stone">
        <h2 className="font-serif text-2xl text-ink mb-1">What&apos;s your name?</h2>
        <p className="text-sm mb-6" style={{ color: '#A8A29E' }}>
          You&apos;ll only be asked this once.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name"
            className="w-full border border-stone rounded-lg px-4 py-3 bg-background text-ink text-sm focus:outline-none focus:border-teal transition-colors"
            style={{ borderColor: '#E8E4DC' }}
            maxLength={40}
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full bg-ink text-background py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
