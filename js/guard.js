// Protect main.html and show welcome text

const auth = sessionStorage.getItem('auth');
if (!auth) {
  location.replace('./index.html');
} else {
  const userData = JSON.parse(auth);
  const username = userData.u || 'guest';

  const welcome = document.getElementById('welcome');
  if (welcome) {
    welcome.textContent = `Welcome, ${username}`;
    welcome.style.opacity = '1';
    setTimeout(() => welcome.remove(), 6000);
  }

  document.getElementById('back-btn')?.addEventListener('click', () => history.back());
}
