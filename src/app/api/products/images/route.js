import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminRequest } from '@/lib/admin-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };

export async function POST(req) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
  }
  if (!extensions[file.type]) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP, GIF, and AVIF images are supported' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Images must be 10 MB or smaller' }, { status: 400 });
  }

  const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensions[file.type]}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('product-images')
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from('product-images').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
