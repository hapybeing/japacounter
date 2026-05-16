'use client';

import { useChantSession } from '@/hooks/useChantSession';

const statusText: Record<string, string> = {
  idle: 'Ready. Start chanting when focused.',
  needs_text_reference: 'Save a mantra text reference first for reliable phrase-level counting',
  listening: 'Listening for chant',
  reference_matched: 'Phrase matched and counted',
  partial_ignored: 'Partial phrase ignored',
  low_confidence: 'Low confidence, not counted',
  paused: 'Paused',
  recording_reference: 'Recording optional voice calibration...',
  processing_reference: 'Processing reference...'
};

export default function SessionPage() {
  const s = useChantSession();

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(200,169,109,0.09),transparent_50%)]" />
      <div className="relative z-10 glass rounded-3xl p-5 sm:p-8">
        <h1 className="text-center text-2xl sm:text-3xl font-semibold text-gold">Live Ritual Session</h1>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="mb-2 text-sm text-zinc-300">Primary Reference (Text Mantra)</p>
          <textarea
            value={s.mantraText}
            onChange={(e) => s.setMantraText(e.target.value)}
            placeholder="Om Namah Shivaya"
            className="min-h-24 w-full rounded-xl border border-white/15 bg-black/35 p-3 text-zinc-100 outline-none focus:border-gold"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={s.saveMantra} className="min-h-12 rounded-xl border border-gold px-4 py-3 text-sm text-gold">Save Mantra</button>
            <button onClick={s.initMic} className="min-h-12 rounded-xl border border-white/20 px-4 py-3 text-sm">Enable Mic</button>
          </div>
          {s.mantraRef && <p className="mt-2 text-xs text-zinc-400">Saved: {s.mantraRef.text} • Estimated phrase duration: {(s.mantraRef.expectedPhraseMs / 1000).toFixed(2)}s</p>}
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="mb-2 text-sm text-zinc-300">Secondary Reference (Optional Voice Calibration)</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={s.startCalibration} disabled={s.isCalibrating} className="min-h-12 rounded-xl border border-white/20 px-4 py-3 text-sm disabled:opacity-50">Calibrate Voice</button>
            <button onClick={s.stopCalibration} disabled={!s.isCalibrating} className="min-h-12 rounded-xl border border-gold px-4 py-3 text-sm text-gold disabled:opacity-50">Stop Calibration</button>
            <p className="self-center text-xs text-zinc-400">Timer: {(s.recordingMs / 1000).toFixed(1)}s</p>
          </div>
          <div className="mt-3 flex h-16 items-end gap-1 overflow-hidden rounded-lg border border-white/10 bg-black/40 p-2">
            {s.waveform.map((v, i) => <span key={`${i}-${v}`} className="w-1 rounded bg-gold/80" style={{ height: `${Math.min(100, Math.max(5, v * 700))}%` }} />)}
          </div>
        </section>

        <div className="my-6 text-center text-7xl sm:text-8xl font-semibold tabular-nums">{s.count}</div>
        <p className="mb-2 text-center text-zinc-400">Confidence {(s.confidence * 100).toFixed(1)}%</p>
        <p className="mb-5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-zinc-300">{statusText[s.status]}</p>

        <div className="relative z-20 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
          <button onClick={s.start} className="min-h-12 rounded-xl bg-gold px-4 py-3 text-sm text-black sm:text-base">Start Session</button>
          <button onClick={s.pause} className="min-h-12 rounded-xl border border-white/20 px-4 py-3 text-sm sm:text-base">Pause</button>
        </div>

        <section className="mt-6 grid gap-3 text-left sm:grid-cols-2">
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
              <p>Has text mantra: {String(Boolean(s.mantraRef))}</p>
              <p>Has audio calibration: {String(Boolean(s.fingerprint))}</p>
              <p>Calibrating: {String(s.isCalibrating)}</p>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
