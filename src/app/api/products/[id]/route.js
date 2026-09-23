import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminRequest } from '@/lib/admin-auth';

export async function PUT(req, { params }) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const body = await req.json();
  const allowed = ['name', 'price', 'description', 'category', 'sizes', 'stock', 'image_url'];
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  if (update.name !== undefined) update.name = String(update.name).trim();
  if (update.price !== undefined) update.price = Number(update.price);
  if (update.stock !== undefined) update.stock = Number(update.stock);
  if (update.price !== undefined && (!Number.isFinite(update.price) || update.price < 0)) return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  if (update.stock !== undefined && (!Number.isInteger(update.stock) || update.stock < 0)) return NextResponse.json({ error: 'Invalid stock' }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from('products').update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(req, { params }) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { error } = await supabaseAdmin.from('products').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
