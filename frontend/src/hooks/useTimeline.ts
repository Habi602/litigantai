"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { TimelineEvent } from "@/lib/types";

export function useTimeline(caseId: number) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<TimelineEvent[]>(
        `/cases/${caseId}/timeline`
      );
      setEvents(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch timeline");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const generateTimeline = async () => {
    setLoading(true);
    try {
      const data = await api.post<TimelineEvent[]>(
        `/cases/${caseId}/timeline/generate`,
        {}
      );
      setEvents(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: number) => {
    await api.delete(`/cases/${caseId}/timeline/${eventId}`);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return {
    events,
    loading,
    error,
    fetchTimeline,
    generateTimeline,
    deleteEvent,
  };
}
