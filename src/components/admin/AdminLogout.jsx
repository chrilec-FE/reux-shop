'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogout() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await fetch('/api/auth/admin-logout', { method: 'POST' }); router.push('/admin/login'); router.refresh(); }}
      className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
    >
      Log out
    </button>
  );
}
