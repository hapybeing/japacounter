'use client';
import { useMemo, useRef, useState } from 'react';
import { buildFingerprint, cosineSimilarity } from '@/lib/audio/fingerprint';
import { CountingEngine } from '@/lib/engine/counting-engine';
import type { Fingerprint } from '@/lib/engine/types';

export function useChantSession() {
  const [count, setCount] = useState(0); const [confidence, setConfidence] = useState(0); const [running, setRunning] = useState(false);
  const [fingerprint, setFingerprint] = useState<Fingerprint | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null); const audioRef = useRef<AudioContext | null>(null); const engineRef = useRef<CountingEngine | null>(null);

  const initMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
    const ctx = new AudioContext(); const src = ctx.createMediaStreamSource(stream); const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
    audioRef.current = ctx; analyserRef.current = analyser;
  };

  const captureReference = async () => {
    if (!analyserRef.current) await initMic();
    const analyser = analyserRef.current!; const data = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data);
    const fp = buildFingerprint(data, audioRef.current!.sampleRate, 'user-mantra'); setFingerprint(fp); engineRef.current = new CountingEngine(fp);
  };

  const tick = () => {
    if (!running || !analyserRef.current || !fingerprint || !engineRef.current) return;
    const data = new Float32Array(analyserRef.current.fftSize); analyserRef.current.getFloatTimeDomainData(data);
    const frameFp = buildFingerprint(data, audioRef.current!.sampleRate, 'frame');
    const similarity = cosineSimilarity(fingerprint.centroid, frameFp.centroid);
    const energy = frameFp.centroid.reduce((a, b) => a + b, 0) / frameFp.centroid.length;
    const vadPass = energy > 0.015;
    const c = Math.max(0, Math.min(1, similarity)); setConfidence(c);
    if (vadPass) setCount(engineRef.current.ingest({ confidence: c, matched: c > 0.72, timestamp: performance.now() }));
    requestAnimationFrame(tick);
  };
  const start = () => { setRunning(true); requestAnimationFrame(tick); };
  const pause = () => setRunning(false);

  return useMemo(() => ({ count, confidence, running, fingerprint, initMic, captureReference, start, pause }), [count, confidence, running, fingerprint]);
}
