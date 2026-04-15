import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { refineMessage, computeRefinementDelta, updateProfile } from '@/lib/anthropic';
import { CommunicationProfile } from '@/types';

export async function POST(req: NextRequest) {
  const { conversation_id, sender_id, sender_name, raw_content } = await req.json();
  if (!conversation_id || !sender_id || !sender_name || !raw_content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch conversation to get receiver info
  const { data: conv } = await supabase
    .from('conversations')
    .select()
    .eq('id', conversation_id)
    .single();

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const receiverId = conv.participant_ids.find((id: string) => id !== sender_id);
  const receiverName = conv.participant_names[conv.participant_ids.indexOf(receiverId)] ?? 'them';

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select()
    .eq('conversation_id', conversation_id)
    .in('user_id', [sender_id, receiverId].filter(Boolean));

  const senderProfile: CommunicationProfile | null =
    profiles?.find((p: CommunicationProfile) => p.user_id === sender_id) ?? null;
  const receiverProfile: CommunicationProfile | null =
    profiles?.find((p: CommunicationProfile) => p.user_id === receiverId) ?? null;

  // Fetch last 10 messages for context
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('sender_name, refined_content')
    .eq('conversation_id', conversation_id)
    .order('sent_at', { ascending: false })
    .limit(10);

  const context = (recentMessages ?? []).reverse();

  // Refine message (falls back to raw on error)
  const refined_content = await refineMessage(
    raw_content,
    sender_name,
    senderProfile,
    receiverName,
    receiverProfile,
    context
  );

  const refinement_delta = computeRefinementDelta(raw_content, refined_content);

  // Store message
  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id,
      sender_name,
      raw_content,
      refined_content,
      refinement_delta,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Update conversation last_message_at
  supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation_id);

  // Async profile update every 5 sender messages (fire and forget)
  const senderMsgCount = (senderProfile?.message_count ?? 0) + 1;
  updateSenderProfile(supabase, sender_id, sender_name, conversation_id, senderProfile, senderMsgCount);

  return NextResponse.json(message);
}

async function updateSenderProfile(
  supabase: ReturnType<typeof createServerClient>,
  senderId: string,
  senderName: string,
  conversationId: string,
  currentProfile: CommunicationProfile | null,
  newCount: number
) {
  // Always increment the count
  await supabase.from('profiles').upsert(
    {
      user_id: senderId,
      conversation_id: conversationId,
      vocabulary_level: currentProfile?.vocabulary_level ?? 'mixed',
      tends_to: currentProfile?.tends_to ?? [],
      communication_gaps: currentProfile?.communication_gaps ?? [],
      topics_of_depth: currentProfile?.topics_of_depth ?? [],
      message_count: newCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,conversation_id' }
  );

  // Every 5 messages, run the full profile observer
  if (newCount % 5 !== 0) return;

  const { data: recentMsgs } = await supabase
    .from('messages')
    .select('raw_content')
    .eq('conversation_id', conversationId)
    .eq('sender_id', senderId)
    .order('sent_at', { ascending: false })
    .limit(10);

  if (!recentMsgs || recentMsgs.length === 0) return;

  const profileUpdate = await updateProfile(
    senderName,
    currentProfile,
    recentMsgs.map((m: { raw_content: string }) => m.raw_content)
  );

  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from('profiles').upsert(
      {
        user_id: senderId,
        conversation_id: conversationId,
        ...profileUpdate,
        message_count: newCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,conversation_id' }
    );
  }
}
