# Party album and RSVP setup (Supabase, free tier)

The album is private: each guest only sees the photos and videos they uploaded.
You see everything in the Supabase dashboard.

1. Go to https://supabase.com and create a free account and a new project.
2. Open **Authentication → Sign In / Providers** and turn on **Allow anonymous sign-ins**.
   Each guest's phone gets its own anonymous account, which is how the album knows whose photos are whose.
3. Open **Authentication → Rate Limits** and raise **anonymous sign-ins** (default 30 per hour per IP)
   to something like 300. Guests on the party wifi share one IP address.
4. Open **SQL Editor**, paste this, and click **Run**:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('party-photos', 'party-photos', false, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
              'video/mp4','video/quicktime','video/webm','video/x-m4v'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Remove the old "everyone sees everything" policies if you created them before
drop policy if exists "party photos: anyone can upload" on storage.objects;
drop policy if exists "party photos: anyone can list" on storage.objects;

create policy "party photos: guests upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'party-photos'
              and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "party photos: guests see only their own"
  on storage.objects for select to authenticated
  using (bucket_id = 'party-photos'
         and (storage.foldername(name))[1] = (select auth.uid()::text));
```

5. Still in **SQL Editor**, run this too. It creates the RSVP list: guests can add to it but can't read it.

```sql
create table if not exists public.rsvps (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  companions text check (char_length(companions) <= 120),
  lang text check (char_length(lang) <= 5)
);

alter table public.rsvps enable row level security;

drop policy if exists "rsvps: guests can add" on public.rsvps;
create policy "rsvps: guests can add"
  on public.rsvps for insert to anon, authenticated
  with check (true);
```

   Then add the head-count columns (the form asks how many adults and other kids are coming):

```sql
alter table public.rsvps
  add column if not exists adults smallint check (adults between 0 and 20),
  add column if not exists kids smallint check (kids between 0 and 20);
```

6. To read the list on `lista.html`, run this with **your** email. Only that email can see the RSVPs.

```sql
drop policy if exists "rsvps: owner can read" on public.rsvps;
create policy "rsvps: owner can read"
  on public.rsvps for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'you@example.com');
```

   Then open **Authentication → URL Configuration**: set **Site URL** to the published site
   (for example `https://<user>.github.io/oliver-party-6/`) and add `https://<user>.github.io/oliver-party-6/**`
   under **Redirect URLs**, so the sign-in email link comes back to the site.

7. Open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
8. Paste both into `supabase-config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), then commit and push.
   GitHub Pages updates the site in a minute or two.
   The QR code on `album.html` encodes the page's own address, so open the
   published album page and print or show the QR from there.

## Notes

- **RSVPs:** open `lista.html` on the site, type your email, and tap the link Supabase emails you
  (open it on the same phone or computer). It shows how many people are coming (adults and kids), a search box, and flags names that confirmed twice
  (only the newest one is counted).
  You can also see them in **Table Editor → rsvps**. Each RSVP is saved the moment the guest taps
  **Confirm**, even if they never send the WhatsApp message. RSVPs made before Supabase was set up
  were not saved anywhere; those only exist as WhatsApp chats.
- A guest's photos are tied to the browser they used. On another phone or browser (or after clearing
  the browser's data) they start with an empty album, but their uploads are still safe in Supabase.
- Each guest's files are in a folder named after their anonymous account in **Storage → party-photos**.
  To remove a photo, delete it there, and its small copy with the same name in that folder's `thumbs/`.
- Guests can upload photos (up to 10 MB) and videos (up to 50 MB, the Supabase free-tier limit).
  They cannot delete. 50 MB is roughly 20-30 seconds of phone video, so short clips work best.
- Videos are uploaded as they are. A thumbnail frame is made on the guest's phone when the browser can read
  the video; otherwise the album shows the video's first frame instead.
- Until `SUPABASE_URL` and `SUPABASE_ANON_KEY` are filled in, RSVPs only go out by WhatsApp and the album starts empty and works as a preview.
  Anything added in preview mode stays in that browser only.
- Photos are shrunk on the guest's phone before uploading (longest side 2400px), and they're turned
  the right way up. A small thumbnail is uploaded too, so the album grid loads fast.
- iPhone HEIC photos are converted to JPEG on iPhones. On other devices that can't read HEIC,
  the original file is uploaded as it is.
- The anon key is public by design. Do not put the `service_role` key in `supabase-config.js`.
- Photo links are temporary (they last a day), so a copied link stops working after that.
- **Play slideshow** shows the guest's own photos full screen, moving every 5 seconds.
- `img/oliver/` is kept out of git (see `.gitignore`) so those photos are never published.
