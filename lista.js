import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js?v=1';

// Only the email allowed by the "rsvps: owner can read" policy (see SETUP.md) gets rows back.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const byId = (id) => document.getElementById(id);
const els = {
  login: byId('login'),
  loginForm: byId('login-form'),
  email: byId('email'),
  loginMsg: byId('login-msg'),
  listView: byId('list-view'),
  who: byId('who'),
  logout: byId('logout'),
  countPeople: byId('count-people'),
  countSiblings: byId('count-siblings'),
  countAdults: byId('count-adults'),
  countFriends: byId('count-friends'),
  countRows: byId('count-rows'),
  missing: byId('missing'),
  search: byId('search'),
  refresh: byId('refresh'),
  listMsg: byId('list-msg'),
  list: byId('rsvps'),
};

let rows = [];

const normalize = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

const formatWhen = (iso) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

function setMsg(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle('error', isError);
}

// RSVPs sent before the form asked for counts have adults/kids = null.
const hasCounts = (row) => row.adults !== null && row.kids !== null;

const plural = (n, one, other) => `${n} ${n === 1 ? one : other}`;

function describeCount(row) {
  const people = 1 + row.adults + row.kids;
  return `1 amig@ + ${plural(row.adults, 'adulto', 'adultos')} + ${plural(row.kids, 'hermanito', 'hermanitos')} = ${plural(people, 'persona', 'personas')}`;
}

// Counts each friend once, using their newest RSVP (rows arrive newest first).
function summarize(latestRows) {
  const counted = latestRows.filter(hasCounts);
  const adults = counted.reduce((sum, row) => sum + row.adults, 0);
  const siblings = counted.reduce((sum, row) => sum + row.kids, 0);
  const friends = latestRows.length;
  return { friends, adults, siblings, people: friends + adults + siblings, missing: latestRows.length - counted.length };
}

function renderTotals(latestRows) {
  const totals = summarize(latestRows);
  els.countPeople.textContent = totals.people;
  els.countFriends.textContent = totals.friends;
  els.countAdults.textContent = totals.adults;
  els.countSiblings.textContent = totals.siblings;
  els.countRows.textContent = rows.length;
  els.missing.hidden = totals.missing === 0;
  els.missing.textContent = `${plural(totals.missing, 'confirmación', 'confirmaciones')} sin número de acompañantes (de antes del cambio): el amig@ sí se cuenta, sus acompañantes no.`;
}

function renderRow(row, isRepeat) {
  const li = document.createElement('li');
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = row.name;
  li.append(name);
  if (row.companions) {
    const withEl = document.createElement('span');
    withEl.className = 'with';
    withEl.textContent = `Viene con: ${row.companions}`;
    li.append(withEl);
  }
  if (hasCounts(row)) {
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = describeCount(row);
    li.append(count);
  }
  const when = document.createElement('span');
  when.className = 'when';
  when.textContent = formatWhen(row.created_at);
  li.append(when);
  if (isRepeat) {
    const dup = document.createElement('span');
    dup.className = 'dup';
    dup.textContent = 'Ya había confirmado antes: solo se cuenta su confirmación más nueva';
    li.append(dup);
  }
  return li;
}

function render() {
  const seen = new Set();
  const repeats = new Set();
  // rows come newest first; walk oldest first so the later copy is the one marked
  [...rows].reverse().forEach((row) => {
    const key = normalize(row.name);
    if (seen.has(key)) repeats.add(row.id);
    seen.add(key);
  });

  const latestByName = new Map();
  rows.forEach((row) => {
    const key = normalize(row.name);
    if (!latestByName.has(key)) latestByName.set(key, row);
  });
  renderTotals([...latestByName.values()]);

  const query = normalize(els.search.value);
  const visible = query ? rows.filter((row) => normalize(row.name).includes(query)) : rows;
  els.list.replaceChildren(...visible.map((row) => renderRow(row, repeats.has(row.id))));

  if (!rows.length) setMsg(els.listMsg, 'Todavía no hay confirmaciones.');
  else if (!visible.length) setMsg(els.listMsg, 'Nadie con ese nombre.');
  else setMsg(els.listMsg, '');
}

async function loadRows() {
  els.refresh.disabled = true;
  setMsg(els.listMsg, 'Cargando…');
  const { data, error } = await supabase
    .from('rsvps')
    .select('id, created_at, name, companions, adults, kids')
    .order('created_at', { ascending: false });
  els.refresh.disabled = false;
  if (error) {
    console.error('Could not load RSVPs', error);
    setMsg(els.listMsg, 'No se pudo cargar la lista. Intenta con "Actualizar".', true);
    return;
  }
  rows = data;
  render();
}

function showSignedIn(session) {
  els.login.hidden = true;
  els.listView.hidden = false;
  els.who.textContent = session.user.email;
  loadRows();
}

function showSignedOut() {
  rows = [];
  els.listView.hidden = true;
  els.login.hidden = false;
}

els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = els.email.value.trim();
  if (!email) return;
  const button = els.loginForm.querySelector('button');
  button.disabled = true;
  setMsg(els.loginMsg, 'Enviando…');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href.split('#')[0].split('?')[0] },
  });
  button.disabled = false;
  if (error) {
    console.error('Could not send login link', error);
    setMsg(els.loginMsg, 'No se pudo mandar el enlace. Espera un momento e intenta otra vez.', true);
    return;
  }
  setMsg(els.loginMsg, 'Listo. Revisa tu correo y abre el enlace desde este mismo teléfono o compu.');
});

els.logout.addEventListener('click', () => supabase.auth.signOut());
els.refresh.addEventListener('click', loadRows);
els.search.addEventListener('input', render);

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user?.email) showSignedIn(session);
  else showSignedOut();
});
