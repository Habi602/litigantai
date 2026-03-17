"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useConversations, useConversationMessages } from "@/hooks/useMessages";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";

function MessagesInner() {
  const { user } = useAuth();
  const { conversations, fetchConversations } = useConversations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { messages, loading: msgLoading, sendMessage } = useConversationMessages(selectedId);
  const searchParams = useSearchParams();

  useEffect(() => {
    const convParam = searchParams.get("conv");
    if (convParam) {
      setSelectedId(Number(convParam));
    }
  }, [searchParams]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleSend = async (content: string) => {
    await sendMessage(content);
    fetchConversations();
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Messages</h2>
        </div>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedId ? (
          <MessageThread
            messages={messages}
            loading={msgLoading}
            currentUserId={user?.id ?? 0}
            onSend={handleSend}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Select a conversation to start messaging.
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading...</div>}>
      <MessagesInner />
    </Suspense>
  );
}
