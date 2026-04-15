import { NextRequest, NextResponse } from 'next/server';
import { refineMessage, computeRefinementDelta } from '@/lib/anthropic';

// Test endpoint: POST { raw, sender_name, receiver_name }
export async function POST(req: NextRequest) {
  const { raw, sender_name = 'Sender', receiver_name = 'Receiver' } = await req.json();
  if (!raw) return NextResponse.json({ error: 'raw required' }, { status: 400 });

  const refined = await refineMessage(raw, sender_name, null, receiver_name, null, []);
  const delta = computeRefinementDelta(raw, refined);

  return NextResponse.json({ raw, refined, refinement_delta: delta });
}
