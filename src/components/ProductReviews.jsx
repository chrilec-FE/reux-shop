'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState('5');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await fetch(`/api/reviews?productId=${productId}`);
    const data = await res.json();
    setReviews(data.reviews || []);
  };
  useEffect(() => { load(); }, [productId]);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!session) return setMessage('Sign in to leave a review');
    const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ productId, rating, body }) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || 'Could not save review');
    setBody('');
    setMessage('Review saved');
    load();
  };

  return <section className="mt-16 border-t border-neutral-200 pt-10"><h2 className="text-xl font-semibold">Reviews</h2><form onSubmit={submit} className="mt-5 max-w-xl space-y-3"><select className="input" value={rating} onChange={(e) => setRating(e.target.value)}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><textarea className="input" rows={3} placeholder="Share your experience" value={body} onChange={(e) => setBody(e.target.value)} required /><button className="btn-secondary">Post review</button>{message && <p className="text-sm text-neutral-500">{message}</p>}</form><div className="mt-8 space-y-4">{reviews.map((review) => <article key={review.id} className="border-b border-neutral-100 pb-4"><p className="font-medium">{'★'.repeat(review.rating)}<span className="ml-2 text-xs text-neutral-400">{new Date(review.created_at).toLocaleDateString()}</span></p><p className="mt-1 text-sm text-neutral-600">{review.body}</p></article>)}{reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet.</p>}</div></section>;
}
