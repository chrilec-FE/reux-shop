'use client';

import AdminAutoRefresh from '@/components/admin/AdminAutoRefresh';

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminAutoRefresh />
      {children}
    </>
  );
}