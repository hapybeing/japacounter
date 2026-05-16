'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { buildFingerprint, cosineSimilarity } from '@/lib/audio/fingerprint';
import { CountingEngine } from '@/lib/engine/counting-engine';
import type { Fingerprint, MantraReference } from '@/lib/engine/types';

type DetectionState =
  | 'idle'
  | 'needs_text_reference'
  | 'listening'
  | 'reference_matched'
  | 'partial_ignored'
  | 'low_confidence'
  | 'paused'
  | 'recording_reference'
  | 'processing_reference';

type Summary = {
  matchedCounts: number;
  ignoredPartials: number;
  lowConfidenceEvents: number;
  avgConfidence: number;
};

const FP_KEY = 'japa.reference.fp.v2';
const MANTRA_KEY = 'japa.reference.text.v1';

const normalize = (t: string) => t.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
const estimateSyllables = (token: string) => Math.max(1, (token.match(/[aeiouy]+/g) ?? []).length);

export function useChantSession() {
  const [count, setCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [running, setRunning] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [fingerprint, setFingerprint] = useState<Fingerprint | null>(null);
  const [status, setStatus] = useState<DetectionState>('needs_text_reference');
  const [summary, setSummary] = useState<Summary>({ matchedCounts: 0, ignoredPartials: 0, lowConfidenceEvents: 0, avgConfidence: 0 });
  const [mantraText, setMantraText] = useState('');
  const [mantraRef, setMantraRef] = useState<MantraReference | null>(null);
  const [recordingMs, setRecordingMs] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<CountingEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const confSamplesRef = useRef<number[]>([]);
  const recordingRef = useRef(false);

  const rebuildEngine = useCallback((nextMantra: MantraReference | null, nextFp: Fingerprint | null) => {
    if (!nextMantra) return;
    engineRef.current = new CountingEngine(nextFp, nextMantra, 650, 0.82);
  }, []);

  const loadSaved = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedMantra = localStorage.getItem(MANTRA_KEY);
    if (savedMantra && !mantraRef) {
      const parsed = JSON.parse(savedMantra) as MantraReference;
      setMantraRef(parsed);
      setMantraText(parsed.text);
      setStatus('idle');
    }
    const savedFp = localStorage.getItem(FP_KEY);
    if (savedFp && !fingerprint) {
      try {
        const parsed = JSON.parse(savedFp) as Fingerprint;
        setFingerprint(parsed);
      } catch {
        localStorage.removeItem(FP_KEY);
      }
    }
  }, [fingerprint, mantraRef]);

  const saveMantra = useCallback(() => {
    const normalized = normalize(mantraText);
    const tokens = normalized.split(' ').filter(Boolean);
    if (tokens.length < 2) {
      setStatus('needs_text_reference');
      return false;
    }
    const syllableEstimate = tokens.reduce((n, t) => n + estimateSyllables(t), 0);
    const expectedPhraseMs = Math.max(1200, syllableEstimate * 240);
    const ref: MantraReference = { text: mantraText.trim(), normalized, tokens, syllableEstimate, expectedPhraseMs };
    setMantraRef(ref);
    localStorage.setItem(MANTRA_KEY, JSON.stringify(ref));
    rebuildEngine(ref, fingerprint);
    setStatus('idle');
    return true;
  }, [fingerprint, mantraText, rebuildEngine]);

  const initMic = useCallback(async () => {
    loadSaved();
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
    analyserRef.current = analyser;
  }, [loadSaved]);

  const startCalibration = useCallback(async () => {
    await initMic();
    recordingRef.current = true;
    setIsCalibrating(true);
    setRecordingMs(0);
    setWaveform([]);
    setStatus('recording_reference');
    const started = performance.now();
    const loop = () => {
      if (!recordingRef.current || !analyserRef.current) return;
      const frame = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(frame);
      const energy = frame.reduce((a, s) => a + Math.abs(s), 0) / frame.length;
      setWaveform((w) => [...w.slice(-60), energy]);
      setRecordingMs(Math.floor(performance.now() - started));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [initMic]);

  const stopCalibration = useCallback(async () => {
    if (!analyserRef.current || !audioCtxRef.current) return;
    recordingRef.current = false;
    setStatus('processing_reference');
    const sr = audioCtxRef.current.sampleRate;
    const frames: Float32Array[] = [];
    const start = performance.now();
    const minMs = 3200;

    while (performance.now() - start < minMs) {
      const frame = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(frame);
      const energy = frame.reduce((a, s) => a + Math.abs(s), 0) / frame.length;
      if (energy > 0.012) frames.push(frame);
      await new Promise((r) => setTimeout(r, 30));
    }

    const total = frames.reduce((n, f) => n + f.length, 0);
    if (total < sr * 1.2) {
      setStatus('needs_text_reference');
      setIsCalibrating(false);
      return;
    }
    const merged = new Float32Array(total);
    let o = 0;
    for (const f of frames) {
      merged.set(f, o);
      o += f.length;
    }

    const fp = buildFingerprint(merged, sr, 'voice-calibration');
    setFingerprint(fp);
    localStorage.setItem(FP_KEY, JSON.stringify(fp));
    rebuildEngine(mantraRef, fp);
    setStatus('idle');
    setIsCalibrating(false);
  }, [mantraRef, rebuildEngine]);

  const tick = useCallback(() => {
    if (!running || !analyserRef.current || !engineRef.current || !audioCtxRef.current || !mantraRef) return;
    const frame = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(frame);
    const energy = frame.reduce((a, s) => a + Math.abs(s), 0) / frame.length;
    setWaveform((w) => [...w.slice(-60), energy]);

    if (energy < 0.012) {
      engineRef.current.decayProgress();
      setStatus('listening');
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const liveFp = buildFingerprint(frame, audioCtxRef.current.sampleRate, 'live-frame');
    const spectral = fingerprint ? cosineSimilarity(fingerprint.centroid, liveFp.centroid) : 0.72;
    const envelope = fingerprint ? cosineSimilarity(fingerprint.envelope, liveFp.envelope) : 0.7;
    const textWeight = Math.min(1, mantraRef.syllableEstimate / 10) * 0.08;
    const combined = Math.max(0, Math.min(1, spectral * 0.58 + envelope * 0.34 + (0.68 + textWeight) * 0.08));

    setConfidence(combined);
    confSamplesRef.current.push(combined);
    const avgConfidence = confSamplesRef.current.reduce((a, b) => a + b, 0) / confSamplesRef.current.length;

    if (combined < 0.76) {
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

    const progressBoost = 1 / Math.max(mantraRef.tokens.length * 2, 6);
    const next = engineRef.current.ingest({ confidence: combined, matched: true, timestamp: performance.now(), phraseProgress: progressBoost });

    if (next > count) {
      setCount(next);
      setStatus('reference_matched');
      setSummary((s) => ({ ...s, matchedCounts: next, avgConfidence }));
    } else {
      setStatus('listening');
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [count, fingerprint, mantraRef, running]);

  const start = useCallback(() => {
    if (!mantraRef) {
      setStatus('needs_text_reference');
      return;
    }
    rebuildEngine(mantraRef, fingerprint);
    setRunning(true);
    setStatus('listening');
    rafRef.current = requestAnimationFrame(tick);
  }, [fingerprint, mantraRef, rebuildEngine, tick]);

  const pause = useCallback(() => {
    setRunning(false);
    setStatus('paused');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return useMemo(
    () => ({
      count,
      confidence,
      running,
      status,
      summary,
      fingerprint,
      mantraText,
      mantraRef,
      recordingMs,
      waveform,
      isCalibrating,
      setMantraText,
      saveMantra,
      initMic,
      startCalibration,
      stopCalibration,
      start,
      pause
    }),
    [confidence, count, fingerprint, initMic, isCalibrating, mantraRef, mantraText, pause, recordingMs, running, saveMantra, start, startCalibration, status, stopCalibration, summary, waveform]
  );
}
