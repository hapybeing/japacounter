'use client';
import { useChantSession } from '@/hooks/useChantSession';

export default function SessionPage() {
  const s = useChantSession();
  return <main className="mx-auto max-w-4xl px-4 py-10"><div className="glass rounded-3xl p-10 text-center"><p className="text-gold">Live Ritual Session</p><div className="my-6 text-8xl font-semibold tabular-nums">{s.count}</div><p className="mb-8 text-zinc-400">Confidence {(s.confidence * 100).toFixed(1)}%</p><div className="flex flex-wrap justify-center gap-3"><button onClick={s.initMic} className="rounded-xl border border-white/20 px-4 py-2">Enable Mic</button><button onClick={s.captureReference} className="rounded-xl border border-gold px-4 py-2 text-gold">Record Reference</button><button onClick={s.start} className="rounded-xl bg-gold px-4 py-2 text-black">Start</button><button onClick={s.pause} className="rounded-xl border border-white/20 px-4 py-2">Pause</button></div><p className="mt-6 text-xs text-zinc-500">On-device processing only. Audio never leaves your browser.</p></div></main>;
}
