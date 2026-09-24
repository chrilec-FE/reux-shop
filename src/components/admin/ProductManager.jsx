'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/format';

const empty = { name: '', price: '', category: 'T-Shirts', sizes: 'S,M,L,XL', stock: '0', image_url: '', description: '' };

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products || []);
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch(editingId ? `/api/products/${editingId}` : '/api/products', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        stock: parseInt(form.stock) || 0,
        image_url: form.image_url,
        description: form.description
      })
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save product');
      return;
    }
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category || '',
      sizes: (product.sizes || []).join(','),
      stock: String(product.stock ?? 0),
      image_url: product.image_url || '',
      description: product.description || ''
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
    setError('');
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={save} className="card h-fit space-y-4 p-6">
        <h2 className="font-semibold">{editingId ? 'Edit item' : 'Add new item'}</h2>
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price (SEK)</label>
            <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
          </div>
          <div>
            <label className="label">Stock</label>
            <input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} />
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <input className="input" value={form.category} onChange={set('category')} />
        </div>
        <div>
          <label className="label">Sizes (comma separated)</label>
          <input className="input" value={form.sizes} onChange={set('sizes')} />
        </div>
        <div>
          <label className="label">Image URL</label>
          <input className="input" type="url" value={form.image_url} onChange={set('image_url')} placeholder="https://…" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="card flex items-center gap-4 p-4">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
              {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="56px" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-sm text-neutral-500">{p.category} · {p.stock} in stock</p>
            </div>
            <p className="font-medium">{formatCurrency(p.price)}</p>
            <button onClick={() => edit(p)} className="text-sm underline">Edit</button>
            <button onClick={() => remove(p.id)} className="text-sm text-red-600 underline">Delete</button>
          </div>
        ))}
        {products.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No products yet.</p>
        )}
      </div>
    </div>
  );
}
