import './globals.css';
import Link from 'next/link';
import { SessionStoreProvider } from '@/lib/engine/session-store';

export const metadata = {
  title: 'JapaCounter',
  description: 'AI-assisted mantra counter with local-first privacy and deterministic precision.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm">
            <Link href="/" className="font-semibold tracking-wide text-gold">JapaCounter</Link>
            <div className="flex gap-5 text-zinc-300">
              <Link href="/session">Session</Link><Link href="/history">History</Link><Link href="/settings">Settings</Link><Link href="/privacy">Privacy</Link>
            </div>
          </nav>
        </header>
        <SessionStoreProvider>{children}</SessionStoreProvider>
      </body>
    </html>
  );
}
