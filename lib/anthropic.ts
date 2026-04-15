import Anthropic from '@anthropic-ai/sdk';
import { CommunicationProfile } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-20250514';

export async function refineMessage(
  rawMessage: string,
  senderName: string,
  senderProfile: CommunicationProfile | null,
  receiverName: string,
  receiverProfile: CommunicationProfile | null,
  recentMessages: Array<{ sender_name: string; refined_content: string }>
): Promise<string> {
  const context = recentMessages
    .slice(-10)
    .map((m) => `${m.sender_name}: ${m.refined_content}`)
    .join('\n');

  const prompt = `You are the expression layer in ContextMesh. Refine the sender's message so it conveys their actual intent as clearly as possible to this specific receiver. You are not a copy editor — you are translating between what someone understands and what they can say.

SENDER: ${senderName}
Sender patterns: ${senderProfile?.tends_to?.join(', ') || 'unknown'}
Sender gaps: ${senderProfile?.communication_gaps?.join(', ') || 'unknown'}
Sender depth: ${senderProfile?.topics_of_depth?.join(', ') || 'unknown'}

RECEIVER: ${receiverName}
Receiver vocabulary: ${receiverProfile?.vocabulary_level || 'mixed'}
Receiver patterns: ${receiverProfile?.tends_to?.join(', ') || 'unknown'}
Receiver depth: ${receiverProfile?.topics_of_depth?.join(', ') || 'unknown'}

RECENT CONVERSATION (last 10 messages):
${context || '(no prior messages)'}

RAW MESSAGE:
${rawMessage}

Rules:
- Preserve the sender's voice — do not make casual writing sound formal
- Preserve uncertainty where it exists — do not add false confidence
- Calibrate complexity to the receiver's vocabulary level
- If the message is already clear, return it unchanged
- Return ONLY the refined message. No explanation, no preamble.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    if (block.type === 'text') return block.text.trim();
  } catch {
    // Fall through to return raw message
  }
  return rawMessage;
}

export async function updateProfile(
  userName: string,
  currentProfile: CommunicationProfile | null,
  recentMessages: string[]
): Promise<Partial<Pick<CommunicationProfile, 'vocabulary_level' | 'tends_to' | 'communication_gaps' | 'topics_of_depth'>>> {
  const prompt = `You are observing a conversation to build a communication profile for ${userName}.

CURRENT PROFILE:
${JSON.stringify(currentProfile, null, 2)}

RECENT MESSAGES FROM ${userName}:
${recentMessages.join('\n')}

Return a JSON object:
{
  "vocabulary_level": "casual" | "mixed" | "technical" | "academic",
  "tends_to": string[],
  "communication_gaps": string[],
  "topics_of_depth": string[]
}

Return ONLY valid JSON. No preamble.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    if (block.type === 'text') {
      return JSON.parse(block.text.trim());
    }
  } catch {
    // Return empty on any error
  }
  return {};
}

export async function getConversationInsight(
  nameA: string,
  profileA: CommunicationProfile | null,
  nameB: string,
  profileB: CommunicationProfile | null
): Promise<string> {
  const prompt = `Summarize the communication dynamic between ${nameA} and ${nameB} in one sentence of max 15 words.

Profile A (${nameA}): ${JSON.stringify(profileA)}
Profile B (${nameB}): ${JSON.stringify(profileB)}

Be specific. Bad: "They have different styles." Good: "Nithish thinks in systems; Minnu needs the human stakes made explicit."

Return ONLY the sentence.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    if (block.type === 'text') return block.text.trim();
  } catch {
    // Fall through
  }
  return `${nameA} and ${nameB} are finding their communication rhythm.`;
}

export function computeRefinementDelta(raw: string, refined: string): number {
  if (raw === refined) return 0;
  const maxLen = Math.max(raw.length, refined.length);
  if (maxLen === 0) return 0;

  const charCounts = new Map<string, number>();
  for (const c of raw) charCounts.set(c, (charCounts.get(c) ?? 0) + 1);

  let common = 0;
  for (const c of refined) {
    const count = charCounts.get(c) ?? 0;
    if (count > 0) {
      common++;
      charCounts.set(c, count - 1);
    }
  }

  return 1 - common / maxLen;
}
