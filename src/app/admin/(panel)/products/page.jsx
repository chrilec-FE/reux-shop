import ProductManager from '@/components/admin/ProductManager';

export const dynamic = 'force-dynamic';

export default function AdminProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Products</h1>
      <p className="mt-1 text-sm text-neutral-500">Add, edit and remove items from your store.</p>
      <ProductManager />
    </div>
  );
}
