export const dynamic = 'force-dynamic';

/** Liveness check for Docker. It skips the database on purpose: restarting the app cannot fix a Supabase outage. */
export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
