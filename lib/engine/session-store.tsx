'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Fingerprint, MantraReference } from '@/lib/engine/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type SessionStore = {
  mantraDraft: string;
  activeMantra: MantraReference | null;
  audioCalibration: Fingerprint | null;
  micEnabled: boolean;
  listening: boolean;
  matching: boolean;
  confidence: number;
  saveState: SaveState;
  saveMessage: string;
  setMantraDraft: (v: string) => void;
  setActiveMantra: (v: MantraReference | null) => void;
  setAudioCalibration: (v: Fingerprint | null) => void;
  setMicEnabled: (v: boolean) => void;
  setListening: (v: boolean) => void;
  setMatching: (v: boolean) => void;
  setConfidence: (v: number) => void;
  setSaveState: (v: SaveState, msg?: string) => void;
};

const Ctx = createContext<SessionStore | null>(null);

export function SessionStoreProvider({ children }: { children: React.ReactNode }) {
  const [mantraDraft, setMantraDraft] = useState('');
  const [activeMantra, setActiveMantra] = useState<MantraReference | null>(null);
  const [audioCalibration, setAudioCalibration] = useState<Fingerprint | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [matching, setMatching] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [saveState, setSaveStateValue] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const setSaveState = (v: SaveState, msg = '') => {
    setSaveStateValue(v);
    setSaveMessage(msg);
  };

  const value = useMemo(
    () => ({ mantraDraft, activeMantra, audioCalibration, micEnabled, listening, matching, confidence, saveState, saveMessage, setMantraDraft, setActiveMantra, setAudioCalibration, setMicEnabled, setListening, setMatching, setConfidence, setSaveState }),
    [mantraDraft, activeMantra, audioCalibration, micEnabled, listening, matching, confidence, saveState, saveMessage]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSessionStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSessionStore must be used within SessionStoreProvider');
  return ctx;
}
