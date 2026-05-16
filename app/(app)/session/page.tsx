'use client';

import { useChantSession } from '@/hooks/useChantSession';

const statusText: Record<string, string> = {
  idle: 'Ready',
  needs_reference: 'Reliable counting requires a recorded reference mantra',
  listening: 'Listening for chant',
  reference_matched: 'Reference matched',
  partial_ignored: 'Partial sound ignored',
  low_confidence: 'Low confidence, not counted',
  paused: 'Paused'
};

export default function SessionPage() {
  const s = useChantSession();

  return (
    <main className="relative mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(200,169,109,0.09),transparent_50%)]" />
      <div className="relative z-10 glass rounded-3xl p-5 sm:p-10 text-center">
        <p className="text-gold">Live Ritual Session</p>
        <div className="my-6 text-7xl sm:text-8xl font-semibold tabular-nums">{s.count}</div>
        <p className="mb-3 text-zinc-400">Confidence {(s.confidence * 100).toFixed(1)}%</p>
        <p className="mb-6 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">{statusText[s.status]}</p>

        <div className="relative z-20 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
          <button onClick={s.initMic} className="min-h-12 rounded-xl border border-white/20 px-4 py-3 text-sm sm:text-base">Enable Mic</button>
          <button onClick={s.captureReference} disabled={s.isCalibrating} className="min-h-12 rounded-xl border border-gold px-4 py-3 text-sm text-gold disabled:opacity-50 sm:text-base">{s.isCalibrating ? 'Calibrating...' : 'Record Reference'}</button>
          <button onClick={s.start} className="min-h-12 rounded-xl bg-gold px-4 py-3 text-sm text-black sm:text-base">Start</button>
          <button onClick={s.pause} className="min-h-12 rounded-xl border border-white/20 px-4 py-3 text-sm sm:text-base">Pause</button>
        </div>

        <section className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
            <h3 className="mb-2 text-gold">Session Summary</h3>
            <p>Total counts: {s.count}</p>
            <p>Matched counts: {s.summary.matchedCounts}</p>
            <p>Ignored partials: {s.summary.ignoredPartials}</p>
            <p>Avg confidence: {(s.summary.avgConfidence * 100).toFixed(1)}%</p>
          </article>
          {process.env.NODE_ENV === 'development' && (
            <article className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
              <h3 className="mb-2 text-gold">Debug</h3>
              <p>Status: {s.status}</p>
              <p>Running: {String(s.running)}</p>
              <p>Has reference: {String(Boolean(s.fingerprint))}</p>
              <p>Calibrating: {String(s.isCalibrating)}</p>
            </article>
          )}
        </section>
        <p className="mt-6 text-xs text-zinc-500">On-device processing only. Audio never leaves your browser.</p>
      </div>
    </main>
  );
}
