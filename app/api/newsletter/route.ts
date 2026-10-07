import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/utils/rate-limit';

const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000001';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = rateLimit(`newsletter:${getClientIp(request)}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_subscribers').insert({
    store_id: DEFAULT_STORE_ID,
    email: email.trim().toLowerCase(),
  });

  if (error) {
    // Duplicate email hits the UNIQUE(store_id, email) constraint — treat as success.
    if (error.code === '23505') {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }
    console.error('Newsletter insert error:', error);
    return NextResponse.json(
      { error: 'Could not subscribe you. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
