-- ContextMesh schema
-- Run this in your Supabase SQL editor

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  invite_token text not null unique,
  participant_ids text[] default '{}',
  participant_names text[] default '{}',
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  raw_content text not null,
  refined_content text not null,
  refinement_delta numeric default 0,
  sent_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  conversation_id uuid references conversations(id) on delete cascade,
  vocabulary_level text default 'mixed',
  tends_to text[] default '{}',
  communication_gaps text[] default '{}',
  topics_of_depth text[] default '{}',
  message_count int default 0,
  updated_at timestamptz default now(),
  unique(user_id, conversation_id)
);

-- Enable realtime on messages
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

-- RLS: open policies for MVP (no auth)
alter table conversations enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;

create policy "allow all on conversations" on conversations for all using (true) with check (true);
create policy "allow all on messages" on messages for all using (true) with check (true);
create policy "allow all on profiles" on profiles for all using (true) with check (true);
