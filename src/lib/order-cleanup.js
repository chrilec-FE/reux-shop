import { supabaseAdmin } from './supabase-admin';

export async function cleanupStaleReceivedOrders() {
  if (!supabaseAdmin) return;

  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from('orders')
    .delete()
    .eq('status', 'received')
    .lt('updated_at', cutoff);
}
