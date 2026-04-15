export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getConversationInsight } from '@/lib/anthropic';
import { CommunicationProfile } from '@/types';

export async function GET(req: NextRequest) {
  const conversation_id = req.nextUrl.searchParams.get('conversation_id');
  if (!conversation_id) {
    return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: conv } = await supabase
    .from('conversations')
    .select()
    .eq('id', conversation_id)
    .single();

  if (!conv || conv.participant_ids.length < 2) {
    return NextResponse.json({ insight: null });
  }

  const [idA, idB] = conv.participant_ids;
  const [nameA, nameB] = conv.participant_names;

  const { data: profiles } = await supabase
    .from('profiles')
    .select()
    .eq('conversation_id', conversation_id)
    .in('user_id', [idA, idB]);

  const profileA: CommunicationProfile | null =
    profiles?.find((p: CommunicationProfile) => p.user_id === idA) ?? null;
  const profileB: CommunicationProfile | null =
    profiles?.find((p: CommunicationProfile) => p.user_id === idB) ?? null;

  const insight = await getConversationInsight(nameA, profileA, nameB, profileB);
  return NextResponse.json({ insight });
}
