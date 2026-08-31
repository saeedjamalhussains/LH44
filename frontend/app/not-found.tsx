import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 text-center">
      <p className="display text-[30vw] leading-none text-line md:text-[16rem]">404</p>
      <p className="display text-3xl md:text-5xl">THIS LAP DOES NOT EXIST.</p>
      <p className="max-w-md text-sm text-muted">
        The page you asked for is not in the archive.
      </p>
      <Link href="/" className="btn btn-ghost">RETURN TO THE LEGACY</Link>
    </div>
  );
}
