'use client';

interface DiffToken {
  type: 'same' | 'added' | 'removed';
  word: string;
}

function computeWordDiff(raw: string, refined: string): DiffToken[] {
  const rawWords = raw.split(/(\s+)/).filter(Boolean);
  const refinedWords = refined.split(/(\s+)/).filter(Boolean);

  const n = rawWords.length;
  const m = refinedWords.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (rawWords[i - 1] === refinedWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && rawWords[i - 1] === refinedWords[j - 1]) {
      result.unshift({ type: 'same', word: rawWords[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', word: refinedWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', word: rawWords[i - 1] });
      i--;
    }
  }
  return result;
}

interface Props {
  raw: string;
  refined: string;
}

export function DiffView({ raw, refined }: Props) {
  const tokens = computeWordDiff(raw, refined);

  return (
    <span className="text-sm leading-relaxed">
      {tokens.map((token, i) => {
        if (token.type === 'removed') {
          return (
            <span key={i} style={{ color: '#C4714A', textDecoration: 'line-through' }}>
              {token.word}
            </span>
          );
        }
        if (token.type === 'added') {
          return (
            <span key={i} style={{ color: '#4A8B7F' }}>
              {token.word}
            </span>
          );
        }
        return <span key={i}>{token.word}</span>;
      })}
    </span>
  );
}
