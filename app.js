// app.js — updated for vibrant UI and screen transitions
const DATA_URLS = {
  'Purnima': './data/purnima.json',
  'Amavasya': './data/amavasya.json',
  'Ekadashi': './data/ekadashi.json'
};
const TZ = 'Asia/Kolkata';

/* UI Elements */
const splash = document.getElementById('splash');
const splashTitle = document.getElementById('splash-title');
const splashSub = document.getElementById('splash-sub');

const welcome = document.getElementById('welcome');
const display = document.getElementById('display');
const listEl = document.getElementById('list');
const displayTitle = document.getElementById('display-title');
const displayCount = document.getElementById('display-count');

const primaryButtons = Array.from(document.querySelectorAll('button.primary'));
const exitWelcome = document.getElementById('exit-welcome');
const exitDisplay = document.getElementById('exit-display');

/* Navigation */
function showScreen(screen) {
  [splash, welcome, display].forEach(s => {
    if (!s) return;
    s.classList.add('hidden');
  });
  screen.classList.remove('hidden');
  screen.scrollIntoView({ behavior: 'smooth' });
}

/* Initial Flow */
function initialFlow() {
  showScreen(splash);
  splash.classList.add('visible');
  setTimeout(() => showScreen(welcome), 900);
}
initialFlow();

/* In-memory cache */
let _cache = {};
async function fetchDates(eventType, force = false) {
  if (_cache[eventType] && !force) return _cache[eventType];
  const url = DATA_URLS[eventType];
  if (!url) throw new Error(`No data URL configured for event type: ${eventType}`);
  const resp = await fetch(url, { cache: 'no-cache' });
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const json = await resp.json();
  _cache[eventType] = Array.isArray(json) ? json : [];
  return _cache[eventType];
}

/* UI Helpers */
function showFetching() {
  listEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <div class="loader" aria-hidden="true"></div>
      <div class="tiny">Fetching event</div>
    </div>`;
}

function renderNoUpcoming(type, all) {
  const end = Array.isArray(all) && all.length ? all[all.length - 1].date : 'no data';
  listEl.innerHTML = `
    <div class="entry">
      <div class="name">No upcoming ${escapeHtml(type)} found</div>
      <div class="date">Data ends on ${escapeHtml(end)}</div>
    </div>`;
}

function renderFetchError(err, url) {
  listEl.innerHTML = `
    <div class="entry">
      <div class="name">Could not fetch data</div>
      <div class="date">Check that ${escapeHtml(url || 'data file')} exists and server is running</div>
    </div>`;
  console.error(err);
}

function renderSingle(next) {
  listEl.innerHTML = '';
  const entry = document.createElement('div');
  entry.className = 'entry';
  entry.innerHTML = `
    <div class="name">${escapeHtml(next.name)}</div>
    <div class="date">${escapeHtml(formatDate(next.date, TZ))}</div>
    <div class="time"><strong>Start:</strong> ${escapeHtml(formatDateTime(next.tithi_begins, TZ))}</div>
    <div class="time"><strong>End:</strong> ${escapeHtml(formatDateTime(next.tithi_ends, TZ))}</div>`;
  listEl.appendChild(entry);

  entry.style.opacity = '0';
  entry.style.transform = 'translateY(6px)';
  requestAnimationFrame(() => {
    entry.style.transition = 'opacity .32s ease, transform .32s ease';
    entry.style.opacity = '1';
    entry.style.transform = 'translateY(0)';
  });
}

/* Date Helpers */
function formatDate(isoDate, tz) {
  const d = new Date(isoDate + 'T00:00:00');
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

function formatDateTime(isoDateTime, tz) {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

function computeDaysUntil(isoDate, tz) {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
  const target = new Date(isoDate + 'T00:00:00');
  const diffMs = target - new Date(todayStr + 'T00:00:00');
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

/* Find next event */
function findNextEvent(records, opts = {}) {
  const tz = opts.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());

  if (!records.length) return null;

  records.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  let lo = 0, hi = records.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if ((records[mid].date || '') < todayIso) lo = mid + 1;
    else hi = mid;
  }
  return lo < records.length ? records[lo] : null;
}

/* Utilities */
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

/* Wire primary buttons */
primaryButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const type = btn.dataset.type;
    displayTitle.textContent = `${type} — Upcoming`;
    displayCount.textContent = '';
    showScreen(display);
    showFetching();
    try {
      const all = await fetchDates(type);
      const next = findNextEvent(all, { timezone: TZ });
      if (!next) {
        renderNoUpcoming(type, all);
        return;
      }
      renderSingle(next);
      displayCount.textContent = computeDaysUntil(next.date, TZ);
    } catch (err) {
      renderFetchError(err, DATA_URLS[type]);
    }
  });
});

/* Exit behavior */
async function attemptExit() {
  // Show goodbye splash
  if (splashTitle) splashTitle.textContent = 'Goodbye';
  if (splashSub) splashSub.textContent = 'See you soon';
  showScreen(splash);

  // Try to close window after showing goodbye
  setTimeout(() => {
    window.close();
    // If window.close() doesn't work (browser restriction), close the tab
    if (!window.closed) {
      window.open('', '_self').close();
    }
  }, 900);
}

function showGoodbyeSplash() {
  if (splashTitle) splashTitle.textContent = 'Goodbye';
  if (splashSub) splashSub.textContent = 'See you soon';
  showScreen(splash);
  setTimeout(() => showScreen(welcome), 900);
}

exitWelcome?.addEventListener('click', () => attemptExit());
exitDisplay?.addEventListener('click', () => showScreen(welcome));

/* Optional: register service worker */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => { });
}
