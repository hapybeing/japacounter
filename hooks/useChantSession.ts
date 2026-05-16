'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { buildFingerprint, cosineSimilarity } from '@/lib/audio/fingerprint';
import { CountingEngine } from '@/lib/engine/counting-engine';
import type { Fingerprint } from '@/lib/engine/types';

type DetectionState =
  | 'idle'
  | 'needs_reference'
  | 'listening'
  | 'reference_matched'
  | 'partial_ignored'
  | 'low_confidence'
  | 'paused';

type Summary = {
  matchedCounts: number;
  ignoredPartials: number;
  lowConfidenceEvents: number;
  avgConfidence: number;
};

const FP_KEY = 'japa.reference.fp.v1';

export function useChantSession() {
  const [count, setCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [running, setRunning] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [fingerprint, setFingerprint] = useState<Fingerprint | null>(null);
  const [status, setStatus] = useState<DetectionState>('needs_reference');
  const [summary, setSummary] = useState<Summary>({ matchedCounts: 0, ignoredPartials: 0, lowConfidenceEvents: 0, avgConfidence: 0 });

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<CountingEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const confSamplesRef = useRef<number[]>([]);

  const maybeLoadSavedReference = useCallback(() => {
    if (fingerprint || typeof window === 'undefined') return;
    const raw = localStorage.getItem(FP_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Fingerprint;
      setFingerprint(parsed);
      engineRef.current = new CountingEngine(parsed, 500, 0.82);
      setStatus('idle');
    } catch {
      localStorage.removeItem(FP_KEY);
    }
  }, [fingerprint]);

  const initMic = useCallback(async () => {
    maybeLoadSavedReference();
    if (analyserRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false, channelCount: 1 }
    });
    const ctx = new AudioContext({ sampleRate: 48000 });
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.2;
    src.connect(analyser);

    streamRef.current = stream;
    audioCtxRef.current = ctx;
    sourceRef.current = src;
    analyserRef.current = analyser;
    setStatus((prev) => (fingerprint ? 'idle' : prev));
  }, [fingerprint, maybeLoadSavedReference]);

  const captureReference = useCallback(async () => {
    await initMic();
    const analyser = analyserRef.current;
    if (!analyser || !audioCtxRef.current) return;

    setIsCalibrating(true);
    setStatus('listening');
    const sr = audioCtxRef.current.sampleRate;
    const frames: Float32Array[] = [];
    const started = performance.now();

    while (performance.now() - started < 2200) {
      const frame = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(frame);
      const energy = frame.reduce((a, s) => a + Math.abs(s), 0) / frame.length;
      if (energy > 0.015) frames.push(frame);
      await new Promise((r) => setTimeout(r, 40));
    }

    const total = frames.reduce((n, f) => n + f.length, 0);
    if (total < sr * 0.45) {
      setStatus('needs_reference');
      setIsCalibrating(false);
      return;
    }

    const merged = new Float32Array(total);
    let offset = 0;
    for (const frame of frames) {
      merged.set(frame, offset);
      offset += frame.length;
    }

    const fp = buildFingerprint(merged, sr, 'user-mantra');
    setFingerprint(fp);
    localStorage.setItem(FP_KEY, JSON.stringify(fp));
    engineRef.current = new CountingEngine(fp, 500, 0.82);
    setSummary({ matchedCounts: 0, ignoredPartials: 0, lowConfidenceEvents: 0, avgConfidence: 0 });
    setCount(0);
    confSamplesRef.current = [];
    setStatus('idle');
    setIsCalibrating(false);
  }, [initMic]);

  const tick = useCallback(() => {
    if (!running || !analyserRef.current || !fingerprint || !engineRef.current || !audioCtxRef.current) return;

    const analyser = analyserRef.current;
    const frame = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(frame);

    const energy = frame.reduce((a, s) => a + Math.abs(s), 0) / frame.length;
    if (energy < 0.014) {
      setStatus('listening');
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const frameFp = buildFingerprint(frame, audioCtxRef.current.sampleRate, 'live-frame');
    const similarity = cosineSimilarity(fingerprint.centroid, frameFp.centroid);
    const envSimilarity = cosineSimilarity(fingerprint.envelope, frameFp.envelope);
    const combined = Math.max(0, Math.min(1, similarity * 0.65 + envSimilarity * 0.35));

    setConfidence(combined);
    confSamplesRef.current.push(combined);
    const avgConfidence = confSamplesRef.current.reduce((a, b) => a + b, 0) / confSamplesRef.current.length;

    if (combined < 0.78) {
      setStatus('partial_ignored');
      setSummary((s) => ({ ...s, ignoredPartials: s.ignoredPartials + 1, avgConfidence }));
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (combined < 0.82) {
      setStatus('low_confidence');
      setSummary((s) => ({ ...s, lowConfidenceEvents: s.lowConfidenceEvents + 1, avgConfidence }));
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const next = engineRef.current.ingest({ confidence: combined, matched: true, timestamp: performance.now() });
    if (next > count) {
      setCount(next);
      setStatus('reference_matched');
      setSummary((s) => ({ ...s, matchedCounts: next, avgConfidence }));
    } else {
      setStatus('listening');
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [count, fingerprint, running]);

  const start = useCallback(() => {
    if (!fingerprint) {
      setStatus('needs_reference');
      return;
    }
    setRunning(true);
    setStatus('listening');
    rafRef.current = requestAnimationFrame(tick);
  }, [fingerprint, tick]);

  const pause = useCallback(() => {
    setRunning(false);
    setStatus('paused');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return useMemo(
    () => ({ count, confidence, running, status, summary, fingerprint, isCalibrating, initMic, captureReference, start, pause }),
    [captureReference, confidence, count, fingerprint, initMic, isCalibrating, pause, running, start, status, summary]
  );
}
