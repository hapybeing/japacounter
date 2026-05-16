export type Fingerprint = { centroid: number[]; envelope: number[]; tempoMs: number; label: string };
export type DetectionEvent = { confidence: number; timestamp: number; matched: boolean; phraseProgress?: number };
export type SessionSummary = {
  id: string;
  startedAt: number;
  endedAt: number;
  count: number;
  avgConfidence: number;
  pacePerMinute: number;
};

export type MantraReference = {
  text: string;
  normalized: string;
  tokens: string[];
  syllableEstimate: number;
  expectedPhraseMs: number;
};
