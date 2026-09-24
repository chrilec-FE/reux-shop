import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginForm from './AdminLoginForm';
import { verifyAdmin } from '@/lib/admin-auth';

export default function AdminLoginPage() {
  if (verifyAdmin(cookies().get('reux_admin')?.value)) redirect('/admin');
  return <AdminLoginForm />;
}
