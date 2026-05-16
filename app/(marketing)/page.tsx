import Link from 'next/link';
import { Hero } from '@/components/landing/hero';

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-24 px-4 py-12">
      <Hero />
      <section className="grid gap-6 md:grid-cols-3">{['Reference capture','Deterministic segmentation','Private local processing'].map((x)=><article key={x} className="glass rounded-2xl p-6"><h3 className="mb-2 text-lg text-gold">{x}</h3><p className="text-zinc-300">Engineered for trust-first mantra detection in noisy reality.</p></article>)}</section>
      <section className="glass rounded-3xl p-10 text-center"><h2 className="mb-4 text-3xl font-semibold">Precision spiritual instrument, not a social app.</h2><p className="mb-6 text-zinc-300">Hybrid counting engine combines VAD, spectral fingerprinting, cadence windows, and anti-double-count gating.</p><div className="flex justify-center gap-4"><Link href="/session" className="rounded-xl bg-gold px-5 py-3 text-black">Start Session</Link><Link href="/session?demo=1" className="rounded-xl border border-gold px-5 py-3 text-gold">Try Demo</Link></div></section>
    </main>
  );
}
