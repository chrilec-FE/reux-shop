'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { Skeleton } from '@/components/LoadingSkeleton';
import { getProductImages } from '@/lib/images';

const empty = { name: '', price: '', category: 'Men', sizes: 'S,M,L,XL', stock: '0', images: [], description: '' };

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
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
        images: form.images,
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
      images: getProductImages(product),
      description: product.description || ''
    });
    setNewImageUrl('');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
    setNewImageUrl('');
    setError('');
  };

  const categoryOptions = [...PRODUCT_CATEGORIES, ...new Set(products.map((product) => product.category).filter((category) => category && !PRODUCT_CATEGORIES.includes(category)))];

  const addImageUrl = () => {
    const value = newImageUrl.trim();
    if (!value || form.images.includes(value)) return;
    setForm((current) => ({ ...current, images: [...current.images, value] }));
    setNewImageUrl('');
  };

  const removeImage = (image) => {
    setForm((current) => ({ ...current, images: current.images.filter((entry) => entry !== image) }));
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/products/images', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not upload image');
      setForm((current) => ({ ...current, images: [...current.images, data.url] }));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingImage(false);
    }
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
          <select className="input" value={form.category} onChange={set('category')} required>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Sizes (comma separated)</label>
          <input className="input" value={form.sizes} onChange={set('sizes')} />
        </div>
        <div>
          <label className="label">Product images</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="input" type="url" value={newImageUrl} onChange={(event) => setNewImageUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImageUrl(); } }} placeholder="https:// image URL" />
            <button type="button" className="btn-secondary shrink-0" onClick={addImageUrl}>Add URL</button>
            <button type="button" className="btn-secondary shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>{uploadingImage ? 'Uploading…' : 'Upload'}</button>
            <input ref={fileInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={uploadImage} />
          </div>
          <p className="mt-1 text-xs text-neutral-500">Upload also offers Take photo on supported phones.</p>
          {form.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {form.images.map((image) => (
                <div key={image} className="relative h-20 w-16 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(image)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900/80 text-xs text-white" aria-label="Remove image">×</button>
                </div>
              ))}
            </div>
          )}
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
        {loading ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24" />) : products.map((p) => (
          <div key={p.id} className="card flex items-center gap-4 p-4">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
              {getProductImages(p)[0] && <Image src={getProductImages(p)[0]} alt={p.name} fill className="object-cover" sizes="56px" />}
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
        {!loading && products.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No products yet.</p>
        )}
      </div>
    </div>
  );
}
