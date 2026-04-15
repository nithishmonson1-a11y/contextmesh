import { ChatScreen } from '@/components/chat/ChatScreen';

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatScreen conversationId={params.id} />;
}
