'use client';
import { useLocalSessions } from '@/hooks/useLocalSessions';
export default function HistoryPage(){const {sessions}=useLocalSessions();return <main className="mx-auto max-w-4xl px-4 py-10"><h1 className="mb-6 text-3xl">Local Session History</h1><div className="space-y-3">{sessions.length===0?<p className="text-zinc-400">No saved sessions yet.</p>:sessions.map(s=><article key={s.id} className="glass rounded-xl p-4"><p>Count {s.count} • Confidence {(s.avgConfidence*100).toFixed(1)}% • Pace {s.pacePerMinute.toFixed(1)}/min</p></article>)}</div></main>}
