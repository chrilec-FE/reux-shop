import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function userFromRequest(req) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin.auth.getUser(header.slice(7));
  return data.user || null;
}

export async function PATCH(req) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Sign in to update your details' }, { status: 401 });

  const profile = await req.json();
  const fields = ['first_name', 'last_name', 'street_address', 'postal_code', 'city', 'country'];
  if (fields.some((field) => typeof profile[field] !== 'string' || !profile[field].trim())) {
    return NextResponse.json({ error: 'Please complete all shipping details' }, { status: 400 });
  }

  const userMetadata = { ...user.user_metadata };
  fields.forEach((field) => { userMetadata[field] = profile[field].trim(); });
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: userMetadata });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: fields.reduce((result, field) => ({ ...result, [field]: data.user.user_metadata[field] }), {}) });
}