import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/utils/rate-limit';

const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000001';

const MAX_NAME = 120;
const MAX_MESSAGE = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALES = new Set(['en', 'fr', 'ar']);

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = rateLimit(`contact:${getClientIp(request)}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, message, email, locale } = (body ?? {}) as Record<string, unknown>;

  // Validation
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > MAX_NAME) {
    return NextResponse.json({ error: 'A valid name is required.' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.trim().length === 0 || message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: 'A valid message is required.' }, { status: 400 });
  }
  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
  }
  const safeLocale = typeof locale === 'string' && LOCALES.has(locale) ? locale : 'en';

  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').insert({
    store_id: DEFAULT_STORE_ID,
    name: name.trim(),
    email: email ? String(email).trim() : null,
    message: message.trim(),
    locale: safeLocale,
  });

  if (error) {
    // Surface the failure instead of pretending it succeeded.
    console.error('Contact insert error:', error);
    return NextResponse.json(
      { error: 'Could not save your message. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
