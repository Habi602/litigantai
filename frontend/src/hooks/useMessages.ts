"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Conversation, Message, ConversationCreate } from "@/lib/types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Conversation[]>("/messages/conversations");
      setConversations(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, fetchConversations };
}

export function useConversationMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (conversationId === null) return;
    try {
      setLoading(true);
      const data = await api.get<Message[]>(`/messages/conversations/${conversationId}`);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (conversationId === null) return;
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (conversationId === null) return;
    const msg = await api.post<Message>(`/messages/conversations/${conversationId}`, { content });
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  return { messages, loading, sendMessage, fetchMessages };
}

export function useStartConversation() {
  const startConversation = async (payload: ConversationCreate): Promise<Conversation> => {
    return api.post<Conversation>("/messages/conversations", payload);
  };
  return { startConversation };
}

export function useUnreadMessageCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api.get<{ count: number }>("/messages/unread-count")
      .then((r) => setCount(r.count))
      .catch(() => {});
  }, []);
  return count;
}
