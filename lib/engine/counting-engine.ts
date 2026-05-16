import type { DetectionEvent, Fingerprint, MantraReference } from './types';

export class CountingEngine {
  private count = 0;
  private lastCountAt = 0;
  private confHistory: number[] = [];
  private phraseProgress = 0;

  constructor(
    private fingerprint: Fingerprint | null,
    private mantra: MantraReference,
    private cooldownMs = 500,
    private threshold = 0.82
  ) {}

  ingest(event: DetectionEvent) {
    if (!event.matched || event.confidence < this.threshold) return this.count;

    const progressBoost = Math.max(0.08, Math.min(0.42, event.confidence * 0.38));
    this.phraseProgress = Math.min(1, this.phraseProgress + (event.phraseProgress ?? progressBoost));

    if (this.phraseProgress < 1) return this.count;

    const elapsed = event.timestamp - this.lastCountAt;
    const cadenceMs = this.fingerprint?.tempoMs ?? this.mantra.expectedPhraseMs;
    const adaptiveCooldown = Math.min(Math.max(cadenceMs * 0.45, this.cooldownMs), cadenceMs * 0.95);
    if (elapsed < adaptiveCooldown) return this.count;

    this.lastCountAt = event.timestamp;
    this.count += 1;
    this.confHistory.push(event.confidence);
    this.phraseProgress = 0;
    return this.count;
  }

  decayProgress() {
    this.phraseProgress = Math.max(0, this.phraseProgress - 0.03);
  }

  getPhraseProgress() {
    return this.phraseProgress;
  }

  getStats(startedAt: number, endedAt: number) {
    const avgConfidence = this.confHistory.reduce((a, b) => a + b, 0) / Math.max(this.confHistory.length, 1);
    const durationMin = (endedAt - startedAt) / 60000;
    return { count: this.count, avgConfidence, pacePerMinute: this.count / Math.max(durationMin, 0.001) };
  }
}
