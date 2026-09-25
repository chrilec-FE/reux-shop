import { Space_Grotesk } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/components/CartContext';
import AdminFloatingActions from '@/components/admin/AdminFloatingActions';
import { verifyAdmin } from '@/lib/admin-auth';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata = {
  title: 'ReUX — Modern Clothing',
  description: 'Clean, minimal clothing. Built different.',
  icons: { icon: '/icon.svg' }
};

export default function RootLayout({ children }) {
  const isAdmin = verifyAdmin(cookies().get('reux_admin')?.value);

  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} flex min-h-screen flex-col font-sans`}>
        <CartProvider>
          <Navbar isAdmin={isAdmin} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <AdminFloatingActions isAdmin={isAdmin} />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
