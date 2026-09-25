import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminRequest } from '@/lib/admin-auth';
import { normalizeImageList } from '@/lib/images';

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await req.json();
  const { name, price, description, category, sizes, stock, image_url, images } = body;
  const imageList = normalizeImageList(images);
  const legacyImageUrl = imageList[0] || String(image_url || '').trim();

  if (!name?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock ?? 0)) || Number(stock ?? 0) < 0) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ name: name.trim(), price: Number(price), description: description || '', category: category || 'Men', sizes: Array.isArray(sizes) ? sizes : [], stock: Number(stock ?? 0), image_url: legacyImageUrl, images: imageList.length ? imageList : (legacyImageUrl ? [legacyImageUrl] : []) })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
