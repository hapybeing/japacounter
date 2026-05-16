export type Fingerprint = { centroid: number[]; envelope: number[]; tempoMs: number; label: string };
export type DetectionEvent = { confidence: number; timestamp: number; matched: boolean };
export type SessionSummary = { id: string; startedAt: number; endedAt: number; count: number; avgConfidence: number; pacePerMinute: number };
