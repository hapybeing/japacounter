import type { Fingerprint } from '@/lib/engine/types';

export function buildFingerprint(samples: Float32Array, sampleRate: number, label: string): Fingerprint {
  const bins = 24;
  const centroid = Array.from({ length: bins }, (_, i) => {
    const start = Math.floor((samples.length / bins) * i);
    const end = Math.floor((samples.length / bins) * (i + 1));
    let sum = 0;
    for (let j = start; j < end; j++) sum += Math.abs(samples[j] ?? 0);
    return sum / Math.max(end - start, 1);
  });
  const envelope = centroid.map((v, i, arr) => (v - (arr[i - 1] ?? v)) * 0.5 + v);
  const tempoMs = Math.max(650, (samples.length / sampleRate) * 1000);
  return { centroid, envelope, tempoMs, label };
}

export function cosineSimilarity(a: number[], b: number[]) {
  const len = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < len; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}
