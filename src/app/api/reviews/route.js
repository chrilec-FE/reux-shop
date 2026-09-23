import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function userFromRequest(req) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin.auth.getUser(header.slice(7));
  return data.user || null;
}

export async function GET(req) {
  if (!supabaseAdmin) return NextResponse.json({ reviews: [] });
  const productId = new URL(req.url).searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'Product is required' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('product_reviews').select('id, product_id, user_id, rating, body, created_at').eq('product_id', productId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data || [] });
}

export async function POST(req) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Sign in to review products' }, { status: 401 });
  const { productId, rating, body } = await req.json();
  if (!productId || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || !body?.trim()) {
    return NextResponse.json({ error: 'Product, rating, and review text are required' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('product_reviews').upsert({ product_id: productId, user_id: user.id, rating: Number(rating), body: body.trim() }, { onConflict: 'product_id,user_id' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
