'use client';
import { useState } from 'react';

interface Props {
  inviteUrl: string;
}

export function InviteBanner({ inviteUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="mx-4 mt-3 mb-1 rounded-xl p-4 border border-dashed"
      style={{ borderColor: '#4A8B7F', backgroundColor: '#EAF3F1' }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: '#4A8B7F' }}>
        Share this link to invite someone
      </p>
      <div
        className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 cursor-pointer group"
        onClick={handleCopy}
        role="button"
        title="Click to copy"
      >
        <span
          className="flex-1 text-xs truncate font-mono"
          style={{ color: '#78716C' }}
        >
          {inviteUrl}
        </span>
        <span
          className="flex-shrink-0 text-xs font-medium transition-colors"
          style={{ color: copied ? '#4A8B7F' : '#A8A29E' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </span>
      </div>
    </div>
  );
}
