import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const conversation_id = req.nextUrl.searchParams.get('conversation_id');

  if (!user_id || !conversation_id) {
    return NextResponse.json({ error: 'user_id and conversation_id required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('user_id', user_id)
    .eq('conversation_id', conversation_id)
    .single();

  if (error) return NextResponse.json(null);
  return NextResponse.json(data);
}
