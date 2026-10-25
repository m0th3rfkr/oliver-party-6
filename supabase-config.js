// Fill these two in after creating your Supabase project (see SETUP.md).
// The anon key is meant to be public; the table and bucket policies limit what it can do.
// Until they are filled in, the album is a preview that only keeps
// what is added in this browser, and RSVPs are only sent by WhatsApp.
export const SUPABASE_URL = 'https://fyekrkqfwqkdjfpvzqwc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_b-gbptTdDSDpFhFfZxDyTQ_AY4W3eED';

export const isSupabaseConfigured = () =>
  !SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
