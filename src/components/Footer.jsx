import Link from 'next/link';

export default function Footer() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'reuxsupport@gmail.com';
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-neutral-500 sm:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-500">
            <Link href="/privacy" className="transition hover:text-neutral-900 hover:opacity-80">Privacy policy</Link>
            <Link href="/terms" className="transition hover:text-neutral-900 hover:opacity-80">Terms</Link>
            <Link href="/shipping" className="transition hover:text-neutral-900 hover:opacity-80">Shipping</Link>
            <Link href="/returns" className="transition hover:text-neutral-900 hover:opacity-80">Returns</Link>
          </nav>
          <p>
            Support: <a href={`mailto:${email}`} className="underline transition hover:text-neutral-900 hover:opacity-80">{email}</a>
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-neutral-500 sm:text-left">© {new Date().getFullYear()} ReUX. All rights reserved.</p>
      </div>
    </footer>
  );
}
