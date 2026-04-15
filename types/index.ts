export type VocabularyLevel = 'casual' | 'mixed' | 'technical' | 'academic';

export interface CommunicationProfile {
  user_id: string;
  conversation_id: string;
  vocabulary_level: VocabularyLevel;
  tends_to: string[];
  communication_gaps: string[];
  topics_of_depth: string[];
  message_count: number;
  updated_at: string;
}

export interface Conversation {
  id: string;
  invite_token: string;
  participant_ids: string[];
  participant_names: string[];
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  raw_content: string;
  refined_content: string;
  refinement_delta: number;
  sent_at: string;
}
