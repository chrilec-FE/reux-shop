export default function Footer() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'reuxsupport@gmail.com';
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-neutral-500 sm:flex-row">
        <p>© {new Date().getFullYear()} ReUX. All rights reserved.</p>
        <p>
          Support: <a href={`mailto:${email}`} className="underline hover:text-neutral-900">{email}</a>
        </p>
      </div>
    </footer>
  );
}
