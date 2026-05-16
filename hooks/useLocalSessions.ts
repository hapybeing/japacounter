'use client';
import { useEffect, useState } from 'react';
import type { SessionSummary } from '@/lib/engine/types';
const KEY = 'japa.sessions.v1';
export function useLocalSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  useEffect(() => { setSessions(JSON.parse(localStorage.getItem(KEY) ?? '[]')); }, []);
  const addSession = (session: SessionSummary) => {
    const next = [session, ...sessions].slice(0, 200);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSessions(next);
  };
  return { sessions, addSession };
}
