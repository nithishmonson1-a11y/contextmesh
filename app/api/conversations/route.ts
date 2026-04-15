export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const { creator_id, creator_name } = await req.json();
  if (!creator_id || !creator_name) {
    return NextResponse.json({ error: 'creator_id and creator_name required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const invite_token = randomBytes(16).toString('hex');

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      invite_token,
      participant_ids: [creator_id],
      participant_names: [creator_name],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const token = req.nextUrl.searchParams.get('token');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('conversations')
    .select()
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  // If token provided, verify it matches
  if (token && data.invite_token !== token) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 403 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { conversation_id, invite_token, user_id, user_name } = await req.json();
  if (!conversation_id || !invite_token || !user_id || !user_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify token and fetch conversation
  const { data: conv, error: fetchError } = await supabase
    .from('conversations')
    .select()
    .eq('id', conversation_id)
    .eq('invite_token', invite_token)
    .single();

  if (fetchError || !conv) {
    return NextResponse.json({ error: 'Invalid conversation or token' }, { status: 403 });
  }

  // Already a participant
  if (conv.participant_ids.includes(user_id)) {
    return NextResponse.json(conv);
  }

  // Max 2 participants for MVP
  if (conv.participant_ids.length >= 2) {
    return NextResponse.json({ error: 'Conversation is full' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('conversations')
    .update({
      participant_ids: [...conv.participant_ids, user_id],
      participant_names: [...conv.participant_names, user_name],
    })
    .eq('id', conversation_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
