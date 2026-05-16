'use client';

import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-10">
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(200,169,109,0.18),transparent_40%)]"
      />
      <div className="relative z-10 max-w-3xl pointer-events-auto">
        <p className="mb-4 text-gold">AI-assisted mantra counting with precision and privacy</p>
        <h1 className="mb-4 text-5xl font-semibold">Count every true repetition.<br />Trust every number.</h1>
        <p className="text-zinc-300">Built for low-latency browser audio, deterministic boundaries, and private local-only sessions.</p>
      </div>
    </section>
  );
}
