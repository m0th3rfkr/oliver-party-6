import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './supabase-config.js?v=1';

/**
 * Saves an RSVP to the Supabase "rsvps" table (see SETUP.md).
 * keepalive lets the request finish even when the page then navigates to WhatsApp.
 * @param {{ name: string, companions: string, lang: string }} rsvp
 * @returns {Promise<boolean>} whether it was saved
 */
export async function saveRsvp({ name, companions, lang }) {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ name, companions: companions || null, lang }),
    });
    if (!res.ok) console.error('RSVP not saved', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('RSVP not saved', err);
    return false;
  }
}
