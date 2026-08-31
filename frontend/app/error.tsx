'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[lh44]', error); }, [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 text-center">
      <p className="display text-6xl text-silver md:text-8xl">DATA UNAVAILABLE</p>
      <p className="max-w-lg text-sm leading-relaxed text-muted">
        Something failed while assembling this page. The rest of the archive is still available.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">TRY AGAIN</button>
        <Link href="/" className="btn btn-ghost">RETURN TO THE LEGACY</Link>
      </div>
    </div>
  );
}
