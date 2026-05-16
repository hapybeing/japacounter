# JapaCounter

JapaCounter is a production-grade, privacy-first, AI-assisted mantra repetition counter built as a precision spiritual instrument.

## Vision
- Trustworthy counting over flashy novelty.
- Immersive premium minimalist ritual UX.
- Local-first audio processing and storage.

## Stack
- Next.js App Router + React + TypeScript strict mode
- Tailwind CSS + Framer Motion
- Vercel-compatible architecture

## Architecture
- `app/`: routes for marketing, live session, settings, history, privacy.
- `hooks/useChantSession.ts`: microphone pipeline and real-time loop.
- `lib/audio/fingerprint.ts`: deterministic fingerprint extraction + cosine similarity.
- `lib/engine/counting-engine.ts`: anti-double-counting, cooldown gating, confidence thresholds.
- `hooks/useLocalSessions.ts`: local-only persistence.

## Audio Pipeline
1. Capture microphone stream with `getUserMedia`.
2. Analyze frames with `AnalyserNode`.
3. Build compact spectral-temporal fingerprint per frame.
4. Compute similarity against recorded reference mantra.
5. Run VAD energy gate to filter silence/breathing/noise.
6. Send candidates to deterministic counting engine.

## Counting Philosophy
- Deterministic first: a repetition is counted only when threshold and cooldown windows pass.
- Adaptive cooldown scales with the reference tempo.
- Confidence is continuously exposed to UI.

## Privacy
- No server-side audio storage.
- No mandatory account.
- Session history kept in localStorage.

## Deployment
```bash
npm install
npm run build
```
Deploy directly to Vercel.

## Roadmap
- AudioWorklet + Worker offloading
- Silero/WebRTC VAD integration
- Optional ONNX local model refinement
- IndexedDB archival + export/import
- PWA offline temple mode
