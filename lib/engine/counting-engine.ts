import type { DetectionEvent, Fingerprint } from './types';

export class CountingEngine {
  private count = 0;
  private lastCountAt = 0;
  private confHistory: number[] = [];
  constructor(private fingerprint: Fingerprint, private cooldownMs = 350, private threshold = 0.78) {}

  ingest(event: DetectionEvent) {
    if (!event.matched || event.confidence < this.threshold) return this.count;
    const elapsed = event.timestamp - this.lastCountAt;
    const adaptiveCooldown = Math.min(Math.max(this.fingerprint.tempoMs * 0.35, this.cooldownMs), this.fingerprint.tempoMs * 0.7);
    if (elapsed < adaptiveCooldown) return this.count;
    this.lastCountAt = event.timestamp;
    this.count += 1;
    this.confHistory.push(event.confidence);
    return this.count;
  }
  getStats(startedAt: number, endedAt: number) {
    const avgConfidence = this.confHistory.reduce((a, b) => a + b, 0) / Math.max(this.confHistory.length, 1);
    const durationMin = (endedAt - startedAt) / 60000;
    return { count: this.count, avgConfidence, pacePerMinute: this.count / Math.max(durationMin, 0.001) };
  }
}
