import AdminDashboardButton from '@/components/admin/AdminDashboardButton';

export default function AdminLayout({ children }) {
  return (
    <>
      {children}
      <AdminDashboardButton />
    </>
  );
}