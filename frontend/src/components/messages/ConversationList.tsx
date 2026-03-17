"use client";

import { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">No conversations yet.</div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {conversations.map((conv) => {
        const label = conv.listing_id
          ? `Listing #${conv.listing_id}`
          : conv.case_id
          ? `Case #${conv.case_id}`
          : null;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
              selectedId === conv.id && "bg-blue-50"
            )}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium text-sm text-gray-900 truncate">
                {conv.other_user_name || "Unknown"}
              </span>
              {conv.unread_count > 0 && (
                <span className="ml-2 flex-shrink-0 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {conv.unread_count > 9 ? "9+" : conv.unread_count}
                </span>
              )}
            </div>
            {label && (
              <span className="text-xs text-blue-600 font-medium">{label}</span>
            )}
            {conv.last_message_text && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {conv.last_message_text}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
