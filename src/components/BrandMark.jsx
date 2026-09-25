export default function BrandMark({ compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2 ${compact ? '' : 'text-xl'}`} aria-hidden="true">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-sm font-bold text-white shadow-sm">
        R
      </span>
      {!compact && <span className="font-bold tracking-tight">Re<span className="text-neutral-400">UX</span></span>}
    </span>
  );
}
