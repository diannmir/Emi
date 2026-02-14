const form = document.getElementById('loginForm');
const msg = document.getElementById('loginError');
const btnForgot = document.getElementById('forgot');
const hintModal = document.getElementById('hintModal');
const closeHintModalBtn = document.getElementById('closeHintModal');

btnForgot?.addEventListener('click', () => {
  if (!hintModal) return;
  hintModal.hidden = false;
});

closeHintModalBtn?.addEventListener('click', closeHintModal);
hintModal?.addEventListener('click', (ev) => {
  if (ev.target === hintModal) closeHintModal();
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') closeHintModal();
});

let tries = 0;
const MAX_TRIES = 5;
let lockedUntil = 0;

form?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  msg.hidden = true;
  msg.textContent = '';

  const now = Date.now();
  if (now < lockedUntil) {
    const s = Math.ceil((lockedUntil - now) / 1000);
    return showError(`Too many attempts. Try again in ${s}s.`);
  }

  const fd = new FormData(form);
  const username = (fd.get('username') || '').toString().trim();
  const password = (fd.get('password') || '').toString();

  if (!username || !password) return showError('Please enter username and password.');

  let users = [];
  try {
    const res = await fetch('./data/users.json', { cache: 'no-store' });
    const json = await res.json();
    users = json.users || [];
  } catch {
    return showError('Could not load users.json');
  }

  const u = users.find((x) => x.username === username);
  if (!u) return fail();

  const hash = await sha256Hex(password);
  if (timingSafeEqualHex(hash, u.passwordHash)) {
    sessionStorage.setItem('auth', JSON.stringify({ u: username, t: Date.now() }));
    location.href = './main.html';
  } else {
    fail();
  }
});

function fail() {
  tries++;
  if (tries >= MAX_TRIES) {
    lockedUntil = Date.now() + 30000;
    tries = 0;
    showError('Too many attempts. Wait 30s.');
  } else {
    showError(`Invalid credentials. Attempt ${tries}/${MAX_TRIES}.`);
  }
}

function showError(t) {
  msg.hidden = false;
  msg.textContent = t;
}

function closeHintModal() {
  if (!hintModal) return;
  hintModal.hidden = true;
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
