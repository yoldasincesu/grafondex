// Grafondex Live Score — app logic (texts come from i18n.js via t())
// site.web.api is the host espn.com itself uses; site.api.espn.com turns real browsers away ("Access Denied")
const SITE = 'https://site.web.api.espn.com/apis/site/v2/sports/';
const ESPN = SITE + 'soccer/'; // soccer-wide endpoints (soccer/all/…)
const HOUR = 3600000;
const DEFAULT_WORKER = 'https://grafondex.yoldasincesu.workers.dev'; // community + Turkish data server used when no address is set in Settings
// every league lives at "<sport>/<slug>"; soccer slugs are stored without the sport
const pathOf = l => leagueOf(l || '').path || `soccer/${l}`;
const sportOf = l => pathOf(l).split('/')[0];
const api = l => SITE + pathOf(l);
const apiSt = l => 'https://site.web.api.espn.com/apis/v2/sports/' + pathOf(l);
const core = l => { const [sp, lg] = pathOf(l).split('/'); return `https://sports.core.api.espn.com/v2/sports/${sp}/leagues/${lg}`; };

// ---- UI icons: the emoji in headings, tabs, buttons and info rows are swapped for one consistent set of line icons
// (Lucide-style, 24×24, stroke = currentColor). Emoji inside user text (posts, chat, names) are never touched.
const ICP = {
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  stadium: '<ellipse cx="12" cy="8" rx="9" ry="3"/><path d="M3 8v8c0 1.7 4 3 9 3s9-1.3 9-3V8"/><path d="M8 18.6v-4M16 18.6v-4M12 19v-4"/>',
  tv: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="m17 2-5 5-5-5"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
  vol: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  ball: '<circle cx="12" cy="12" r="10"/><path d="m12 7 4.2 3-1.6 5H9.4l-1.6-5z"/><path d="M12 2v5M21.5 9.5l-5.3.5M17.8 20l-3.2-5M6.2 20l3.2-5M2.5 9.5l5.3.5"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
  pen: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  tick: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  bars: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  game: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><rect x="2" y="6" width="20" height="12" rx="6"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H16a6 6 0 0 0 6-6c0-4.9-4.5-8.4-10-8.4"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  flag: '<path d="M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1"/>',
  warn: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3M12 9v4M12 17h.01"/>',
  ruler: '<path d="M21.3 15.3 8.7 2.7a1 1 0 0 0-1.4 0L2.7 7.3a1 1 0 0 0 0 1.4l12.6 12.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4M7.5 10.5l2-2M10.5 13.5l2-2M13.5 16.5l2-2"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s1.5-1 4-1 4 2 8 2 4-1 4-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
  shirt: '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  brief: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.3 1.4 1.2 2.7 2.5 2.7"/>',
  med: '<path d="M8 21h8M12 3v18M3 7h18M6 7l-3 6h6zM18 7l-3 6h6z"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  card: '<rect x="6" y="3" width="12" height="18" rx="2"/>',
  dot: '<circle cx="12" cy="12" r="5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  bball: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2v20M4.9 4.9a10 10 0 0 1 0 14.2M19.1 4.9a10 10 0 0 0 0 14.2"/>',
  tennis: '<circle cx="12" cy="12" r="10"/><path d="M6 3.5a10 10 0 0 1 0 17M18 3.5a10 10 0 0 0 0 17"/>',
  vball: '<circle cx="12" cy="12" r="10"/><path d="M12 12a8 8 0 0 0-7.6-5.5M12 12a8 8 0 0 0 7.6 4.6M12 12a8 8 0 0 1 0 10M12 2a8 8 0 0 1 4 9"/>',
  car: '<path d="M5 17h14v-4l-2-5H7l-2 5zM5 13h14"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
};
const EMO = {
  '📅': 'cal', '🗓': 'cal', '🏆': 'trophy', '🏟': 'stadium', '🏛': 'stadium', '📺': 'tv', '📼': 'tv', '🔔': 'bell', '🔇': 'mute', '🔊': 'vol',
  '⚽': 'ball', '🔑': 'key', '✨': 'spark', '❓': 'help', '✉': 'mail', '📧': 'mail', '📩': 'mail', '📨': 'mail', '🔁': 'refresh', '🔄': 'refresh',
  '✏': 'pen', '✍': 'pen', '📝': 'pen', '✅': 'check', '✓': 'tick', '❌': 'x', '✕': 'x', '🔐': 'lock', '🔒': 'lock', '📤': 'share', '📲': 'phone', '📱': 'phone',
  '💬': 'chat', '🎬': 'play', '▶': 'play', '⚖': 'scale', '🎯': 'target', '👥': 'users', '🤝': 'users', '👤': 'user', '🧑': 'user', '⛔': 'ban', '🚑': 'med',
  '📈': 'trend', '📋': 'clip', '📥': 'down', '➕': 'plus', '＋': 'plus', '🛡': 'shield', '📰': 'news', '📊': 'bars', '🗳': 'bars', '🌍': 'globe', '🌐': 'globe',
  '🏅': 'award', '🎖': 'award', '🥇': 'award', '🥈': 'award', '🥉': 'award', '⭐': 'star', '★': 'star', '🎮': 'game', '🧠': 'bulb', '⚙': 'gear', '🛠': 'gear',
  '🗑': 'trash', '⏳': 'clock', '⏰': 'clock', '⏱': 'timer', '💶': 'money', '💼': 'brief', '🎨': 'palette', '📍': 'pin', '📌': 'pin', '🚩': 'flag', '⚠': 'warn',
  '📏': 'ruler', '🎂': 'cake', '👕': 'shirt', '🎙': 'mic', '🎤': 'mic', '📖': 'book', '📚': 'book', '👁': 'eye', '🔗': 'link', '🔎': 'search', '🔍': 'search',
  '🔢': 'hash', '🔥': 'fire', '✋': 'hand', '🟥': 'card', '🟨': 'card', '🔴': 'dot', 'ⓘ': 'info', '🧑‍⚖️': 'user', '🧮': 'hash', '🕊': 'spark', '😕': 'info', '🏀': 'bball', '🎾': 'tennis', '🏐': 'vball', '🏎': 'car', '🏈': 'ball', '⚾': 'ball', '🏒': 'ball', '🤾': 'ball', '📼': 'tv',
};
const svgI = k => `<svg class="ui-i ui-${k}" viewBox="0 0 24 24" aria-hidden="true">${ICP[k]}</svg>`;
const EMO_RE = /^\s*((?:\p{Extended_Pictographic}|[Ⓜⓘ✓✕＋])(?:️|‍(?:\p{Extended_Pictographic}|♀|♂)️?|\p{Emoji_Modifier})*)\s*/u;
const IC_SEL = '.card>h2, .card h2>span:first-child, .seg>a, .seg>button, .chips>a, .chips>button, .authtabs>button, .btn, .cbtn, .linkbtn, .inforow .ic, .setrow>span, .setsec>summary, details>summary, .lrow .nm>b, .empty, .gamesbar a, .tabbtn, .adminlink>span, h3, .datebar .cal, .langcur>span, .slic, .form-block>label, .tvtag, .profact .btn, .tstats>span, .board .bi, .form-block>.hint, .setsec>summary>span, .gamesbar>a>span';
const icDone = new WeakSet();
function iconize(root = document) {
  for (const el of root.querySelectorAll(IC_SEL)) {
    if (icDone.has(el) || el.closest('.post, .msg, .bub, .bubbody, .pbody, .dmrow, .cmt, [data-noicon]')) continue;
    icDone.add(el);
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode()) && !n.textContent.trim());
    if (!n) continue;
    const m = n.textContent.match(EMO_RE); if (!m) continue;
    const key = EMO[m[1]] || EMO[m[1].replace(/️/g, '')] || EMO[[...m[1]][0]];
    if (key === 'star') continue; // favourite stars keep their own look
    if (key === 'dot') { n.textContent = n.textContent.slice(m[0].length); n.parentNode.insertBefore(Object.assign(document.createElement('i'), { className: 'ui-dot' }), n); continue; } // 🔴 → a pulsing live dot
    let rest = n.textContent.slice(m[0].length), m2; while ((m2 = rest.match(EMO_RE))) rest = rest.slice(m2[0].length); // "🌐 🌐 Dil" → one icon
    n.textContent = rest;
    if (key) n.parentNode.insertBefore(document.createRange().createContextualFragment(svgI(key)), n);
    if (el.classList.contains('ic') && !n.textContent.trim() && !key) el.textContent = '';
  }
}
{
  let icRaf = 0;
  const run = () => { icRaf = 0; iconize(document); };
  new MutationObserver(() => { if (!icRaf) icRaf = requestAnimationFrame(run); }).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('DOMContentLoaded', run);
}
// ---- empty pages: a soft icon tile, one sentence and (when there is one) the next step
const emptyState = (icon, text, actions = '') => `<div class="empty es"><span class="esic">${svgI(icon)}</span><div class="estx">${text}</div>${actions ? `<div class="esact">${actions}</div>` : ''}</div>`;

// [slug, official name, ESPN logo number, has a standings table]. Official names are the same in
// every language; the country/region label beside them is translated (t('cc.*')).
const GROUPS = [
  [['tur.1', 'Trendyol Süper Lig', 18, 1], ['tur.2', 'Trendyol 1. Lig', 0, 1], ['tur.3', 'Nesine 2. Lig', 0, 1], ['tur.4', 'Nesine 3. Lig', 0, 1], ['tur.cup', 'Ziraat Türkiye Kupası', 0, 0], ['tur.w.1', 'Suwen Kadın Futbol Süper Ligi', 0, 1]],
  [['uefa.champions', 'UEFA Champions League', 2, 1], ['uefa.europa', 'UEFA Europa League', 2310, 1], ['uefa.europa.conf', 'UEFA Conference League', 20296, 1], ['uefa.super_cup', 'UEFA Super Cup', 1272, 0]],
  [['eng.1', 'Premier League', 23, 1], ['esp.1', 'LaLiga', 15, 1], ['ita.1', 'Serie A', 12, 1], ['ger.1', 'Bundesliga', 10, 1], ['fra.1', 'Ligue 1', 9, 1]],
  [['ned.1', 'Eredivisie', 11, 1], ['por.1', 'Liga Portugal', 14, 1], ['bel.1', 'Jupiler Pro League', 6, 1], ['sco.1', 'Scottish Premiership', 45, 1],
    ['aut.1', 'Austrian Bundesliga', 5, 1], ['sui.1', 'Swiss Super League', 17, 0], ['gre.1', 'Super League Greece', 98, 1], ['rus.1', 'Russian Premier League', 106, 1]],
  [['eng.2', 'EFL Championship', 24, 1], ['esp.2', 'LaLiga 2', 107, 1], ['ita.2', 'Serie B', 99, 1], ['ger.2', '2. Bundesliga', 97, 1], ['fra.2', 'Ligue 2', 96, 1],
    // more lower divisions: shown only after ESPN answered with a real table for them on this device (see probeLeagues)
    ['eng.4', 'EFL League Two', 0, 1, 1], ['eng.5', 'National League', 0, 1, 1], ['ger.3', '3. Liga', 0, 1, 1], ['ita.3', 'Serie C', 0, 1, 1], ['fra.3', 'Championnat National', 0, 1, 1], ['esp.3', 'Primera Federación', 0, 1, 1],
    ['por.2', 'Liga Portugal 2', 0, 1, 1], ['bel.2', 'Challenger Pro League', 0, 1, 1], ['aut.2', '2. Liga (AUT)', 0, 1, 1], ['sui.2', 'Challenge League', 0, 1, 1], ['gre.2', 'Super League 2', 0, 1, 1],
    ['sco.3', 'Scottish League One', 0, 1, 1], ['sco.4', 'Scottish League Two', 0, 1, 1], ['rus.2', 'Russian First League', 0, 1, 1],
    ['bra.2', 'Brasileirão Série B', 0, 1, 1], ['arg.2', 'Primera Nacional', 0, 1, 1], ['usa.usl.1', 'USL Championship', 0, 1, 1], ['mex.2', 'Liga de Expansión MX', 0, 1, 1], ['jpn.2', 'J2 League', 0, 1, 1]],
  [['eng.fa', 'FA Cup', 40, 0], ['eng.league_cup', 'Carabao Cup', 41, 0], ['esp.copa_del_rey', 'Copa del Rey', 80, 0],
    ['ita.coppa_italia', 'Coppa Italia', 2192, 0], ['ger.dfb_pokal', 'DFB-Pokal', 2061, 0], ['fra.coupe_de_france', 'Coupe de France', 182, 0]],
  [['fifa.world', 'FIFA World Cup', 4, 1], ['fifa.worldq.uefa', 'World Cup Qualifying – UEFA', 67, 1], ['uefa.euro', 'UEFA EURO', 74, 1],
    ['uefa.euroq', 'UEFA EURO Qualifying', 56, 1], ['uefa.nations', 'UEFA Nations League', 2395, 1], ['fifa.friendly', 'International Friendly', 53, 0]],
  [['ksa.1', 'Saudi Pro League', 2488, 1], ['usa.1', 'MLS', 19, 1], ['bra.1', 'Brasileirão Série A', 85, 1], ['arg.1', 'Liga Profesional', 1, 1],
    ['conmebol.libertadores', 'CONMEBOL Libertadores', 58, 1], ['fifa.cwc', 'FIFA Club World Cup', 1932, 1]],
  [['swe.1', 'Allsvenskan', 0, 1], ['nor.1', 'Eliteserien', 0, 1], ['den.1', 'Danish Superliga', 0, 1], ['fin.1', 'Veikkausliga', 0, 1], ['rou.1', 'Romanian Liga 1', 0, 1], ['cze.1', 'Czech First League', 0, 1],
    ['cyp.1', 'Cypriot First Division', 0, 1], ['isr.1', 'Israeli Premier League', 0, 1], ['irl.1', 'League of Ireland', 0, 1], ['nir.1', 'NIFL Premiership', 0, 1], ['wal.1', 'Cymru Premier', 0, 1],
    ['sco.2', 'Scottish Championship', 0, 1], ['eng.3', 'EFL League One', 0, 1], ['ned.2', 'Eerste Divisie', 0, 1], ['swe.2', 'Superettan', 0, 1], ['nor.2', 'OBOS-ligaen', 0, 1], ['den.2', 'Danish 1st Division', 0, 1]],
  [['jpn.1', 'J1 League', 0, 1], ['chn.1', 'Chinese Super League', 0, 1], ['ind.1', 'Indian Super League', 0, 1], ['aus.1', 'A-League Men', 0, 1], ['rsa.1', 'South African Premiership', 0, 1],
    ['nga.1', 'Nigeria Premier League', 0, 1], ['gha.1', 'Ghana Premier League', 0, 1], ['afc.champions', 'AFC Champions League Elite', 0, 0], ['caf.champions', 'CAF Champions League', 0, 0]],
  [['mex.1', 'Liga MX', 0, 1], ['col.1', 'Colombian Primera A', 0, 1], ['chi.1', 'Chilean Primera División', 0, 1], ['uru.1', 'Uruguayan Primera División', 0, 1], ['ecu.1', 'LigaPro Ecuador', 0, 1],
    ['par.1', 'Paraguayan Primera División', 0, 1], ['per.1', 'Peruvian Liga 1', 0, 1], ['ven.1', 'Venezuelan Primera División', 0, 1], ['bol.1', 'Bolivian Liga Profesional', 0, 1], ['crc.1', 'Costa Rican Primera División', 0, 1],
    ['conmebol.sudamericana', 'CONMEBOL Sudamericana', 0, 0], ['concacaf.champions', 'Concacaf Champions Cup', 0, 0], ['concacaf.leagues.cup', 'Leagues Cup', 0, 0]],
  [['uefa.wchampions', 'UEFA Women\'s Champions League', 0, 1], ['eng.w.1', 'Women\'s Super League', 0, 1], ['esp.w.1', 'Liga F', 0, 1], ['fra.w.1', 'Première Ligue', 0, 1], ['ned.w.1', 'Vrouwen Eredivisie', 0, 1],
    ['usa.nwsl', 'NWSL', 0, 1], ['aus.w.1', 'A-League Women', 0, 1], ['mex.w.1', 'Liga MX Femenil', 0, 1], ['eng.w.fa', 'Women\'s FA Cup', 0, 1], ['eng.w.league_cup', 'WSL Players Cup', 0, 1],
    ['fifa.wwc', 'FIFA Women\'s World Cup', 0, 1], ['fifa.wworldq.uefa', 'Women\'s World Cup Qualifying – UEFA', 0, 1], ['uefa.weuro', 'UEFA Women\'s EURO', 0, 1], ['uefa.w.nations', 'UEFA Women\'s Nations League', 0, 1]],
].map((ls, g) => ls.map(([id, name, logo, table, probe]) => ({ id, name, logo, table: !!table, group: g, probe: !!probe })));
// American leagues: their own sport path, league logo and US region
GROUPS.push([['nba', 'NBA', 'basketball/nba'], ['nhl', 'NHL', 'hockey/nhl'], ['nfl', 'NFL', 'football/nfl']].map(([id, name, path]) => ({
  id, name, path, table: true, region: 'usa', group: GROUPS.length,
  logoUrl: `https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/${id}.png&w=64&h=64`,
})));
const LEAGUES = GROUPS.flat();
// leagues marked 'probe' are listed only once ESPN has served a standings table for them (checked every 3 days)
let LOK = (() => { try { return JSON.parse(localStorage.getItem('lok') || '{}'); } catch { return {}; } })();
const shownL = L => !L.probe || LOK[L.id]?.ok === true;
async function probeLeagues() {
  const due = LEAGUES.filter(L => L.probe && !(LOK[L.id] && Date.now() - LOK[L.id].at < 3 * 86400000));
  if (!due.length) return;
  await Promise.all(due.map(async L => {
    let ok = false;
    try { const r = await fetch(apiSt(L.id) + '/standings'); if (r.ok) { const j = await r.json(); ok = !!(j.children?.length || j.standings?.entries?.length); } } catch { return; } // offline: try again next time
    LOK[L.id] = { ok, at: Date.now() };
  }));
  try { localStorage.setItem('lok', JSON.stringify(LOK)); } catch {}
  if (/^#\/(leagues|settings)/.test(location.hash) && typeof render === 'function') render();
}
// ESPN's numeric league ids, used to sort the "all football" list into our leagues
const ESPN_NUM = { 'tur.1': 3946, 'uefa.champions': 775, 'uefa.europa': 776, 'uefa.europa.conf': 20296, 'uefa.super_cup': 5462, 'eng.1': 700, 'esp.1': 740, 'ita.1': 730,
  'ger.1': 720, 'fra.1': 710, 'ned.1': 725, 'por.1': 715, 'bel.1': 3901, 'sco.1': 735, 'aut.1': 3907, 'sui.1': 3944, 'gre.1': 3955, 'rus.1': 3939, 'eng.2': 3914, 'esp.2': 3921,
  'ita.2': 3931, 'ger.2': 3927, 'fra.2': 3926, 'eng.fa': 3918, 'eng.league_cup': 3920, 'esp.copa_del_rey': 3951, 'ita.coppa_italia': 3956, 'ger.dfb_pokal': 3954,
  'fra.coupe_de_france': 3952, 'fifa.world': 606, 'fifa.worldq.uefa': 786, 'uefa.euro': 781, 'uefa.euroq': 3947, 'uefa.nations': 2395, 'fifa.friendly': 3922,
  'ksa.1': 21231, 'usa.1': 770, 'bra.1': 630, 'arg.1': 745, 'conmebol.libertadores': 783, 'fifa.cwc': 5501,
  'eng.w.1': 8097, 'usa.nwsl': 8301, 'uefa.wchampions': 19483, 'esp.w.1': 20956, 'fra.w.1': 20955, 'ned.w.1': 19945, 'aus.w.1': 18992, 'mex.w.1': 23541, 'fifa.wworldq.uefa': 20649, 'eng.w.fa': 20226, 'eng.w.league_cup': 23390 };
for (const L of LEAGUES) L.espn = ESPN_NUM[L.id];
const leagueOf = id => LEAGUES.find(l => l.id === id) || { id, name: id, logo: 0 };
const lname = L => L.name;
const TFF_PID = { 'tur.w.1': 1000, 'tur.2': 142, 'tur.3': 976, 'tur.4': 971 }; // TFF pages of the leagues that come from tff.org (3 and 4 have groups)
const TFF_GROUPED = id => id === 'tur.3' || id === 'tur.4';
const isTff = id => id === 'tur.cup' || !!TFF_PID[id]; // Turkish Cup and women's Super League come from TFF through the user's own server

// region of a competition: flagcdn code + translated label
const CC = { tur: 'tr', eng: 'gb-eng', esp: 'es', ita: 'it', ger: 'de', fra: 'fr', ned: 'nl', por: 'pt', bel: 'be', sco: 'gb-sct', aut: 'at', sui: 'ch', gre: 'gr', rus: 'ru', ksa: 'sa', usa: 'us', bra: 'br', arg: 'ar', uefa: 'eu', wal: 'gb-wls', nir: 'gb-nir', swe: 'se', nor: 'no', den: 'dk', fin: 'fi', rou: 'ro', cze: 'cz', cyp: 'cy', isr: 'il', irl: 'ie', jpn: 'jp', chn: 'cn', ind: 'in', aus: 'au', rsa: 'za', nga: 'ng', gha: 'gh',
  mex: 'mx', col: 'co', chi: 'cl', uru: 'uy', ecu: 'ec', par: 'py', per: 'pe', ven: 've', bol: 'bo', crc: 'cr' };
const regionOf = id => leagueOf(id).region || id.split('.')[0];
const ccOf = id => CC[regionOf(id)];
const regionName = id => {
  const r = regionOf(id);
  if (I18N['cc.' + r]) return t('cc.' + r);
  const cc = CC[r];
  try { if (cc && cc.length === 2) return new Intl.DisplayNames([LOCALE()], { type: 'region' }).of(cc.toUpperCase()); } catch {}
  return /^(afc|caf|concacaf|conmebol|fifa)$/.test(r) ? ({ afc: 'Asia', caf: 'Africa', concacaf: 'North America', conmebol: 'South America', fifa: 'World' })[r] : r.toUpperCase();
};
const flagImg = (id, cls = '') => ccOf(id) ? `<img class="flag ${cls}" src="https://flagcdn.com/w40/${ccOf(id)}.png" alt="">` : '';
// league logo when ESPN has one, otherwise the country flag in its place
function lgIcon(id, cls = '') {
  const L = leagueOf(id);
  if (L.logoUrl) return `<img class="lgi ${cls}" src="${L.logoUrl}" alt="">`;
  if (!L.logo) return `<span class="lgi lgflag ${cls}" data-lg="${esc(id)}">${flagImg(id) || '🌍'}</span>`;
  return `<img class="lgi ${cls}" src="https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/${L.logo}.png&w=64&h=64" alt="" onerror="this.style.visibility='hidden'">`;
}
// small "flag + country" line under a league name
const regionLine = id => `<small class="region">${flagImg(id)}${esc(regionName(id))}</small>`;

// ---- storage (only on this phone) ----
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let favs = store.get('favs', []); // [{id, name, league}]
let xfavs = store.get('xfavs', []); // teams of handball / volleyball / European basketball: [{sport, name}]
let enabled = store.get('leagues', ['tur.1', 'tur.cup', 'uefa.champions', 'uefa.europa', 'uefa.europa.conf', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1']);
// the Turkish Cup arrived later: switch it on once for people who already saved a league list
// women's football: the main competitions are switched on once for everyone (they can be turned off in Settings)
if (!store.get('lowerAdded', false)) { for (const id of ['tur.2', 'tur.3', 'tur.4']) if (!enabled.includes(id)) enabled.push(id); store.set('leagues', enabled); store.set('lowerAdded', true); }
if (!store.get('womenAdded', false)) { for (const id of ['tur.w.1', 'uefa.wchampions', 'eng.w.1', 'esp.w.1', 'fra.w.1', 'usa.nwsl']) if (!enabled.includes(id)) enabled.push(id); store.set('leagues', enabled); store.set('womenAdded', true); }
if (!store.get('cupAdded', false)) { if (!enabled.includes('tur.cup')) enabled.push('tur.cup'); store.set('leagues', enabled); store.set('cupAdded', true); }
// every football league is on by default now (all of them come in one request)
if (!store.get('allSoccerAdded', false)) {
  for (const L of GROUPS.flat()) if (!L.path && !L.probe && !enabled.includes(L.id)) enabled.push(L.id);
  store.set('leagues', enabled); store.set('allSoccerAdded', true);
}
// same for the American leagues
if (!store.get('usAdded', false)) { for (const l of ['nba', 'nhl', 'nfl']) if (!enabled.includes(l)) enabled.push(l); store.set('leagues', enabled); store.set('usAdded', true); }
let pinned = store.get('pinned', ['tur.1']);
const segState = {};

// ---- helpers ----
const $ = s => document.querySelector(s);
const app = $('#app');
const cache = new Map();
// scores default to a 4 s cache and skip the browser's HTTP cache so a 5 s refresh really fetches
// the same address asked twice at once (two boxes of one page, a refresh during a slow answer) shares one request
const inflight = new Map();
async function get(url, ttl = 4000) {
  const c = cache.get(url);
  if (c && Date.now() - c.t < ttl) return c.d;
  if (inflight.has(url)) return inflight.get(url);
  const p = (async () => {
    const r = await fetch(url, ttl < 10000 ? { cache: 'no-store' } : undefined);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    cache.set(url, { t: Date.now(), d });
    if (cache.size > 400) cache.delete(cache.keys().next().value);
    return d;
  })();
  inflight.set(url, p);
  try { return await p; } finally { inflight.delete(url); }
}
// wait at most `ms` for a slow source: the page shows without it and redraws itself quietly once it has arrived
function soon(p, ms, route) {
  let late = false;
  return Promise.race([
    p.then(v => { if (late && (location.hash.replace(/^#\/?/, '').split('/')[0] || 'matches') === route) render(true); return v; }),
    new Promise(ok => setTimeout(() => { late = true; ok(null); }, ms)),
  ]);
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// team logos live under the league slug for US sports (…/teamlogos/nba/500/2.png) and under "soccer" otherwise
const logoUrl = (id, league) => {
  const [sp, lg] = pathOf(league || 'x').split('/');
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/${sp === 'soccer' ? 'soccer' : lg}/500/${id}.png&w=80&h=80`;
};
const img = (id, cls = '', league) => `<img class="logo ${cls}" loading="lazy" src="${logoUrl(id, league)}" alt="" onerror="this.style.visibility='hidden'">`;
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtD = (d, o) => new Date(d).toLocaleDateString(LOCALE(), o);
const hm = iso => new Date(iso).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }); // kick-offs are always Turkish time (TSİ)
const dshort = iso => fmtD(iso, { day: 'numeric', month: 'short' });
// team ids are only unique within a sport (NBA team 19 ≠ a football club 19)
const isFav = (id, league) => favs.some(f => f.id == id && sportOf(f.league) === sportOf(league));
const scoreOf = c => (c.score && typeof c.score === 'object') ? c.score.displayValue : c.score;
const setTitle = s => { $('#title').textContent = s; };

// live games: pulsing dot + a minute that keeps running between refreshes (ESPN only updates its clock now and then)
const liveHtml = s => `<span class="livedot"></span>` + (s.tick ? `<span class="liveclk" data-c="${s.tick.c}" data-m="${s.tick.m}" data-t="${Date.now()}">${esc(s.txt)}</span>` : esc(s.txt));
function status(st, league) {
  const ty = st?.type || {}, n = ty.name;
  const noScore = ['STATUS_POSTPONED', 'STATUS_CANCELED', 'STATUS_SCHEDULED', 'STATUS_DELAYED', 'STATUS_RAIN_DELAY'].includes(n) || ty.state === 'pre';
  const us = sportOf(league) !== 'soccer';
  // not played as planned: own orange label instead of a kick-off time
  const ODD = { STATUS_POSTPONED: 'st.PPD', STATUS_CANCELED: 'st.CANC', STATUS_DELAYED: 'st.DLY', STATUS_RAIN_DELAY: 'st.DLY', STATUS_SUSPENDED: 'st.SUSP', STATUS_INTERRUPTED: 'st.SUSP', STATUS_ABANDONED: 'st.ABD', STATUS_FORFEIT: 'st.FF' };
  if (ODD[n]) return { cls: 'ppd', txt: t(ODD[n]), show: ['STATUS_SUSPENDED', 'STATUS_INTERRUPTED', 'STATUS_ABANDONED', 'STATUS_FORFEIT'].includes(n) };
  // US sports show the period as well ("Q3 5:21", "2nd 10:00"); finals after overtime keep "/OT"
  if (ty.state === 'in') {
    const dc = String(st.displayClock || '');
    const tick = !us && n !== 'STATUS_HALFTIME' && /^\d+'?$/.test(dc) && Number.isFinite(+st.clock) ? { c: +st.clock, m: parseInt(dc) } : null;
    return { cls: 'live', txt: n === 'STATUS_HALFTIME' ? t('st.HT') : (us ? ty.shortDetail : (st.displayClock || ty.shortDetail)), show: true, tick };
  }
  if (us && ty.state === 'post' && n !== 'STATUS_POSTPONED' && n !== 'STATUS_CANCELED') return { cls: 'post', txt: t('st.FT') + ((ty.shortDetail || '').match(/\/(\d?OT|SO)/)?.[0] || ''), show: true };
  const map = { STATUS_FULL_TIME: 'st.FT', STATUS_FINAL: 'st.FT', STATUS_FINAL_AET: 'st.AET', STATUS_FINAL_PEN: 'st.PEN', STATUS_POSTPONED: 'st.PPD', STATUS_CANCELED: 'st.CANC', STATUS_ABANDONED: 'st.ABD' };
  if (ty.state === 'post' || n === 'STATUS_POSTPONED' || n === 'STATUS_CANCELED') return { cls: 'post', txt: t(map[n] || 'st.FT'), show: !noScore };
  return { cls: 'pre', txt: null, show: false };
}

function sides(comp) {
  const cs = comp.competitors || [];
  return [cs.find(x => x.homeAway === 'home') || cs[0], cs.find(x => x.homeAway === 'away') || cs[1]];
}

// notes under a match: ESPN's own notes, neutral grounds, and a home side playing away from its usual stadium
// (each club's usual ground is learned from the matches this device has already seen)
const homeVen = (() => { try { return JSON.parse(localStorage.getItem('hven') || '{}'); } catch { return {}; } })();
let hvenT = 0;
function matchNote(ev, h) {
  const comp = ev.competitions?.[0] || {}, v = comp.venue?.fullName || '';
  const out = (comp.notes || []).map(n => n.headline || n.text).filter(Boolean);
  if (comp.neutralSite && v) out.push(t('mn.neutral', v));
  else if (v && h?.team?.id) {
    const k = h.team.id, seen = homeVen[k] || (homeVen[k] = {});
    if (!seen[ev.id]) { seen[ev.id] = v; const ids = Object.keys(seen); if (ids.length > 12) delete seen[ids[0]]; clearTimeout(hvenT); hvenT = setTimeout(() => { try { localStorage.setItem('hven', JSON.stringify(homeVen)); } catch {} }, 1500); }
    const cnt = {}; for (const x of Object.values(seen)) cnt[x] = (cnt[x] || 0) + 1;
    const [usual, n] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || [];
    if (usual && n >= 2 && usual !== v) out.push(t('mn.moved', v));
  }
  return out.length ? `<div class="mnote">ⓘ ${esc([...new Set(out)].join(' · '))}</div>` : '';
}
function matchRow(ev, league, withDate = false, tv = '', tbd = false, hideLg = false) {
  const comp = ev.competitions[0];
  const [h, a] = sides(comp);
  const s = status(ev.status || comp.status, league);
  // score sits on the team's own line so long (wrapped) names stay aligned
  const team = c => `<div class="tm ${c === h ? 'thome' : 'taway'} ${s.show && c.winner ? 'win' : ''}">${img(c.team.id, '', league)}<span class="tn">${esc(c.team.displayName || c.team.shortDisplayName)}${isFav(c.team.id, league) ? ' <span class="star">★</span>' : ''}</span><b class="ts ${s.cls}">${s.show ? esc(scoreOf(c)) : ''}</b></div>`;
  const comp_ = withDate && !hideLg ? (LEAGUES.some(l => l.id === league) ? lname(leagueOf(league)) : (ev.league?.name || ev.league?.abbreviation)) : '';
  const gf = goalCheck(`${league}:${ev.id}`, scoreOf(h), scoreOf(a), s.cls === 'live', { league, id: ev.id, h, a, min: s.cls === 'live' ? (s.txt || '') : '' });
  return `<a class="match${gf ? ' goalrow g' + gf.side : ''}" href="#/match/${league}/${ev.id}">
    <div class="mtime ${s.cls}">${withDate ? `<small>${tbd ? '' : dshort(ev.date)}</small>` : ''}${s.cls === 'live' ? liveHtml(s) : tbd ? '' : esc(s.txt ?? hm(ev.date))}</div>
    <div class="teams">${comp_ ? `<div class="lg">${esc(comp_)}</div>` : ''}${team(h)}${team(a)}${sportOf(league) === 'soccer' ? matchNote(ev, h) : ''}</div>
  </a>`;
}

function seg(key, labels) {
  const cur = segState[key] ?? 0;
  return `<div class="seg" data-segkey="${key}">${labels.map((l, i) => `<button data-seg="${i}" class="${i === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
// before kick-off the empty score/stats/events tabs go last: info (and chat) come first
const tabsHtml = (key, T, pre, firstIdx = [], k = 'match') => { const o = pre ? [...firstIdx, ...T.map((_, i) => i).filter(i => !firstIdx.includes(i))] : T.map((_, i) => i); return seg(k, o.map(i => T[i][0])) + o.map((i, n) => pane(k, n, T[i][1])).join(''); };
const pane = (key, i, html) => `<div class="pane ${(segState[key] ?? 0) === i ? 'on' : ''}" data-pane="${key}:${i}">${html}</div>`;
// match events timeline. items: {side: 'home'|'away', min, kind: goal|yellow|red|sub|miss, name, note?, out?}
// (name/note/out already escaped). Substitutions: green ↑ for the player coming on, grey ↓ for the one going off.
function timelineHtml(items) {
  const ICON = { goal: '⚽', yellow: '<i class="cardic y"></i>', red: '<i class="cardic r"></i>', sub: '<i class="subic">⇄</i>', miss: '<i class="missic">✕</i>' };
  let html = '', second = false;
  for (const it of items) {
    if (!second && (parseInt(it.min) || 0) > 45) { second = true; if (html) html += `<div class="tl-break">${t('st.HT')}</div>`; }
    const body = it.kind === 'sub'
      ? `<span class="tl-in"><i class="up">↑</i> ${it.name}</span>${it.out ? `<span class="tl-out"><i>↓</i> ${it.out}</span>` : ''}`
      : `<b>${it.name}</b>${it.note ? `<small>${it.note}</small>` : ''}`;
    const cell = `<div class="tl-ev"><span class="tl-ic">${ICON[it.kind] || '•'}</span><span class="tl-txt">${body}</span></div>`;
    html += `<div class="tl-row tl-${it.kind}"><div class="tl-side home">${it.side === 'home' ? cell : ''}</div>
      <div class="tl-min">${esc(it.min)}</div><div class="tl-side away">${it.side === 'away' ? cell : ''}</div></div>`;
  }
  return `<div class="card tl">${html}</div>`;
}

const favStar = (id, name, league) => `<button class="favstar ${isFav(id, league) ? 'on' : ''}" data-fav="${id}" data-name="${esc(name)}" data-league="${league}" aria-label="${t('favorite')}">${isFav(id, league) ? '★' : '☆'}</button>`;
const formHtml = form => form ? `<div class="form">${[...form].slice(-5).map(c => `<i class="${c}">${t('res.' + c)}</i>`).join('')}</div>` : '';

// ---- sport switcher (Matches, Leagues, Favourites show one sport at a time) ----
const SPORTS = [['soccer', '⚽', 'sp.soccer'], ['basketball', '🏀', 'sp.basketball'], ['volley', '🏐', 'sp.volley'], ['handball', '🤾', 'sp.handball'], ['baseball', '⚾', 'sp.baseball'], ['f1', '🏎️', 'sp.f1'], ['tennis', '🎾', 'sp.tennis'], ['hockey', '🏒', 'sp.hockey'], ['football', '🏈', 'sp.football']];
// sports that come from the Cloudflare server in one common shape (tennis, EuroLeague + Turkish basketball, volleyball)

// other sports: countries the user wants to see (the server sends every league with its country)
const CTRY_EU = ['Turkey', 'Germany', 'Spain', 'Italy', 'France', 'Greece', 'Serbia', 'Lithuania', 'Latvia', 'Estonia', 'Israel', 'Poland', 'Croatia', 'Slovenia', 'Montenegro', 'Bosnia-and-Herzegovina', 'North-Macedonia', 'Russia', 'Belgium', 'Netherlands',
  'Czech-Republic', 'Austria', 'Switzerland', 'Portugal', 'UK', 'England', 'Finland', 'Sweden', 'Hungary', 'Ukraine', 'Bulgaria', 'Romania', 'Denmark', 'Norway', 'Georgia', 'Cyprus', 'Slovakia', 'Europe', 'World'];
const CTRY_ALL = [...CTRY_EU.filter(x => !['Europe', 'World'].includes(x)), 'Iceland', 'Ireland', 'Luxembourg', 'Malta', 'Albania', 'Kosovo', 'Belarus', 'Kazakhstan', 'Azerbaijan', 'USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Uruguay',
  'Venezuela', 'China', 'Japan', 'South-Korea', 'Australia', 'New-Zealand', 'India', 'Iran', 'Qatar', 'Saudi-Arabia', 'Egypt', 'Tunisia', 'Algeria', 'Morocco', 'South-Africa', 'Nigeria', 'Taiwan', 'Thailand', 'Philippines', 'Indonesia'].sort((a, b) => a.localeCompare(b));
const CTRY_DEFAULT = { handball: CTRY_EU, eubasket: CTRY_EU, volley: ['Turkey', 'Europe', 'World'] };
let ctryPref = store.get('ctry', {});
// every country is on by default now (once for everybody); the choice lives in Settings › Sports, countries and leagues
if (!store.get('ctryAllOn', false)) { ctryPref = {}; store.set('ctry', ctryPref); store.set('ctryAllOn', true); }
const ctryOn = (sport, country) => !ctryPref[sport] || ctryPref[sport].includes(country || 'World');
const groupOk = (sport, g) => { if (!g.country || !CTRY_DEFAULT[sport] || !ctryPref[sport]) return true; return ctryPref[sport].includes(g.country); };
const CTRY_ISO = {"Albania": "AL", "Algeria": "DZ", "Argentina": "AR", "Australia": "AU", "Austria": "AT", "Azerbaijan": "AZ", "Belarus": "BY", "Belgium": "BE", "Bosnia-and-Herzegovina": "BA", "Brazil": "BR", "Bulgaria": "BG", "Canada": "CA", "Chile": "CL", "China": "CN", "Colombia": "CO", "Croatia": "HR", "Cyprus": "CY", "Czech-Republic": "CZ", "Denmark": "DK", "Egypt": "EG", "England": "GB-ENG", "Estonia": "EE", "Finland": "FI", "France": "FR", "Georgia": "GE", "Germany": "DE", "Greece": "GR", "Hungary": "HU", "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR", "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Japan": "JP", "Kazakhstan": "KZ", "Kosovo": "XK", "Latvia": "LV", "Lithuania": "LT", "Luxembourg": "LU", "Malta": "MT", "Mexico": "MX", "Montenegro": "ME", "Morocco": "MA", "Netherlands": "NL", "New-Zealand": "NZ", "Nigeria": "NG", "North-Macedonia": "MK", "Norway": "NO", "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Qatar": "QA", "Romania": "RO", "Russia": "RU", "Saudi-Arabia": "SA", "Serbia": "RS", "Slovakia": "SK", "Slovenia": "SI", "South-Africa": "ZA", "South-Korea": "KR", "Spain": "ES", "Sweden": "SE", "Switzerland": "CH", "Taiwan": "TW", "Thailand": "TH", "Tunisia": "TN", "Turkey": "TR", "UK": "GB", "Ukraine": "UA", "Uruguay": "UY", "USA": "US", "Venezuela": "VE"};
const ctryName = c => { if (c === 'Europe') return t('ct.europe'); if (c === 'World') return t('ct.world'); if (c === 'England') return t('cc.eng'); const iso = CTRY_ISO[c]; try { if (iso && iso.length === 2) return new Intl.DisplayNames([LOCALE()], { type: 'region' }).of(iso) || c; } catch {} return String(c).replace(/-/g, ' '); };
let sportsOn = store.get('sportsOn', null);
const sportShown = s => s === 'soccer' || !sportsOn || sportsOn.includes(s);
const OTHER_SPORTS = ['tennis', 'volley', 'handball', 'baseball', 'f1']; // basketball is one sport: NBA from ESPN, plus European leagues from the server (added below the NBA games)
let curSport = store.get('sport', 'soccer');
const scrollBar = inner => `<div class="sbwrap"><button class="sbarr l" data-sbar="-1" aria-label="‹">‹</button>${inner}<button class="sbarr r" data-sbar="1" aria-label="›">›</button></div>`;
// clean line icons for the sport tabs (the volleyball emoji looks like a globe on some phones)
const SPORT_SVG = {
  soccer: '<circle cx="12" cy="12" r="9"/><path d="M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4zM12 8.2V3.2M15.4 10.7l4.6-1.5M14.1 14.7l2.8 3.9M9.9 14.7l-2.8 3.9M8.6 10.7L4 9.2"/>',
  basketball: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6a9 9 0 0 1 0 12.8M18.4 5.6a9 9 0 0 0 0 12.8"/>',
  volley: '<circle cx="12" cy="12" r="9"/><path d="M12 3c-1.5 4.5-.5 7.500 3 10M3.600 9.500c4-1.500 8-.5 11.400 3.500M20 15.500c-3.500-1.500-7-.5-9.500 3.200M20.300 8.500c-3 0-5.500 1-7.300 3.500"/>',
  handball: '<circle cx="12" cy="12" r="9"/><path d="M12 12V3.200M12 12l8.300 2.700M12 12l-8.300 2.700"/><circle cx="12" cy="12" r="2.200"/>',
  baseball: '<circle cx="12" cy="12" r="9"/><path d="M6.800 4.800c2.500 3.200 2.500 11.200 0 14.400M17.200 4.800c-2.500 3.200-2.500 11.200 0 14.400"/>',
  f1: '<path d="M5 21V3"/><path d="M5 4h14v9H5z"/><path d="M5 8.500h14M9.500 4v9M14.500 4v9"/>',
  tennis: '<ellipse cx="10" cy="9.500" rx="5.500" ry="7" transform="rotate(-35 10 9.500)"/><path d="M13.500 14.500L20 21"/>',
  hockey: '<path d="M5 3l7.500 13.500H19"/><ellipse cx="17" cy="20" rx="4" ry="1.600"/>',
  football: '<ellipse cx="12" cy="12" rx="9.500" ry="5.500" transform="rotate(-35 12 12)"/><path d="M9.500 9.500l5 5M11.200 10.800l-1.300 1.300M13.200 12.800l-1.300 1.300"/>',
};
const sportSvg = s => SPORT_SVG[s] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${SPORT_SVG[s]}</svg>` : '';
const sportBar = () => scrollBar(`<div class="sportbar">${SPORTS.filter(x => sportShown(x[0])).map(([s, ic, k]) => `<button class="${s === curSport ? 'on' : ''}" data-sport="${s}"><span>${sportSvg(s) || ic}</span>${t(k)}</button>`).join('')}</div>`);

// ---- goal effects: a goal replaces the score for a few seconds with an animation (and a sound) ----
const APP_VERSION = 'v67';
let fx = { anim: true, sound: true, vib: true, voice: false, vol: 1, mute: {}, ...store.get('fx', {}) };
fx.mute ||= {}; if (!(fx.vol >= 0 && fx.vol <= 1)) fx.vol = 1;
// the phone's text-to-speech "Gooool" sounded robotic: off for everybody once (it can be switched back on in Settings)
if (!store.get('voiceOff1', false)) { fx.voice = false; store.set('fx', fx); store.set('voiceOff1', true); }
let actx = null;
const audioCtx = () => { try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== 'running') actx.resume().catch(() => {}); return actx; } catch { return null; } };
// browsers only allow sound after a first tap: unlock it on the first interaction
// phones suspend (or 'interrupt') the audio again after the app was in the background: every tap wakes it up
addEventListener('pointerdown', () => audioCtx(), { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden && actx && actx.state !== 'running') actx.resume().catch(() => {}); });
// sound effects: stadium recordings made for the app (sounds/*.mp3: crowd + horn, referee whistles, groan, chimes), decoded once;
// until they are loaded (or if they fail) the old synthesised tones play instead
const SFX = { goal: 'goal', concede: 'groan', miss: 'groan', start: 'whistle_start', ht: 'whistle_ht', end: 'whistle_end', cancel: 'groan', red: 'red', var: 'var', remind: 'ding', chime: 'ding' };
// every sound can be switched off on its own (Settings); the same sound is not played twice within 15 s (the in-app check and the push can both see one event)
const sndMuted = kind => !fx.sound || !!fx.mute[kind];
const sndLast = {};
const sndDup = kind => { const n = Date.now(), d = n - (sndLast[kind] || 0) < 15000; if (!d) sndLast[kind] = n; return d; };
const sfxBuf = {};
let sfxLoading = null;
function sfxLoad() {
  const c = audioCtx(); if (!c || sfxLoading) return sfxLoading;
  setTimeout(() => { if (Object.keys(sfxBuf).length < new Set(Object.values(SFX)).size) sfxLoading = null; }, 20000); // some failed (offline, old cache): try again later
  sfxLoading = Promise.all([...new Set(Object.values(SFX))].map(n => fetch(`sounds/${n}.mp3`).then(r => r.ok ? r : fetch(`${n}.mp3`)).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => c.decodeAudioData(b, ok, no))).then(buf => { sfxBuf[n] = buf; }).catch(() => {})));
  return sfxLoading;
}
addEventListener('pointerdown', () => sfxLoad(), { once: true, passive: true });
function sfxPlay(kind, vol = 1) {
  const n = SFX[kind]; if (!n) return false;
  const c = audioCtx(), buf = sfxBuf[n];
  if (c && buf && c.state === 'running') { const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; g.gain.value = vol * fx.vol; src.connect(g); g.connect(c.destination); src.start(); return true; }
  // not decoded yet, or the phone keeps Web Audio asleep: play the file with a plain <audio>, which phones allow more readily
  sfxLoad();
  try { const a = new Audio(`sounds/${n}.mp3`); a.volume = Math.max(0, Math.min(1, vol * fx.vol)); const p = a.play(); if (p) p.catch(() => {}); return true; } catch { return false; }
}
function goalSound() { // stadium crowd + air horn (falls back to the synthesised version)
  const c = audioCtx(); if (!c || sndMuted('goal')) return;
  if (sfxPlay('goal')) { goalVoice(); return; }
  const t0 = c.currentTime, out = c.createGain(); out.gain.value = 0.9 * fx.vol; out.connect(c.destination);
  const len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.8);
  src.connect(bp); bp.connect(g); g.connect(out); src.start(t0); src.stop(t0 + 3);
  [[392, 0], [523.25, 0.32]].forEach(([f, dt]) => {
    const o = c.createOscillator(), og = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1400;
    og.gain.setValueAtTime(0.0001, t0 + dt); og.gain.exponentialRampToValueAtTime(0.28, t0 + dt + 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.9);
    o.connect(lp); lp.connect(og); og.connect(out); o.start(t0 + dt); o.stop(t0 + dt + 1);
  });
  goalVoice();
}
// a human voice shouting the goal (the phone's own speech voice, in the app language)
function goalVoice() {
  if (!fx.voice || !('speechSynthesis' in window)) return;
  try {
    const word = { tr: 'Gooooool!', ru: 'Гоооооол!', es: 'Gooooool!', ku: 'Gooooool!' }[LANG] || 'Gooooool!', L = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ru: 'ru-RU', fr: 'fr-FR', es: 'es-ES', pl: 'pl-PL', ku: 'tr-TR' }[LANG] || 'en-GB';
    speechSynthesis.cancel();
    setTimeout(() => { const u = new SpeechSynthesisUtterance(word); u.lang = L; u.pitch = 1.3; u.rate = 0.62; u.volume = 1; speechSynthesis.speak(u); }, 400);
  } catch {}
}
// one sound per kind of notification, all synthesised: referee whistles for start / half-time / full-time, a buzzer for a red card, sad tones for a cancelled goal …
function whistle(c, t, dur, f = 2800) {
  const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 38; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(g.gain);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.03); g.gain.setValueAtTime(0.5, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination); o.start(t); lfo.start(t); o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
}
function tone(c, t, f, dur, type = 'sine', vol = 0.3, lp = 0) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o; if (lp) { const b = c.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = lp; o.connect(b); n = b; }
  n.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
const SOUND_KINDS = {
  goal: c => { const t = c.currentTime; tone(c, t, 392, 0.9, 'sawtooth', 0.28, 1400); tone(c, t + 0.32, 523.25, 0.9, 'sawtooth', 0.28, 1400); },
  cancel: c => { const t = c.currentTime; [[392, 0], [330, 0.28], [262, 0.56]].forEach(([f, d]) => tone(c, t + d, f, 0.5, 'sawtooth', 0.25, 900)); },
  red: c => { const t = c.currentTime; tone(c, t, 150, 0.55, 'sawtooth', 0.4, 700); tone(c, t + 0.65, 150, 0.35, 'sawtooth', 0.4, 700); },
  var: c => { const t = c.currentTime; [0, 0.18].forEach(d => tone(c, t + d, 1000, 0.1, 'square', 0.12)); tone(c, t + 0.45, 700, 0.35, 'square', 0.12); },
  start: c => { const t = c.currentTime; whistle(c, t, 0.9); },
  ht: c => { const t = c.currentTime; whistle(c, t, 0.35, 2600); whistle(c, t + 0.5, 0.35, 2600); },
  end: c => { const t = c.currentTime; whistle(c, t, 0.3, 2500); whistle(c, t + 0.45, 0.3, 2500); whistle(c, t + 0.9, 0.9, 2500); },
  remind: c => { const t = c.currentTime; tone(c, t, 660, 1.2, 'sine', 0.3); tone(c, t, 990, 0.9, 'sine', 0.15); tone(c, t + 0.5, 660, 1.0, 'sine', 0.22); },
};
// the same buzz patterns the service worker uses for a closed app, so vibration alone tells the events apart
const VIB = { goal: [300, 100, 300, 100, 600], cancel: [600, 200, 200], red: [800, 150, 800], var: [100, 80, 100, 80, 100], start: [500], ht: [200, 150, 200], end: [200, 100, 200, 100, 700], remind: [150] };
const kindVib = kind => { if (fx.vib && navigator.vibrate) try { navigator.vibrate(VIB[kind] || [200, 100, 200]); } catch {} };
function kindSound(kind, test) { if (!test && sndDup(kind)) return; kindVib(kind); const c = audioCtx(); if (!c || (!test && sndMuted(kind))) return; if (sfxPlay(SFX[kind] ? kind : 'chime')) return; (SOUND_KINDS[kind === 'concede' || kind === 'miss' ? 'cancel' : kind] || (() => chimeSound()))(c); }
function chimeSound() { // soft bell for a notification that arrives while the app is open
  const c = audioCtx(); if (!c || !fx.sound) return;
  if (sfxPlay('chime', 0.8)) return;
  const t0 = c.currentTime;
  [[880, 0], [1318.5, 0.14]].forEach(([f, dt]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.7);
    o.connect(g); g.connect(c.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.75);
  });
}
const goalSeen = new Map(), goalAt = new Map(); // match -> last score / when the animation ends
function goalCheck(key, h, a, live, info) {
  if (!live) { goalSeen.delete(key); return goalAt.get(key)?.until > Date.now() ? goalAt.get(key) : null; }
  const cur = [parseInt(h) || 0, parseInt(a) || 0], prev = goalSeen.get(key);
  goalSeen.set(key, cur);
  // the score went down during the match: the goal was disallowed (VAR / offside) — the groan for a followed or open match
  if (prev && (cur[0] < prev[0] || cur[1] < prev[1]) && info && (isFav(info.h.team.id, info.league) || isFav(info.a.team.id, info.league) || location.hash.includes(`/${info.id}`))) kindSound('cancel');
  if (prev && (cur[0] > prev[0] || cur[1] > prev[1]) && !(goalAt.get(key)?.until > Date.now())) {
    const side = cur[0] > prev[0] ? 0 : 1;
    goalAt.set(key, { until: Date.now() + 8000, side });
    if (info) goalToast({ ...info, side, score: `${cur[0]}–${cur[1]}` });
  }
  const g = goalAt.get(key);
  return g && g.until > Date.now() ? g : null;
}
// the animation wears the scoring team's colours (ESPN gives each team a main and an alternate colour); too light / too dark ones are adjusted so the white text stays readable
const fxCol = (hex, d) => {
  hex = String(hex || '').replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(hex)) return d;
  const n = parseInt(hex, 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, L = .299 * r + .587 * g + .114 * b;
  if (L > 170) return `rgb(${r * .6 | 0},${g * .6 | 0},${b * .6 | 0})`;
  if (L < 40) return `rgb(${Math.min(255, r + 55)},${Math.min(255, g + 55)},${Math.min(255, b + 55)})`;
  return '#' + hex;
};
const FX_DEMO = [['Galatasaray', 'a90432', 'fdb913'], ['Fenerbahçe', '002d72', 'ffed00'], ['Beşiktaş', '222222', 'ffffff'], ['Trabzonspor', '8b1a3d', '1d9ad6'], ['Grafondex FC', '0a8f3c', 'f5c518']];
let fxDemoN = 0;
// ---- goal toast: one card under the header; several goals at once are queued (and merged when many arrive together)
const toastQ = [];
let toastBusy = false;
function goalToast(g) {
  const mine = isFav(g.h.team.id, g.league) || isFav(g.a.team.id, g.league) || location.hash.includes(`/${g.id}`);
  if (fx.favOnly && !mine && g.id !== 'demo') return; // Settings: only my favourites' goals (and the match I have open)
  // whose goal? a favourite scored → the full roar; a favourite conceded → the crowd's groan
  const sc = g.side ? g.a : g.h, ot = g.side ? g.h : g.a, forUs = isFav(sc.team.id, g.league), against = !forUs && isFav(ot.team.id, g.league);
  toastQ.push({ ...g, mine, forUs, against });
  if (!toastBusy) setTimeout(nextToast, 120); // let goals found in the same refresh arrive first
}
function nextToast() {
  if (!toastQ.length) { toastBusy = false; return; }
  toastBusy = true;
  const many = toastQ.length >= 3 ? toastQ.splice(0) : [toastQ.shift()];
  const anyMine = many.some(x => x.mine);
  const anyFor = many.some(x => x.forUs), allAgainst = many.every(x => x.against);
  if (allAgainst) kindSound('concede');
  else if (fx.sound && (anyFor || anyMine || !favs.length)) goalSound(); else if (fx.sound && !fx.mute.chime) sfxPlay('chime', 0.6);
  if (fx.vib && anyMine && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
  if (!fx.anim) { setTimeout(nextToast, 300); return; }
  const g = many[0], sc = g.side ? g.a : g.h, col1 = fxCol(sc.team?.color, '#0a8f3c'), col2 = fxCol(sc.team?.alternateColor, '#f5c518');
  const line = x => `<span class="gtl">${esc(x.h.team.shortDisplayName || x.h.team.displayName)} <b>${esc(x.score)}</b> ${esc(x.a.team.shortDisplayName || x.a.team.displayName)}${x.min ? ` <small>${esc(x.min)}</small>` : ''}</span>`;
  const el = document.createElement('a');
  el.className = 'gtoast' + (anyMine ? ' mine' : '');
  el.href = `#/match/${g.league}/${g.id}`;
  el.style.cssText = `--g1:${col1};--g2:${col2}`;
  el.innerHTML = many.length > 1
    ? `<span class="gtball">⚽</span><span class="gtbody"><b class="gttitle">${t('gt.many', many.length)}</b>${many.slice(0, 4).map(line).join('')}${many.length > 4 ? `<small>+${many.length - 4}</small>` : ''}</span>`
    : `<span class="gtball">⚽</span><span class="gtbody"><b class="gttitle">${t('gt.goal')} ${esc(sc.team.shortDisplayName || sc.team.displayName)}</b>${line(g)}</span>${img(sc.team.id, 'mid', g.league)}`;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => { el.remove(); nextToast(); }, 350); }, many.length > 1 ? 5200 : 4200);
}
const goalFxHtml = (name, score, team) => `<div class="goalfx" style="--g1:${fxCol(team?.color, '#0a8f3c')};--g2:${fxCol(team?.alternateColor, '#f5c518')}" aria-hidden="true"><i class="gball">⚽</i><b>${t('goalWord')}</b><small>${esc(name)} ${esc(score)}</small><u></u><u></u><u></u><u></u><u></u><u></u><u></u><u></u></div>`;
// a push notification arrives while the app is open: play the ding
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data?.type === 'push' && !document.hidden && e.data.kind !== 'goal') kindSound(e.data.kind || ''); });
// ---- calendar (.ics): one match, or every upcoming match of the favourite teams ----
const icsEsc = x => String(x || '').replace(/[\\,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
const icsStamp = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function icsBuild(list) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grafondex//Live Score//TR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of list) {
    const st = Date.parse(e.s); if (!st) continue;
    L.push('BEGIN:VEVENT', `UID:${icsStamp(st)}-${(e.t || '').replace(/\W/g, '').slice(0, 24)}@grafondex`, `DTSTAMP:${icsStamp(Date.now())}`, `DTSTART:${icsStamp(st)}`, `DTEND:${icsStamp(st + (e.d || 120) * 60000)}`,
      `SUMMARY:${icsEsc(e.t)}`, ...(e.w ? [`LOCATION:${icsEsc(e.w)}`] : []), 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(e.t)}`, 'TRIGGER:-PT30M', 'END:VALARM', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}
// file name per match: "Besiktas-AC-Milan-2026-11-05"
const icsName = (title, iso) => (String(title || 'mac').replace(/[ıİ]/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'mac') + (iso ? '-' + String(iso).slice(0, 10) : '');
function icsSave(list, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([icsBuild(list)], { type: 'text/calendar;charset=utf-8' }));
  a.download = name + '.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const calBtn = (title, iso, where, mins = 120) => iso ? `<div class="form-block"><button class="btn ghost" data-ics data-ics-t="${esc(title)}" data-ics-s="${esc(iso)}" data-ics-w="${esc(where || '')}" data-ics-d="${mins}">📅 ${t('o.cal')}</button></div>` : '';

// ---- club badges for sports ESPN has no crests for (volleyball, handball, basketball): TheSportsDB through the Worker; a coloured initials badge until it arrives
const BSP = { volley: 'volleyball', eubasket: 'basketball', handball: 'handball', basketball: 'basketball' };
// TFF clubs (1. / 2. / 3. Lig, cup, women): the letter badge is swapped for the crest (TheSportsDB) once found
const tffLogo = (name, big) => `<span class="tinit${big ? ' big' : ''}" data-badge="${esc(tffName(name))}" data-bsp="soccer">${esc(tffName(name).slice(0, 1))}</span>`;
const phLogo = (name, sport, cls = '') => `<span class="logo ph tl ${cls}" data-badge="${esc(name)}" data-bsp="${esc(BSP[sport] || sport || 'volleyball')}" style="--pc:${pcol(name)}">${esc(initials(name))}</span>`;
const badgeMem = new Map(Object.entries(store.get('badges', {})).filter(([, v]) => v));
const bTok = s => String(s || '').toLowerCase().replace(/ı/g, 'i').replace(/i̇/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(w => w.length > 1 && !/^(fk|sk|spor|kulubu|jk|as|fc|gsk|bld|belediye)$/.test(w));
let tsdbAt = 0;
async function tsdbDirect(name) {
  const tk = bTok(name); if (!tk.length) return '';
  for (const q of [...new Set([name, tk.join(' '), tk[0]])]) {
    const wait = tsdbAt + 2100 - Date.now(); if (wait > 0) await new Promise(r => setTimeout(r, wait)); tsdbAt = Date.now();
    const j = await fetch('https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=' + encodeURIComponent(q)).then(r => r.ok ? r.json() : null).catch(() => null);
    const best = (j?.teams || []).filter(x => x.strBadge && /soccer/i.test(x.strSport || '')).find(x => { const xt = bTok(x.strTeam + ' ' + (x.strAlternate || '')); return tk.every(w => xt.some(y => y.includes(w) || w.includes(y))); });
    if (best) return best.strBadge + '/small';
  }
  return '';
}
let badgeChain = Promise.resolve();
const badgeUrl = (name, sp) => new Promise(res => {
  const k = sp + '|' + name; if (badgeMem.has(k)) return res(badgeMem.get(k));
  badgeChain = badgeChain.then(async () => {
    let u = '';
    try { u = (await get(`${workerBase()}/api/badge?n=${encodeURIComponent(name)}&sp=${encodeURIComponent(sp)}`, 86400000)).url || ''; } catch {}
    // not found through the Worker (TheSportsDB limits shared callers): ask it straight from the phone, gently (its free tier allows ~30 calls a minute)
    if (!u && sp === 'soccer') u = await tsdbDirect(name).catch(() => '');
    if (u) { badgeMem.set(k, u); try { store.set('badges', Object.fromEntries([...badgeMem].slice(-500))); } catch {} }
    res(u);
  });
});
function fillBadges() {
  if (!workerBase()) return;
  document.querySelectorAll('[data-badge]:not([data-bd])').forEach(el => {
    el.dataset.bd = '1';
    badgeUrl(el.dataset.badge, el.dataset.bsp).then(u => {
      if (!u || !el.isConnected) return;
      const im = new Image(); im.alt = ''; // not loading=lazy: an image outside the page never loads with it, so onload never came
      im.onload = () => { if (!el.isConnected) return; if (el.classList.contains('tinit')) { im.className = 'logo tcrest' + (el.classList.contains('big') ? ' big' : ''); el.replaceWith(im); } else if (el.classList.contains('tl')) { im.className = 'logo ' + el.className.replace(/\b(logo|ph|tl)\b/g, '').trim(); el.replaceWith(im); } else { im.style.objectFit = 'contain'; el.appendChild(im); } };
      im.src = u;
    });
  });
}
// market value (Transfermarkt, through the Worker), filled in one player at a time and remembered
const mvMem = new Map(Object.entries(store.get('mval', {})));
// four lookups at a time (one by one took ~5 s for a full squad); the memory is written once things settle
const mvQ = []; let mvRun = 0, mvSaveT = 0;
const mvPump = () => { while (mvRun < 4 && mvQ.length) { const job = mvQ.shift(); mvRun++; job().finally(() => { mvRun--; mvPump(); }); } };
const mvSave = () => { clearTimeout(mvSaveT); mvSaveT = setTimeout(() => { try { store.set('mval', Object.fromEntries([...mvMem].slice(-600))); } catch {} }, 1500); };
function fillValues() {
  if (!workerBase()) return;
  document.querySelectorAll('[data-mv]:not([data-md])').forEach(el => {
    el.dataset.md = '1'; const n = el.dataset.mv, tm = el.dataset.mt || '', k = n + '|' + tm;
    const show = v => { if (v?.v && el.isConnected) { el.textContent = '💶 ' + v.v; if (el.tagName === 'A') { el.href = v.url; el.target = '_blank'; el.rel = 'noopener'; } el.hidden = false; } };
    if (mvMem.has(k)) return show(mvMem.get(k));
    mvQ.push(async () => {
      if (!el.isConnected) return; // the page was left: skip
      let v; try { v = await get(`${workerBase()}/api/value?n=${encodeURIComponent(n)}&t=${encodeURIComponent(tm)}`, 86400000); } catch { return; }
      mvMem.set(k, v || {}); mvSave();
      show(v);
    });
    mvPump();
  });
}
// league logo when ESPN's table has none: ask ESPN for the league itself, once, and remember it
const lgMem = new Map(Object.entries(store.get('lglogo2', {})));
function fillLeagueLogos() {
  document.querySelectorAll('[data-lg]:not([data-ld])').forEach(async el => {
    el.dataset.ld = '1'; const id = el.dataset.lg;
    let u = lgMem.get(id);
    if (u === undefined) {
      try { const j = await get(core(id), 86400000); u = (j.logos || []).find(x => /default/.test((x.rel || []).join()))?.href || j.logos?.[0]?.href || ''; } catch { u = ''; }
      if (!u && workerBase() && !/^(uefa|fifa|afc|caf|concacaf|conmebol)\./.test(id)) { // no ESPN logo: the league badge from TheSportsDB through the Worker
        const cc = ccOf(id), ctry = { 'gb-eng': 'England', 'gb-sct': 'Scotland', 'gb-wls': 'Wales', 'gb-nir': 'Northern Ireland', us: 'USA' }[cc] || (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of((cc || '').toUpperCase()).replace('Türkiye', 'Turkey'); } catch { return ''; } })();
        if (ctry) try { u = (await get(`${workerBase()}/api/lbadge?c=${encodeURIComponent(ctry)}&n=${encodeURIComponent(leagueOf(id).name)}`, 86400000)).url || ''; } catch { return; }
      }
      lgMem.set(id, u); try { store.set('lglogo2', Object.fromEntries(lgMem)); } catch {}
    }
    if (u && el.isConnected) { const im = new Image(); im.alt = ''; im.className = 'lgi ' + el.className.replace(/\b(lgi|lgflag)\b/g, '').trim(); im.onload = () => el.isConnected && el.replaceWith(im); im.src = u.replace(/^http:/, 'https:'); }
  });
}
// ---- Matches tab ----
const otherRow = (it, sport, day) => {
  if (it.kind === 'race') return `<div class="match static race"><div class="mtime ${it.state}">${it.state === 'in' ? '<span class="livedot"></span>' : ''}${esc(it.state === 'pre' ? hm(it.time) : (it.text || ''))}</div>
    <div class="teams"><b class="racetitle">${esc(I18N['f1.' + it.code] ? t('f1.' + it.code) : it.title)}</b>${it.results.length ? `<ol class="results">${it.results.map(r => `<li><i>${esc(r.pos)}</i>${esc(r.name)}<small>${esc(r.team)}</small></li>`).join('')}</ol>` : ''}</div></div>`;
  const team = x => `<div class="tm ${it.state === 'post' && x.winner ? 'win' : ''}">${x.logo ? `<img class="logo" loading="lazy" src="${esc(x.logo)}" alt="" onerror="this.style.visibility='hidden'">` : phLogo(x.name, sport)}<span class="tn">${esc(x.name)}</span>
    <b class="ts ${it.state}">${x.sets?.length ? `<span class="setline">${x.sets.map(v => `<i>${esc(v)}</i>`).join('')}</span>` : ''}${esc(x.score)}</b></div>`;
  return `<a class="match" href="#/game/${esc(sport)}/${esc(it.id)}/${esc(day)}"><div class="mtime ${it.state}">${it.state === 'in' ? '<span class="livedot"></span>' : ''}${esc(it.state === 'pre' ? hm(it.time) : (it.text || ''))}${it.round ? `<small>${esc(it.round)}</small>` : ''}</div>
    <div class="teams">${team(it.home)}${team(it.away)}</div></a>`;
};
// ---- game page for the sports that come from the server (basketball in Europe, volleyball, handball, tennis ...) ----
const EUL = 'https://api-live.euroleague.net/v2';
const euSeason = (comp, iso) => { const d = iso ? new Date(iso) : new Date(); return comp + (d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1); };
const euName = n => String(n || '').split(',').map(s => s.trim().toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())).reverse().join(' ');
// ---- league tables and team pages of the sports that come from the server ----
const srcSport = k => { const [a, b] = String(k).split(':'); const s = a === 'thf' ? 'handball' : a === 'tvf' ? 'volley' : a === 'eu' ? 'basketball' : a === 'as' ? b : k; return s === 'volleyball' ? 'volley' : s === 'eubasket' ? 'basketball' : s; };
const ZC = { green: '#2ecc71', blue: '#3498db', red: '#e5484d' };
function otherTableHtml(g, hl, sport) {
  const hasD = g.rows.some(r => r.d != null), hasP = g.rows.some(r => r.p != null && r.p !== r.g);
  const n = x => x == null || x === '' ? '–' : esc(x);
  const norm = s => String(s || '').toLocaleLowerCase('tr');
  const body = g.rows.map(r => {
    const z = g.zones.find(z => r.pos >= z.from && r.pos <= z.to), me = hl && (norm(r.name) === norm(hl) || norm(r.name).includes(norm(hl)) || norm(hl).includes(norm(r.name)));
    return `<tr class="${me ? 'fav' : ''}"><td class="r" style="border-left-color:${z ? ZC[z.c] : 'transparent'}">${esc(r.pos)}</td><td class="tmc" style="color:var(--text)">${r.logo ? `<img class="logo" src="${esc(r.logo)}" alt="" onerror="this.remove()"> ` : phLogo(r.name, sport) + ' '}<a href="#/tx/${esc(sport)}/${encodeURIComponent(r.name)}" style="color:inherit">${esc(r.name)}</a></td><td>${n(r.o)}</td><td>${n(r.g)}</td>${hasD ? `<td>${n(r.d)}</td>` : ''}<td>${n(r.m)}</td>${r.f != null ? `<td>${n(r.f)}–${n(r.a)}</td>` : ''}${hasP ? `<td><b>${n(r.p)}</b></td>` : ''}</tr>`;
  }).join('');
  const hasF = g.rows.some(r => r.f != null);
  const legend = g.zones.map(z => `<span style="margin-right:12px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${ZC[z.c]};margin-right:5px"></i>${t('z.' + z.l)}</span>`).join('');
  return `${g.name ? `<h2>${esc(g.name)}</h2>` : ''}<div class="stwrap"><table class="stbl"><thead><tr><th>#</th><th class="tmc">${t('th.team')}</th><th>O</th><th>G</th>${hasD ? '<th>B</th>' : ''}<th>M</th>${hasF ? '<th>+/–</th>' : ''}${hasP ? '<th>P</th>' : ''}</tr></thead><tbody>${body}</tbody></table></div><div class="hint" style="padding:6px 14px 12px">${legend}</div>`;
}
async function viewOtherTable(rawSrc, hl) {
  const src = decodeURIComponent(rawSrc || ''); setTitle(t('o.standings'));
  const d = await get(`${workerBase()}/tstand?src=${encodeURIComponent(src)}`, 60000).catch(() => null);
  if (!d || d.error || !d.groups?.length) return `<div class="empty">${d?.error === 'needKey' ? t('c.needKey') : t('o.noTable')}</div>`;
  setTitle(d.title || t('o.standings'));
  return `<div class="card">${d.groups.map(g => otherTableHtml(g, hl ? decodeURIComponent(hl) : '', srcSport(src))).join('')}</div>`;
}
async function viewTeamX(sport, rawName) {
  const name = decodeURIComponent(rawName || ''); setTitle(name);
  const c = await get(`${workerBase()}/tcomps?sport=${encodeURIComponent(sport)}&name=${encodeURIComponent(name)}`, 300000).catch(() => ({ comps: [], games: [] }));
  const tabs = await Promise.all((c.comps || []).map(x => get(`${workerBase()}/tstand?src=${encodeURIComponent(x.src)}`, 60000).then(d => ({ x, d })).catch(() => ({ x, d: null }))));
  const norm = s => String(s || '').toLocaleLowerCase('tr'), me = r => norm(r.name) === norm(name) || norm(r.name).includes(norm(name)) || norm(name).includes(norm(r.name));
  const found = tabs.map(({ x, d }) => { for (const g of d?.groups || []) { const r = g.rows.find(me); if (r) return { x, d, g, r }; } return null; }).filter(Boolean);
  const logo = found.map(f => f.r.logo).find(Boolean);
  const isFavX = xfavs.some(f => f.sport === sport && f.name === name);
  const hero = `<div class="card hero plhero"><div class="plpic" style="--pc:${pcol(name)}" ${logo ? '' : `data-badge="${esc(name)}" data-bsp="${esc(BSP[sport] || sport)}"`}><span class="pin_">${esc(initials(name))}</span>${logo ? `<img src="${esc(logo)}" alt="" style="object-fit:contain" onerror="this.remove()">` : ''}</div>
    <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(name)}</div>
    <div class="st">${found.map(f => `<a href="#/ostand/${encodeURIComponent(f.x.src)}/${encodeURIComponent(name)}" class="chip">${esc(f.d.title || f.x.title)} · ${t('o.rank', f.r.pos)}</a>`).join(' ') || ''}</div>
    <button class="favbtn ${isFavX ? 'on' : ''}" data-xfav="${esc(sport)}|${esc(name)}">${isFavX ? t('inFavs') : t('addFav')}</button></div>`;
  const tables = found.map(f => `<div class="card"><h2>${esc(f.d.title || f.x.title)}<a href="#/ostand/${encodeURIComponent(f.x.src)}/${encodeURIComponent(name)}">${t('o.standings')}</a></h2>${otherTableHtml(f.g, name, srcSport(f.x.src))}</div>`).join('');
  const games = (c.games || []).slice(0, 12);
  const gHtml = games.length ? `<div class="card"><h2>${t('o.games')}</h2>${games.map(g => `<a class="match" href="#/game/${esc(sport === 'basketball' ? 'eubasket' : sport)}/${esc(g.id)}/${esc(g.day)}"><div class="mtime ${g.state}">${esc(g.state === 'pre' ? dshort(g.time) + ' ' + hm(g.time) : g.state === 'in' ? t('live') : dshort(g.time))}</div><div class="teams"><div class="tm"><span class="tn">${esc(g.home)}</span><b class="ts ${g.state}">${esc(g.hs ?? '')}</b></div><div class="tm"><span class="tn">${esc(g.away)}</span><b class="ts ${g.state}">${esc(g.as ?? '')}</b></div></div></a>`).join('')}</div>` : '';
  // EuroLeague / EuroCup clubs: the squad from the official API, every player has a profile
  let squad = '';
  const eu = found.find(f => f.x.src.startsWith('eu:') && f.r.code);
  if (eu) {
    const comp = eu.x.src.split(':')[1], season = euSeason(comp);
    const ppl = await get(`${EUL}/competitions/${comp}/seasons/${season}/clubs/${eu.r.code}/people`, 600000).catch(() => []);
    const pl = (Array.isArray(ppl) ? ppl : ppl.data || []).filter(p => /player/i.test(p.typeName || '') || p.type === 'J' || p.type === 'P');
    const coach = (Array.isArray(ppl) ? ppl : ppl.data || []).find(p => p.type === 'E');
    if (pl.length) squad = `<div class="card"><h2>${t('squad')}</h2>${coach ? `<div class="inforow"><span class="k">${t('hb.coach')}</span><span class="v">${esc(euName(coach.person.alias || coach.person.name))}</span></div>` : ''}${pl.sort((a, b) => (+a.dorsal || 99) - (+b.dorsal || 99)).map(p => `<a class="pl" href="#/player/basketball/${esc(comp)}/${esc(p.person.code)}"><span class="no">${esc(p.dorsal || '')}</span><span class="nm">${esc(euName(p.person.alias || p.person.name))}</span><span class="ps">${esc(p.positionName || '')}</span></a>`).join('')}</div>`;
  }
  if (sport === 'volley') { // one squad per gender the club plays in (the same club name can have a women's and a men's team)
    const gs = [...new Set(found.map(f => vGender(f.x.src + ' ' + (f.d.title || f.x.title))))];
    squad = (await Promise.all((gs.length ? gs : [vGender(name)]).map(g => vSquad(name, g)))).map(vHtml).join('');
  }
  const empty = !tables && !gHtml && !squad ? `<div class="empty">${t('o.noTable')}</div>` : '';
  return hero + tables + squad + gHtml + empty;
}
// volleyball squads and profiles (Volleybox through the Worker): women's clubs on women.volleybox.net, men's on volleybox.net
const vGender = s => (/sultan|kad[ıi]n|women|\bw\b|\(w\)|bayan/i.test(String(s || '')) ? 'w' : 'm');
const vSquad = (name, g) => get(`${workerBase()}/vteam?name=${encodeURIComponent(name)}&g=${g}`, 6 * 3600e3).then(d => (d?.players?.length ? { ...d, g } : null)).catch(() => null);
const vCard = (p, g) => `<a class="pcard" href="#/vplayer/${g}/${esc(p.slug)}"><div class="pph" style="--pc:${pcol(p.name)}"><span class="pin_">${esc(initials(p.name))}</span>${p.photo ? `<img loading="lazy" src="${esc(p.photo)}" alt="" onerror="this.remove()">` : ''}${p.no ? `<i class="pno">${esc(p.no)}</i>` : ''}</div>
  <b class="pnm">${esc(p.name)}</b><small>${esc([p.pos, p.h].filter(Boolean).join(' · '))}</small></a>`;
const vSeason = y => (+y ? `${+y - 1}/${String(y).slice(2)}` : '');
const vHtml = d => d ? `<div class="card"><h2>${d.team.logo ? `<img class="logo" src="${esc(d.team.logo)}" alt="" onerror="this.remove()"> ` : ''}${esc(d.team.name)} · ${t('squad')} ${esc(vSeason(d.season))}</h2>${pgrid(d.players.map(p => vCard(p, d.g)))}<div class="hint" style="padding:0 14px 10px">${t('v.src')}</div></div>` : '';
async function viewVPlayer(g, slug) {
  const p = await get(`${workerBase()}/vplayer?g=${encodeURIComponent(g)}&slug=${encodeURIComponent(slug)}`, 3600e3).catch(() => null);
  if (!p || p.error || !p.name) return `<div class="empty">${t('pl.noData')}</div>`;
  setTitle(p.name);
  const hero = `<div class="card hero plhero"><div class="plpic" style="--pc:${pcol(p.name)}"><span class="pin_">${esc(initials(p.name))}</span>${p.photo ? `<img loading="lazy" src="${esc(p.photo)}" alt="" onerror="this.remove()">` : ''}</div>
    <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(p.name)}</div><div class="st">${esc(p.pos || '')}</div></div>`;
  const rows = [['🌍', t('pl.nation'), p.nat], ['🎂', t('pl.born'), p.born], ['📏', t('pl.height'), p.h], ['⚖️', t('pl.weight'), p.w], ['🏐', t('v.spike'), p.spike], ['🧱', t('v.block'), p.block]].filter(r => r[2]);
  return hero + (rows.length ? `<div class="card">${rows.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>` : '') + `<p class="note"><a href="${esc(p.url)}" target="_blank" rel="noopener">${t('v.src')} ›</a></p>`;
}
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
async function viewGame(sport, id, day) {
  setTitle(t('nav.matches'));
  let it = null, grp = null;
  try { const d = await capi('GET', `/sports/${sport}?date=${day}`); for (const g of d.groups || []) { const f = (g.items || []).find(x => String(x.id) === String(id)); if (f) { it = f; grp = g; break; } } } catch (e) { return retryBox(e); }
  if (!it) return emptyState('ball', t('noMatches'));
  const tvTr = await tvList(trDay(it.time)).then(l => tvFor(l, it.time, it.home.name, it.away.name, '')).catch(() => '');
  const show = it.state !== 'pre';
  const side = x => `<div class="side">${x.logo ? `<img class="logo big" src="${esc(x.logo)}" alt="" onerror="this.style.visibility='hidden'">` : phLogo(x.name, sport, 'big')}<span>${x.pid ? `<a class="plink" href="#/player/tennis/${esc(x.tour)}/${esc(x.pid)}">${esc(x.name)}</a>` : !['eubasket', 'volley', 'handball'].includes(sport) ? esc(x.name) : `<a class="plink" href="#/tx/${esc(srcSport(sport))}/${encodeURIComponent(x.name)}">${esc(x.name)}</a>`}</span></div>`;
  const hero = `<div class="card hero"><div class="row">${side(it.home)}<div class="mid"><div class="sc">${show ? `${esc(it.home.score)} - ${esc(it.away.score)}` : esc(hm(it.time))}</div>
    <div class="st ${it.state}">${it.state === 'pre' ? dshort(it.time) : it.state === 'in' ? `<span class="livetag">${t('live')}</span> ${esc(it.text || '')}` : esc(it.text || t('st.FT'))}</div>${tvTr ? `<div class="tvtag">📺 ${esc(tvTr)}</div>` : ''}</div>${side(it.away)}</div></div>`;
  if (sport === 'handball' && String(id).startsWith('thf-')) return viewThfGame(it, id, grp, hero, tvTr);
  // score by set / quarter / period when the source has it
  const hs = it.home.sets || [], as = it.away.sets || [], n = Math.max(hs.length, as.length);
  const row = (x, s) => `<tr><td class="t">${x.logo ? `<img class="logo" src="${esc(x.logo)}" alt="" onerror="this.style.visibility='hidden'"> ` : phLogo(x.name, sport) + ' '}${esc(x.name)}</td>${Array.from({ length: n }, (_, k) => `<td>${esc(s[k] ?? '')}</td>`).join('')}<td class="p">${esc(x.score)}</td></tr>`;
  const perHtml = show && n ? `<div class="card"><table class="lines"><thead><tr><th></th>${Array.from({ length: n }, (_, k) => `<th>${k + 1}</th>`).join('')}<th>${t('total')}</th></tr></thead><tbody>${row(it.home, hs)}${row(it.away, as)}</tbody></table></div>`
    : `<div class="empty">${it.state === 'pre' ? t('notStarted') : t('noStats')}</div>`;
  const rows = [['🏆', t('competition'), grp?.name], ['🔢', t('round'), it.round], ['📅', t('date'), new Date(it.time).toLocaleString(LOCALE(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) + ' (TSİ)'], ['🏟️', t('venue'), it.venue], ['📺', t('tvTr'), tvTr || it.tv]].filter(r => r[2]);
  const infoHtml = `<div class="card">${rows.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>`;
  // EuroLeague / EuroCup: full box score with a profile for every player
  let boxHtml = '';
  const el = /^([EU])-(\d+)$/.exec(String(id));
  if (el && show) {
    const bs = await get(`${EUL}/competitions/${el[1]}/seasons/${euSeason(el[1], it.time)}/games/${el[2]}/stats`, 20000).catch(() => null);
    const tbl = (s, label) => {
      const pl = (s?.players || []).filter(p => p.stats?.timePlayed > 0).sort((x, y) => y.stats.timePlayed - x.stats.timePlayed);
      if (!pl.length) return '';
      return `<div class="card"><h2>${esc(label)}</h2><table class="boxt"><thead><tr><th>#</th><th style="text-align:left">${t('pl.player')}</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead><tbody>${pl.map(p => `<tr><td>${esc(p.player.dorsal || '')}</td><td class="t"><a href="#/player/basketball/${el[1]}/${esc(p.player.person.code)}">${esc(euName(p.player.person.alias || p.player.person.name))}</a></td><td>${mmss(p.stats.timePlayed)}</td><td class="p">${p.stats.points ?? 0}</td><td>${p.stats.totalRebounds ?? 0}</td><td>${p.stats.assistances ?? 0}</td></tr>`).join('')}</tbody></table></div>`;
    };
    boxHtml = tbl(bs?.local, it.home.name) + tbl(bs?.road, it.away.name);
  }
  if (sport === 'volley') { const g = vGender(grp?.name), sq = (await Promise.all([it.home.name, it.away.name].map(n => vSquad(n, g)))).map(vHtml).join(''); if (sq) boxHtml = sq; }
  const T = [[t('score'), perHtml], ...(boxHtml ? [[t('search.players'), boxHtml]] : []), [t('info'), infoHtml + calBtn(`${it.home.name} – ${it.away.name}`, it.time, [it.venue, grp?.name].filter(Boolean).join(', '))], [t('c.chat'), chatHtml(`m-${String(sport).replace(/\W/g, '')}-${String(id).replace(/\W/g, '')}`)]];
  return hero + tabsHtml('match', T, it.state === 'pre', [T.length - 2, T.length - 1]);
}
// Turkish handball (THF): line-up, goals, 2-minute suspensions and the timeline from the federation's live ticker
const HB_EV = { Goal: '🤾', SevenMeterGoal: '🤾 7m', SevenMeterMiss: '❌ 7m', TimeOut: '⏱', TwoMinutes: '✋ 2′', Warning: '🟨', Disqualification: '🟥', Red: '🟥' };
async function viewThfGame(it, id, grp, hero, tvTr) {
  const m = await get(`${workerBase()}/thfmatch?id=${encodeURIComponent(id)}`, 8000).catch(() => null);
  if (!m || m.error) return hero + `<div class="empty">${it.state === 'pre' ? t('notStarted') : t('noStats')}</div>`;
  const sm = (s, k) => s?.[k] ?? '–';
  const sumRows = [[t('hb.half1'), 'ht1'], [t('hb.half2'), 'ht2'], [t('total'), 'final'], [t('hb.seven'), null], [t('hb.two'), 'two'], [t('hb.warn'), 'warn']];
  const cell = (s, k) => k ? sm(s, k) : s ? `${sm(s, 'sevenGoals')}/${sm(s, 'sevenGiven')}` : '–';
  const hasSum = m.home.sum && m.home.sum.final != null;
  const score = hasSum ? `<div class="card"><table class="lines"><thead><tr><th></th><th>${esc(m.home.name)}</th><th>${esc(m.away.name)}</th></tr></thead><tbody>${sumRows.map(([l, k]) => `<tr><td class="t">${esc(l)}</td><td>${esc(cell(m.home.sum, k))}</td><td>${esc(cell(m.away.sum, k))}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${it.state === 'pre' ? t('notStarted') : t('noStats')}</div>`;
  const evs = m.events.length ? `<div class="card">${m.events.map(e => `<div class="inforow"><span class="k">${esc(e.min)}</span><span class="ic">${HB_EV[e.type] || '•'}</span><span class="v">${e.pid ? `<a class="plink" href="#/player/handball/thf/${esc(e.pid)}">${esc(e.name || '')}</a>` : esc(e.name || '')}${e.type === 'Goal' || e.type === 'SevenMeterGoal' ? ` <small>${esc(e.h)}–${esc(e.a)}</small>` : ''} <small>${esc(e.side === 'home' ? m.home.name : m.away.name)}</small></span></div>`).reverse().join('')}</div>` : `<div class="empty">${t('noStats')}</div>`;
  const side = s => !s.players.length ? '' : `<div class="card"><h2>${esc(s.name)}</h2><table class="boxt"><thead><tr><th>#</th><th style="text-align:left">${t('pl.player')}</th><th>G</th><th>7m</th><th>2′</th><th>🟨</th></tr></thead><tbody>${s.players.map(p => `<tr><td>${esc(p.no)}</td><td class="t"><a href="#/player/handball/thf/${esc(p.id)}">${esc(p.name)}</a></td><td class="p">${p.goals || 0}</td><td>${p.sevenM || 0}</td><td>${p.two || 0}</td><td>${p.warn || 0}</td></tr>`).join('')}</tbody></table>${s.coaches.length ? `<div class="inforow"><span class="k">${t('hb.coach')}</span><span class="v">${esc(s.coaches.join(', '))}</span></div>` : ''}</div>`;
  const plHtml = side(m.home) + side(m.away) || `<div class="empty">${t('noStats')}</div>`;
  const rows = [['🏆', t('competition'), m.league || grp?.name], ['🔢', t('round'), it.round], ['📅', t('date'), new Date(it.time).toLocaleString(LOCALE(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) + ' (TSİ)'], ['🏟️', t('venue'), m.hall], ['📺', t('tvTr'), tvTr]].filter(r => r[2]);
  const infoHtml = `<div class="card">${rows.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>`;
  const T = [[t('score'), score], [t('events'), evs], [t('search.players'), plHtml], [t('info'), infoHtml + calBtn(`${it.home.name} – ${it.away.name}`, it.time, m.hall || grp?.name)], [t('c.chat'), chatHtml('m-handball-' + String(id).replace(/\W/g, ''))]];
  return hero + tabsHtml('match', T, it.state === 'pre', [3, 4]);
}
async function viewThfPlayer(id) {
  const p = await get(`${workerBase()}/thfplayer?id=${encodeURIComponent(id)}`, 600000).catch(() => null);
  if (!p || p.error) return `<div class="empty">${t('pl.noData')}</div>`;
  setTitle(p.name);
  const hero = `<div class="card hero plhero"><div class="plpic" style="--pc:${pcol(p.name)}"><span class="pin_">${esc(initials(p.name))}</span>${p.img ? `<img loading="lazy" src="${esc(p.img)}" alt="" onerror="this.remove()">` : ''}</div>
    <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(p.name)}</div><div class="st">${[p.no ? '#' + p.no : '', p.pos].filter(Boolean).map(esc).join(' · ')}</div>${p.team ? `<div class="plteam">${esc(p.team)}</div>` : ''}</div>`;
  const rows = [['🌍', t('pl.nation'), p.nationality], ['🎂', t('pl.born'), p.birth ? fmtD(p.birth, { day: 'numeric', month: 'long', year: 'numeric' }) : ''], ['📏', t('pl.height'), p.height ? p.height + ' cm' : ''], ['⚖️', t('pl.weight'), p.weight ? p.weight + ' kg' : '']].filter(r => r[2]);
  return hero + (rows.length ? `<div class="card">${rows.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>` : '');
}
// EuroLeague / EuroCup player: data and season averages from the official API, portrait from the server
async function viewEuPlayer(comp, code) {
  const season = euSeason(comp);
  const [sp, st] = await Promise.all([get(`${EUL}/competitions/${comp}/seasons/${season}/people/${encodeURIComponent(code)}`, 600000).catch(() => null), get(`${EUL}/competitions/${comp}/seasons/${season}/people/${encodeURIComponent(code)}/stats`, 300000).catch(() => null)]);
  const cur = sp?.data?.[0], person = cur?.person || await get(`${EUL}/people/${encodeURIComponent(code)}`, 3600000).catch(() => null);
  if (!person) return `<div class="empty">${t('pl.noData')}</div>`;
  const name = euName(person.alias || person.name); setTitle(name);
  const club = cur?.club?.name || '', pos = cur?.positionName || '';
  const src = cur?.images?.headshot || person.images?.headshot || '';
  const age = person.birthDate ? Math.floor((Date.now() - new Date(person.birthDate)) / 31557600000) : '';
  const hero = `<div class="card hero plhero"><div class="plpic" style="--pc:${pcol(name)}"><span class="pin_">${esc(initials(name))}</span>${phImg(src, name, 'basketball', club)}</div>
    <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(name)}</div><div class="st">${[cur?.dorsal ? '#' + cur.dorsal : '', pos].filter(Boolean).map(esc).join(' · ')}</div>${club ? `<div class="plteam">${esc(club)}</div>` : ''}</div>`;
  const info = [['🌍', t('pl.nation'), person.country?.name], ['🎂', t('pl.age'), age ? `${age} · ${fmtD(person.birthDate, { day: 'numeric', month: 'long', year: 'numeric' })}` : ''], ['📏', t('pl.height'), person.height ? person.height + ' cm' : ''], ['⚖️', t('pl.weight'), person.weight ? person.weight + ' kg' : '']].filter(r => r[2]);
  const av = st?.averagePerGame;
  const stat = (k, v) => v == null ? '' : `<div class="inforow"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`;
  const statsCard = av ? `<div class="card"><h2>${comp === 'E' ? 'EuroLeague' : 'EuroCup'} ${esc(season.slice(1))}–${String((+season.slice(1) + 1) % 100).padStart(2, '0')} · ${av.gamesPlayed} ${t('pl.games')}</h2>${stat('PTS', av.points)}${stat('REB', av.totalRebounds)}${stat('AST', av.assistances)}${stat('STL', av.steals)}${stat('BLK', av.blocksFavour)}${stat('MIN', mmss(av.timePlayed))}${stat('2P', av.twoPointShootingPercentage)}${stat('3P', av.threePointShootingPercentage)}${stat('FT', av.freeThrowShootingPercentage)}${stat('PIR', av.valuation)}</div>` : '';
  return hero + `<div class="card">${info.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>` + statsCard;
}
async function otherSportHtml(sport, day, extra = false) {
  const d = await capi('GET', `/sports/${sport}?date=${day}`);
  if (d.error) throw new Error(d.error);
  const cards = (d.groups || []).filter(g => groupOk(sport, g)).map(g => `<div class="card"><h2>${esc(g.name)}${g.src ? `<a href="#/ostand/${encodeURIComponent(g.src)}">📊 ${t('o.standings')}</a>` : ''}</h2>${g.items.map(it => otherRow(it, sport, day)).join('')}</div>`).join('');
  const limit = d.limit ? `<p class="note">⏳ ${t('c.limitNote')}</p>` : '';
  const note = limit + (d.needKey ? `<p class="note">📌 ${t(cards ? 'c.needKeyNote' : 'c.needKey')}</p>` : '');
  if (!cards && !note && /Free plans do not have access/i.test(d.errors?.[0] || '')) return extra ? '' : `<div class="empty">${t('apiWindow')}</div>`;
  if (!cards && !note && sport === 'baseball' && !extra) return `<div class="empty">${t('off.baseball')}</div>`;
  if (!cards) return note || (extra ? '' : d.errors?.length ? `<div class="empty">${t('loadFail')}<br><small>${esc(d.errors[0])}</small></div>` : `<div class="empty">${t('noMatchesDay')}</div>`);
  return cards + note;
}

// favourite team playing right now (or later today): a big score card on top of the match list
// "kick-off in 2:14:05" on the match-day card, ticking every second
const cdText = iso => { const ms = new Date(iso) - Date.now(); if (ms <= 0) return t('md.now'); const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return t('md.in') + ' ' + (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(x).padStart(2, '0'); };
setInterval(() => { for (const el of document.querySelectorAll('[data-cd]')) el.textContent = cdText(el.dataset.cd); }, 1000);
function liveHero(rows) {
  const live = rows.filter(([e]) => e.status?.type?.state === 'in');
  const soon = rows.filter(([e]) => e.status?.type?.state === 'pre' && new Date(e.date) - Date.now() < 20 * 3600e3 && new Date(e.date) > Date.now()).sort((x, y) => new Date(x[0].date) - new Date(y[0].date)).slice(0, 1);
  const pick = (live.length ? live : soon).slice(0, 3);
  if (!pick.length) return '';
  return pick.map(([ev, lg]) => {
    const comp = ev.competitions[0], [h, a] = sides(comp), s = status(ev.status || comp.status, lg), isLive = s.cls === 'live';
    const evs = (comp.details || []).filter(d => d.scoringPlay || d.redCard).slice(-1)[0];
    const lastEv = evs ? `${evs.redCard ? '🟥' : '⚽'} ${esc(evs.clock?.displayValue || '')} ${esc(evs.athletesInvolved?.[0]?.displayName || evs.athletesInvolved?.[0]?.shortName || '')}` : '';
    const side = c => `<div class="lhs">${img(c.team.id, 'big', lg)}<b>${esc(c.team.shortDisplayName || c.team.displayName)}</b></div>`;
    const hc = fxCol(h.team.color, '#2563eb'), ac = fxCol(a.team.color && a.team.color !== h.team.color ? a.team.color : a.team.alternateColor, '#e5484d');
    return `<a class="card livehero mday ${isLive ? 'on' : ''}" style="--hc:${hc};--ac:${ac}" href="#/match/${lg}/${ev.id}"><div class="lhtop">${isLive ? `<span class="lvpulse"></span> ${t('lh.live')}` : t('md.today')} · ${esc(lname(leagueOf(lg)) || ev.league?.name || '')}</div>
      <div class="lhrow">${side(h)}<div class="lhmid"><div class="lhsc">${isLive ? `${esc(scoreOf(h))} – ${esc(scoreOf(a))}` : esc(hm(ev.date))}</div><div class="lhmin">${isLive ? liveHtml(s) : `<span class="lhcd" data-cd="${esc(ev.date)}">${cdText(ev.date)}</span>`}</div></div>${side(a)}</div>
      ${lastEv ? `<div class="lhlast">${lastEv}</div>` : ''}</a>`;
  }).join('');
}
async function viewMatches(dateStr) {
  setTitle(t('nav.matches'));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = dateStr ? parseYmd(dateStr) : today;
  const key = ymd(d);
  let bar = `<div class="datebar" id="datebar"><label class="cal" title="${t('pickDate')}">📅<small>${t('calendar')}</small><input type="date" data-date-pick value="${isoDay(d)}"></label>`;
  // a week either side of the chosen day, plus a shortcut back to today
  const first = addDays(d, -7), last = addDays(d, 7);
  if (today < first || today > last) bar += `<a href="#/matches">${t('today')}<b>${today.getDate()}</b></a>`;
  for (let x = first; x <= last; x = addDays(x, 1)) {
    const diff = Math.round((x - today) / 864e5);
    const lbl = diff === 0 ? t('today') : diff === -1 ? t('yesterday') : diff === 1 ? t('tomorrow') : fmtD(x, { weekday: 'short' });
    const mon = x.getMonth() !== today.getMonth() || x.getFullYear() !== today.getFullYear() ? ' ' + fmtD(x, { month: 'short' }) : '';
    bar += `<a href="#/matches/${ymd(x)}" class="${ymd(x) === key ? 'on' : ''}">${lbl}<b>${x.getDate()}${mon ? `<i>${mon}</i>` : ''}</b></a>`;
  }
  bar += '</div>';
  if (key !== ymd(today)) bar += `<div class="daytitle">${fmtD(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>`;

  if (OTHER_SPORTS.includes(curSport)) return sportBar() + bar + await otherSportHtml(curSport, isoDay(d));

  // ESPN groups days by US time, so the previous US day can hold late European-time games
  const days = [ymd(addDays(d, -1)), key];
  const mine = enabled.filter(l => sportOf(l) === curSport && !isTff(l));
  const soccer = curSport === 'soccer';
  // football: one "all football" list per day (every league at once, refreshed each minute);
  // leagues ESPN can't place in that list, and the other sports, are fetched league by league
  const single = soccer ? mine.filter(l => !leagueOf(l).espn) : mine;
  const TFFL = ['tur.w.1', 'tur.2', 'tur.3', 'tur.4'];
  const [allDays, res, tvItems, ztk, ...tffRes] = await Promise.all([
    soccer ? Promise.allSettled(days.map(day => get(`${SITE}soccer/all/scoreboard?dates=${day}&limit=500`, 60000))) : [],
    Promise.allSettled(single.flatMap(l => days.map(day =>
      get(`${api(l)}/scoreboard?dates=${day}`).then(j => ({ l, events: j.events || [] }))))),
    // the Worker sources (TV guide, cup, TFF lower leagues) can take a few seconds when cold: the list does not wait for them
    soccer ? soon(tvList(isoDay(d)).catch(() => []), 1200, 'matches').then(v => v || []) : [],
    soccer && enabled.includes('tur.cup') && workerBase() ? soon(ztkData().catch(() => null), 1200, 'matches') : null,
    ...TFFL.map(l => soccer && enabled.includes(l) && workerBase() ? soon(kslData(true, 0, l).catch(() => null), 1200, 'matches') : null),
  ]);
  if (soccer) {
    const byEspn = Object.fromEntries(LEAGUES.filter(L => L.espn).map(L => [String(L.espn), L.id]));
    const grouped = {};
    for (const r of allDays) for (const ev of r.value?.events || []) {
      const l = byEspn[(ev.uid || '').match(/~l:(\d+)/)?.[1]];
      if (l && mine.includes(l)) (grouped[l] ||= []).push(ev);
    }
    // leagues with a game in progress: fetch their own small scoreboard every few seconds for fresh scores
    const live = Object.entries(grouped).filter(([, evs]) => evs.some(e => e.status?.type?.state === 'in')).map(([l]) => l);
    const fresh = await Promise.allSettled(live.flatMap(l => days.map(day => get(`${api(l)}/scoreboard?dates=${day}`).then(j => ({ l, events: j.events || [] })))));
    for (const f of fresh) if (f.status === 'fulfilled') {
      const ids = new Map(f.value.events.map(e => [e.id, e]));
      grouped[f.value.l] = grouped[f.value.l].map(e => ids.get(e.id) || e);
    }
    for (const [l, events] of Object.entries(grouped)) res.push({ status: 'fulfilled', value: { l, events } });
    if (allDays.every(r => r.status === 'rejected') && !res.some(r => r.status === 'fulfilled')) throw new Error(t('noConn'));
  }
  const tvOf = (ev, lg) => { const [h, a] = sides(ev.competitions[0]); return tvFor(tvItems, ev.date, h.team.displayName, a.team.displayName, lg); };
  const cupToday = (ztk?.rounds || []).flatMap(r => r.matches).filter(m => m.iso && ymd(new Date(m.iso)) === key);
  const tffDay = d => (d?.rounds || []).flatMap(r => r.matches).filter(m => m.iso && ymd(new Date(m.iso)) === key);
  const tffToday = { 'tur.cup': cupToday, ...Object.fromEntries(TFFL.map((l, i) => [l, tffDay(tffRes[i])])) };
  const byLeague = {}, seen = new Set(), favRows = [];
  for (const r of res) {
    if (r.status !== 'fulfilled') continue;
    for (const ev of r.value.events) {
      // a game that started yesterday and is still going stays on today's list (no vanishing at midnight)
      const carry = key === ymd(today) && ev.status?.type?.state === 'in' && ymd(new Date(ev.date)) !== key;
      if (seen.has(ev.id) || (ymd(new Date(ev.date)) !== key && !carry)) continue;
      seen.add(ev.id);
      (byLeague[r.value.l] ||= []).push(ev);
      if (ev.competitions[0].competitors.some(c => isFav(c.team.id, r.value.l))) favRows.push([ev, r.value.l]);
    }
  }
  if (!soccer && res.length && res.every(r => r.status === 'rejected')) throw new Error(t('noConn'));
  let html = sportBar() + liveHero(favRows) + bar;
  const byDate = (x, y) => new Date(x.date) - new Date(y.date);
  if (favRows.length) {
    favRows.sort((x, y) => byDate(x[0], y[0]));
    html += `<div class="card"><h2>${t('myFavs')}</h2>${favRows.map(([e, l]) => matchRow(e, l, false, tvOf(e, l))).join('')}</div>`;
  }
  const head = L => `<h2><a class="lglink" href="#/league/${L.id}">${lgIcon(L.id)}<span class="lgname">${esc(lname(L))}<small>${esc(regionName(L.id))}</small></span></a>${L.table ? `<a href="#/league/${L.id}/puan">${t('table')}</a>` : ''}</h2>`;
  for (const L of LEAGUES.filter(L => sportOf(L.id) === curSport)) {
    if (isTff(L.id)) {
      const td = tffToday[L.id] || [];
      if (td.length) html += `<div class="card">${head(L)}${td.sort((x, y) => x.iso.localeCompare(y.iso)).map(m => tffRow(m, L.id)).join('')}</div>`;
      continue;
    }
    const evs = byLeague[L.id];
    if (!evs) continue;
    evs.sort(byDate);
    html += `<div class="card">${head(L)}${evs.map(e => matchRow(e, L.id, false, tvOf(e, L.id))).join('')}</div>`;
  }
  const extra = curSport === 'basketball' ? await otherSportHtml('eubasket', isoDay(d), true).catch(() => '') : '';
  if (!seen.size && !Object.values(tffToday).some(x => x.length) && !extra.includes('class="card"')) html += emptyState('cal', t('noMatchesDay'), `<a class="btn" href="#/matches/${ymd(new Date(d.getTime() + 864e5))}">${t('es.nextDay')} ›</a><a class="btn ghost" href="#/settings/icerik">${t('pickLeagues')}</a>`);
  return html + extra;
}

// ---- Match page ----

// one discussion thread per match (the server also opens one when a followed match ends)
async function matchThreadCard(key, h, a) {
  let th = null;
  try { th = (await capi('GET', `/posts?ref=${encodeURIComponent('match:' + key)}`)).posts[0] || null; } catch { return ''; }
  if (th) return `<a class="card mthread" href="#/post/${th.id}"><span>💬 <b>${t('mt.open')}</b></span><span class="pcount">${th.replies} ${t('cat.repliesLbl')} ›</span></a>`;
  if (!acct) return '';
  return `<div class="card mthread"><span>💬 ${t('mt.none')}</span><button class="btn" data-mthread="${esc(key)}" data-h="${esc(h.team.displayName)}" data-a="${esc(a.team.displayName)}">${t('mt.create')}</button></div>`;
}
// minute-by-minute commentary (ESPN), newest first; key events when there is no commentary
function commentaryHtml(j) {
  const com = (j.commentary || []).filter(c => c.text);
  const list = com.length ? com.map(c => ({ m: c.time?.displayValue || '', tx: c.text, k: c.play?.type?.text || '' }))
    : (j.keyEvents || []).map(k => ({ m: k.clock?.displayValue || '', tx: k.text || k.shortText || k.type?.text || '', k: k.type?.text || '' })).filter(x => x.tx);
  if (!list.length) return '';
  const ic = k => /goal/i.test(k) ? '⚽' : /red/i.test(k) ? '🟥' : /yellow/i.test(k) ? '🟨' : /substitution/i.test(k) ? '🔁' : /var|review/i.test(k) ? '📺' : /penalty/i.test(k) ? '🎯' : /corner/i.test(k) ? '🚩' : /half|start|end|kickoff/i.test(k) ? '⏱️' : '•';
  return `<div class="card comcard">${[...list].reverse().map(x => `<div class="comrow ${/goal/i.test(x.k) ? 'goal' : ''}"><b>${esc(x.m)}</b><span class="cic">${ic(x.k)}</span><span>${esc(x.tx)}</span></div>`).join('')}</div><div class="hint" style="padding:0 14px 12px">${t('com.src')}</div>`;
}
// match highlights: ESPN's own clip when it has one, otherwise a YouTube search for the official summary
const hlUrl = (h, a, date, j) => j?.videos?.[0]?.links?.web?.href || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${h.team.displayName} ${a.team.displayName} ${LANG === 'tr' ? 'maç özeti' : 'highlights'} ${new Date(date).getFullYear()}`)}`;
// second screen: big score, latest events and the match chat side by side (landscape), refreshed every few seconds
async function viewLiveScreen(league, id) {
  const j = await get(`${api(league)}/summary?event=${id}`, 4000);
  if (league === 'all' && j.header?.league?.slug) league = j.header.league.slug;
  const comp = j.header.competitions[0], [h, a] = sides(comp), s = status(comp.status, league);
  setTitle(`${h.team.abbreviation || h.team.displayName} – ${a.team.abbreviation || a.team.displayName}`);
  const evs0 = (j.keyEvents || []).filter(k => /goal|card|substitution|penalty|var/i.test(k.type?.text || '')).slice(-6).reverse();
  const evTx = await trLines(evs0.map(k => k.shortText || k.text || ''));
  const evs = evs0.map((k, i) => ({ ...k, shortText: evTx[i] }));
  const ic = k => /goal/i.test(k) ? '⚽' : /red/i.test(k) ? '🟥' : /yellow/i.test(k) ? '🟨' : /substitution/i.test(k) ? '🔁' : '📺';
  const side = c => `<div class="ssteam">${img(c.team.id, 'big', league)}<b>${esc(c.team.shortDisplayName || c.team.displayName)}</b></div>`;
  return `<div class="ssgrid"><div class="ssleft"><div class="card ssscore">${side(h)}<div class="ssmid"><div class="sssc">${s.show ? `${esc(scoreOf(h))}–${esc(scoreOf(a))}` : esc(hm(comp.date))}</div><div class="ssst ${s.cls}">${s.cls === 'live' ? liveHtml(s) : esc(s.txt || dshort(comp.date))}</div></div>${side(a)}</div>
    <div class="card ssev">${evs.map(k => `<div class="comrow"><b>${esc(k.clock?.displayValue || '')}</b><span class="cic">${ic(k.type?.text || '')}</span><span>${esc(k.shortText || k.text || '')}</span></div>`).join('') || `<div class="empty">${t('ss.noEv')}</div>`}</div>
    <div class="ssbtns"><button class="btn ghost" data-ss-full>⛶ ${t('ss.full')}</button><a class="btn ghost" href="#/match/${esc(league)}/${esc(id)}">${t('ss.details')}</a></div></div>
    <div class="ssright">${chatHtml('m-soccer-' + id)}</div></div>`;
}
document.addEventListener('click', e => {
  if (!e.target.closest('[data-ss-full]')) return;
  const el = document.documentElement;
  (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {}))).catch?.(() => {});
});
// one chat room per club ("Tribün"): on the team page and on its own page from the favourites
const roomId = (league, id) => ('club-' + league + '-' + id).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 64);
async function viewRoom(league, id, rawName) {
  const name = decodeURIComponent(rawName || '') || t('th.team'); setTitle('💬 ' + name);
  return `<div class="card roomhead"><a href="#/team/${esc(league)}/${esc(id)}">${img(id, 'mid', league)}<b>${esc(name)}</b></a><span class="hint">${t('room.hint', esc(name))}</span></div>` + chatHtml(roomId(league, id));
}
// polls in forum topics: options when opening a topic (rank 'Kaptan' or admin), votes and results inside the topic
const pollFields = () => (isAdminUser() || (rankMap.get(acct?.user?.username) ?? 0) >= 3)
  ? `<details class="pollmk"><summary>📊 ${t('tp.add')}</summary>${[1, 2, 3, 4].map(i => `<input class="pollopt" maxlength="60" placeholder="${esc(t('tp.opt', i))}">`).join('')}<div class="hint">${t('tp.hint')}</div></details>` : '';
async function topicPollHtml(pid) {
  let d; try { d = await capi('GET', '/tpoll/' + pid); } catch { return ''; }
  const show = d.mine != null || d.total >= 3;
  return `<div class="card tpoll" data-tpoll="${pid}"><h2>📊 ${t('tp.title')} <small class="hint">· ${t('poll.n', d.total)}</small></h2>${d.options.map((o, i) => { const pc = d.total ? Math.round(d.counts[i] / d.total * 100) : 0;
    return `<button class="tpopt ${d.mine === i ? 'on' : ''}" data-tpvote="${pid}|${i}"><span>${esc(o)}</span>${show ? `<b>${pc}%</b><i style="width:${pc}%"></i>` : ''}</button>`; }).join('')}${acct ? '' : `<div class="hint" style="padding:0 14px 12px">${t('c.needLogin')}</div>`}</div>`;
}
document.addEventListener('click', async e => {
  const v = e.target.closest('[data-tpvote]'); if (!v) return;
  const [pid, opt] = v.dataset.tpvote.split('|');
  try { await capi('POST', '/tpoll/' + pid, { opt: +opt }); const h = await topicPollHtml(pid); v.closest('.tpoll').outerHTML = h; } catch (err) { alert(errText(err)); }
});
// ---------- games hub: prediction league, weekend fantasy, daily quiz
const gamesBar = active => `<div class="chips"><a data-replace href="#/leaderboard" class="${active === 'lb' ? 'on' : ''}">🎯 ${t('lb.tab')}</a><a data-replace href="#/fantasy" class="${active === 'fantasy' ? 'on' : ''}">⚽ ${t('fy.tab')}</a><a data-replace href="#/quiz" class="${active === 'quiz' ? 'on' : ''}">🧠 ${t('qz.tab')}</a></div>`;
async function viewGames() {
  setTitle(t('gm.tab'));
  const tile = (href, ic, k) => `<a class="card gametile" href="${href}"><span class="gic">${ic}</span><span><b>${t(k)}</b><small>${t(k + 'D')}</small></span><i>›</i></a>`;
  return communityNav('games') + tile('#/leaderboard', '🎯', 'gm.pred') + tile('#/fantasy', '⚽', 'gm.fy') + tile('#/quiz', '🧠', 'gm.qz');
}
// ---------- following: the feed of the members I follow
async function viewFeed() {
  setTitle(t('fd.tab'));
  if (!acct) return communityNav('feed') + authForm();
  let d; try { d = await capi('GET', '/feed'); } catch (e) { return communityNav('feed') + `<div class="empty">⚠️ ${esc(errText(e))}</div>`; }
  const row = x => {
    const who = `<b>${nameHtml(x)}</b>`, when = `<small class="hint">${ago(x.created)}</small>`;
    // rows are not links themselves (the name inside is one): a tap anywhere else opens the item
    if (x.k === 'post') return `<div class="feedrow postrow" data-href="#/post/${x.id}" data-user="${esc(x.username)}">📝 ${who} ${t('fd.post')}<div>${esc(x.tx)}</div>${when}</div>`;
    if (x.k === 'comment') return `<div class="feedrow postrow" data-href="#/post/${x.id}" data-user="${esc(x.username)}">💬 ${who} ${t('fd.comment', esc(x.title || ''))}<div>“${esc(String(x.tx).slice(0, 140))}”</div>${when}</div>`;
    const [lg, ev] = String(x.id).split(':');
    return `<div class="feedrow postrow" data-href="#/match/${esc(lg)}/${esc(ev)}" data-user="${esc(x.username)}">🎯 ${who} ${t('fd.pred')}<div>${esc(x.tx)}${x.settled === 1 ? ` · <b>+${x.pts}</b>` : ''}</div>${when}</div>`;
  };
  const fol = d.following.length ? `<div class="card"><h2>👥 ${t('fd.following', d.following.length)}</h2><div class="folrow">${d.following.map(u => `<a href="#/user/${encodeURIComponent(u.username)}">${avatar(u, 36)}<small>${esc(u.username)}</small></a>`).join('')}</div></div>` : '';
  return communityNav('feed') + fol + (d.items.length ? `<div class="card">${d.items.map(row).join('')}</div>` : `<div class="empty">${t(d.following.length ? 'fd.empty' : 'fd.none')}<br><br><a href="#/members" style="color:var(--accent)">${t('fd.find')} ›</a></div>`);
}
async function followBox(name) {
  const d = await capi('GET', '/follow/' + encodeURIComponent(name)).catch(() => null);
  if (!d) return '';
  const own = acct?.user?.username === name;
  return `<div class="card"><div class="statrow"><div><b>${d.followers}</b><small>${t('fl.followers')}</small></div><div><b>${d.following}</b><small>${t('fl.following')}</small></div></div>${acct && !own ? `<div class="form-block"><button class="btn ${d.iFollow ? 'ghost' : ''}" data-follow="${esc(name)}" data-on="${d.iFollow ? 0 : 1}">${d.iFollow ? '✓ ' + t('fl.unfollow') : '➕ ' + t('fl.follow')}</button></div>` : ''}</div>`;
}
document.addEventListener('click', async e => {
  const f = e.target.closest('[data-follow]'); if (!f) return;
  try { await capi('POST', '/follow', { username: f.dataset.follow, on: f.dataset.on === '1' }); const box = f.closest('.card'); box.outerHTML = await followBox(f.dataset.follow); } catch (err) { alert(errText(err)); }
});
// ---------- weekend fantasy
let fyPick = null;
async function viewFantasy(which) {
  setTitle(t('fy.tab'));
  let d; try { d = await capi('GET', '/fantasy' + (which === 'last' ? '/last' : '')); } catch (e) { return communityNav('fantasy') + `<div class="empty">⚠️ ${esc(errText(e))}</div>`; }
  const fmt = s => fmtD(s * 1000, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  if (fyPick === null || fyPick.week !== d.week) fyPick = { week: d.week, list: d.mine.map(p => ({ id: p.id, name: p.name, team: p.team })) };
  const state = d.finished ? t('fy.finished') : d.locked ? t('fy.live', fmt(d.end)) : t('fy.open', fmt(d.start));
  const mine = d.locked ? (d.mine.length ? d.mine.map(p => `<div class="fyrow"><b>${esc(p.name)}</b><small>${esc(p.team)}</small><span class="fygoals">${p.goals ? '⚽'.repeat(Math.min(p.goals, 5)) + ` +${p.goals * 5}` : '—'}</span></div>`).join('') : `<div class="empty" style="padding:14px">${t('fy.noTeam')}</div>`)
    : `${fyPick.list.map((p, i) => `<div class="fyrow"><b>${esc(p.name)}</b><small>${esc(p.team)}</small><button class="cbtn txt" data-fy-rm="${i}">✕</button></div>`).join('')}${acct ? (fyPick.list.length < 5 ? `<div class="form-block"><input id="fy-q" type="search" autocomplete="off" autocapitalize="off" placeholder="${esc(t('fy.search', 5 - fyPick.list.length))}"><div id="fy-res"></div></div>` : '') + `<div class="form-block"><button class="btn" data-fy-save ${fyPick.list.length ? '' : 'disabled'}>${t('fy.save')}</button><div class="hint" id="fy-msg"></div></div>` : `<div class="form-block"><div class="hint">${t('c.needLogin')}</div></div>`}`;
  const board = d.board.length ? `<div class="card"><h2>🏆 ${t('fy.board')}</h2>${d.board.map((r, i) => `<div class="lbrow"><span class="rk">${i + 1}</span>${avatar(r, 28)}<span class="nm">${nameHtml(r)}</span><b>${r.pts}</b></div>`).join('')}</div>` : '';
  const past = d.past.length ? `<div class="card"><h2>🥇 ${t('fy.past')}</h2>${d.past.map(p => `<div class="wkrow"><small>${esc(fmtD(p.week * 1000, { day: 'numeric', month: 'short' }))}</small><a href="#/user/${encodeURIComponent(p.username)}">🥇 ${esc(p.username)} <small>${p.pts}</small></a></div>`).join('')}</div>` : '';
  return communityNav('fantasy') + `<div class="card"><div class="form-block"><b>⚽ ${t('fy.title')}</b><div class="hint">${t('fy.rules')}</div><div class="wknext">⏳ ${state}</div><div class="chips" style="padding:0"><a data-replace href="#/fantasy" class="${which !== 'last' ? 'on' : ''}">${t('fy.thisWeek')}</a><a data-replace href="#/fantasy/last" class="${which === 'last' ? 'on' : ''}">${t('fy.lastWeek')}</a></div></div></div>
    <div class="card"><h2>👕 ${t('fy.myTeam')} (${(d.locked ? d.mine : fyPick.list).length}/5)</h2>${mine}</div>` + board + past;
}
document.addEventListener('input', e => {
  if (e.target.id !== 'fy-q') return;
  clearTimeout(window._fyq);
  window._fyq = setTimeout(async () => {
    const q = e.target.value.trim(), box = document.getElementById('fy-res'); if (!box) return;
    if (q.length < 3) { box.innerHTML = ''; return; }
    const j = await get(`${ESPN_Q}query=${encodeURIComponent(q)}&limit=10&type=player`, 120000).catch(() => null);
    const ps = ((j?.results || []).find(r => r.type === 'player')?.contents || []).filter(c => (c.sport || 'soccer') === 'soccer');
    box.innerHTML = ps.map(c => { const id = uidId(c.uid, 'a'); return id ? `<button class="lrow fyadd" data-fy-add="${esc(id)}" data-name="${esc(c.displayName)}" data-team="${esc(c.subtitle || '')}"><span class="nm" style="padding:8px 10px;text-align:left">${esc(c.displayName)}<small class="hint" style="display:block">${esc(c.subtitle || '')}</small></span><span class="go">＋</span></button>` : ''; }).join('') || `<div class="hint">${t('search.none')}</div>`;
  }, 350);
});
document.addEventListener('click', async e => {
  const ad = e.target.closest('[data-fy-add]'), rm = e.target.closest('[data-fy-rm]'), sv = e.target.closest('[data-fy-save]');
  if (!ad && !rm && !sv) return;
  if (ad && fyPick && fyPick.list.length < 5 && !fyPick.list.some(p => p.id === ad.dataset.fyAdd)) { fyPick.list.push({ id: ad.dataset.fyAdd, name: ad.dataset.name, team: ad.dataset.team }); render(true); return; }
  if (rm && fyPick) { fyPick.list.splice(+rm.dataset.fyRm, 1); render(true); return; }
  if (sv && fyPick) { const msg = document.getElementById('fy-msg'); try { await capi('POST', '/fantasy', { players: fyPick.list }); msg.textContent = '✅ ' + t('fy.saved'); } catch (err) { msg.textContent = '❌ ' + errText(err); } }
});
// ---------- daily quiz
let qzSel = {};
async function viewQuiz() {
  setTitle(t('qz.tab'));
  let d; try { d = await capi('GET', '/quiz'); } catch (e) { return communityNav('quiz') + `<div class="empty">⚠️ ${esc(e.code === 'quiz_unavailable' ? t('qz.wait') : errText(e))}</div>`; }
  if (qzSel.day !== d.day) qzSel = { day: d.day, a: {} };
  const qtext = q => t('qz.' + q.type, esc(q.subject));
  const done = d.mine;
  const qs = d.questions.map((q, i) => `<div class="card qzq"><h2>${i + 1}. ${qtext(q)}</h2><div class="qzopts">${q.options.map((o, k) => {
    const cls = done ? (k === done.answers[i] ? 'ok' : '') : qzSel.a[i] === k ? 'on' : '';
    return `<button class="qzopt ${cls}" ${done ? 'disabled' : ''} data-qz="${i}|${k}">${esc(o)}</button>`; }).join('')}</div></div>`).join('');
  const head = `<div class="card"><div class="form-block"><b>🧠 ${t('qz.title')}</b><div class="hint">${t('qz.rules')}</div>${done ? `<div class="wknext">✅ ${t('qz.score', done.score, d.questions.length)}</div>` : ''}</div></div>`;
  const send = done ? '' : acct ? `<div class="form-block"><button class="btn" data-qz-send>${t('qz.send')}</button><div class="hint" id="qz-msg"></div></div>` : `<div class="empty">${t('c.needLogin')}</div>`;
  const board = d.board.length ? `<div class="card"><h2>🏆 ${t('qz.board')}</h2>${d.board.map((r, i) => `<div class="lbrow"><span class="rk">${i + 1}</span><span class="nm"><a href="#/user/${encodeURIComponent(r.username)}">${esc(r.username)}</a></span><b>${r.score}/5</b></div>`).join('')}</div>` : '';
  return communityNav('quiz') + head + qs + send + board;
}
document.addEventListener('click', async e => {
  const o = e.target.closest('[data-qz]');
  if (o) { const [i, k] = o.dataset.qz.split('|').map(Number); qzSel.a[i] = k; o.parentElement.querySelectorAll('.qzopt').forEach(b => b.classList.toggle('on', b === o)); return; }
  if (!e.target.closest('[data-qz-send]')) return;
  const msg = document.getElementById('qz-msg'), n = document.querySelectorAll('.qzq').length;
  if (Object.keys(qzSel.a).length < n) { msg.textContent = t('qz.all'); return; }
  try { const r = await capi('POST', '/quiz', { answers: Array.from({ length: n }, (_, i) => qzSel.a[i]) }); render(true); } catch (err) { msg.textContent = '❌ ' + errText(err); }
});
// voice search (Web Speech API, works in Chrome on Android): "Beşiktaş", "Vlahovic", "Galatasaray sıradaki maç"
document.addEventListener('click', e => {
  const b = e.target.closest('[data-voice]'); if (!b) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, msg = document.getElementById('vs-msg');
  if (!SR) { msg.textContent = t('vs.noSupport'); return; }
  const r = new SR(); r.lang = LOCALE(); r.interimResults = false; r.maxAlternatives = 1;
  b.classList.add('on'); msg.textContent = '🎙️ ' + t('vs.listening');
  r.onresult = async ev => {
    let txt = ev.results[0][0].transcript.trim();
    const next = /(sıradaki|sonraki|ne zaman|next match|when)/i.test(txt);
    txt = txt.replace(/\b(sıradaki maç(ı)?|sonraki maç(ı)?|maçı ne zaman|ne zaman|next match|when do .* play)\b/gi, '').replace(/['’](n[ıiuü]n|[ıiuü]n|y[ıiuü])\b/gi, '').trim();
    const sq = document.getElementById('sq'); if (sq) { sq.value = txt; }
    msg.textContent = `“${ev.results[0][0].transcript}”`;
    await runSearch(txt);
    // "… sıradaki maç": open the first team found straight away
    if (next) { const a = document.querySelector('#sres a[href^="#/team/"]'); if (a) location.hash = a.getAttribute('href'); }
  };
  r.onerror = () => { msg.textContent = t('vs.noSupport'); };
  r.onend = () => b.classList.remove('on');
  try { r.start(); } catch { b.classList.remove('on'); }
});
// ---------- squads: the club's current list from Wikipedia, matched to ESPN's players (photos, profiles);
// ESPN-only names (players who left) are dropped, new signings ESPN does not know yet come from Wikipedia
const FIFA2 = { AFG:'AF',ALB:'AL',ALG:'DZ',AND:'AD',ANG:'AO',ARG:'AR',ARM:'AM',AUS:'AU',AUT:'AT',AZE:'AZ',BEL:'BE',BEN:'BJ',BIH:'BA',BLR:'BY',BOL:'BO',BRA:'BR',BUL:'BG',BFA:'BF',CAN:'CA',CHI:'CL',CHN:'CN',CIV:'CI',CMR:'CM',COD:'CD',COL:'CO',CPV:'CV',CRC:'CR',CRO:'HR',CUW:'CW',CYP:'CY',CZE:'CZ',DEN:'DK',ECU:'EC',EGY:'EG',ENG:'GB',EQG:'GQ',ESP:'ES',EST:'EE',FIN:'FI',FRA:'FR',GAB:'GA',GAM:'GM',GEO:'GE',GER:'DE',GHA:'GH',GRE:'GR',GUI:'GN',GNB:'GW',HAI:'HT',HON:'HN',HUN:'HU',IRL:'IE',IRN:'IR',IRQ:'IQ',ISL:'IS',ISR:'IL',ITA:'IT',JAM:'JM',JPN:'JP',KAZ:'KZ',KEN:'KE',KOR:'KR',KOS:'XK',KSA:'SA',LBY:'LY',LTU:'LT',LUX:'LU',LVA:'LV',MAR:'MA',MDA:'MD',MEX:'MX',MKD:'MK',MLI:'ML',MLT:'MT',MNE:'ME',MOZ:'MZ',NED:'NL',NGA:'NG',NIR:'GB',NOR:'NO',NZL:'NZ',PAN:'PA',PAR:'PY',PER:'PE',POL:'PL',POR:'PT',QAT:'QA',ROU:'RO',RSA:'ZA',RUS:'RU',SCO:'GB',SEN:'SN',SLE:'SL',SRB:'RS',SUI:'CH',SVK:'SK',SVN:'SI',SWE:'SE',SYR:'SY',TOG:'TG',TUN:'TN',TUR:'TR',UAE:'AE',UKR:'UA',URU:'UY',USA:'US',UZB:'UZ',VEN:'VE',WAL:'GB',ZAM:'ZM',ZIM:'ZW' };
const natName = c => { const iso = FIFA2[c]; if (c === 'ENG') return t('cc.eng'); try { return iso ? new Intl.DisplayNames([LOCALE()], { type: 'region' }).of(iso) : c; } catch { return c; } };
const normN = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ø/g, 'o').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
async function wikiSquadHtml(team, ath, league) {
  const d = await get(`${workerBase()}/api/squad?n=${encodeURIComponent(team)}`, 6 * 3600e3).catch(() => null);
  const wp = d?.players || [];
  if (wp.length < 12) return ''; // no usable list: keep ESPN's
  const used = new Set();
  const find = p => {
    const n = normN(p.name), parts = n.split(' '), last = parts[parts.length - 1];
    const cands = ath.filter(a => !used.has(a.id));
    return cands.find(a => normN(a.displayName) === n || normN(a.fullName) === n)
      || cands.find(a => { const an = normN(a.displayName).split(' '); return an[an.length - 1] === last && (an[0][0] === parts[0][0] || String(a.jersey) === p.no); })
      || cands.find(a => p.no && String(a.jersey) === p.no && normN(a.displayName).split(' ').some(w => w.length > 2 && n.includes(w)))
      || cands.find(a => parts.length === 1 && normN(a.displayName).split(' ').includes(n));
  };
  const list = wp.map(p => {
    const a = find(p); if (a) used.add(a.id);
    return a ? { ...a, jersey: p.no || a.jersey, position: { name: p.pos || a.position?.name }, citizenship: a.citizenship || natName(p.nat) }
      : { id: '', displayName: p.name, jersey: p.no, position: { name: p.pos }, citizenship: natName(p.nat), q: p.q, wiki: true };
  });
  const card = x => x.wiki
    ? `<div class="pcwrap"><a class="pcard p-${posKey(x)}" href="${x.q ? `#/legend/${x.q}` : `#/search/${encodeURIComponent(x.displayName)}`}"><div class="pph" style="--pc:${pcol(x.displayName)}"><span class="pin_">${esc(initials(x.displayName))}</span>${phImg('', x.displayName, 'soccer', team)}${x.jersey ? `<i class="pno">${esc(x.jersey)}</i>` : ''}</div><b class="pnm">${esc(x.displayName)}</b><small>${esc(x.citizenship || '')}</small><small class="newtag">${t('sq.new')}</small></a></div>`
    : playerCard(x, [x.age ? t('age', x.age) : '', x.citizenship || ''].filter(Boolean).join(' · '), 'soccer', league, team);
  const POS = [['Goalkeeper', 'pos.G'], ['Defender', 'pos.D'], ['Midfielder', 'pos.M'], ['Forward', 'pos.F']];
  const byNo = (x, y) => (+x.jersey || 99) - (+y.jersey || 99);
  let html = POS.map(([k, label]) => { const g = list.filter(x => x.position?.name === k).sort(byNo); return g.length ? `<div class="card"><h2>${t(label)} (${g.length})</h2>${pgrid(g.map(card))}</div>` : ''; }).join('');
  const other = list.filter(x => !POS.some(([k]) => k === x.position?.name));
  if (other.length) html += `<div class="card"><h2>${t('other')}</h2>${pgrid(other.map(card))}</div>`;
  const gone = ath.filter(a => !used.has(a.id)).length;
  return `<div class="sqhead"><b>${list.length}</b> ${t('sq.players')}</div>` + html
    + `<div class="hint" style="padding:6px 14px 14px">${t('sq.src', esc(d.updated || ''))}${gone ? ' ' + t('sq.gone', gone) : ''} <a href="${esc(d.source || '#')}" target="_blank" rel="noopener">Wikipedia ›</a></div>`;
}
// ---------- commentary in the app's language (ESPN writes English): translated on the server, cached per line
const trMem = new Map();
async function trLines(texts) {
  if (LANG === 'en' || !texts.length) return texts;
  const need = [...new Set(texts.filter(s => !trMem.has(LANG + '|' + s)))];
  if (need.length) {
    try { const r = await capi('POST', '/tr', { lang: LANG, texts: need }); need.forEach((s, i) => trMem.set(LANG + '|' + s, r.out?.[i] || s)); }
    catch { need.forEach(s => trMem.set(LANG + '|' + s, s)); }
  }
  return texts.map(s => trMem.get(LANG + '|' + s) || s);
}
async function commentaryTr(j) {
  const base = commentaryHtml(j); if (!base || LANG === 'en') return base;
  const com = (j.commentary || []).filter(c => c.text), key = (j.keyEvents || []).filter(k => k.text || k.shortText);
  const src = com.length ? com.map(c => c.text) : key.map(k => k.text || k.shortText || k.type?.text || '');
  const out = await trLines(src);
  const map = new Map(src.map((s, i) => [s, out[i]]));
  const jj = { ...j, commentary: com.map(c => ({ ...c, text: map.get(c.text) || c.text })), keyEvents: com.length ? j.keyEvents : key.map(k => ({ ...k, text: map.get(k.text || k.shortText || k.type?.text || '') || k.text })) };
  return commentaryHtml(jj).replace(t('com.src'), t('com.srcTr'));
}
async function viewMatch(league, id) {
  if (sportOf(league) !== 'soccer') return viewUsMatch(league, id);
  setTitle(lname(leagueOf(league)));
  const j = await get(`${api(league)}/summary?event=${id}`, 4000);
  // matches opened from "recent" lists come in as "all"; the summary names the real league
  if (league === 'all' && j.header?.league?.slug) league = j.header.league.slug;
  setTitle(LEAGUES.some(l => l.id === league) ? lname(leagueOf(league)) : (j.header?.league?.name || ''));
  const comp = j.header.competitions[0];
  const [h, a] = sides(comp);
  const s = status(comp.status);
  const rk = await leagueRanks(league).catch(() => new Map());
  const rankChip = c => { const r = rk.get(String(c.team.id)); return r ? `<a class="rkchip" href="#/league/${esc(league)}/puan">${t('o.rank', r.rank)}</a>` : ''; };
  const sideHtml = c => `<div class="side"><a href="#/team/${league}/${c.team.id}">${img(c.team.id, 'big', league)}<span>${esc(c.team.displayName)}</span></a>${rankChip(c)}${formHtml(c.form)}${favStar(c.team.id, c.team.displayName, league)}</div>`;
  const hc = fxCol(h.team.color, '#2563eb'), ac = fxCol(a.team.color && a.team.color !== h.team.color ? a.team.color : a.team.alternateColor, '#e5484d');
  let html = `<div class="card hero tchero ${s.cls === 'live' ? 'islive' : ''}" style="--hc:${hc};--ac:${ac}"><div class="row">${sideHtml(h)}
    <div class="mid"><div class="sc">${s.show ? `${esc(scoreOf(h))} - ${esc(scoreOf(a))}` : s.cls === 'ppd' ? '– : –' : esc(hm(comp.date))}</div>
    <div class="st ${s.cls}">${s.cls === 'pre' ? dshort(comp.date) : s.cls === 'live' ? `<span class="livetag">${t('live')}</span> ${liveHtml(s)}` : esc(s.txt)}</div><!--tv--></div>
    ${sideHtml(a)}</div><div class="heroact"><a class="cbtn txt" href="#/live/${esc(league)}/${esc(id)}">📺 ${t('ss.btn')}</a>${s.cls === 'post' ? `<a class="cbtn txt" href="${esc(hlUrl(h, a, comp.date, j))}" target="_blank" rel="noopener">🎬 ${t('hl.btn')}</a>` : ''}${s.cls === 'live' || s.cls === 'post' ? `<button class="cbtn txt" data-share-card="${esc(league)}|${esc(id)}">📤 ${t('sc.btn')}</button>` : ''}<!--chjump--></div></div>`;

  // events as a timeline: home on the left, away on the right, minute in the middle
  const homeId = h.team.id;
  const rawEvs = (j.keyEvents || []).length ? j.keyEvents
    : (comp.details || []).map(d => ({ type: d.type, team: d.team, clock: d.clock, participants: (d.athletesInvolved || []).map(a => ({ athlete: a })) }));
  const evs = rawEvs.filter(e => e.team && /Goal|Card|Substitution|Penalty/.test(e.type?.text || ''))
    .sort((x, y) => (x.clock?.value ?? 0) - (y.clock?.value ?? 0));
  const items = evs.map(e => {
    const ty = e.type.text, p = e.participants || [];
    const pk = a => a?.id ? `<a class="plink" href="#/player/soccer/${esc(league)}/${esc(a.id)}">${esc(a.displayName || '')}</a>` : esc(a?.displayName || '');
    const name = pk(p[0]?.athlete);
    const it = { side: e.team.id == homeId ? 'home' : 'away', min: e.clock?.displayValue || '', name, kind: 'other' };
    if (ty === 'Substitution') Object.assign(it, { kind: 'sub', out: pk(p[1]?.athlete) });
    else if (/Own Goal/.test(ty)) Object.assign(it, { kind: 'goal', note: t('ownGoal') });
    else if (/Penalty - Scored/.test(ty)) Object.assign(it, { kind: 'goal', note: t('penalty') });
    else if (/Penalty/.test(ty)) Object.assign(it, { kind: 'miss', note: t('missedPen') });
    else if (/Goal/.test(ty)) Object.assign(it, { kind: 'goal', note: p[1] ? `${t('assist')}: ${pk(p[1].athlete)}` : '' });
    else if (/Yellow/.test(ty)) it.kind = 'yellow';
    else if (/Red/.test(ty)) it.kind = 'red';
    return it;
  });
  const marks = {};
  for (const e of evs) {
    const ty = e.type.text, p = e.participants || [], a0 = p[0]?.athlete?.id, mk = id => (id ? (marks[id] ||= {}) : {});
    if (ty === 'Substitution') { mk(p[1]?.athlete?.id).out = e.clock?.displayValue || '1'; mk(a0).inn = 1; }
    else if (/Own Goal|Penalty - (Missed|Saved)/.test(ty) || /Penalty/.test(ty) && !/Scored/.test(ty)) continue;
    else if (/Goal/.test(ty)) mk(a0).g = (mk(a0).g || 0) + 1;
    else if (/Yellow/.test(ty)) mk(a0).y = (mk(a0).y || 0) + 1;
    else if (/Red/.test(ty)) mk(a0).r = 1;
  }
  const evHtml = items.length ? timelineHtml(items) : `<div class="empty">${s.cls === 'pre' ? t('notStarted') : t('noEvents')}</div>`;

  // stats
  const STATS = [['possessionPct', 'possession', '%'], ['totalShots', 'shots'], ['shotsOnTarget', 'onTarget'], ['wonCorners', 'corners'], ['foulsCommitted', 'fouls'],
    ['offsides', 'offsides'], ['yellowCards', 'yellow'], ['redCards', 'red'], ['saves', 'saves'], ['totalPasses', 'passes'], ['accuratePasses', 'accPasses']];
  const bt = j.boxscore?.teams || [];
  const statOf = (tid, n) => bt.find(x => x.team.id == tid)?.statistics?.find(x => x.name === n)?.displayValue;
  const stRows = STATS.map(([n, label, suf = '']) => {
    const hv = statOf(h.team.id, n), av = statOf(a.team.id, n);
    if (hv == null && av == null) return '';
    const hn = parseFloat(hv) || 0, an = parseFloat(av) || 0, tot = hn + an || 1;
    const lead = hn > an ? 'h' : an > hn ? 'a' : '';
    return `<div class="stat st2 ${lead ? 'lead-' + lead : ''}"><div class="l"><b>${esc(hv ?? '-')}${suf}</b><span>${t('stat.' + label)}</span><b>${esc(av ?? '-')}${suf}</b></div>
      <div class="bars2"><span class="h"><i style="width:${hn / tot * 100}%"></i></span><span class="a"><i style="width:${an / tot * 100}%"></i></span></div></div>`;
  }).join('');
  const momHtml = s.cls !== 'pre' && s.cls !== 'ppd' ? momentumHtml(j, h, a) : '';
  const stHtml = momHtml + (stRows && s.cls !== 'pre' ? `<div class="card stcard" style="--hc:${hc};--ac:${ac}">${stRows}</div>` : momHtml ? '' : `<div class="empty">${t('noStats')}</div>`);

  // lineups
  const rosters = (j.rosters || []).filter(r => r.roster?.length);
  const lineup = r => {
    const pl = x => `<a class="pl" href="#/player/soccer/${esc(league)}/${esc(x.athlete.id)}"><span class="no">${esc(x.jersey)}</span><span class="nm">${esc(x.athlete.displayName)}</span>
      ${x.subbedIn ? `<span class="arr up" title="${t('subIn')}">↑</span>` : ''}${x.subbedOut ? `<span class="arr down" title="${t('subOut')}">↓</span>` : ''}<span class="ps">${esc(x.position?.abbreviation || '')}</span></a>`;
    const starters = r.roster.filter(x => x.starter), subs = r.roster.filter(x => !x.starter);
    return `<div class="card"><h2>${img(r.team.id)} ${esc(r.team.displayName)}${r.formation ? ` · ${esc(r.formation)}` : ''}</h2><div style="padding:0 10px 12px">${pitchHtml(starters, r.formation, league, { marks, color: r.team.color, team: r.team.displayName })}</div></div>
      <div class="card"><h2>${t('subs')}</h2>${subs.map(pl).join('')}</div>`;
  };
  let luHtml = luSwitch(rosters.map(r => [r.team.displayName, lineup(r), img(r.team.id, '', league)]));
  // before kick-off ESPN often has no line-up yet: show each side's likely eleven (its last line-up) instead
  if (!luHtml && (s.cls === 'pre' || s.cls === 'ppd')) {
    luHtml = luSwitch((await Promise.all([h, a].map(async c => { const te = await teamEvents(c.team.id, league).catch(() => null); return [c.team.displayName, te ? await predictedXi(c.team.id, te.past, c.team.displayName).catch(() => '') : '', img(c.team.id, '', league)]; }))).filter(x => x[1]));
  }
  if (!luHtml) luHtml = `<div class="empty">${t('noLineups')}</div>`;

  // match info: everything ESPN knows about the venue, crowd, officials and TV
  const gi = j.gameInfo || {};
  const tvTr = tvFor(await tvList(trDay(comp.date)), comp.date, h.team.displayName, a.team.displayName, league);
  const tv = [...new Set([...(j.broadcasts || []), ...(comp.broadcasts || [])].map(b => b.media?.shortName || b.media?.name || b.names?.[0]).filter(Boolean))];
  const ref = (gi.officials || []).map(o => o.displayName || o.fullName).filter(Boolean);
  const infoRows = [
    ['📅', t('date'), new Date(comp.date).toLocaleString(LOCALE(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) + ' (TSİ)'],
    ['🏆', t('competition'), LEAGUES.some(l => l.id === league) ? lname(leagueOf(league)) : (j.header?.league?.name || '')],
    ['🏟️', t('venue'), [gi.venue?.fullName, gi.venue?.address?.city].filter(Boolean).join(', ')],
    ['👥', t('attendance'), gi.attendance ? Number(gi.attendance).toLocaleString(LOCALE()) : ''],
    ['🧑‍⚖️', t('referee'), ref.join(', ')],
    ['📺', t('tvTr'), tvTr],
    ['📺', t('broadcast'), tv.join(', ')],
  ].filter(r => r[2]);
  const infoHtml = `<div class="card">${infoRows.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>
    ${tvTr ? '' : `<p class="note">📺 ${workerBase() ? t('noTvInfo') : t('needWorker')}</p>`}`;
  if (tvTr) html = html.replace('<!--tv-->', `<div class="tvtag">📺 ${esc(tvTr)}</div>`);

  const k = 'match', mkey = `${league}:${id}`;
  const threadHtml = await matchThreadCard(mkey, h, a).catch(() => '');
  if (threadHtml) html = html.replace('<!--tv-->', '<!--tv-->') + threadHtml;
  const [mvHtml, prHtml] = await Promise.all([motmHtml(mkey, rosters, s).catch(() => ''), predictHtml(mkey, comp, s, h, a, probFrom(j)).catch(() => '')]);
  const T = { ev: [t('events'), evHtml], st: [t('stats'), stHtml], lu: [t('lineups'), luHtml], rc: [t('recent'), recentHtml(j, [h, a])], inf: [t('info'), infoHtml + calBtn(`${h.team.displayName} – ${a.team.displayName}`, comp.date, [gi.venue?.fullName, lname(leagueOf(league))].filter(Boolean).join(', '))],
    ch: [s.cls === 'live' ? '🔴 ' + t('c.chat') : t('c.chat'), (s.cls === 'live' ? `<div class="hint livechat">🔴 ${t('lc.live')}</div>` : '') + chatHtml('m-soccer-' + id, s.cls === 'post' && Date.now() - new Date(comp.date) > 4 * 3600e3 ? t('lc.closed') : '') + (s.cls === 'post' ? threadHtml : '')], mv: [t('mvp.tab'), mvHtml], pr: [t('pred.tab'), prHtml], ...(commentaryHtml(j) ? { com: ['🎙️ ' + t('com.tab'), lazy(commentaryTr(j))] } : {}), cmp: ['⚖️ ' + t('cmp.tab'), compareHtml(j, h, a, rk) + h2hListHtml(j, h, a) + lazy(refereeHtml(league, gi).catch(() => '')) + (s.cls === 'pre' ? lazy(suspHtml(league, h, a).catch(() => '')) : '')],
    ...(s.cls !== 'pre' && s.cls !== 'ppd' ? { rt: ['⭐ ' + t('rt.tab'), lazy(ratingsHtml(league, id, rosters, s))] } : {}) };
  if (s.cls === 'pre') T.inf[1] = lazy(pollHtml(league, id, h, a)) + T.inf[1];
  if (rk.size) T.tb = [t('o.standings'), await standingsHtml(league, undefined, [h.team.id, a.team.id]).catch(() => `<div class="empty">${t('noTable')}</div>`)];
  const order = (s.cls === 'pre' || s.cls === 'ppd' ? ['inf', 'cmp', 'lu', 'rc', 'pr', 'tb', 'ch', 'ev', 'st', 'mv'] : (s.cls === 'live' ? ['ev', 'ch', 'com', 'st', 'lu', 'rt', 'tb', 'cmp', 'rc', 'inf', 'mv', 'pr'] : ['ev', 'com', 'st', 'lu', 'rt', 'tb', 'cmp', 'rc', 'inf', 'ch', 'mv', 'pr'])).filter(x => T[x]);
  if (s.cls === 'live' && order.includes('ch')) html = html.replace('<!--chjump-->', `<button class="cbtn txt" data-segjump="${k}:${order.indexOf('ch')}">💬 ${t('lc.btn')}</button>`);
  html += seg(k, order.map(x => T[x][0])) + order.map((x, i) => pane(k, i, T[x][1])).join('');
  return html;
}

// two line-ups: one button per team, one pitch at a time (the choice survives the 5-second refresh)
let luSel = 0;
const luSwitch = items => items.length < 2 ? items.map(x => x[1]).join('') : `<div class="lusw">${items.map(([n, , lg], i) => `<button class="${i === luSel ? 'on' : ''}" data-lu="${i}">${lg || ''}<span>${esc(n)}</span></button>`).join('')}</div>`
  + items.map(([, h], i) => `<div class="luteam" data-luteam="${i}" ${i === luSel ? '' : 'hidden'}>${h}</div>`).join('');
// ---- NBA / NHL / NFL game page: score by period, team stats, top players, info ----
async function viewUsMatch(league, id) {
  setTitle(lname(leagueOf(league)));
  const j = await get(`${api(league)}/summary?event=${id}`, 4000);
  const comp = j.header.competitions[0];
  const [h, a] = sides(comp);
  const s = status(comp.status, league);
  const side = c => `<div class="side"><a href="#/team/${league}/${c.team.id}">${img(c.team.id, 'big', league)}<span>${esc(c.team.displayName)}</span></a>
    ${c.record?.[0]?.summary ? `<small class="rec">${esc(c.record[0].summary)}</small>` : ''}${favStar(c.team.id, c.team.displayName, league)}</div>`;
  const tvTr = tvFor(await tvList(trDay(comp.date)), comp.date, h.team.displayName, a.team.displayName, league);
  let html = `<div class="card hero"><div class="row">${side(h)}
    <div class="mid"><div class="sc">${s.show ? `${esc(scoreOf(h))} - ${esc(scoreOf(a))}` : s.cls === 'ppd' ? '– : –' : esc(hm(comp.date))}</div>
    <div class="st ${s.cls}">${s.cls === 'pre' ? dshort(comp.date) : s.cls === 'live' ? `<span class="livetag">${t('live')}</span> ${liveHtml(s)}` : esc(s.txt)}</div>${tvTr ? `<div class="tvtag">📺 ${esc(tvTr)}</div>` : ''}</div>
    ${side(a)}</div></div>`;

  // score by period (quarters / periods, then overtime)
  const ls = c => (c.linescores || []).map(x => x.displayValue ?? x.value ?? '');
  const n = Math.max(ls(h).length, ls(a).length), regular = sportOf(league) === 'hockey' ? 3 : 4;
  const head = Array.from({ length: n }, (_, k) => k < regular ? k + 1 : t('ot') + (k - regular > 0 ? k - regular + 1 : ''));
  const lineRow = c => `<tr><td class="t">${img(c.team.id, '', league)} ${esc(c.team.abbreviation || c.team.displayName)}</td>${Array.from({ length: n }, (_, k) => `<td>${esc(ls(c)[k] ?? '')}</td>`).join('')}<td class="p">${esc(scoreOf(c) ?? '')}</td></tr>`;
  const periodHtml = n ? `<div class="card"><table class="lines"><thead><tr><th></th>${head.map(x => `<th>${x}</th>`).join('')}<th>${t('total')}</th></tr></thead><tbody>${lineRow(h)}${lineRow(a)}</tbody></table></div>`
    : `<div class="empty">${t('notStarted')}</div>`;

  // team stats: ESPN's own labels, a bar wherever both values are numbers
  const bt = j.boxscore?.teams || [];
  const statsOf = tid => bt.find(x => x.team.id == tid)?.statistics || [];
  const hs = statsOf(h.team.id), as = statsOf(a.team.id);
  const stRows = hs.map(st => {
    const other = as.find(x => x.name === st.name);
    if (!other) return '';
    const hn = parseFloat(st.displayValue), an = parseFloat(other.displayValue);
    const bar = !isNaN(hn) && !isNaN(an) && !/-/.test(st.displayValue) && hn + an > 0
      ? `<div class="bars"><i class="h" style="width:${hn / (hn + an) * 100}%"></i><i class="a" style="width:${an / (hn + an) * 100}%"></i></div>` : '';
    return `<div class="stat"><div class="l"><b>${esc(st.displayValue)}</b><span>${esc(st.label || st.displayName || st.name)}</span><b>${esc(other.displayValue)}</b></div>${bar}</div>`;
  }).join('');
  const stHtml = stRows ? `<div class="card">${stRows}</div>` : `<div class="empty">${t('noStats')}</div>`;

  // leaders: best player per category for each team
  const ldHtml = (j.leaders || []).map(tl => `<div class="card"><h2>${img(tl.team?.id, '', league)} ${esc(tl.team?.displayName || '')}</h2>${(tl.leaders || []).map(cat => {
    const top = cat.leaders?.[0];
    return top ? `<div class="pl"><span class="nm"><b>${top.athlete?.id ? `<a class="plink" href="#/player/${esc(sportOf(league))}/${esc(league)}/${esc(top.athlete.id)}">${esc(top.athlete.displayName || '')}</a>` : esc(top.athlete?.displayName || '')}</b><small class="sub">${esc(cat.displayName || cat.name)}</small></span><span class="ps" style="color:var(--text);font-weight:700">${esc(top.displayValue)}</span></div>` : '';
  }).join('')}</div>`).join('') || `<div class="empty">${t('noStats')}</div>`;

  // players: full box score, every name opens the player profile
  const pls = (j.boxscore?.players || []).map(tp => `<div class="card"><h2>${img(tp.team?.id, '', league)} ${esc(tp.team?.displayName || '')}</h2>${(tp.statistics || []).map(g => {
    const labels = g.labels || g.names || [];
    const rows = (g.athletes || []).filter(x => x.athlete?.id && (x.stats || []).some(v => v !== '' && v !== '0' && v !== '--'));
    if (!rows.length) return '';
    return `<div style="overflow-x:auto"><table class="boxt"><thead><tr><th style="text-align:left">${esc(g.text || g.type || t('pl.player'))}</th>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>${rows.map(x => `<tr><td class="t"><a href="#/player/${esc(sportOf(league))}/${esc(league)}/${esc(x.athlete.id)}">${esc(x.athlete.shortName || x.athlete.displayName)}</a></td>${labels.map((_, k) => `<td>${esc(x.stats?.[k] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }).join('')}</div>`).join('');
  const plHtml = pls.replace(/<div class="card"><h2>[^<]*(<[^>]*>[^<]*)*<\/h2><\/div>/g, '') || `<div class="empty">${t('noStats')}</div>`;

  // info, officials included when ESPN has them (NBA does)
  const gi = j.gameInfo || {};
  const tv = [...new Set([...(j.broadcasts || []), ...(comp.broadcasts || [])].map(b => b.media?.shortName || b.media?.name || b.names?.[0]).filter(Boolean))];
  const info = [
    ['📅', t('date'), new Date(comp.date).toLocaleString(LOCALE(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ['🏆', t('competition'), lname(leagueOf(league))],
    ['🏟️', t('venue'), [gi.venue?.fullName, gi.venue?.address?.city, gi.venue?.address?.state].filter(Boolean).join(', ')],
    ['👥', t('attendance'), gi.attendance ? Number(gi.attendance).toLocaleString(LOCALE()) : ''],
    ['🧑‍⚖️', t('referees'), (gi.officials || []).map(o => o.displayName || o.fullName).filter(Boolean).join(', ')],
    ['📺', t('tvTr'), tvTr],
    ['📺', t('broadcast'), tv.join(', ')],
  ].filter(r => r[2]);
  const infoHtml = `<div class="card">${info.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>`;

  return html + tabsHtml('match', [[t('score'), periodHtml], [t('stats'), stHtml], [t('search.players'), plHtml], [t('leaders'), ldHtml], [t('info'), infoHtml + calBtn(`${h.team.displayName} – ${a.team.displayName}`, comp.date, gi.venue?.fullName)], [t('c.chat'), chatHtml(`m-${sportOf(league)}-${id}`)]], s.cls === 'pre' || s.cls === 'ppd', [4, 5]);
}

// ---- pre-match: earlier meetings with their scores, the referee's card record, players who will probably miss the game (sent off last time)
function h2hListHtml(j, h, a) {
  const seen = new Set(), list = [];
  for (const e of (j.headToHeadGames || []).flatMap(x => x.events || [])) {
    if (seen.has(e.id) || e.homeTeamScore == null) continue; seen.add(e.id);
    const hh = e.homeTeamId == h.team.id;
    list.push({ id: e.id, d: e.gameDate, lg: e.leagueAbbreviation || e.leagueName || '', hn: hh ? h : a, an: hh ? a : h, hs: e.homeTeamScore, as: e.awayTeamScore });
  }
  if (!list.length) return '';
  list.sort((x, y) => new Date(y.d) - new Date(x.d));
  const nm = c => esc(c.team.shortDisplayName || c.team.displayName);
  return `<div class="card"><h2>🤝 ${t('pm.h2h')}</h2>${list.slice(0, 8).map(x => {
    const w = +x.hs > +x.as ? 'h' : +x.hs < +x.as ? 'a' : '';
    return `<a class="h2hrow" href="#/match/all/${esc(x.id)}"><span class="rd">${dshort(x.d)}<small>${esc(x.lg)}</small></span><span class="h2ht ${w === 'h' ? 'win' : ''}">${nm(x.hn)}</span><b>${esc(x.hs)} – ${esc(x.as)}</b><span class="h2ht r ${w === 'a' ? 'win' : ''}">${nm(x.an)}</span></a>`;
  }).join('')}</div>`;
}
async function refereeHtml(league, gi) {
  const ref = (gi?.officials || []).find(o => /^referee$/i.test(o.position?.name || o.position?.displayName || '')) || gi?.officials?.[0];
  const name = ref?.displayName || ref?.fullName;
  if (!name) return '';
  let st = null;
  if (workerBase()) st = await get(`${workerBase()}/refstats?league=${encodeURIComponent(league)}&name=${encodeURIComponent(name)}`, 3600000).catch(() => null);
  const box = (v, l) => `<div class="refbox"><b>${v}</b><small>${l}</small></div>`;
  const nums = st?.games ? `<div class="refnums">${box(st.games, t('pm.games'))}${box(st.avgY, t('pm.avgY'))}${box(st.avgR, t('pm.avgR'))}</div>` : `<div class="hint" style="padding:0 14px 12px">${t('pm.refWait')}</div>`;
  return `<div class="card"><h2>🧑‍⚖️ ${t('referee')}: ${esc(name)}</h2>${nums}</div>`;
}
async function suspHtml(league, h, a) {
  const rows = await Promise.all([h, a].map(async c => {
    const te = await teamEvents(c.team.id, league).catch(() => null);
    const last = (te?.past || []).find(e => e.competitions?.[0]?.status?.type?.state === 'post' || e.status?.type?.state === 'post');
    if (!last) return null;
    const sm = await get(`${api('all')}/summary?event=${last.id}`, 3600000).catch(() => null);
    const reds = (sm?.keyEvents || []).filter(k => /Red Card/i.test(k.type?.text || '') && k.team?.id == c.team.id).map(k => k.participants?.[0]?.athlete?.displayName).filter(Boolean);
    return reds.length ? { c, reds } : null;
  }));
  const ok = rows.filter(Boolean);
  if (!ok.length) return '';
  return `<div class="card"><h2>⛔ ${t('pm.susp')}</h2>${ok.map(x => `<div class="form-block"><b>${esc(x.c.team.displayName)}</b>${x.reds.map(n => `<div class="hint">🟥 ${esc(n)}</div>`).join('')}</div>`).join('')}<div class="hint" style="padding:0 14px 12px">${t('pm.suspNote')}</div></div>`;
}

// ---- live pressure graph: who is attacking, from ESPN's minute-by-minute commentary (shots, corners, dangerous play), goals marked
function momentumHtml(j, h, a) {
  const com = (j.commentary || []).filter(c => c.text);
  if (com.length < 8) return '';
  const names = c => [c.team.displayName, c.team.shortDisplayName, c.team.abbreviation, c.team.name].filter(Boolean).map(x => x.toLowerCase());
  const hn = names(h), an = names(a);
  const minOf = s => { const m = String(s || '').match(/(\d+)'?(?:\s*\+\s*(\d+))?/); return m ? Math.min(+m[1] + (+m[2] || 0) * 0.2, 125) : null; };
  const W = tx => /^goal!/i.test(tx) ? 5 : /penalty/i.test(tx) ? 3 : /attempt saved|hits the (bar|post)/i.test(tx) ? 3 : /attempt (missed|blocked)/i.test(tx) ? 2 : /^corner/i.test(tx) ? 1.5 : /free kick in the attacking half|dangerous/i.test(tx) ? 0.7 : 0;
  const B = 3, buckets = {}; let maxM = 0;
  for (const c of com) {
    const m = minOf(c.time?.displayValue), tx = c.text || '', w = W(tx);
    if (m == null) continue; maxM = Math.max(maxM, m);
    if (!w) continue;
    const pt = (c.play?.team?.displayName || '').toLowerCase();
    const low = tx.toLowerCase();
    // the attacking side: ESPN's play team, else the team named in brackets / after "Corner,"
    let side = pt ? (hn.includes(pt) ? 1 : an.includes(pt) ? -1 : 0) : 0;
    if (!side) { const br = (low.match(/\(([^)]+)\)/) || [])[1] || (low.match(/^corner,\s*([^.]+)\./) || [])[1] || ''; side = hn.some(n => br.includes(n)) ? 1 : an.some(n => br.includes(n)) ? -1 : 0; }
    if (!side) continue;
    const b = Math.floor(m / B); buckets[b] = (buckets[b] || 0) + side * w;
  }
  const n = Math.max(Math.ceil(Math.max(maxM, 10) / B), 4);
  const raw = Array.from({ length: n }, (_, i) => buckets[i] || 0);
  const val = raw.map((_, i) => (raw[i - 1] || 0) * 0.25 + raw[i] * 0.5 + (raw[i + 1] || 0) * 0.25);
  const mx = Math.max(3, ...val.map(Math.abs));
  const Wd = 340, Hd = 120, mid = Hd / 2, x = i => (i + 0.5) / n * Wd, y = v => mid - v / mx * (mid - 10);
  const path = val.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `M${x(0).toFixed(1)},${mid}${val.map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}L${x(n - 1).toFixed(1)},${mid}Z`;
  const goals = (j.keyEvents || []).filter(k => /goal|penalty - scored/i.test(k.type?.text || '') && !/disallowed|missed|saved/i.test(k.type?.text || '')).map(k => ({ m: minOf(k.clock?.displayValue), home: k.team?.id == h.team.id }));
  const gx = m => Math.min(Wd - 6, Math.max(6, m / (n * B) * Wd));
  const hc = fxCol(h.team.color, '#2f7bf6'), ac = fxCol(a.team.color === h.team.color ? h.team.alternateColor : a.team.color, '#e5484d');
  const ht = 45 / (n * B) * Wd;
  return `<div class="card momcard"><h2>📈 ${t('mom.title')}</h2>
    <div class="momleg"><span><i style="background:${hc}"></i>${esc(h.team.shortDisplayName || h.team.displayName)}</span><span><i style="background:${ac}"></i>${esc(a.team.shortDisplayName || a.team.displayName)}</span></div>
    <svg viewBox="0 0 ${Wd} ${Hd}" class="momsvg" preserveAspectRatio="none">
      <defs><clipPath id="momU"><rect x="0" y="0" width="${Wd}" height="${mid}"/></clipPath><clipPath id="momD"><rect x="0" y="${mid}" width="${Wd}" height="${mid}"/></clipPath></defs>
      ${ht < Wd ? `<line x1="${ht}" x2="${ht}" y1="4" y2="${Hd - 4}" class="momht"/>` : ''}
      <path d="${area}" fill="${hc}" opacity=".55" clip-path="url(#momU)"/><path d="${area}" fill="${ac}" opacity=".55" clip-path="url(#momD)"/>
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/>
      <line x1="0" x2="${Wd}" y1="${mid}" y2="${mid}" class="momaxis"/>
      ${goals.filter(g => g.m != null).map(g => `<text x="${gx(g.m)}" y="${g.home ? 12 : Hd - 3}" text-anchor="middle" font-size="11">⚽</text>`).join('')}
    </svg>
    <div class="momaxisl"><span>0'</span><span>45'</span><span>${Math.round(n * B)}'</span></div>
    <div class="hint" style="padding:0 14px 12px">${t('mom.hint')}</div></div>`;
}

// ---- shareable score card: team colours, logos, score and scorers drawn on a canvas, sent with the phone's share sheet
const loadImgCors = src => new Promise(ok => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; setTimeout(() => ok(null), 6000); });
async function shareScoreCard(league, id, btn) {
  if (btn) btn.disabled = true;
  try {
    const j = await get(`${api(league)}/summary?event=${id}`, 4000);
    const comp = j.header.competitions[0], [h, a] = sides(comp), s = status(comp.status);
    const Wc = 1080, Hc = 1350, cv = document.createElement('canvas'); cv.width = Wc; cv.height = Hc;
    const x = cv.getContext('2d');
    const c1 = fxCol(h.team.color, '#0a8f3c'), c2 = fxCol(a.team.color === h.team.color ? a.team.alternateColor : a.team.color, '#1f3b8f');
    const g = x.createLinearGradient(0, 0, Wc, Hc); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, Wc, Hc);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, Wc, Hc);
    // soft pitch lines
    x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 6; x.beginPath(); x.arc(Wc / 2, Hc / 2 + 40, 230, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(0, Hc / 2 + 40); x.lineTo(Wc, Hc / 2 + 40); x.stroke();
    x.textAlign = 'center'; x.fillStyle = '#fff';
    const lg = LEAGUES.some(l => l.id === league) ? lname(leagueOf(league)) : (j.header?.league?.name || '');
    x.font = '600 38px system-ui, sans-serif'; x.globalAlpha = .85; x.fillText(lg.toUpperCase(), Wc / 2, 110); x.globalAlpha = 1;
    x.font = '800 44px system-ui, sans-serif'; x.fillText(s.cls === 'live' ? `🔴 ${t('live').toUpperCase()} ${s.txt || ''}` : s.cls === 'post' ? t('sc.full') : dshort(comp.date), Wc / 2, 175);
    const noLogo = btn?.dataset.retry === '1', none = Promise.resolve(null);
    const [lh, la, logo] = await Promise.all(noLogo ? [none, none, loadImgCors('logo-g.png')] : [loadImgCors(logoUrl(h.team.id, league).replace(/&w=\d+&h=\d+/, '&w=300&h=300')), loadImgCors(logoUrl(a.team.id, league).replace(/&w=\d+&h=\d+/, '&w=300&h=300')), loadImgCors('logo-g.png')]);
    const badge = (im, cx, c) => {
      x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(cx, 400, 150, 0, Math.PI * 2); x.fill();
      if (im) x.drawImage(im, cx - 105, 295, 210, 210);
      else { x.fillStyle = '#222'; x.font = '800 90px system-ui, sans-serif'; x.fillText(initials(c.team.displayName), cx, 432); }
    };
    badge(lh, 270, h); badge(la, Wc - 270, a);
    x.fillStyle = '#fff'; x.font = '700 46px system-ui, sans-serif';
    const fit = (txt, cx, yy, maxW) => { let f = 46; do { x.font = `700 ${f}px system-ui, sans-serif`; f -= 2; } while (x.measureText(txt).width > maxW && f > 24); x.fillText(txt, cx, yy); };
    fit(h.team.shortDisplayName || h.team.displayName, 270, 620, 420); fit(a.team.shortDisplayName || a.team.displayName, Wc - 270, 620, 420);
    x.font = '900 230px system-ui, sans-serif'; x.fillText(`${scoreOf(h) ?? 0} – ${scoreOf(a) ?? 0}`, Wc / 2, 900);
    // scorers under each side
    const goals = (j.keyEvents || []).filter(k => /goal|penalty - scored/i.test(k.type?.text || '') && !/disallowed|missed|saved/i.test(k.type?.text || ''));
    const col = (home, cx) => {
      const L = goals.filter(k => (k.team?.id == h.team.id) === home).map(k => `${k.participants?.[0]?.athlete?.displayName || ''} ${k.clock?.displayValue || ''}${/own/i.test(k.type?.text || '') ? ' (KK)' : /penalty/i.test(k.type?.text || '') ? ' (P)' : ''}`.trim());
      x.font = '500 36px system-ui, sans-serif'; x.globalAlpha = .92;
      L.slice(0, 6).forEach((l, i) => { let txt = '⚽ ' + l; while (x.measureText(txt).width > 470 && txt.length > 6) txt = txt.slice(0, -2); x.fillText(txt, cx, 1000 + i * 50); });
      x.globalAlpha = 1;
    };
    col(true, 270); col(false, Wc - 270);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, Hc - 120, Wc, 120);
    if (logo) x.drawImage(logo, Wc / 2 - 230, Hc - 95, 70, 70);
    x.fillStyle = '#fff'; x.font = '700 40px system-ui, sans-serif'; x.textAlign = 'left'; x.fillText('Grafondex Live Score', Wc / 2 - 145, Hc - 45);
    let blob = null;
    try { blob = await new Promise(ok => cv.toBlob(ok, 'image/png')); } catch {}
    if (!blob) { // a logo without CORS makes the canvas unreadable: draw again without logos
      if (btn && !noLogo) { btn.dataset.retry = '1'; try { return await shareScoreCard(league, id, btn); } finally { delete btn.dataset.retry; } }
      throw new Error('canvas');
    }
    const name = `${(h.team.abbreviation || 'H')}-${(a.team.abbreviation || 'A')}-${scoreOf(h)}-${scoreOf(a)}.png`.replace(/[^A-Za-z0-9.-]/g, '');
    const file = new File([blob], name, { type: 'image/png' });
    const text = `${h.team.displayName} ${scoreOf(h)}–${scoreOf(a)} ${a.team.displayName} · Grafondex Live Score`;
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text }).catch(() => {});
    else { const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  } finally { if (btn) btn.disabled = false; }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-share-card]'); if (b) { const [lg, id] = b.dataset.shareCard.split('|'); shareScoreCard(lg, id, b).catch(() => {}); return; }
  const sj = e.target.closest('[data-segjump]'); if (sj) { const [k, i] = sj.dataset.segjump.split(':'); document.querySelector(`.seg[data-segkey="${k}"] [data-seg="${i}"]`)?.click(); document.querySelector(`.seg[data-segkey="${k}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});

// last five games of both teams + earlier meetings, from the match summary
// pre-match comparison: table place, form of the last five, goals for / against, clean sheets, head to head, absentees
function compareHtml(j, h, a, rk) {
  const stats = side => {
    const lf = (j.lastFiveGames || []).find(x => x.team?.id == side.team.id), evs = lf?.events || [];
    let gf = 0, ga = 0, pts = 0, cs = 0, w = 0;
    for (const e of evs) {
      const home = e.homeTeamId == side.team.id, f = +(home ? e.homeTeamScore : e.awayTeamScore) || 0, g = +(home ? e.awayTeamScore : e.homeTeamScore) || 0;
      gf += f; ga += g; if (!g) cs++; if (f > g) { pts += 3; w++; } else if (f === g) pts += 1;
    }
    const n = evs.length || 0, r = rk?.get(String(side.team.id));
    return { n, gf, ga, pts, cs, w, avgF: n ? gf / n : 0, avgA: n ? ga / n : 0, rank: r?.rank || 0, lpts: r?.pts ?? null, form: [...evs].sort((x, y) => new Date(x.gameDate) - new Date(y.gameDate)).map(e => e.gameResult).filter(Boolean) };
  };
  const A = stats(h), B = stats(a);
  if (!A.n && !B.n && !A.rank && !B.rank) return `<div class="empty">${t('noInfo')}</div>`;
  // head to head (this season's meetings and ESPN's head-to-head list when it has one)
  const h2h = [...(j.seasonseries || []).flatMap(s => s.events || []), ...((j.headToHeadGames || []).flatMap(x => x.events || []))];
  let hw = 0, aw = 0, dr = 0; const seenH = new Set();
  for (const e of h2h) {
    if (seenH.has(e.id)) continue; seenH.add(e.id);
    const cs = e.competitors || [];
    let sh, sa;
    if (cs.length) { const x = cs.find(c => c.team?.id == h.team.id), y = cs.find(c => c.team?.id == a.team.id); sh = +x?.score; sa = +y?.score; }
    else { const hh = e.homeTeamId == h.team.id; sh = +(hh ? e.homeTeamScore : e.awayTeamScore); sa = +(hh ? e.awayTeamScore : e.homeTeamScore); }
    if (!Number.isFinite(sh) || !Number.isFinite(sa) || (e.status && e.status?.type?.state === 'pre')) continue;
    if (sh > sa) hw++; else if (sh < sa) aw++; else dr++;
  }
  const row = (label, x, y, fmt = v => v, better = 'high') => {
    const tot = x + y, px = !tot ? 50 : Math.round((better === 'high' ? x : y) / tot * 100), good = better === 'high' ? x > y ? 'l' : y > x ? 'r' : '' : x < y ? 'l' : y < x ? 'r' : '';
    return `<div class="cmprow"><b class="${good === 'l' ? 'win' : ''}">${fmt(x)}</b><div class="cmpmid"><span>${label}</span><div class="cmpbar"><i style="width:${px}%"></i><i style="width:${100 - px}%"></i></div></div><b class="${good === 'r' ? 'win' : ''}">${fmt(y)}</b></div>`;
  };
  const f1 = v => v.toFixed(1);
  const head = `<div class="cmphead"><div>${img(h.team.id, 'big', '')}<b>${esc(h.team.shortDisplayName || h.team.displayName)}</b>${formHtml(A.form.join(''))}</div><span>VS</span><div>${img(a.team.id, 'big', '')}<b>${esc(a.team.shortDisplayName || a.team.displayName)}</b>${formHtml(B.form.join(''))}</div></div>`;
  let rows = '';
  if (A.rank && B.rank) rows += row(t('cmp.rank'), A.rank, B.rank, v => v + '.', 'low');
  if (A.lpts != null && B.lpts != null) rows += row(t('th.Pts'), A.lpts, B.lpts);
  if (A.n && B.n) rows += row(t('cmp.form'), A.pts, B.pts, v => `${v}/15`) + row(t('cmp.wins'), A.w, B.w) + row(t('cmp.gf'), A.avgF, B.avgF, f1) + row(t('cmp.ga'), A.avgA, B.avgA, f1, 'low') + row(t('cmp.cs'), A.cs, B.cs);
  if (hw + aw + dr) rows += row(t('cmp.h2h'), hw, aw) + `<div class="hint" style="text-align:center;padding:0 0 8px">${t('cmp.draws', dr)}</div>`;
  // absentees, when ESPN lists them
  const inj = (j.injuries || []).map(x => ({ team: x.team, list: (x.injuries || []).map(i => `${i.athlete?.displayName || ''}${i.status ? ' · ' + i.status : ''}`).filter(Boolean) })).filter(x => x.list.length);
  const injHtml = inj.length ? `<div class="card"><h2>🚑 ${t('cmp.out')}</h2>${inj.map(x => `<div class="form-block"><b>${esc(x.team?.displayName || '')}</b>${x.list.map(s => `<div class="hint">• ${esc(s)}</div>`).join('')}</div>`).join('')}</div>` : '';
  return `<div class="card cmpcard">${head}<div class="cmprows">${rows}</div><div class="hint" style="padding:0 14px 12px">${t('cmp.note')}</div></div>` + injHtml;
}
function recentHtml(j, sidesArr) {
  const blocks = sidesArr.map(side => {
    const lf = (j.lastFiveGames || []).find(x => x.team?.id == side.team.id);
    const evs = [...(lf?.events || [])].sort((x, y) => new Date(y.gameDate) - new Date(x.gameDate));
    if (!evs.length) return '';
    const badges = `<div class="form">${[...evs].reverse().map(e => `<i class="${e.gameResult || ''}">${e.gameResult ? t('res.' + e.gameResult) : '-'}</i>`).join('')}</div>`;
    const rows = evs.map(e => {
      const home = e.homeTeamId == side.team.id;
      const us = esc(side.team.displayName), them = esc(e.opponent?.displayName || '');
      return `<a class="rrow" href="#/match/all/${e.id}">
        <div class="rd">${dshort(e.gameDate)}<small>${esc(e.leagueAbbreviation || e.leagueName || '')}</small></div>
        <div class="rt"><span class="${home ? 'me' : ''}">${home ? us : them}</span><span class="${home ? '' : 'me'}">${home ? them : us}</span></div>
        <div class="rs"><b>${esc(e.homeTeamScore)}</b><b>${esc(e.awayTeamScore)}</b></div>
        <i class="res ${e.gameResult || ''}">${e.gameResult ? t('res.' + e.gameResult) : '-'}</i></a>`;
    }).join('');
    return `<div class="card"><h2>${img(side.team.id)} <span style="color:var(--text);font-size:14px">${esc(side.team.displayName)}</span><span style="margin-left:auto">${badges}</span></h2>${rows}</div>`;
  }).join('');
  const h2h = (j.seasonseries || []).flatMap(s => s.events || []);
  const h2hHtml = h2h.length ? `<div class="card"><h2>${t('h2h')}</h2>${h2h.map(e => {
    const cs = e.competitors || [];
    const hh = cs.find(c => c.homeAway === 'home') || cs[0], aa = cs.find(c => c.homeAway === 'away') || cs[1];
    return hh && aa ? `<div class="rrow"><div class="rd">${dshort(e.date)}</div><div class="rt"><span>${esc(hh.team.displayName)}</span><span>${esc(aa.team.displayName)}</span></div><div class="rs"><b>${esc(hh.score ?? '')}</b><b>${esc(aa.score ?? '')}</b></div></div>` : '';
  }).join('')}</div>` : '';
  return (blocks + h2hHtml) || `<div class="empty">${t('noRecent')}</div>`;
}

// ---- seasons (football seasons are named by the year they start: 2025 = 2025/26) ----
const curSeasonYear = () => { const d = new Date(); return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; };
const seasonLabel = y => `${y}/${String(y + 1).slice(2)}`;
const seasonSelect = (attr, sel) => `<select class="picker seasonpick" ${attr}>${Array.from({ length: 10 }, (_, k) => curSeasonYear() - k)
  .map(y => `<option value="${y}" ${y == sel ? 'selected' : ''}>${y === curSeasonYear() ? t('curSeason') + ' · ' : ''}${seasonLabel(y)}</option>`).join('')}</select>`;
const leagueSeason = {};
const selSeason = l => leagueSeason[l] ?? curSeasonYear();
// the league's own roster endpoint is missing for some clubs (e.g. teams seen in European cups): try the all-competitions one too
async function rosterOf(league, id) {
  for (const u of [`${api(league)}/teams/${id}/roster`, `${ESPN}all/teams/${id}/roster`]) {
    const r = await get(u, 300000).catch(() => null);
    if (r?.athletes?.length) return r;
  }
  return null;
}

// ---- Team page ----
// "all" covers every competition (league, European cups, friendlies)
async function teamEvents(id, league, season) {
  const soccer = sportOf(league) === 'soccer';
  if (soccer && season && season !== curSeasonYear()) {
    const r = await get(`${ESPN}all/teams/${id}/schedule?season=${season}`, 300000).catch(() => null);
    const all = [...new Map((r?.events || []).map(e => [e.id, e])).values()];
    return { past: all.sort((x, y) => new Date(y.date) - new Date(x.date)), live: [], next: [] };
  }
  // US schedules already hold the whole season (played and upcoming) in one list
  const [r1, r2] = await Promise.allSettled(soccer ? [
    get(`${ESPN}all/teams/${id}/schedule`, 60000),
    get(`${ESPN}all/teams/${id}/schedule?fixture=true`, 60000),
  ] : [get(`${api(league)}/teams/${id}/schedule`, 60000)]);
  const ev = [...(r1.value?.events || []), ...(r2?.value?.events || [])];
  const uniq = [...new Map(ev.map(e => [e.id, e])).values()];
  const st = e => (e.competitions[0].status || e.status)?.type?.state;
  const past = uniq.filter(e => st(e) === 'post').sort((x, y) => new Date(y.date) - new Date(x.date));
  const live = uniq.filter(e => st(e) === 'in');
  const next = uniq.filter(e => st(e) === 'pre').sort((x, y) => new Date(x.date) - new Date(y.date));
  return { past, live, next };
}
const leagueOfEvent = (e, fallback) => e.league?.slug || e.competitions?.[0]?.league?.slug || fallback;


const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const posKey = x => { const p = (x.position?.abbreviation || x.position?.name || '')[0]; return ['G', 'D', 'M', 'F'].includes(p) ? p : 'O'; };

// player photos: ESPN headshot first, then a Wikipedia portrait found by name (only when the page is about an athlete of that sport), else a coloured avatar
const wikiMem = new Map(Object.entries(store.get('wiki', {})));
const WIKI_Q = { soccer: 'footballer', basketball: 'basketball player', tennis: 'tennis player', hockey: 'ice hockey player', football: 'American football player', baseball: 'baseball player', racing: 'racing driver', volleyball: 'volleyball player', handball: 'handball player' };
const WIKI_RE = { soccer: /footballer|soccer/i, basketball: /basketball/i, tennis: /tennis/i, hockey: /hockey/i, football: /american football|gridiron/i, baseball: /baseball/i, racing: /racing|driver/i, volleyball: /volleyball/i, handball: /handball/i };
async function wikiPhoto(name, sport) {
  const k = sport + '|' + name; if (wikiMem.has(k)) return wikiMem.get(k);
  let url = '';
  try {
    const q = encodeURIComponent(`${name} ${WIKI_Q[sport] || 'athlete'}`);
    const j = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrlimit=4&prop=pageimages%7Cdescription&piprop=thumbnail&pithumbsize=300&format=json&origin=*`).then(r => r.json());
    const want = nameToks(name), re = WIKI_RE[sport] || /./;
    const p = Object.values(j.query?.pages || {}).sort((x, y) => x.index - y.index).find(p => p.thumbnail && re.test(p.description || '') && want.length && want.every(w => normName(String(p.title).replace(/\(.*\)/, '')).includes(w)));
    url = p?.thumbnail.source || '';
  } catch {}
  wikiMem.set(k, url);
  try { const o = Object.fromEntries([...wikiMem].slice(-300)); store.set('wiki', o); } catch {}
  return url;
}
// portrait the server finds (TheSportsDB / Wikidata) for players ESPN has no headshot for
async function workerPhoto(name, sport, team) {
  const k = 'w2|' + sport + '|' + name; // w2: server now also checks Transfermarkt, old misses are void if (wikiMem.has(k)) return wikiMem.get(k);
  let u = '';
  try { u = (await get(`${workerBase()}/api/photo?n=${encodeURIComponent(name)}&sp=${encodeURIComponent(sport)}&t=${encodeURIComponent(team || '')}`, 86400000)).url || ''; } catch {}
  wikiMem.set(k, u);
  try { store.set('wiki', Object.fromEntries([...wikiMem].slice(-400))); } catch {}
  return u;
}
// ESPN headshot failed -> server portrait -> Wikipedia portrait -> coloured initials
function photoFb(img) {
  if (img.dataset.ok) return;
  const st = +img.dataset.st || 0; img.dataset.st = st + 1;
  const n = img.dataset.n, sp = img.dataset.sp || 'soccer';
  const steps = [() => workerPhoto(n, sp, img.dataset.tm)]; // portraits only: Wikipedia pictures are often match photos in another club's kit
  if (n && steps[st]) steps[st]().then(u => { if (u && u !== img.src) img.src = u; else photoFb(img); }); else img.remove();
}
window.photoFb = photoFb;
const pcol = n => `hsl(${[...String(n)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7)} 42% 40%)`;
const phImg = (src, name, sport, team = '') => `<img loading="lazy" src="${esc(src)}" alt="" data-n="${esc(name || '')}" data-sp="${esc(sport || 'soccer')}" data-tm="${esc(team)}" onerror="photoFb(this)" onload="phLoad(this)">`;
// ESPN answers some missing headshots with a tiny/blank picture instead of an error: treat that as missing too
window.phLoad = img => { if (img.naturalWidth < 40 || img.naturalHeight < 40) photoFb(img); else img.dataset.ok = '1'; };
// and a headshot that never answers (slow CDN, blocked host) falls back after a few seconds
function photoWatch() { setTimeout(() => document.querySelectorAll('img[data-n]:not([data-ok]):not([data-st])').forEach(im => { const r = im.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && (!im.complete || !im.naturalWidth)) photoFb(im); }), 4500); }
// feet/inches and pounds to metric outside English
const unitH = s => { if (LANG === 'en' || !s) return s; const m = /(\d+)'\s*(\d+)?/.exec(s); return m ? `${Math.round((+m[1] * 12 + +(m[2] || 0)) * 2.54)} cm` : s; };
const unitW = s => { if (LANG === 'en' || !s) return s; const m = /(\d+)\s*lbs?/i.exec(s); return m ? `${Math.round(+m[1] * .4536)} kg` : s; };
const hsUrl = (sport, league, id) => `https://a.espncdn.com/i/headshots/${sport === 'soccer' ? 'soccer' : ['basketball', 'hockey', 'football', 'baseball'].includes(sport) ? league : sport}/players/full/${id}.png`;
const pfavBtn = (p, cls = 'pstar') => `<button class="${cls} ${isPFav(p.id, p.sport) ? 'on' : ''}" data-pfav="${esc(p.id)}" data-name="${esc(p.name)}" data-psport="${esc(p.sport)}" data-league="${esc(p.league)}" data-team="${esc(p.team || '')}" aria-label="${t('pl.favs')}">${isPFav(p.id, p.sport) ? '★' : '☆'}</button>`;
function playerCard(x, sub, sport = 'soccer', league = 'all', team = '') {
  const src = x.headshot?.href || (sport === 'soccer' && x.id ? hsUrl('soccer', league, x.id) : '');
  const pic = src ? phImg(src, x.displayName, sport, team) : '';
  const card = `<a class="pcard p-${posKey(x)}" href="#/player/${esc(sport)}/${esc(league)}/${esc(x.id)}"><div class="pph" style="--pc:${pcol(x.displayName)}"><span class="pin_">${esc(initials(x.displayName))}</span>${pic}${x.jersey ? `<i class="pno">${esc(x.jersey)}</i>` : ''}</div>
    <b class="pnm">${esc(x.displayName)}</b><small>${esc(sub)}</small>${sport === 'soccer' && team ? `<small class="mval" data-mv="${esc(x.displayName)}" data-mt="${esc(team)}"></small>` : ''}</a>`;
  return `<div class="pcwrap">${card}${pfavBtn({ id: x.id, name: x.displayName, sport, league, team })}</div>`;
}
const pgrid = list => `<div class="pgrid">${list.join('')}</div>`;


// ---- pitch view: starters placed by position and formation, with faces and shirt numbers ----
const POS_DEPTH = { G: 0, GK: 0, SW: 1, CD: 1, 'CD-R': 1, 'CD-L': 1, RB: 1, LB: 1, RWB: 1.5, LWB: 1.5, DM: 2, CM: 3, 'CM-R': 3, 'CM-L': 3, RM: 3, LM: 3, AM: 4, 'AM-R': 4, 'AM-L': 4, RW: 4.5, LW: 4.5, SS: 4.6, F: 5, CF: 5, 'CF-R': 5, 'CF-L': 5 };
const posDepth = p => { const k = String(p || '').toUpperCase(); if (k in POS_DEPTH) return POS_DEPTH[k]; if (/^G/.test(k)) return 0; if (/DM/.test(k)) return 2; if (/B|D/.test(k)) return 1; if (/AM|W/.test(k)) return 4.4; if (/M/.test(k)) return 3; return 5; };
const posSide = p => { const k = String(p || '').toUpperCase(); const wide = /^[LR](B|WB|M|W)$/.test(k); if (/^L/.test(k) && wide) return -2; if (/^R/.test(k) && wide) return 2; if (/-L$/.test(k) || /^LF$/.test(k)) return -1; if (/-R$/.test(k) || /^RF$/.test(k)) return 1; return 0; };
// number badge colour from the team colour (white or very light colours would hide the white digits)
const tcOf = c => { const h = String(c || '').replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(h)) return ''; const n = parseInt(h, 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; return l > 0.72 ? '' : '#' + h; };
function pitchHtml(starters, formation, league, opt = {}) {
  const pl = starters.map((x, i) => ({ x, i, d: posDepth(x.position?.abbreviation), side: posSide(x.position?.abbreviation) }));
  // by line first, then centre before wide (so a double pivot is not mixed up with the wingers), then ESPN's own place number
  pl.sort((a, b) => a.d - b.d || Math.abs(a.side) - Math.abs(b.side) || (+a.x.formationPlace || a.i) - (+b.x.formationPlace || b.i));
  let sizes = String(formation || '').split('-').map(Number).filter(n => n > 0);
  if (sizes.reduce((q, n) => q + n, 0) !== pl.length - 1) { // formation missing or odd: group by depth
    const g = { 1: 0, 2: 0, 3: 0, 4: 0 }; for (const p of pl.slice(1)) g[p.d <= 1.5 ? 1 : p.d < 3.5 ? 2 : p.d < 4.7 ? 3 : 4]++;
    sizes = Object.values(g).filter(n => n > 0);
  }
  const rows = [[pl[0]]]; let k = 1;
  for (const n of sizes) { rows.push(pl.slice(k, k + n)); k += n; }
  rows[rows.length - 1].push(...pl.slice(k)); // never lose a player
  const R = rows.length, tc = tcOf(opt.color);
  const html = rows.map((row, ri) => {
    const top = R > 1 ? 90 - ri * 78 / (R - 1) : 50;
    row.sort((a, b) => a.side - b.side || a.i - b.i);
    return row.map((p, j) => {
      const left = row.length === 1 ? 50 : 8 + 84 * (j + .5) / row.length, a = p.x.athlete || {}, mk = opt.marks?.[a.id] || {};
      const nm = a.shortName || a.displayName || '';
      const tags = `${mk.g ? `<i class="pmk g">⚽${mk.g > 1 ? `<s>${mk.g}</s>` : ''}</i>` : ''}${mk.r ? '<i class="pmk r"></i>' : mk.y ? '<i class="pmk y"></i>' : ''}${mk.out ? '<i class="pmk o">↓</i>' : ''}`;
      return `<a class="pp ${mk.out ? 'off' : ''}" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%" href="#/player/soccer/${esc(league)}/${esc(a.id)}"><span class="pph" style="--pc:${pcol(a.displayName)}"><span class="pin_">${esc(initials(a.displayName))}</span>${phImg(hsUrl('soccer', league, a.id), a.displayName, 'soccer', opt.team)}${p.x.jersey ? `<i class="pno">${esc(p.x.jersey)}</i>` : ''}${tags}</span><b>${esc(nm)}</b></a>`;
    }).join('');
  }).join('');
  return `<div class="pitch" ${tc ? `style="--tc:${tc}"` : ''}><i class="pl-box b"></i><i class="pl-box s"></i><i class="pl-box tb"></i><i class="pl-mid"></i><i class="pl-arc"></i>${formation ? `<span class="pfm">${esc(formation)}</span>` : ''}${html}</div>`;
}
// the likely starting eleven of a team = its latest line-up
async function predictedXi(id, past, teamName = '') {
  let ev, r, st = [];
  for (const e of (past || []).slice(0, 6)) { // the latest game ESPN actually has a line-up for
    const j = await get(`${SITE}soccer/all/summary?event=${e.id}`, 600000).catch(() => null);
    r = (j?.rosters || []).find(x => String(x.team?.id) === String(id));
    st = (r?.roster || []).filter(x => x.starter);
    if (st.length >= 9) { ev = e; break; }
  }
  if (!ev) return '';
  const opp = (ev.competitions?.[0]?.competitors || []).find(c => String(c.team?.id) !== String(id))?.team?.displayName || '';
  return `<div class="card"><h2>⭐ ${teamName ? esc(teamName) + ' · ' : ''}${t('xi.title')}</h2><div class="hint" style="padding:0 14px 8px">${t('xi.note', esc(opp), dshort(ev.date))}</div><div style="padding:0 10px 12px">${pitchHtml(st, r.formation, 'all', { color: r.team?.color, team: r.team?.displayName })}</div></div>`;
}

// NBA rosters are one flat list; NHL/NFL come grouped ("Centers", "offense", …)
function usRosterHtml(roster, league) {
  const ath = roster?.athletes || [];
  const groups = ath[0]?.items ? ath.filter(g => g.items?.length).map(g => [g.position, g.items]) : [['', ath]];
  const pl = x => playerCard(x, [x.position?.abbreviation, x.age ? t('age', x.age) : ''].filter(Boolean).join(' · '), sportOf(league), league, roster?.team?.displayName || '');
  const label = s => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
  const html = groups.map(([g, list]) => `<div class="card">${g ? `<h2>${esc(label(g))} (${list.length})</h2>` : ''}${pgrid([...list].sort((x, y) => (+x.jersey || 999) - (+y.jersey || 999)).map(pl))}</div>`).join('');
  return html || `<div class="empty">${t('noSquad')}</div>`;
}


const rightsOrEmpty = (e, league) => { const [h, a] = sides(e.competitions[0]); return rightsTv(leagueOfEvent(e, league), h.team.displayName, a.team.displayName); };
// a game's competition: domestic league, European cup, domestic cup or other (friendlies …)
function compInfo(e, league) {
  const slug = leagueOfEvent(e, league) || '';
  const own = LEAGUES.find(l => l.id === slug);
  const raw = own ? lname(leagueOf(slug)) : (e.league?.name || e.league?.abbreviation || '');
  let kind = 'other';
  if (/^uefa\./.test(slug) || /champions|europa|conference|uefa/i.test(raw)) kind = 'europe';
  else if (/cup|kupa|copa|coupe|pokal|coppa|trophy|super/i.test(raw + ' ' + slug)) kind = 'cup';
  else if (own && own.table !== false && !/^tff/.test(slug)) kind = 'league';
  else if (own) kind = 'cup';
  return { slug, name: raw || t('fx.other'), kind };
}
const FX_KINDS = [['league', '🏟️', 'fx.league'], ['europe', '🌍', 'fx.europe'], ['cup', '🏆', 'fx.cup'], ['other', '🤝', 'fx.other']];
// games whose date is not fixed yet are kept but shown without a date
const dateTbd = e => { const c = e.competitions?.[0]; return c?.timeValid === false || /tbd|tba|postponed|ertelen/i.test((e.status || c?.status)?.type?.detail || '') || /postponed/i.test((e.status || c?.status)?.type?.name || ''); };
function fixtureGroups(list, league, cap) {
  const by = {};
  for (const e of list.slice(0, cap)) { const ci = compInfo(e, league); (by[ci.kind + '|' + ci.name] ||= { ...ci, items: [] }).items.push(e); }
  const order = k => FX_KINDS.findIndex(x => x[0] === k);
  return Object.values(by).sort((a, b) => order(a.kind) - order(b.kind) || b.items.length - a.items.length).map(g => {
    const ic = (LEAGUES.some(l => l.id === g.slug) || ccOf(g.slug)) ? lgIcon(g.slug) : FX_KINDS[order(g.kind)][1];
    const rows = g.items.map(e => matchRow(e, leagueOfEvent(e, league), true, rightsOrEmpty(e, league), dateTbd(e), true)).join('');
    return `<div class="card"><h2>${ic} ${esc(g.name)} <span class="cnt">${g.items.length}</span></h2>${rows}</div>`;
  }).join('');
}


// every team's place in a league table (UEFA competitions: the league phase), for the rank under the logos
async function leagueRanks(league) {
  const m = new Map();
  if (isTff(league) || league === 'all' || leagueOf(league).table === false) return m;
  const j = await get(`${apiSt(league)}/standings`, 300000).catch(() => null), groups = j?.children || [];
  for (const g of groups) for (const en of g.standings?.entries || []) {
    const st = n => en.stats.find(q => q.name === n)?.value, r = st('rank') || st('playoffSeed');
    if (r) m.set(String(en.team?.id), { rank: r, pts: st('points') });
  }
  return m;
}
// the team's place in every table it plays in (league, European cup, …)
async function teamRanks(id, evs, homeLeague) {
  const slugs = [...new Set([homeLeague, ...[...evs.past, ...evs.live, ...evs.next].map(e => leagueOfEvent(e, ''))].filter(x => x && x !== 'all' && !isTff(x)))].slice(0, 8);
  const rs = await Promise.all(slugs.map(async slug => {
    const j = await get(`${apiSt(slug)}/standings`, 300000).catch(() => null);
    const groups = j?.children || [];
    for (const g of groups) {
      const en = g.standings?.entries?.find(x => String(x.team?.id) === String(id));
      if (!en) continue;
      const st = n => en.stats.find(q => q.name === n)?.value;
      return { slug, name: LEAGUES.some(l => l.id === slug) ? lname(leagueOf(slug)) : (j.name || slug), group: groups.length > 1 ? g.name : '', rank: st('rank') || st('playoffSeed'), pts: st('points'), p: st('gamesPlayed'), w: st('wins'), d: st('ties'), l: st('losses'), gd: st('pointDifferential') };
    }
    return null;
  }));
  const order = slugs.reduce((o, x, i) => (o[x] = i, o), {});
  return rs.filter(r => r && r.rank).sort((a, b) => order[a.slug] - order[b.slug]);
}
async function clubInfo(name, sport) {
  try {
    const c = await get(`${workerBase()}/api/club?n=${encodeURIComponent(name)}&sp=${sport}`, 86400000);
    return [['🏟️', t('i.stadium'), c.stadium], ['👥', t('i.cap'), c.cap ? Number(c.cap).toLocaleString() : ''], ['📍', t('i.city'), c.city], ['📅', t('i.formed'), c.formed], ['🌍', t('i.country'), c.country], ['🧑‍💼', t('coach'), c.manager], ['🌐', t('i.web'), c.web]].filter(r => r[2]);
  } catch { return []; }
}
const ranksCard = ranks => ranks.length ? `<div class="card"><h2>📊 ${t('rank.title')}</h2>${ranks.map(r => `<a class="lrow rankrow" href="#/league/${esc(r.slug)}/puan">${lgIcon(r.slug)}<span class="nm">${esc(r.name)}${r.group ? `<small class="hint" style="display:block">${esc(r.group)}</small>` : ''}</span>
  <span class="rk"><b>${r.rank}.</b><small>${r.pts ?? '-'} ${t('th.Pts')} · ${r.w ?? 0}-${r.d ?? 0}-${r.l ?? 0}</small></span></a>`).join('')}</div>` : '';
async function viewTeam(league, id, season) {
  season = season ? +season : curSeasonYear();
  const pastSeason = season !== curSeasonYear();
  // ESPN's team-info endpoint is closed to browsers, so name, rank and record come from the standings
  const espnNews = get(`${api(league)}/news?team=${id}&limit=10`, 600000).then(j => j.articles || []).catch(() => []);
  const [table, roster, evs] = await Promise.all([
    get(`${apiSt(league)}/standings${pastSeason ? '?season=' + season : ''}`, 120000).catch(() => null),
    rosterOf(league, id),
    teamEvents(id, league, season),
  ]);
  const groups = table?.children || [];
  const group = groups.find(g => g.standings?.entries?.some(e => e.team.id == id));
  const entry = group?.standings.entries.find(e => e.team.id == id);
  const stat = n => entry?.stats.find(s => s.name === n);
  const evTeam = [...evs.past, ...evs.live, ...evs.next].flatMap(e => e.competitions[0].competitors || []).find(c => c.team?.id == id)?.team;
  const name = entry?.team.displayName || roster?.team?.displayName || evTeam?.displayName || favs.find(f => f.id == id)?.name || t('th.team');
  setTitle(name);
  const teamNews = async () => (await newsFor(name)) || (LANG === 'en' ? await espnNews : []);
  const fav = isFav(id, league);
  const newsP = teamNews().catch(() => []), forumP = teamForumHtml(league, id).catch(() => ''); // slow parts run side by side, after the page is shown
  const xiP = sportOf(league) === 'soccer' ? predictedXi(id, evs.past).catch(() => '') : Promise.resolve('');
  const ranksP = sportOf(league) === 'soccer' && !pastSeason ? teamRanks(id, evs, league).catch(() => []) : Promise.resolve([]);
  const rank = stat('rank')?.value || stat('playoffSeed')?.value;
  const baseSummary = rank ? t('rankIn', rank, groups.length > 1 ? group.name : lname(leagueOf(league))) : '';
  const sumP = ranksP.then(ranks => ranks.length ? ranks.slice(0, 2).map(r => t('rankIn', r.rank, r.name)).join(' · ') : baseSummary);
  const summary = baseSummary;
  // last five results across every competition, newest last (coloured W/D/L chips)
  const formStr = sportOf(league) === 'soccer' ? [...evs.past].sort((x, y) => new Date(x.date) - new Date(y.date)).slice(-5).map(e => {
    const cs = e.competitions?.[0]?.competitors || [], me = cs.find(c => c.team?.id == id), op = cs.find(c => c.team?.id != id);
    if (!me || !op || me.score == null || op.score == null) return '';
    const a = +(me.score.value ?? me.score), b = +(op.score.value ?? op.score);
    return a > b ? 'W' : a < b ? 'L' : 'D';
  }).join('') : '';
  const rec = '';
  const tcol = fxCol(roster?.team?.color || evTeam?.color || entry?.team?.color, '#2563eb');
  const sv = n => stat(n)?.displayValue ?? stat(n)?.value;
  const tile = (v, l) => v != null && v !== '' ? `<div class="ttile"><b>${esc(v)}</b><small>${l}</small></div>` : '';
  const tiles = entry && sportOf(league) === 'soccer' ? `<div class="ttiles">${tile(rank, t('tc.rank'))}${tile(sv('points'), t('tc.pts'))}${tile(sv('gamesPlayed'), t('tc.played'))}${tile([sv('wins'), sv('ties'), sv('losses')].every(x => x != null) ? `${sv('wins')}-${sv('ties')}-${sv('losses')}` : '', t('tc.wdl'))}</div>` : '';
  let html = `<div class="card hero tcover" style="--tc:${tcol}"><div class="tcbadge">${img(id, 'big', league)}</div><div class="tcname">${esc(name)}</div>
    <div class="st">${lazy(sumP.then(esc), 'span')}${formStr ? `<div class="form big">${[...formStr].map(c => `<i class="${c}">${t('res.' + c)}</i>`).join('')}</div>` : ''}${rec ? ' · ' + esc(rec) + (sportOf(league) === 'soccer' ? ' ' + t('wdl') : '') : ''}</div>
    ${tiles}<button class="favbtn ${fav ? 'on' : ''}" data-fav="${id}" data-name="${esc(name)}" data-league="${league}">${fav ? t('inFavs') : t('addFav')}</button></div>`;

  const rows = (list, withDate) => list.map(e => matchRow(e, leagueOfEvent(e, league), withDate)).join('');
  const seasonBar = sportOf(league) === 'soccer' ? `<div class="seasonbar">${seasonSelect(`data-team-season="${league}/${id}"`, season)}</div>` : '';
  const sec = (title, inner) => inner ? `<div class="fxsec">${title}</div>${inner}` : '';
  const nextSorted = [...evs.next].sort((x, y) => (dateTbd(x) - dateTbd(y)) || (new Date(x.date) - new Date(y.date)));
  const fxBody = (evs.live.length ? `<div class="card"><h2>${t('live')}</h2>${rows(evs.live, true)}</div>` : '')
    + (!pastSeason ? sec(t('upcoming'), fixtureGroups(nextSorted, league, 40)) : '')
    + sec(pastSeason ? t('season', seasonLabel(season)) + ' · ' + evs.past.length : t('recentMatches'), fixtureGroups(evs.past, league, pastSeason ? 150 : 30))
    || emptyState('ball', t('noMatches'));
  const fx = seasonBar + fxBody;

  if (sportOf(league) !== 'soccer') return html + seg('team', [t('fixtures'), t('squad'), t('news.tab'), t('cat.teamForum')]) + pane('team', 0, fx) + pane('team', 1, usRosterHtml(roster, league)) + pane('team', 2, lazy(newsP.then(n => newsCard(n, t('news.title'))))) + pane('team', 3, await teamForumHtml(league, id));
  const POS = [['Goalkeeper', 'pos.G'], ['Defender', 'pos.D'], ['Midfielder', 'pos.M'], ['Forward', 'pos.F']];
  const ath = roster?.athletes || [];
  const pl = x => playerCard(x, [x.age ? t('age', x.age) : '', x.citizenship || ''].filter(Boolean).join(' · '), 'soccer', league, name);
  const byNo = (x, y) => (+x.jersey || 99) - (+y.jersey || 99);
  let sq = POS.map(([k, label]) => {
    const g = ath.filter(x => x.position?.name === k).sort(byNo);
    return g.length ? `<div class="card"><h2>${t(label)} (${g.length})</h2>${pgrid(g.map(pl))}</div>` : '';
  }).join('');
  const other = ath.filter(x => !POS.some(([k]) => k === x.position?.name));
  if (other.length) sq += `<div class="card"><h2>${t('other')}</h2>${pgrid(other.map(pl))}</div>`;
  if (ath.length) sq = `<div class="sqhead"><b>${ath.length}</b> ${t('sq.players')}</div>` + sq;
  if (!sq) sq = `<div class="empty">${t('noSquad')}</div>`;
  const espnSq = sq; // ESPN's list stays the fallback (a separate copy: the lazy box must not contain itself)
  sq = lazy(xiP) + lazy(wikiSquadHtml(name, ath, league).then(h => h || espnSq).catch(() => espnSq));

  // profile: competitions the club plays in (from its schedule) and the head coach
  const comps = [...new Set([...evs.past, ...evs.live, ...evs.next].map(e => { const sl = leagueOfEvent(e, ''); return LEAGUES.some(l => l.id === sl) ? lname(leagueOf(sl)) : (e.league?.name || e.league?.abbreviation || ''); }).filter(Boolean))];
  const coach = [roster?.coach?.[0]?.firstName, roster?.coach?.[0]?.lastName].filter(Boolean).join(' ');
  const clubP = clubInfo(name, sportOf(league));
  const infoPane = lazy(Promise.all([sumP, clubP]).then(([summary, ci]) => { const infoRows = [...ci, ['🏆', t('competitions'), comps.join(', ')], ['🧑‍💼', t('coach'), coach || ''], ['📊', t('th.team'), summary]].filter(r => r[2]); return (infoRows.length ? `<div class="card">${infoRows.map(([ic, kk, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${esc(kk)}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>` : `<div class="empty">${t('noInfo')}</div>`); }));
  const k = 'team';
  // its own tab: the team's place in every competition, then the full tables (its team is the one the user came from)
  const tbPane = lazy(ranksP.then(async ranks => {
  let tbPane = ranksCard(ranks);
  tbPane += (await Promise.all(ranks.slice(0, 3).map(async r => { try { return `<div class="card"><h2>${lgIcon(r.slug)} ${esc(r.name)}<a href="#/league/${esc(r.slug)}/puan">${t('o.standings')}</a></h2>${await standingsHtml(r.slug, undefined, id)}</div>`; } catch { return ''; } }))).join('');
  if (!tbPane) tbPane = `<div class="empty">${t('noTable')}</div>`;
  return tbPane; }));
  const isSoc = sportOf(league) === 'soccer';
  const trP = isSoc ? newsFor(`${name} transfer`).catch(() => null) : null;
  return html + seg(k, [t('fixtures'), t('squad'), t('o.standings'), t('info'), t('news.tab'), t('cat.teamForum'), ...(isSoc ? ['🔁 ' + t('tr.tab'), '🏛️ ' + t('lg.clubTab')] : []), '💬 ' + t('room.tab')]) + pane(k, 0, fx) + pane(k, 1, sq) + pane(k, 2, tbPane) + pane(k, 3, infoPane) + pane(k, 4, lazy(newsOr(newsP, t('news.title')))) + pane(k, 5, lazy(forumP))
    + (isSoc ? pane(k, 6, lazy(trP.then(n => n?.length ? newsCard(n, t('tr.title', name)) : `<div class="empty">${t('tr.none')}</div>`))) + pane(k, 7, lazy(clubLegendsHtml(name).catch(() => `<div class="empty">${t('noInfo')}</div>`))) : '')
    + pane(k, isSoc ? 8 : 6, `<div class="hint" style="padding:4px 6px 8px">${t('room.hint', esc(name))}</div>` + chatHtml(roomId(league, id)));
}


// ---- Players: profile page, favourites, search (ESPN athlete + search endpoints) ----
const ESPN_C = 'https://site.web.api.espn.com/apis/common/v3/sports/';
const ESPN_Q = 'https://site.web.api.espn.com/apis/search/v2?';
let pfavs = store.get('pfavs', []); // [{id, name, sport, league, team}]
const isPFav = (id, sport) => pfavs.some(f => f.id == id && f.sport === sport);
const TAB_OF = { racing: 'f1', volleyball: 'volley' };
const tabOfSport = sp => TAB_OF[sp] || sp;
const sportIcon = sp => (SPORTS.find(x => x[0] === tabOfSport(sp)) || [0, '🏅'])[1];
const dobOf = a => a.displayDOB || '';

// career: clubs (with years) and a season-by-season table
const yearsOf = str => { const ys = String(str || '').match(/\d{4}/g) || []; if (!ys.length) return ''; const cur = /CURRENT/i.test(str); return `${ys[0]}–${cur ? t('pl.now') : ys[ys.length - 1]}`; };
async function careerHtml(sport, league, id) {
  const base = ESPN_C + (sport === 'soccer' ? 'soccer' : `${sport}/${league}`) + '/athletes/' + id;
  const [bio, st] = await Promise.all([sport === 'soccer' ? get(base + '/bio', 600000).catch(() => null) : null, get(base + '/stats', 600000).catch(() => null)]);
  let html = '';
  const th = bio?.teamHistory || [];
  if (th.length) html += `<div class="card"><h2>${t('pl.clubs')}</h2>${th.map(x => `<a class="lrow clubrow" href="#/team/${/^\d+$/.test(x.id) ? 'all' : ''}/${esc(x.id)}">${x.logo ? `<img class="logo" loading="lazy" src="${esc(x.logo)}" alt="" onerror="this.style.visibility='hidden'">` : ''}<span class="nm">${esc(x.displayName)}</span><small class="hint">${esc(yearsOf(x.seasons))}</small></a>`).join('')}</div>`;
  const cat = (st?.categories || []).find(x => x.name === 'averages') || st?.categories?.[0];
  if (cat?.statistics?.length) {
    const labels = (cat.labels || []).slice(0, 12), teams = st.teams || {};
    const tn = r => teams[r.teamSlug]?.displayName || teams[r.teamId]?.displayName || teams[r.teamSlug]?.shortDisplayName || r.teamSlug || '';
    const rows = [...cat.statistics].sort((x, y) => (y.season?.year || 0) - (x.season?.year || 0)).slice(0, 40);
    const sl = r => r.season?.type?.abbreviation || r.season?.displayName || r.season?.year || '';
    const tot = Array.isArray(cat.totals) && cat.totals.length ? `<tr class="tot"><td>${t('pl.careerTotal')}</td><td></td>${cat.totals.slice(0, labels.length).map(v => `<td>${esc(v)}</td>`).join('')}</tr>` : '';
    html += `<div class="card"><h2>${t('pl.bySeason')}</h2><div class="stwrap"><table class="stbl"><thead><tr><th></th><th></th>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(sl(r))}</td><td class="tmc">${esc(tn(r))}</td>${(r.stats || []).slice(0, labels.length).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}${tot}</tbody></table></div></div>`;
  }
  return html;
}
async function viewPlayer(sport, league, id) {
  if (league === 'E' || league === 'U') return viewEuPlayer(league, id);
  if (league === 'thf') return viewThfPlayer(id);
  let a, o = null;
  const oP = get(`${ESPN_C}${sport}/${league}/athletes/${id}/overview`, 300000).catch(() => null); // started together with the profile
  try {
    const j = await get(`${ESPN_C}${sport}/${league}/athletes/${id}`, 300000); a = j.athlete;
    var lg = j.league?.slug;
  } catch { return `<div class="empty">${t('pl.noData')}</div>`; }
  if (!a) return `<div class="empty">${t('pl.noData')}</div>`;
  o = await oP;
  setTitle(a.displayName || a.fullName);
  const team = a.team, teamLeague = sport === 'soccer' ? (lg || league) : league;
  const teamOk = team && (sport === 'soccer' || LEAGUES.some(l => l.id === teamLeague));
  const src = a.headshot?.href || hsUrl(sport, league, id);
  const pos = a.position?.displayName || a.position?.name || '';
  const p = { id, name: a.displayName || a.fullName, sport, league, team: team?.displayName || '' };
  const pnP = newsFor(`"${p.name}" ${p.team}`.trim()).catch(() => null), careerP = careerHtml(sport, league, id).catch(() => '');
  const flag = a.flag?.href ? `<img class="flag" src="${esc(a.flag.href)}" alt="" onerror="this.remove()">` : '';
  const hero = `<div class="card hero plhero"><div class="plpic" style="--pc:${pcol(p.name)}"><span class="pin_">${esc(initials(p.name))}</span>${phImg(src, p.name, sport, p.team)}</div>
    <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(p.name)}</div>
    <div class="st">${[a.displayJersey, pos].filter(Boolean).map(esc).join(' · ')}</div>
    ${sport === 'soccer' ? `<a class="mval big" data-mv="${esc(p.name)}" data-mt="${esc(p.team || team?.displayName || '')}" hidden></a>` : ''}
    ${team ? `<div class="plteam">${teamOk ? `<a href="#/team/${esc(teamLeague)}/${esc(team.id)}">${img(team.id, '', teamLeague)} ${esc(team.displayName)}</a>` : esc(team.displayName)}</div>` : ''}
    <button class="favbtn ${isPFav(id, sport) ? 'on' : ''}" data-pfav="${esc(id)}" data-name="${esc(p.name)}" data-psport="${esc(sport)}" data-league="${esc(league)}" data-team="${esc(p.team)}">${isPFav(id, sport) ? t('pl.inFav') : t('pl.addFav')}</button></div>`;
  const rows = [['pl.age', a.age ? t('age', a.age) : ''], ['pl.born', dobOf(a)], ['pl.birthplace', a.displayBirthPlace], ['pl.nation', [a.citizenship].filter(Boolean).join('')],
    ['pl.height', unitH(a.displayHeight)], ['pl.weight', unitW(a.displayWeight)], ['pl.exp', a.displayExperience], ['pl.draft', a.displayDraft], ['pl.hand', a.hand?.displayValue]].filter(r => r[1]);
  const info = rows.length ? `<div class="card">${rows.map(([k, v]) => `<div class="inforow"><span class="k">${t(k)}</span><span class="v">${k === 'pl.nation' ? flag : ''}${esc(v)}</span></div>`).join('')}</div>` : '';
  const ss = a.statsSummary?.statistics || [];
  const tiles = ss.length ? `<div class="card"><h2>${t('pl.current')} · ${esc(a.statsSummary.displayName || '')}</h2><div class="stiles">${ss.map(x => `<div class="stile"><b>${esc(x.displayValue ?? '')}</b><small>${esc(x.shortDisplayName || x.displayName || '')}</small></div>`).join('')}</div></div>` : '';
  const st = o?.statistics, labels = st?.labels || [];
  const table = labels.length && st.splits?.length ? `<div class="card"><h2>${t('pl.seasonStats')}</h2><div class="stwrap"><table class="stbl"><thead><tr><th></th>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
    <tbody>${st.splits.map(sp => `<tr><td>${esc(sp.displayName)}</td>${sp.stats.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>` : '';
  const ev = o?.nextGame?.league?.events?.[0];
  const next = ev ? `<div class="card"><h2>${t('pl.next')}</h2><div class="inforow"><span class="k">${esc(dshort(ev.date))} · ${esc(hm(ev.date))}</span><span class="v">${esc(ev.name || ev.shortName || '')}</span></div></div>` : '';
  const news = lazy(newsOr(pnP.then(pn => pn || (LANG === 'en' ? o?.news : null)), t('news.title')));
  const cmpBtn = `<a class="btn ghost" href="#/compare/${esc(sport)}/${esc(league)}/${esc(id)}" style="display:block;text-align:center;margin-bottom:10px">${t('cmp.btn')}</a>`;
  const career = lazy(careerP.then(c => c || `<div class="empty">${t('pl.noCareer')}</div>`));
  const summary = tiles + table + next + info + (!tiles && !table ? `<div class="empty">${t('pl.noStats')}</div>` : '');
  const key = 'player';
  return hero + cmpBtn + seg(key, [t('pl.tabSummary'), t('pl.career'), t('news.tab')]) + pane(key, 0, summary) + pane(key, 1, career || `<div class="empty">${t('pl.noCareer')}</div>`) + pane(key, 2, news || `<div class="empty">${t('news.none')}</div>`);
}
async function favPlayers(list) {
  const rows = await Promise.all(list.map(async f => {
    const j = await get(`${ESPN_C}${f.sport}/${f.league}/athletes/${f.id}`, 300000).catch(() => null);
    return { f, a: j?.athlete };
  }));
  return `<div class="card"><h2>⭐ ${t('pl.favs')}</h2><div class="favpl">${rows.map(({ f, a }) => {
    const ss = (a?.statsSummary?.statistics || []).slice(0, 4).map(x => `<span><b>${esc(x.displayValue)}</b> ${esc(x.shortDisplayName || x.displayName)}</span>`).join('');
    return `<div class="pcwrap row"><a class="favplrow" href="#/player/${esc(f.sport)}/${esc(f.league)}/${esc(f.id)}"><span class="pph sm" style="--pc:${pcol(f.name)}"><span class="pin_">${esc(initials(f.name))}</span>${phImg(a?.headshot?.href || hsUrl(f.sport, f.league, f.id), f.name, f.sport)}</span>
      <div class="pbody"><b>${esc(f.name)}</b><small>${esc(a?.team?.displayName || f.team || '')}${a?.position?.abbreviation ? ' · ' + esc(a.position.abbreviation) : ''}</small><div class="ssline">${ss}</div></div></a>${pfavBtn(f)}</div>`;
  }).join('')}</div></div>`;
}
let searchTimer = 0, searchTok = 0;
const uidId = (uid, k) => (String(uid || '').match(new RegExp('~' + k + ':(\\d+)')) || [])[1];
// ESPN's subtitles are English ("Turkish club"): teams show their league and country in the app language, players a translated position
const POSW = { Goalkeeper: 'pos.G', Defender: 'pos.D', Midfielder: 'pos.M', Forward: 'pos.F' };
function srchSub(c, kind, sport, lg) {
  const sp = (SPORTS.find(x => x[0] === tabOfSport(sport)) || [])[2], L = LEAGUES.find(l => l.id === lg);
  if (kind === 'team') return L ? `${lname(L)}${/^(uefa|fifa|afc|caf|concacaf|conmebol)\./.test(L.id) || L.region ? '' : ' · ' + regionName(L.id)}` : (sp ? t(sp) : '');
  const txt = [c.subtitle, c.description].filter(Boolean).join(' · ').replace(/\b(Goalkeeper|Defender|Midfielder|Forward)\b/g, m => t(POSW[m]))
    .replace(/\b(club|team|player|footballer|soccer|football|basketball|volleyball|handball|tennis|baseball|hockey)\b/ig, '').replace(/\s*·\s*(?=·|$)/g, '').replace(/^\s*·\s*/, '').replace(/\s{2,}/g, ' ').trim();
  return txt || (sp ? t(sp) : '');
}
// the last searches (on this phone), shown while the box is empty
const rememberSearch = q => { const l = store.get('srecent', []).filter(x => normName(x) !== normName(q)); l.unshift(q); store.set('srecent', l.slice(0, 8)); };
const recentSearchHtml = () => { const l = store.get('srecent', []); return l.length ? `<div class="card"><h2>🕒 ${t('search.recent')}<button class="linkbtn" data-srecent-clear style="margin-left:auto">${t('search.clear')}</button></h2><div class="srecent">${l.map(q => `<button class="chipq" data-sq="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>` : ''; };
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sq]'); if (b) { const i = document.getElementById('sq'); if (i) { i.value = b.dataset.sq; runSearch(b.dataset.sq); } return; }
  if (e.target.closest('[data-srecent-clear]')) { store.set('srecent', []); const box = document.getElementById('sres'); if (box) box.innerHTML = emptyState('search', t('search.hint')); }
});
async function runSearch(q) {
  const box = document.getElementById('sres'); if (!box) return;
  q = q.trim();
  if (q.length < 2) { box.innerHTML = recentSearchHtml() || emptyState('search', t('search.hint')); return; }
  const tok = ++searchTok;
  box.innerHTML = '<div class="spin"></div>';
  const call = type => get(`${ESPN_Q}query=${encodeURIComponent(q)}&limit=12&type=${type}`, 120000).then(j => (j.results || []).find(r => r.type === type)?.contents || []).catch(() => []);
  const nq = normName(q);
  const leagues = LEAGUES.filter(l => normName(lname(l)).includes(nq) || normName(l.id).includes(nq)).slice(0, 6);
  const [teams, players, users, topics] = await Promise.all([call('team'), call('player'),
    workerBase() && q.length >= 3 ? capi('GET', '/users?q=' + encodeURIComponent(q)).then(r => r.users || []).catch(() => []) : [],
    workerBase() ? capi('GET', '/psearch?q=' + encodeURIComponent(q)).then(r => r.posts || []).catch(() => []) : []]);
  if (tok !== searchTok) return;
  rememberSearch(q);
  const row = (c, kind) => {
    const id = uidId(c.uid, kind === 'player' ? 'a' : 't'); if (!id) return '';
    const sport = c.sport || 'soccer', lg = c.defaultLeagueSlug || c.league || (sport === 'soccer' ? 'all' : '');
    const sub = srchSub(c, kind, sport, lg);
    const ok = kind === 'player' || sport === 'soccer' || LEAGUES.some(l => l.id === lg);
    const href = kind === 'player' ? `#/player/${esc(sport)}/${esc(lg || sport)}/${esc(id)}` : `#/team/${esc(lg)}/${esc(id)}`;
    const pic = c.image?.default ? `<img class="${kind === 'team' ? 'logo' : 'srcpic'}" loading="lazy" src="${esc(c.image.default)}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="srcpic">${sportIcon(sport)}</span>`;
    const inner = `${pic}<span class="nm">${esc(c.displayName)}<small class="hint" style="display:block">${sportIcon(sport)} ${esc(sub)}</small></span>${ok ? '<span class="go">›</span>' : ''}`;
    return ok ? `<div class="lrow"><a href="${href}">${inner}</a></div>` : `<div class="lrow"><span class="srow">${inner}</span></div>`;
  };
  const sec = (title, list, kind) => list.length ? `<div class="card"><h2>${title} (${list.length})</h2>${list.map(c => row(c, kind)).join('')}</div>` : '';
  const lgSec = leagues.length ? `<div class="card"><h2>🏆 ${t('search.leagues')}</h2>${leagues.map(l => `<div class="lrow"><a href="#/league/${esc(l.id)}">${lgIcon(l.id)}<span class="nm">${esc(lname(l))}<small class="hint" style="display:block">${esc(ctryName(l.country || ''))}</small></span><span class="go">›</span></a></div>`).join('')}</div>` : '';
  const usSec = users.length ? `<div class="card"><h2>👥 ${t('search.members')}</h2>${users.slice(0, 6).map(u => `<div class="lrow"><a href="#/user/${encodeURIComponent(u.username)}">${avatar(u, 28)}<span class="nm">${nameHtml(u)}</span><span class="go">›</span></a></div>`).join('')}</div>` : '';
  const tpSec = topics.length ? `<div class="card"><h2>💬 ${t('search.topics')}</h2>${topics.map(p => `<div class="lrow"><a href="#/post/${p.id}"><span class="nm">${esc(p.title)}<small class="hint" style="display:block">${esc(p.username)} · ${ago(p.created)} · ${p.n} ${t("c.comments").toLocaleLowerCase(LOCALE())}</small></span><span class="go">›</span></a></div>`).join('')}</div>` : '';
  const any = leagues.length || teams.length || players.length || users.length || topics.length;
  box.innerHTML = any ? lgSec + sec(t('search.teams'), teams, 'team') + sec(t('search.players'), players, 'player') + '<div id="sleg"></div>' + usSec + tpSec : '<div id="sleg"></div>' + emptyState('search', t('search.none'));
  // former players and legends (Wikidata): everyone ESPN no longer lists
  const have = new Set(players.map(c => normName(c.displayName)));
  const leg = (await wdSearch(q).catch(() => [])).filter(x => !have.has(normName(x.label)));
  if (tok !== searchTok) return;
  const lb = document.getElementById('sleg');
  if (lb && leg.length) lb.innerHTML = `<div class="card"><h2>🏛️ ${t('lg.title')} (${leg.length})</h2>${leg.map(x => `<div class="lrow"><a href="#/legend/${x.id}"><span class="srcpic">⚽</span><span class="nm">${esc(x.label)}<small class="hint" style="display:block">${esc(x.description || '')}</small></span><span class="go">›</span></a></div>`).join('')}</div>`;
  else if (!teams.length && !players.length && !users.length && !topics.length && !leagues.length) box.innerHTML = emptyState('search', t('search.none'));
}

// ---- legends / former players: Wikidata (career with years, apps and goals, honours) + the Wikipedia summary
const WD = 'https://www.wikidata.org/w/api.php?format=json&origin=*&';
const wdLang = () => (LANG === 'ku' ? 'tr' : LANG);
async function wdSearch(q) {
  const j = await get(`${WD}action=wbsearchentities&search=${encodeURIComponent(q)}&language=${wdLang()}&uselang=${wdLang()}&type=item&limit=15`, 3600000);
  return (j.search || []).filter(x => /footballer|football player|soccer|futbolcu|fußball|футбол|footballeur|futbolista|piłkarz/i.test(x.description || '')).slice(0, 8);
}
async function wdLabels(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const j = await get(`${WD}action=wbgetentities&ids=${ids.slice(i, i + 50).join('|')}&props=labels&languages=${wdLang()}|en`, 86400000).catch(() => ({}));
    for (const [id, e] of Object.entries(j.entities || {})) out[id] = e.labels?.[wdLang()]?.value || e.labels?.en?.value || id;
  }
  return out;
}
const wdYear = s => s ? (/([+-]\d{4})/.exec(s.time || s)?.[1] || '').replace('+', '') : '';
// a club's best-known players (Wikidata): fame (Wikipedia language versions) weighted by the years they spent at the club
async function clubLegendsHtml(name) {
  const ck = 'clubleg:' + name, hit = store.get(ck, null);
  let list = hit && Date.now() - hit.t < 7 * 864e5 ? hit.v : null;
  if (!list) {
    const s = await get(`${WD}action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=10`, 86400000);
    const club = (s.search || []).find(x => /football club|association football|soccer club|futbol kulübü/i.test(x.description || '') && !/women|kadın/i.test(x.description || ''));
    if (!club) return `<div class="empty">${t('noInfo')}</div>`;
    const q = `SELECT ?p ?pLabel ?sl WHERE { ?p wdt:P54 wd:${club.id}; wdt:P106 wd:Q937857; wikibase:sitelinks ?sl. FILTER(?sl > 4) SERVICE wikibase:label { bd:serviceParam wikibase:language "${wdLang()},en". } } ORDER BY DESC(?sl) LIMIT 120`;
    const r = await get('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), 86400000);
    const ppl = (r.results?.bindings || []).map(b => ({ id: b.p.value.split('/').pop(), name: b.pLabel.value, sl: +b.sl.value }));
    // the years, games and goals at this club (one more small query for those players)
    const q2 = `SELECT ?p (MIN(YEAR(?s)) AS ?from) (MAX(YEAR(?e)) AS ?to) (MAX(?a) AS ?apps) (MAX(?g) AS ?goals) WHERE { VALUES ?p { ${ppl.map(p => 'wd:' + p.id).join(' ')} } ?p p:P54 ?st. ?st ps:P54 wd:${club.id}. OPTIONAL { ?st pq:P580 ?s. } OPTIONAL { ?st pq:P582 ?e. } OPTIONAL { ?st pq:P1350 ?a. } OPTIONAL { ?st pq:P1351 ?g. } } GROUP BY ?p`;
    const r2 = ppl.length ? await get('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q2), 86400000).catch(() => null) : null;
    const yrsOf = Object.fromEntries((r2?.results?.bindings || []).map(b => [b.p.value.split('/').pop(), { from: +b.from?.value || 0, to: +b.to?.value || 0, apps: +b.apps?.value || 0, goals: +b.goals?.value || 0 }]));
    const yr = new Date().getFullYear();
    list = ppl.map(p => {
      const y = yrsOf[p.id] || {}, from = y.from || 9999, to = y.to || 0, apps = y.apps || 0, goals = y.goals || 0;
      const yrs = from < 9999 ? (to || yr) - from : 0;
      return { ...p, from: from < 9999 ? from : 0, to, apps, goals, score: p.sl * (1 + Math.min(yrs, 12)) + apps / 5, current: !to && from < 9999 };
    }).sort((a, b) => b.score - a.score).slice(0, 30);
    store.set(ck, { t: Date.now(), v: list });
  }
  if (!list.length) return `<div class="empty">${t('noInfo')}</div>`;
  return `<div class="card"><h2>🏛️ ${t('lg.clubTitle', esc(name))}</h2>${list.map((p, i) => `<a class="lrow legrow" href="#/legend/${p.id}"><span class="rk">${i + 1}</span><span class="nm">${esc(p.name)}<small class="hint" style="display:block">${p.from ? (p.to && p.to !== p.from ? `${p.from}–${p.to}` : p.to ? `${p.from}` : `${p.from}–`) : ''}${p.apps ? ` · ${p.apps} ${t('lg.apps').toLowerCase()}${p.goals ? ` · ${p.goals} ${t('lg.goals').toLowerCase()}` : ''}` : ''}</small></span><span class="go">›</span></a>`).join('')}<div class="hint" style="padding:8px 14px 12px">${t('lg.src')}</div></div>`;
}
async function viewLegend(qid) {
  if (!/^Q\d+$/.test(qid || '')) return `<div class="empty">${t('noInfo')}</div>`;
  const j = await get(`${WD}action=wbgetentities&ids=${qid}&props=claims|labels|descriptions|sitelinks&languages=${wdLang()}|en`, 86400000);
  const e = j.entities?.[qid]; if (!e) return `<div class="empty">${t('noInfo')}</div>`;
  const name = e.labels?.[wdLang()]?.value || e.labels?.en?.value || qid; setTitle(name);
  const C = p => e.claims?.[p] || [], val = c => c?.mainsnak?.datavalue?.value, qv = c => val(c)?.id, qual = (c, p) => c?.qualifiers?.[p]?.[0]?.datavalue?.value;
  const teams = C('P54').map(c => ({ id: qv(c), from: wdYear(qual(c, 'P580')), to: wdYear(qual(c, 'P582')), apps: qual(c, 'P1350')?.amount, goals: qual(c, 'P1351')?.amount })).filter(x => x.id);
  const awards = C('P166').map(c => ({ id: qv(c), y: wdYear(qual(c, 'P585')) })).filter(x => x.id);
  const ids = [...new Set([...teams.map(x => x.id), ...awards.map(x => x.id), ...['P413', 'P19', 'P27', 'P1532'].flatMap(p => C(p).map(qv))].filter(Boolean))];
  const [L, sum] = await Promise.all([wdLabels(ids), (async () => {
    const site = e.sitelinks?.[wdLang() + 'wiki'] || e.sitelinks?.enwiki, host = e.sitelinks?.[wdLang() + 'wiki'] ? wdLang() : 'en';
    if (!site) return null;
    return get(`https://${host}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(site.title.replace(/ /g, '_'))}`, 86400000).catch(() => null);
  })()]);
  const pic = val(C('P18')[0]), born = val(C('P569')[0])?.time, died = val(C('P570')[0])?.time;
  const fmtW = s => { const m = /([+-]\d{4})-(\d\d)-(\d\d)/.exec(s || ''); return m ? (m[2] === '00' ? m[1].replace('+', '') : fmtD(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] || 1)).getTime(), { day: 'numeric', month: 'long', year: 'numeric' })) : ''; };
  const age = born && !died ? Math.floor((Date.now() - new Date(born.slice(1, 11))) / 31557600000) : 0;
  const hero = `<div class="card hero plhero"><div class="plpic" style="--pc:${pcol(name)}"><span class="pin_">${esc(initials(name))}</span>${pic ? `<img src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(pic)}?width=300" alt="" onerror="this.remove()">` : ''}</div>
    <div style="font-size:20px;font-weight:700;margin-top:8px">${esc(name)}</div><div class="st">${esc(e.descriptions?.[wdLang()]?.value || e.descriptions?.en?.value || '')}</div></div>`;
  const info = [['🎂', t('lg.born'), [fmtW(born), age ? t('age', age) : '', L[qv(C('P19')[0])]].filter(Boolean).join(' · ')], ['🕊️', t('lg.died'), fmtW(died)],
    ['🌍', t('i.country'), [...new Set([...C('P1532'), ...C('P27')].map(c => L[qv(c)]).filter(Boolean))].slice(0, 2).join(', ')], ['🎯', t('lg.pos'), C('P413').map(c => L[qv(c)]).filter(Boolean).join(', ')],
    ['📏', t('lg.height'), val(C('P2048')[0])?.amount ? Math.round(+val(C('P2048')[0]).amount * (val(C('P2048')[0]).unit?.endsWith('Q11573') ? 100 : 1)) + ' cm' : '']].filter(r => r[2]);
  const infoCard = `<div class="card">${info.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>`;
  const nat = x => /national|mill[iî]|yaş altı|nationalmannschaft|сборная|sélection|selección|reprezentacja|under-|U-?\d\d/i.test(L[x.id] || '');
  const tRows = list => list.sort((a, b) => (a.from || '9999').localeCompare(b.from || '9999')).map(x => `<tr><td>${esc(x.from && x.from === x.to ? x.from : (x.from || '?') + '–' + (x.to || ''))}</td><td class="t" style="text-align:left">${esc(L[x.id])}</td><td>${x.apps ? +x.apps : ''}</td><td>${x.goals ? +x.goals : ''}</td></tr>`).join('');
  const tbl = (title, list) => list.length ? `<div class="card"><h2>${title}</h2><table><thead><tr><th>${t('lg.years')}</th><th style="text-align:left">${t('th.team')}</th><th>${t('lg.apps')}</th><th>${t('lg.goals')}</th></tr></thead><tbody>${tRows(list)}</tbody></table></div>` : '';
  const club = teams.filter(x => !nat(x)), natT = teams.filter(nat);
  const tot = club.reduce((s, x) => [s[0] + (+x.apps || 0), s[1] + (+x.goals || 0)], [0, 0]);
  const aw = {}; for (const a of awards) (aw[a.id] = aw[a.id] || []).push(a.y);
  const awCard = awards.length ? `<div class="card"><h2>🏆 ${t('lg.awards')} (${awards.length})</h2>${Object.entries(aw).sort((a, b) => b[1].length - a[1].length).map(([id, ys]) => `<div class="inforow"><span class="ic">${ys.length > 1 ? '×' + ys.length : '🏅'}</span><span class="v" style="text-align:left">${esc(L[id])}${ys.filter(Boolean).length ? `<small class="hint" style="display:block">${esc(ys.filter(Boolean).sort().join(', '))}</small>` : ''}</span></div>`).join('')}</div>` : '';
  const bio = sum?.extract ? `<div class="card"><h2>📖 ${t('lg.bio')}</h2><div class="form-block ptext">${esc(sum.extract)}</div><div class="hint" style="padding:0 14px 12px"><a href="${esc(sum.content_urls?.mobile?.page || sum.content_urls?.desktop?.page || '#')}" target="_blank" rel="noopener">Wikipedia ›</a></div></div>` : '';
  const sums = tot[0] ? `<div class="card"><div class="statrow"><div><b>${tot[0]}</b><small>${t('lg.apps')}</small></div><div><b>${tot[1]}</b><small>${t('lg.goals')}</small></div><div><b>${club.length}</b><small>${t('lg.clubs')}</small></div><div><b>${awards.length}</b><small>${t('lg.awards')}</small></div></div></div>` : '';
  const k = 'legend';
  return hero + sums + seg(k, [t('lg.career'), t('lg.awards'), t('info')]) + pane(k, 0, tbl('🏟️ ' + t('lg.clubs'), club) + tbl('🌍 ' + t('lg.national'), natT) || `<div class="empty">${t('noInfo')}</div>`) + pane(k, 1, awCard || `<div class="empty">${t('noInfo')}</div>`) + pane(k, 2, infoCard + bio) + `<div class="hint" style="text-align:center;padding:8px">${t('lg.src')}</div>`;
}
async function viewSearch(q0) {
  setTitle(t('search.title'));
  if (q0) setTimeout(() => { const el = document.getElementById('sq'); if (el && !el.value) { el.value = decodeURIComponent(q0); runSearch(el.value); } }, 0);
  return `<div class="card"><div class="form-block sqrow"><input id="sq" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" placeholder="${esc(t('search.ph'))}"><button class="micbtn" data-voice aria-label="${esc(t('vs.mic'))}">🎤</button></div><div class="hint" id="vs-msg" style="padding:0 14px 8px"></div></div><div id="sres">${recentSearchHtml() || emptyState('search', t('search.hint'))}</div>`;
}
document.addEventListener('input', e => {
  if (e.target.id !== 'sq') return;
  clearTimeout(searchTimer); const v = e.target.value; searchTimer = setTimeout(() => runSearch(v), 300);
});


// ---- Match extras: man of the match vote, score prediction; community: leaderboard, notifications ----
// fan poll before kick-off: who wins? (members and visitors, one vote per device)
const devId = () => { let d = store.get('devid', ''); if (!d) { d = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 20); store.set('devid', d); } return d; };
async function pollHtml(league, id, h, a) {
  let d; try { d = await capi('GET', `/poll?m=${encodeURIComponent(league + ':' + id)}&dev=${devId()}`); } catch { return ''; }
  const pc = k => d.n ? Math.round(d[k] / d.n * 100) : 0;
  const btn = (k, label) => `<button class="pollbtn ${d.mine === k ? 'on' : ''}" data-poll="${esc(league)}|${esc(id)}|${k}"><span>${label}</span>${d.mine || d.n >= 5 ? `<b>${pc(k)}%</b><i style="width:${pc(k)}%"></i>` : ''}</button>`;
  return `<div class="card pollcard"><h2>🗳️ ${t('poll.title')}${d.n ? ` <small class="hint">· ${t('poll.n', d.n)}</small>` : ''}</h2><div class="pollrow">${btn('h', esc(h.team.shortDisplayName || h.team.displayName))}${btn('d', t('poll.draw'))}${btn('a', esc(a.team.shortDisplayName || a.team.displayName))}</div>${d.mine ? '' : `<div class="hint" style="padding:0 14px 12px">${t('poll.hint')}</div>`}</div>`;
}
// player ratings 1-10 after kick-off: everybody's average and my own marks
async function ratingsHtml(league, id, rosters, st) {
  const m = league + ':' + id;
  let d = { avg: [], mine: {}, voters: 0 };
  try { d = await capi('GET', '/rate?m=' + encodeURIComponent(m)); } catch {}
  const av = Object.fromEntries(d.avg.map(x => [String(x.player_id), x]));
  const col = v => v >= 8 ? '#16a34a' : v >= 6.5 ? '#65a30d' : v >= 5 ? '#d97706' : '#dc2626';
  const played = r => r.roster.filter(x => x.starter || x.subbedIn);
  const top = d.avg.slice(0, 3).map((x, i) => `<div class="rttop"><span>${['🥇', '🥈', '🥉'][i]}</span><b>${esc(x.player_name)}</b><small>${esc(x.team || '')}</small><i style="background:${col(x.avg)}">${x.avg.toFixed ? x.avg.toFixed(1) : x.avg}</i></div>`).join('');
  const teams = rosters.map(r => `<div class="card"><h2>${img(r.team.id)} ${esc(r.team.displayName)}</h2>${played(r).map(x => {
    const pid = String(x.athlete.id), a = av[pid], mine = d.mine[pid] || '';
    return `<div class="rtrow"><span class="no">${esc(x.jersey ?? '')}</span><span class="nm">${esc(x.athlete.displayName)}${x.starter ? '' : ` <small>${t('subs')}</small>`}</span>${a ? `<i class="rtavg" style="background:${col(a.avg)}" title="${a.n}">${(+a.avg).toFixed(1)}</i>` : '<i class="rtavg none">–</i>'}
      ${acct ? `<select data-rate="${esc(pid)}" data-name="${esc(x.athlete.displayName)}" data-team="${esc(r.team.displayName)}"><option value="">${t('rt.mine')}</option>${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(v => `<option ${+mine === v ? 'selected' : ''}>${v}</option>`).join('')}</select>` : ''}</div>`;
  }).join('') || `<div class="empty" style="padding:14px">${t('noSquad')}</div>`}</div>`).join('');
  return `<div class="card ratecard"><h2>⭐ ${t('rt.title')}${d.voters ? ` <small class="hint">· ${t('rt.voters', d.voters)}</small>` : ''}</h2>${top || `<div class="empty" style="padding:14px">${t('rt.none')}</div>`}</div>`
    + `<div class="ratelist" data-ratem="${esc(league)}|${esc(id)}">${teams}${acct ? `<div class="form-block"><button class="btn" data-rate-save>${t('rt.save')}</button><div class="hint" id="rt-msg"></div></div>` : `<div class="empty">${t('rt.login')}</div>`}</div>`;
}
document.addEventListener('click', async e => {
  const pb = e.target.closest('[data-poll]');
  if (pb) {
    const [lg, ev, pick] = pb.dataset.poll.split('|'), card = pb.closest('.pollcard');
    try { await capi('POST', '/poll', { league: lg, event: ev, pick, dev: devId() }); } catch (err) { alert(errText(err)); return; }
    const m = document.querySelectorAll('.hero .side span'); // fresh numbers in place
    const html = await pollHtml(lg, ev, { team: { displayName: m[0]?.textContent || '' } }, { team: { displayName: m[1]?.textContent || '' } });
    if (card && html) card.outerHTML = html;
    return;
  }
  const rs = e.target.closest('[data-rate-save]');
  if (rs) {
    const box = rs.closest('[data-ratem]'), [lg, ev] = box.dataset.ratem.split('|'), msg = document.getElementById('rt-msg');
    const ratings = [...box.querySelectorAll('select[data-rate]')].filter(s => s.value).map(s => ({ id: s.dataset.rate, name: s.dataset.name, team: s.dataset.team, score: +s.value }));
    if (!ratings.length) { msg.textContent = t('rt.pick'); return; }
    try { await capi('POST', '/rate', { league: lg, event: ev, ratings }); msg.textContent = '✅ ' + t('rt.saved', ratings.length); pageCache.clear(); setTimeout(() => render(true), 600); } catch (err) { msg.textContent = '❌ ' + errText(err); }
  }
});
async function motmHtml(key, rosters, st) {
  if (st.cls === 'pre' || st.cls === 'ppd') return `<div class="empty">${t('mvp.hintPre')}</div>`;
  let d = { votes: [], mine: null, total: 0 };
  try { d = await capi('GET', '/motm/' + key); } catch { return `<div class="empty">${t('c.err.network')}</div>`; }
  const n = Object.fromEntries(d.votes.map(v => [String(v.player_id), v.n]));
  const top = d.votes.slice(0, 3).map(v => `<div class="mvtop"><b>${esc(v.name)}</b><small>${esc(v.team || '')}</small><span>${v.n} · ${Math.round(v.n / d.total * 100)}%</span><i style="width:${Math.round(v.n / d.total * 100)}%"></i></div>`).join('');
  const rows = rosters.map(r => `<div class="card"><h2>${img(r.team.id)} ${esc(r.team.displayName)}</h2>${r.roster.map(x => { const id = String(x.athlete.id), mine = d.mine === id;
    return `<div class="mvrow"><span class="no">${esc(x.jersey ?? '')}</span><span class="nm">${esc(x.athlete.displayName)}${x.starter ? '' : ` <small>${t('subs')}</small>`}</span><small>${n[id] || ''}</small>
      <button class="cbtn ${mine ? 'on' : ''}" data-motm="${esc(key)}" data-pid="${esc(id)}">${mine ? t('mvp.voted') : t('mvp.vote')}</button></div>`; }).join('')}</div>`).join('');
  return `<div class="card"><h2>⭐ ${t('mvp.title')}${d.total ? ` · ${t('mvp.total', d.total)}` : ''}</h2>${top || `<div class="empty" style="padding:14px">${t('mvp.none')}</div>`}${acct ? '' : `<div class="form-block"><div class="hint">${t('mvp.login')}</div><a class="btn" href="#/profile" style="text-align:center">${t('c.login')} ›</a></div>`}</div>` + rows;
}
// win / draw / win chances: ESPN's predictor or win-probability when it has one, otherwise the bookmaker odds ESPN lists, turned into percentages
function probFrom(j) {
  const pr = j?.predictor, hp = parseFloat(pr?.homeTeam?.gameProjection), ap = parseFloat(pr?.awayTeam?.gameProjection);
  if (isFinite(hp) && isFinite(ap)) return { h: Math.round(hp), d: Math.max(0, Math.round(100 - hp - ap)), a: Math.round(ap), src: 'ESPN' };
  const w = (j?.winprobability || []).at(-1);
  if (w && isFinite(w.homeWinPercentage)) { const h = w.homeWinPercentage * 100, d = (w.tiePercentage || 0) * 100; return { h: Math.round(h), d: Math.round(d), a: Math.round(100 - h - d), src: 'ESPN' }; }
  const o = (j?.pickcenter || j?.odds || []).find(x => x.homeTeamOdds?.moneyLine != null && x.awayTeamOdds?.moneyLine != null);
  if (o) {
    const p = ml => ml > 0 ? 100 / (ml + 100) : -ml / (-ml + 100), v = [p(+o.homeTeamOdds.moneyLine), p(+(o.drawOdds?.moneyLine ?? 0)) * (o.drawOdds?.moneyLine != null ? 1 : 0), p(+o.awayTeamOdds.moneyLine)], s = v[0] + v[1] + v[2];
    if (s > 0) return { h: Math.round(v[0] / s * 100), d: Math.round(v[1] / s * 100), a: Math.round(v[2] / s * 100), src: o.provider?.name || t('pred.odds') };
  }
  return null;
}
const probBar = (p, lh, la) => `<div class="probbar"><div class="pbl"><b>${p.h}%</b><span>${esc(lh)}</span></div><div class="pbl mid"><b>${p.d}%</b><span>${t('pred.draw')}</span></div><div class="pbl r"><b>${p.a}%</b><span>${esc(la)}</span></div>
  <div class="pbar"><i class="h" style="width:${p.h}%"></i><i class="d" style="width:${p.d}%"></i><i class="a" style="width:${p.a}%"></i></div></div>`;
async function predictHtml(key, comp, st, h, a, pj) {
  const [lg, ev] = key.split(':');
  const cs = await capi('GET', '/predict/stats?m=' + encodeURIComponent(key)).catch(() => null);
  const lh = h.team.displayName, la = a.team.displayName;
  const chances = (pj ? `<div class="predsec"><small class="hint">${t('pred.prob')} · ${esc(pj.src)}</small>${probBar(pj, lh, la)}</div>` : '')
    + (cs && cs.n ? `<div class="predsec"><small class="hint">${t('pred.users', cs.n)}</small>${probBar({ h: Math.round(cs.h / cs.n * 100), d: Math.round(cs.d / cs.n * 100), a: Math.round(cs.a / cs.n * 100) }, lh, la)}${cs.top ? `<small class="hint">${t('pred.top', cs.top.home + '-' + cs.top.away)}</small>` : ''}</div>` : '');
  let mine = null;
  if (acct) { try { mine = (await capi('GET', '/predict/mine?m=' + encodeURIComponent(key))).mine; } catch {} }
  const open = st.cls === 'pre' && new Date(comp.date) > new Date();
  const head = `<h2>🎯 ${t('pred.title')}</h2>${chances}`;
  const link = `<a class="btn ghost" href="#/leaderboard" style="text-align:center;margin:0 12px 12px">🏆 ${t('pred.lb')} ›</a>`;
  if (!open) return `<div class="card">${head}<div class="form-block">${mine ? `<div class="inforow"><span class="k">${t('pred.mineLbl')}</span><span class="v">${mine.home} - ${mine.away}${mine.settled === 1 ? ` · ${t('pred.pts', mine.pts)}` : ''}</span></div>` : `<div class="hint">${t('pred.closed')}</div>`}</div>${link}</div>`;
  if (!acct) return `<div class="card">${head}<div class="form-block"><div class="hint">${t('pred.hint')}</div><a class="btn" href="#/profile" style="text-align:center">${t('c.login')} ›</a></div>${link}</div>`;
  return `<div class="card">${head}<div class="form-block"><div class="hint">${t('pred.hint')}</div>
    <div class="predrow"><span>${esc(h.team.displayName)}</span><input id="pr-h" type="number" inputmode="numeric" min="0" max="20" value="${mine ? mine.home : ''}" placeholder="0"><b>-</b><input id="pr-a" type="number" inputmode="numeric" min="0" max="20" value="${mine ? mine.away : ''}" placeholder="0"><span>${esc(a.team.displayName)}</span></div>
    <button class="btn" data-predict="${esc(lg)}|${esc(ev)}">${t('pred.send')}</button><div class="hint" id="pr-msg">${mine ? t('pred.mine', mine.home + '-' + mine.away) : ''}</div></div>${link}</div>`;
}
async function viewLeaderboard(scope) {
  setTitle(t('lb.tab'));
  const sc = scope === 'all' ? 'all' : 'week';
  let d; try { d = await capi('GET', '/leaderboard?scope=' + sc); } catch (e) { return communityNav('lb') + `<div class="empty">⚠️ ${esc(errText(e))}</div>`; }
  const chips = `<div class="chips"><a data-replace href="#/leaderboard/week" class="${sc === 'week' ? 'on' : ''}">${t('lb.week')}</a><a data-replace href="#/leaderboard/all" class="${sc === 'all' ? 'on' : ''}">${t('lb.all')}</a></div>`;
  const board = d.board.length ? `<div class="card">${d.board.map((r, i) => `<div class="lbrow"><span class="rk">${i + 1}</span>${avatar(r, 30)}<span class="nm">${nameHtml(r)}${r.username === d.lastWinner ? ` <span class="bdg">🏆 ${t('bdg.weekly')}</span>` : ''}</span><small>${r.exact} ${t('lb.exact')}</small><b>${r.pts}</b></div>`).join('')}</div>` : `<div class="empty">${t('lb.empty')}</div>`;
  const mine = d.mine.length ? `<div class="card"><h2>${t('lb.mine')}</h2>${d.mine.map(m => `<a class="lrow" href="#/match/${m.match.split(':')[0]}/${m.match.split(':')[1]}"><span class="nm" style="padding:10px 12px">${esc(m.home_name)} - ${esc(m.away_name)}<small class="hint" style="display:block">${t('pred.mineLbl')}: ${m.home}-${m.away}${m.settled === 1 ? ` · ${m.rh}-${m.ra}` : ''}</small></span><span class="pcount">${m.settled === 1 ? t('pred.pts', m.pts) : '⏳'}</span></a>`).join('')}</div>` : '';
  // champions of past weeks (awarded automatically every Monday 09:00)
  const w = await capi('GET', '/weekly').catch(() => ({ weeks: [] }));
  const byWeek = {}; for (const x of w.weeks || []) (byWeek[x.week] ||= []).push(x);
  const champs = Object.keys(byWeek).length ? `<div class="card"><h2>🏆 ${t('wk.champs')}</h2>${Object.entries(byWeek).sort((a, b) => b[0] - a[0]).slice(0, 8).map(([wk, xs]) => `<div class="wkrow"><small>${esc(fmtD(+wk * 1000, { day: 'numeric', month: 'short' }))} – ${esc(fmtD((+wk + 6 * 86400) * 1000, { day: 'numeric', month: 'short' }))}</small>${xs.sort((a, b) => a.place - b.place).map(x => `<a href="#/user/${encodeURIComponent(x.username)}">${['🥇', '🥈', '🥉'][x.place - 1]} ${esc(x.username)} <small>${x.pts}</small></a>`).join('')}</div>`).join('')}</div>` : '';
  const nextAward = (() => { const n = new Date(); const ist = new Date(n.getTime() + 3 * 3600e3); const dow = (ist.getUTCDay() + 6) % 7; const mon = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + (7 - dow)) + 6 * 3600e3; const ms = mon - n.getTime(); const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5); return t('wk.next', d, h); })();
  // an invite link (#/leaderboard/pg/CODE) fills the join box
  const pgHtml = await pgroupsCard().catch(() => '');
  const inv = (location.hash.match(/#\/leaderboard\/pg\/([A-Z0-9]{4,8})/i) || [])[1];
  if (inv) setTimeout(() => { const i = document.getElementById('pg-code'); if (i) { i.value = inv.toUpperCase(); i.scrollIntoView({ block: 'center' }); } }, 300);
  return communityNav('lb') + `<div class="card"><div class="form-block"><div class="hint">${t('pred.hint')}</div><div class="wknext">⏳ ${nextAward}</div></div></div>` + pgHtml + chips + board + champs + mine;
}
async function viewNotifs() {
  setTitle(t('nt.title'));
  if (!acct) return communityNav('notifs') + authForm();
  let d; try { d = await capi('GET', '/notifs'); } catch (e) { return communityNav('notifs') + `<div class="empty">⚠️ ${esc(errText(e))}</div>`; }
  const txt = i => t('nt.' + i.kind, i.who);
  const html = d.items.length ? `<div class="card">${d.items.map(i => `<a class="lrow ${i.read ? '' : 'unread'}${/^mod_/.test(i.kind) ? ' modn' : ''}" href="${i.kind === 'weekly' ? '#/leaderboard' : i.kind === 'fantasy' ? '#/fantasy/last' : i.kind === 'dm' ? '#/dm/' + encodeURIComponent(i.who) : /^mod_/.test(i.kind) || !i.post_id ? '#/user/' + encodeURIComponent(i.who) : '#/post/' + i.post_id}"><span class="nm" style="padding:10px 12px">${esc(txt(i))}<small class="hint" style="display:block">“${esc(i.text || '')}” · ${ago(i.created)}</small></span></a>`).join('')}</div>` : `<div class="empty">${t('nt.empty')}</div>`;
  if (d.unread) { capi('POST', '/notifs/read').then(() => { notifCount = 0; notifAt = 0; document.querySelectorAll('.nbadge,.tbadge').forEach(x => x.remove()); pollNotifs(true); }).catch(() => {}); }
  return communityNav('notifs') + html;
}

// ---- home-screen shortcut "my team's live match": straight to a favourite's game in progress, else its next one
async function viewGoLive() {
  setTitle(t('gl.title'));
  const fs = favs.filter(f => /^\d+$/.test(String(f.id)) && f.league && f.league !== 'all').slice(0, 12);
  if (!fs.length) return `<div class="empty">${t('noFavs')}</div>`;
  const all = await Promise.all(fs.map(f => teamEvents(f.id, f.league).then(te => ({ f, te })).catch(() => null)));
  const pick = kind => all.filter(Boolean).flatMap(({ f, te }) => (te[kind] || []).map(e => ({ f, e }))).sort((x, y) => new Date(x.e.date) - new Date(y.e.date))[0];
  const hit = pick('live') || pick('next');
  if (!hit) return `<div class="empty">${t('gl.none')}</div>`;
  setTimeout(() => location.replace(`#/match/all/${hit.e.id}`), 0); // 'all': the match page finds the competition itself (league, cup or Europe)
  return `<div class="empty">⏳ ${esc(hit.e.name || '')}</div>`;
}

// ---- private prediction groups: create one, share the code, friends join and get their own table
async function pgroupsCard() {
  if (!acct) return '';
  const d = await capi('GET', '/pgroup').catch(() => ({ groups: [] }));
  return `<div class="card"><h2>👥 ${t('pg.title')}</h2>${(d.groups || []).map(g => `<a class="lrow" href="#/pgroup/${g.id}"><span class="nm" style="padding:10px 12px"><b>${esc(g.name)}</b><small class="hint" style="display:block">${t('pg.members', g.members)}</small></span><span class="go">›</span></a>`).join('') || `<div class="hint" style="padding:0 14px 8px">${t('pg.empty')}</div>`}
    <div class="form-block pgform"><input id="pg-name" maxlength="40" placeholder="${esc(t('pg.namePh'))}"><button class="btn" data-pg-create>➕ ${t('pg.create')}</button></div>
    <div class="form-block pgform"><input id="pg-code" maxlength="8" placeholder="${esc(t('pg.codePh'))}" style="text-transform:uppercase"><button class="btn ghost" data-pg-join>🔑 ${t('pg.join')}</button></div><div class="hint" id="pg-msg" style="padding:0 14px 10px"></div></div>`;
}
async function viewPGroup(id, scope) {
  setTitle(t('pg.title'));
  if (!acct) return authForm();
  const sc = scope === 'week' ? 'week' : 'all';
  let d; try { d = await capi('GET', `/pgroup/${encodeURIComponent(id)}?scope=${sc}`); } catch (e) { return `<div class="empty">⚠️ ${esc(errText(e))}</div>`; }
  setTitle(d.group.name);
  const link = `${location.href.split('#')[0]}#/leaderboard/pg/${d.group.code}`;
  const chips = `<div class="chips"><a data-replace href="#/pgroup/${d.group.id}/all" class="${sc === 'all' ? 'on' : ''}">${t('lb.all')}</a><a data-replace href="#/pgroup/${d.group.id}/week" class="${sc === 'week' ? 'on' : ''}">${t('lb.week')}</a></div>`;
  const board = `<div class="card">${d.board.map((r, i) => `<div class="lbrow"><span class="rk">${i < 3 && r.pts ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>${avatar(r, 30)}<span class="nm">${nameHtml(r)}<small class="hint" style="display:block">${t('pg.line', r.n, r.exact)}</small></span><b class="pts">${r.pts}</b></div>`).join('')}</div>`;
  const inv = `<div class="card"><div class="form-block"><div class="hint">${t('pg.invite')}</div><div class="pgcode">${esc(d.group.code)}</div><button class="btn" data-pg-share="${esc(d.group.code)}" data-pg-name="${esc(d.group.name)}" data-pg-link="${esc(link)}">📤 ${t('pg.share')}</button></div></div>`;
  return chips + board + inv + `<div class="form-block"><a class="btn ghost" href="#/leaderboard">🎯 ${t('pg.predictMore')}</a><button class="btn ghost danger" data-pg-leave="${d.group.id}">${d.group.mine ? t('pg.delete') : t('pg.leave')}</button></div>`;
}
document.addEventListener('click', async e => {
  const cp = e.target.closest('[data-copy]');
  if (cp) { try { await navigator.clipboard.writeText(cp.dataset.copy); cp.textContent = '✅ ' + t('cal.copied'); } catch {} return; }
  const msg = () => document.getElementById('pg-msg');
  if (e.target.closest('[data-pg-create]')) {
    const name = document.getElementById('pg-name')?.value.trim(); if (!name) return;
    try { const r = await capi('POST', '/pgroup/create', { name }); location.hash = `#/pgroup/${r.id}`; } catch (err) { if (msg()) msg().textContent = '❌ ' + errText(err); }
    return;
  }
  if (e.target.closest('[data-pg-join]')) {
    const code = document.getElementById('pg-code')?.value.trim(); if (!code) return;
    try { const r = await capi('POST', '/pgroup/join', { code }); location.hash = `#/pgroup/${r.id}`; } catch (err) { if (msg()) msg().textContent = '❌ ' + errText(err); }
    return;
  }
  const sh = e.target.closest('[data-pg-share]');
  if (sh) {
    const text = t('pg.shareText', sh.dataset.pgName, sh.dataset.pgShare);
    if (navigator.share) navigator.share({ title: 'Grafondex', text, url: sh.dataset.pgLink }).catch(() => {});
    else { try { await navigator.clipboard.writeText(text + ' ' + sh.dataset.pgLink); sh.textContent = '✅ ' + t('cal.copied'); } catch {} }
    return;
  }
  const lv = e.target.closest('[data-pg-leave]');
  if (lv) { if (!confirm(t('pg.leaveQ'))) return; try { await capi('POST', `/pgroup/${lv.dataset.pgLeave}/leave`); location.hash = '#/leaderboard'; } catch {} }
});

// ---- news cards (ESPN) and player comparison ----

// news in the app language through the server (Google News headlines); ESPN's English feed only as a fallback
async function newsFor(q) {
  if (!workerBase()) return null;
  try {
    const r = await fetch(`${workerBase()}/api/news?q=${encodeURIComponent(q)}&lang=${LANG === 'ku' ? 'tr' : LANG}`);
    const j = await r.json();
    return (j.items || []).length ? j.items.map(x => ({ headline: x.title, published: x.date, source: x.source, desc: x.desc || '', images: x.image ? [{ url: x.image }] : undefined, links: { web: { href: x.link } } })) : null;
  } catch { return null; }
}
// when a team or player has no news of its own: Turkey + world headlines instead of an empty tab
async function generalNews() {
  const qs = LANG === 'tr' || LANG === 'ku' ? ['Türkiye gündem', 'dünya haberleri'] : ['Turkey news', 'world news'];
  const r = await Promise.all(qs.map(q => newsFor(q).catch(() => null)));
  const a = r[0] || [], b = r[1] || [], out = [];
  for (let i = 0; i < 6; i++) { if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); }
  return out;
}
const newsOr = async (p, title) => { const n = await p; return n && n.length ? newsCard(n, title) : newsCard(await generalNews().catch(() => []), t('news.general')); };
// news open inside the app: headline, picture, summary and the publisher's page in a frame (with a button to the original)
const ART = (() => { try { return new Map(JSON.parse(sessionStorage.getItem('gx-art') || '[]')); } catch { return new Map(); } })();
function artKey(a) {
  const k = [...a.u].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 5381).toString(36);
  if (!ART.has(k)) { ART.set(k, a); if (ART.size > 120) ART.delete(ART.keys().next().value); clearTimeout(artKey.t); artKey.t = setTimeout(() => { try { sessionStorage.setItem('gx-art', JSON.stringify([...ART])); } catch {} }, 300); }
  return k;
}
async function viewArticle(k) {
  const a = ART.get(k);
  if (!a) return `<div class="empty">${t('news.none')}</div>`;
  setTitle(a.src || t('news.title'));
  let host = ''; try { host = new URL(a.u).hostname.replace(/^www\./, ''); } catch {}
  return `<div class="card artcard">${a.img ? `<img class="artimg" src="${esc(a.img)}" alt="" onerror="this.remove()">` : ''}<div class="form-block"><h1 class="arth">${esc(a.h)}</h1>
      <div class="hint">${esc([a.src || host, a.d ? fmtD(new Date(a.d).getTime(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''].filter(Boolean).join(' · '))}</div>
      ${a.desc ? `<p class="ptext">${esc(a.desc)}</p>` : ''}
      <a class="btn" href="${esc(a.u)}" target="_blank" rel="noopener">${t('news.open')} ↗</a></div></div>
    <div class="card artframe"><iframe src="${esc(a.u)}" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" title="${esc(a.h)}"></iframe><div class="hint" style="padding:8px 14px">${t('news.frameHint')}</div></div>`;
}
const newsCard = (items, title) => {
  const rows = (items || []).filter(a => a.headline && (a.links?.web?.href || a.link)).slice(0, 10).map(a => {
    const pic = a.images?.[0]?.url, d = a.published || a.lastModified;
    const key = artKey({ h: a.headline, u: a.links?.web?.href || a.link, img: pic || '', src: a.source || '', d: d || '', desc: a.description || a.desc || '' });
    return `<a class="newsrow" href="#/article/${key}">${pic ? `<img loading="lazy" src="${esc(pic)}" alt="" onerror="this.remove()">` : '<span class="nph">📰</span>'}<span><b>${esc(a.headline)}</b><small>${a.source ? esc(a.source) + ' · ' : ''}${d ? esc(fmtD(new Date(d).getTime(), { day: 'numeric', month: 'long' })) : ''}</small></span></a>`;
  }).join('');
  return rows ? `<div class="card"><h2>📰 ${title}</h2>${rows}</div>` : `<div class="empty">${t('news.none')}</div>`;
};
async function viewCompare(sport, l1, id1, l2, id2) {
  setTitle(t('cmp.title'));
  const ld = (lg, id) => get(`${ESPN_C}${sport}/${lg}/athletes/${id}`, 300000).then(j => j.athlete).catch(() => null);
  const A = await ld(l1, id1);
  if (!A) return `<div class="empty">${t('pl.noData')}</div>`;
  if (!id2) return `<div class="card"><div class="form-block"><b>${esc(A.displayName)}</b><div class="hint">${t('cmp.pick')}</div>
    <input id="cq" data-cmp="${esc(sport)}/${esc(l1)}/${esc(id1)}" type="search" autocomplete="off" placeholder="${esc(t('search.ph'))}"></div></div><div id="cres"></div>`;
  const Bp = await ld(l2, id2);
  if (!Bp) return `<div class="empty">${t('pl.noData')}</div>`;
  const pic = (a, lg) => `<div class="cmph"><span class="pph sm" style="--pc:${pcol(a.displayName)}"><span class="pin_">${esc(initials(a.displayName))}</span>${phImg(a.headshot?.href || hsUrl(sport, lg, a.id), a.displayName, sport)}</span><a href="#/player/${esc(sport)}/${esc(lg)}/${esc(a.id)}"><b>${esc(a.displayName)}</b></a><small>${esc(a.team?.displayName || '')}</small></div>`;
  const num = v => parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  const row = (label, x, y, cmp, force) => { const nx = num(x), ny = num(y); const wx = force ? force === 'l' : cmp && nx > ny, wy = force ? force === 'r' : cmp && ny > nx; return `<tr><td class="${wx ? 'win' : ''}">${esc(x ?? '–')}</td><th>${esc(label)}</th><td class="${wy ? 'win' : ''}">${esc(y ?? '–')}</td></tr>`; };
  const info = [[t('pl.age'), A.age, Bp.age, false], [t('pl.height'), unitH(A.displayHeight), unitH(Bp.displayHeight), false], [t('pl.weight'), unitW(A.displayWeight), unitW(Bp.displayWeight), false], [t('pl.nation'), A.citizenship, Bp.citizenship, false]];
  const sa = A.statsSummary?.statistics || [], sb = Object.fromEntries((Bp.statsSummary?.statistics || []).map(x => [x.name, x]));
  const stats = sa.filter(x => sb[x.name]).map(x => [x.shortDisplayName || x.displayName, x.displayValue, sb[x.name].displayValue, true]);
  // market value (Transfermarkt through the Worker) for footballers
  if (sport === 'soccer' && workerBase()) {
    const mv = p => get(`${workerBase()}/api/value?n=${encodeURIComponent(p.displayName)}&t=${encodeURIComponent(p.team?.displayName || '')}`, 86400000).then(v => v?.v || null).catch(() => null);
    const [va, vb] = await Promise.all([mv(A), mv(Bp)]);
    const eur = v => { const m = String(v || '').replace(',', '.').match(/([\d.]+)\s*(bn|mil|m|k|bin|mio)?/i); if (!m) return 0; const u = (m[2] || '').toLowerCase(); return +m[1] * (u === 'bn' ? 1e9 : /^(mil|m|mio)$/.test(u) ? 1e6 : /^(k|bin)$/.test(u) ? 1e3 : 1); };
    if (va || vb) info.push(['💶 ' + t('cmp.value'), va || '–', vb || '–', false, eur(va) > eur(vb) ? 'l' : eur(vb) > eur(va) ? 'r' : '']);
  }
  return `<div class="card"><div class="cmphead">${pic(A, l1)}<b class="vs">VS</b>${pic(Bp, l2)}</div>
    <table class="cmp"><tbody>${info.map(r => row(...r)).join('')}${stats.length ? `<tr><th colspan="3" class="sec">${t('pl.current')} · ${esc(A.statsSummary?.displayName || '')}</th></tr>` + stats.map(r => row(...r)).join('') : ''}</tbody></table></div>
    <a class="btn ghost" href="#/compare/${esc(sport)}/${esc(l1)}/${esc(id1)}" style="display:block;text-align:center">${t('cmp.other')}</a>`;
}
document.addEventListener('input', e => {
  if (e.target.id !== 'cq') return;
  clearTimeout(searchTimer); const v = e.target.value, base = e.target.dataset.cmp, [sport, l1, id1] = base.split('/');
  searchTimer = setTimeout(async () => {
    const box = document.getElementById('cres'); if (!box || v.trim().length < 2) { if (box) box.innerHTML = ''; return; }
    const j = await get(`${ESPN_Q}query=${encodeURIComponent(v.trim())}&limit=12&type=player`, 120000).catch(() => ({}));
    const list = ((j.results || []).find(r => r.type === 'player')?.contents || []).filter(c => c.sport === sport && uidId(c.uid, 'a') && uidId(c.uid, 'a') !== id1);
    box.innerHTML = list.length ? `<div class="card">${list.map(c => `<div class="lrow"><a href="#/compare/${esc(base)}/${esc(c.defaultLeagueSlug || sport)}/${esc(uidId(c.uid, 'a'))}"><span class="nm">${esc(c.displayName)}<small class="hint" style="display:block">${esc([c.subtitle, c.description].filter(Boolean).join(' · '))}</small></span><span class="go">›</span></a></div>`).join('')}</div>` : `<div class="empty">${t('search.none')}</div>`;
  }, 300);
});

// ---- Favourites ----
async function viewFavs() {
  setTitle(t('nav.favs'));
  const other = OTHER_SPORTS.includes(curSport);
  const mineF = other ? [] : favs.filter(f => sportOf(f.league) === curSport);
  const mineP = pfavs.filter(f => tabOfSport(f.sport) === curSport);
  const mineX = xfavs.filter(f => f.sport === curSport);
  // handball / volleyball / basketball favourites: the team link and every upcoming match
  const xCards = await Promise.all(mineX.map(async f => {
    const c = await get(`${workerBase()}/tcomps?sport=${encodeURIComponent(f.sport)}&name=${encodeURIComponent(f.name)}`, 300000).catch(() => null);
    const gs = (c?.games || []).filter(g => g.state !== 'post' && g.time).sort((a, b) => String(a.time).localeCompare(String(b.time)));
    const row = g => `<div class="match static"><div class="mtime pre">${esc(dshort(g.time))}<small>${esc(hm(g.time))}</small></div><div class="teams">${[g.home, g.away].map(n => `<div class="tm">${phLogo(n, f.sport)}<span class="tn">${esc(n)}</span></div>`).join('')}${g.comp ? `<small class="hint">${esc(g.comp)}</small>` : ''}</div></div>`;
    return `<div class="card"><h2>${phLogo(f.name, f.sport)} <span style="color:var(--text);font-size:14px">${esc(f.name)}</span><a href="#/tx/${esc(f.sport)}/${encodeURIComponent(f.name)}">${t('teamLink')}</a></h2>${gs.map(row).join('') || `<div class="empty" style="padding:16px">${t('noMatch')}</div>`}</div>`;
  }));
  const xHtml = xCards.join('');
  const tffF = mineF.filter(f => String(f.id).startsWith('tff:')), espnF = mineF.filter(f => !String(f.id).startsWith('tff:'));
  const tffCards = (await Promise.all(tffF.map(async f => {
    const nm = String(f.id).slice(4), d = await get(`${workerBase()}/tffteam?pid=${TFF_PID[f.league]}&grup=${encodeURIComponent(f.grup || '')}&name=${encodeURIComponent(nm)}`, 300000).catch(() => null);
    const ms = (d?.matches || []), next = ms.filter(m => !tffScore(m.score)), last = ms.filter(m => tffScore(m.score)).slice(-1);
    return `<div class="card"><h2>${tffLogo(f.name)} <span style="color:var(--text);font-size:14px">${esc(f.name)}</span><a href="#/tt/${esc(f.league)}/${encodeURIComponent(nm)}/${esc(f.grup || '')}">${t('teamLink')}</a></h2>${[...last, ...next].map(m => tffRow(m, f.league, true)).join('') || `<div class="empty" style="padding:14px">${t('noMatches')}</div>`}</div>`;
  }))).join('');
  const html = (espnF.length ? await favCards(espnF) : '') + tffCards + xHtml + (mineP.length ? await favPlayers(mineP) : '');
  // a calendar the phone subscribes to (webcal): it keeps itself up to date with every followed football team's matches
  const subT = favs.filter(f => sportOf(f.league) === 'soccer' && /^\d+$/.test(String(f.id)) && f.league !== 'all').slice(0, 20).map(f => `${f.league}:${f.id}`);
  const subUrl = subT.length && workerBase() ? `${workerBase()}/ics?t=${subT.join(',')}&lang=${LANG}` : '';
  const calAll = favs.length || xfavs.length ? `<div class="card"><h2>📅 ${t('cal.title')}</h2>${subUrl ? `<div class="form-block"><a class="btn" href="${esc(subUrl.replace(/^https:/, 'webcal:'))}">🔄 ${t('cal.sub')}</a><div class="hint">${t('cal.subHint')}</div><button class="btn ghost" data-copy="${esc(subUrl)}">📋 ${t('cal.copy')}</button></div>` : ''}<div class="form-block"><button class="btn ghost" data-ics-all>📥 ${t('o.calAll')}</button></div></div>` : '';
  const rooms = espnF.length ? `<div class="card"><h2>💬 ${t('room.mine')}</h2>${espnF.map(f => `<a class="lrow" href="#/room/${esc(f.league)}/${esc(f.id)}/${encodeURIComponent(f.name)}">${img(f.id, '', f.league)}<span class="nm" style="padding:10px 12px">${esc(f.name)} ${t('room.tab')}</span><span class="go">›</span></a>`).join('')}</div>` : '';
  const wkBtn = favs.some(f => /^\d+$/.test(String(f.id)) && sportOf(f.league) === 'soccer') ? `<div class="card wkcard"><div class="form-block"><b>${t('wk.title')}</b><div class="hint">${t('wk.hint')}</div><button class="btn" data-weekcard>📤 ${t('wk.btn')}</button></div></div>` : '';
  return sportBar() + rooms + (html || emptyState('star', other ? t('c.otherNote') : t('noFavs'))) + wkBtn + calAll;
}
async function favCards(list) {
  const all = await Promise.all(list.map(f => teamEvents(f.id, f.league).then(e => ({ f, e })).catch(() => ({ f, e: { past: [], live: [], next: [] } }))));
  return all.map(({ f, e }) => {
    const rows = [...e.live, ...e.past.slice(0, 1), ...e.next].map(ev => matchRow(ev, leagueOfEvent(ev, f.league), true)).join('');
    return `<div class="card"><h2>${img(f.id, '', f.league)} <span style="color:var(--text);font-size:14px">${esc(f.name)}</span><a href="#/team/${f.league}/${f.id}">${t('teamLink')}</a></h2>${rows || `<div class="empty" style="padding:16px">${t('noMatch')}</div>`}</div>`;
  }).join('');
}

// ---- Leagues: list + one page per league ----
const LTABS = [['fikstur', 'fixtures'], ['puan', 'table'], ['gol', 'tab.goals'], ['asist', 'tab.assists'], ['takim', 'tab.teams']];

async function viewLeagues() {
  setTitle(t('nav.leagues'));
  if (OTHER_SPORTS.includes(curSport)) return sportBar() + `<div class="empty">${t('c.otherNote')}</div>`;
  const row = L => `<div class="lrow"><a href="#/league/${L.id}">${lgIcon(L.id)}<span class="nm">${esc(lname(L))}${regionLine(L.id)}</span><span class="go">›</span></a>
    <button class="pin ${pinned.includes(L.id) ? 'on' : ''}" data-pin="${L.id}" aria-label="${t('pin')}">${pinned.includes(L.id) ? '★' : '☆'}</button></div>`;
  const ofSport = L => sportOf(L.id) === curSport;
  const pins = LEAGUES.filter(L => pinned.includes(L.id) && ofSport(L));
  return sportBar() + (pins.length ? `<div class="card"><h2>${t('pinned')}</h2>${pins.map(row).join('')}</div>` : '')
    + GROUPS.map((ls, g) => [g, ls.filter(L => ofSport(L) && shownL(L))]).filter(([, ls]) => ls.length)
      .map(([g, ls]) => `<div class="card"><h2>${curSport === 'soccer' ? t('grp.' + g) : t('cc.usa')}</h2>${ls.map(row).join('')}</div>`).join('');
}

// ESPN lists every match day; consecutive days (max 4) make one round
function rounds(dates) {
  const days = [...new Set(dates.map(d => d.slice(0, 10)))].sort();
  const out = [];
  for (const d of days) {
    const cur = out.at(-1), tt = Date.parse(d);
    if (cur && tt - Date.parse(cur.at(-1)) <= 864e5 && tt - Date.parse(cur[0]) < 4 * 864e5) cur.push(d);
    else out.push([d]);
  }
  return out;
}
const dayFmt = (d, o) => fmtD(d + 'T12:00:00', o);
const roundLabel = r => r.length === 1 ? dayFmt(r[0], { day: 'numeric', month: 'long' })
  : `${dayFmt(r[0], { day: 'numeric', month: 'short' })} – ${dayFmt(r.at(-1), { day: 'numeric', month: 'short' })}`;

// NFL: ESPN's own weeks (preseason, regular season, playoffs)
async function nflFixturesHtml(league, start) {
  const base = `#/league/${league}/fikstur`;
  const sb = await get(`${api(league)}/scoreboard`, HOUR);
  const weeks = (sb.leagues?.[0]?.calendar || []).flatMap(st => (st.entries || []).map(e => ({ key: `${st.value}-${e.value}`, type: st.value, week: e.value, label: e.label, end: e.endDate })));
  if (!weeks.length) return `<div class="empty">${t('noMatches')}</div>`;
  const cur = weeks.findIndex(w => Date.parse(w.end) >= Date.now());
  let i = start ? weeks.findIndex(w => w.key === start) : -1;
  if (i < 0) i = cur >= 0 ? cur : weeks.length - 1;
  const w = weeks[i];
  const label = x => x.type === '2' || x.type === 2 ? t('week', x.week) : x.label;
  const j = await get(`${api(league)}/scoreboard?seasontype=${w.type}&week=${w.week}`);
  const evs = (j.events || []).sort((x, y) => new Date(x.date) - new Date(y.date));
  const nav = `<div class="roundnav">
    <a data-replace href="${i > 0 ? `${base}/${weeks[i - 1].key}` : '#'}" class="${i > 0 ? '' : 'off'}" aria-label="${t('prevRound')}">‹</a>
    <select data-round-pick="${league}">${weeks.map((x, k) => `<option value="${x.key}" ${k === i ? 'selected' : ''}>${k === cur ? '● ' : ''}${esc(label(x))}</option>`).join('')}</select>
    <a data-replace href="${i < weeks.length - 1 ? `${base}/${weeks[i + 1].key}` : '#'}" class="${i < weeks.length - 1 ? '' : 'off'}" aria-label="${t('nextRound')}">›</a></div>`;
  if (!evs.length) return nav + `<div class="empty">${t('noMatchesRange')}</div>`;
  const byDay = new Map();
  for (const e of evs) { const k = fmtD(e.date, { weekday: 'long', day: 'numeric', month: 'long' }); (byDay.get(k) || byDay.set(k, []).get(k)).push(e); }
  return nav + `<div class="weektitle">${esc(label(w))}</div>` + [...byDay].map(([k, es]) => `<div class="card"><h2 style="text-transform:capitalize">${esc(k)}</h2>${es.map(e => matchRow(e, league)).join('')}</div>`).join('');
}

async function fixturesHtml(league, start) {
  if (sportOf(league) === 'football') return nflFixturesHtml(league, start);
  const base = `#/league/${league}/fikstur`;
  // match days; some leagues lack this list, then the scoreboard's own day calendar is used
  let dates = (await get(`${core(league)}/calendar/ondays`, HOUR).catch(() => null))?.eventDate?.dates;
  if (!dates?.length) {
    const sb = await get(`${api(league)}/scoreboard`, HOUR).catch(() => null);
    dates = (sb?.leagues?.[0]?.calendar || []).filter(c => typeof c === 'string');
  }
  const today = new Date(), todayKey = isoDay(today);
  // NBA/NHL play every day: one day per page there
  let rs = sportOf(league) === 'soccer' ? rounds(dates) : [...new Set(dates.map(d => d.slice(0, 10)))].sort().map(d => [d]);
  if (!rs.length) {
    // no calendar at all: plain Monday–Sunday weeks around today
    const mon = addDays(today, -((today.getDay() + 6) % 7));
    rs = Array.from({ length: 53 }, (_, w) => Array.from({ length: 7 }, (_, k) => isoDay(addDays(mon, (w - 26) * 7 + k))));
  }
  const cur = rs.findIndex(y => y.at(-1) >= todayKey);
  let i = start ? rs.findIndex(r => r[0] === start) : -1;
  if (i < 0) i = cur >= 0 ? cur : rs.length - 1;
  const r = rs[i];
  const lists = await Promise.all(r.map(d => get(`${api(league)}/scoreboard?dates=${d.replaceAll('-', '')}`).then(j => j.events || []).catch(() => [])));
  const evs = [...new Map(lists.flat().map(e => [e.id, e])).values()].sort((x, y) => new Date(x.date) - new Date(y.date));
  const weekOf = await matchweeks(league, rs, i, evs);
  const nav = `<div class="roundnav">
    <a data-replace href="${i > 0 ? `${base}/${rs[i - 1][0]}` : '#'}" class="${i > 0 ? '' : 'off'}" aria-label="${t('prevRound')}">‹</a>
    <select data-round-pick="${league}">${rs.map((x, k) => `<option value="${x[0]}" ${k === i ? 'selected' : ''}>${k === cur ? '● ' : ''}${weekOf(k) ? t('week', weekOf(k)) + ' · ' : ''}${roundLabel(x)}</option>`).join('')}</select>
    <a data-replace href="${i < rs.length - 1 ? `${base}/${rs[i + 1][0]}` : '#'}" class="${i < rs.length - 1 ? '' : 'off'}" aria-label="${t('nextRound')}">›</a></div>`;
  if (!evs.length) return nav + `<div class="empty">${t('noMatchesRange')}</div>`;
  const byDay = new Map();
  for (const e of evs) {
    const k = fmtD(e.date, { weekday: 'long', day: 'numeric', month: 'long' });
    (byDay.get(k) || byDay.set(k, []).get(k)).push(e);
  }
  return nav + (weekOf(i) ? `<div class="weektitle">${t('week', weekOf(i))}</div>` : '') + [...byDay].map(([k, es]) => `<div class="card"><h2 style="text-transform:capitalize">${esc(k)}</h2>${es.map(e => matchRow(e, league)).join('')}</div>`).join('');
}

// earlier seasons: month by month through the scoreboard's date range
async function pastFixturesHtml(league, season, start) {
  const base = `#/league/${league}/fikstur`;
  const months = Array.from({ length: 18 }, (_, k) => { const d = new Date(season, k, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; });
  let i = start ? months.indexOf(start) : -1;
  if (i < 0) i = 16; // May of the following year: the end of a European season
  const [y, m] = months[i].split('-').map(Number);
  const j = await get(`${api(league)}/scoreboard?dates=${y}${pad(m)}01-${y}${pad(m)}${pad(new Date(y, m, 0).getDate())}&limit=500`, 600000).catch(() => null);
  const evs = [...new Map((j?.events || []).map(e => [e.id, e])).values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  const mname = k => new Date(+months[k].slice(0, 4), +months[k].slice(5) - 1, 1).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric' });
  const nav = `<div class="roundnav">
    <a data-replace href="${i > 0 ? `${base}/${months[i - 1]}` : '#'}" class="${i > 0 ? '' : 'off'}" aria-label="${t('prevRound')}">‹</a>
    <select data-month-pick="${league}">${months.map((x, k) => `<option value="${x}" ${k === i ? 'selected' : ''}>${esc(mname(k))}</option>`).join('')}</select>
    <a data-replace href="${i < months.length - 1 ? `${base}/${months[i + 1]}` : '#'}" class="${i < months.length - 1 ? '' : 'off'}" aria-label="${t('nextRound')}">›</a></div>`;
  if (!evs.length) return nav + `<div class="empty">${t('noMatchesRange')}</div>`;
  const byDay = new Map();
  for (const e of evs) {
    const k = fmtD(e.date, { weekday: 'long', day: 'numeric', month: 'long' });
    (byDay.get(k) || byDay.set(k, []).get(k)).push(e);
  }
  return nav + [...byDay].map(([k, es]) => `<div class="card"><h2 style="text-transform:capitalize">${esc(k)}</h2>${es.map(e => matchRow(e, league)).join('')}</div>`).join('');
}

// ESPN has no matchweek numbers. When the calendar splits into exactly 2×(teams−1) rounds
// (a plain double round-robin) every round gets its number; otherwise only the shown round
// does, estimated from how many games most teams have played.
async function matchweeks(league, rs, shown, evs) {
  if (!leagueOf(league).table || sportOf(league) !== 'soccer') return () => null;
  const j = await get(`${apiSt(league)}/standings`, 120000).catch(() => null);
  const entries = (j?.children || []).flatMap(g => g.standings?.entries || []);
  if (!entries.length || (j.children || []).length > 1) return () => null;
  if (rs.length === 2 * (entries.length - 1)) return k => k + 1;
  const gp = entries.map(e => e.stats.find(s => s.name === 'gamesPlayed')?.value ?? 0);
  const counts = new Map();
  gp.forEach(g => counts.set(g, (counts.get(g) || 0) + 1));
  const mode = [...counts].sort((x, y) => y[1] - x[1])[0][0];
  const anyPlayed = evs.some(e => (e.status || e.competitions[0].status)?.type?.state !== 'pre');
  const week = anyPlayed ? mode : mode + 1;
  // only trust the estimate for the round that is being played now
  const today = isoDay(new Date());
  const isNow = rs[shown][0] <= today && today <= rs[shown].at(-1) || (!anyPlayed && shown === rs.findIndex(y => y.at(-1) >= today));
  return k => (k === shown && isNow ? week : null);
}

async function leadersHtml(league, kind) {
  const j = await get(`${api(league)}/statistics`, 600000);
  const s = (j.stats || []).find(x => x.name === (kind === 'gol' ? 'goalsLeaders' : 'assistsLeaders'));
  const ls = (s?.leaders || []).slice(0, 30);
  if (!ls.length) return `<div class="empty">${t('noStatsYet')}</div>`;
  let rank = 0, prev = null;
  const rows = ls.map((l, k) => {
    if (l.value !== prev) { rank = k + 1; prev = l.value; }
    const a = l.athlete, tm = a.team || {};
    const apps = a.statistics?.find(x => x.name === 'appearances')?.displayValue ?? '';
    return `<tr class="${isFav(tm.id) ? 'fav' : ''}"><td class="r">${rank}</td>
      <td class="t"><a href="#/team/${league}/${tm.id}">${img(tm.id)}<span><b style="font-weight:600">${esc(a.displayName)}</b><small class="sub">${esc(tm.displayName || '')}</small></span></a></td>
      <td>${apps}</td><td class="p">${l.value}</td></tr>`;
  }).join('');
  return `<div class="card"><table><thead><tr><th>#</th><th style="text-align:left">${t('player')}</th><th>${t('apps')}</th><th>${kind === 'gol' ? t('goalCol') : t('assistCol')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// team list from the standings (ESPN's own team-list endpoint refuses browsers); cups fall back to this round's games
async function teamsHtml(league) {
  const j = await get(`${apiSt(league)}/standings`, 120000).catch(() => null);
  let ts = (j?.children || []).flatMap(g => g.standings?.entries || []).map(e => e.team);
  if (!ts.length) {
    const sb = await get(`${api(league)}/scoreboard`, HOUR).catch(() => null);
    ts = (sb?.events || []).flatMap(e => e.competitions[0].competitors.map(c => c.team));
  }
  ts = [...new Map(ts.map(x => [x.id, x])).values()].sort((x, y) => x.displayName.localeCompare(y.displayName, LOCALE()));
  if (!ts.length) return `<div class="empty">${t('noTeams')}</div>`;
  return `<div class="tgrid">${ts.map(tm => `<a class="tcell" href="#/team/${league}/${tm.id}">${img(tm.id, 'mid', league)}<span>${esc(tm.displayName)}</span>${favStar(tm.id, tm.displayName, league)}</a>`).join('')}</div>`;
}

// conference tables with each sport's usual columns
const US_COLS = {
  basketball: [['wins', 'th.W'], ['losses', 'th.L'], ['winPercent', 'th.PCT'], ['gamesBehind', 'th.GB']],
  hockey: [['gamesPlayed', 'th.P'], ['wins', 'th.W'], ['losses', 'th.L'], ['otLosses', 'th.OTL'], ['points', 'th.Pts']],
  football: [['wins', 'th.W'], ['losses', 'th.L'], ['ties', 'th.D'], ['winPercent', 'th.PCT']],
};
function usStandingsHtml(league, groups) {
  const cols = US_COLS[sportOf(league)];
  return groups.map(g => {
    const sv = (e, n) => e.stats.find(s => s.name === n);
    const key = e => sv(e, 'playoffSeed')?.value || 99;
    const entries = [...(g.standings?.entries || [])].sort((x, y) => key(x) - key(y)
      || (sv(y, 'points')?.value ?? sv(y, 'winPercent')?.value ?? 0) - (sv(x, 'points')?.value ?? sv(x, 'winPercent')?.value ?? 0));
    const rows = entries.map((e, k) => `<tr class="${isFav(e.team.id, league) ? 'fav' : ''}"><td class="r">${k + 1}</td>
      <td class="t"><a href="#/team/${league}/${e.team.id}">${img(e.team.id, '', league)}<span>${esc(e.team.displayName)}</span>${favStar(e.team.id, e.team.displayName, league)}</a></td>
      ${cols.map(([n], c) => `<td class="${c === cols.length - 1 ? 'p' : ''}">${esc(sv(e, n)?.displayValue ?? '')}</td>`).join('')}</tr>`).join('');
    return `<div class="card"><h2>${esc(g.name)}</h2><table><thead><tr><th>#</th><th style="text-align:left">${t('th.team')}</th>${cols.map(([, l]) => `<th>${t(l)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');
}

// form column: the last five results (newest first) and a "?" for the next game, from one season scoreboard request
const formBoxes = f => f ? `<span class="fbox">${f.next ? `<a class="fq" href="${f.next.href}" title="${esc(f.next.title)}">?</a>` : '<i class="fq off">?</i>'}${f.res.slice(0, 5).map(r => `<a class="fr ${r.r}" href="${r.href}" title="${esc(r.title)}">${t('res.' + r.r)}</a>`).join('')}</span>` : '';
async function leagueForm(league) {
  const now = new Date(), from = ymd(addDays(now, -75)), to = ymd(addDays(now, 28));
  const j = await get(`${api(league)}/scoreboard?dates=${from}-${to}&limit=1000`, 600000).catch(() => null);
  const m = new Map(), add = (id, x, k) => { const o = m.get(id) || { res: [], next: null }; if (k === 'res') o.res.push(x); else if (!o.next || x.d < o.next.d) o.next = x; m.set(id, o); };
  for (const ev of j?.events || []) {
    const comp = ev.competitions?.[0], [h, a] = sides(comp || {}); if (!h || !a) continue;
    const st = ev.status?.type?.state, title = `${h.team.displayName} ${st === 'post' ? scoreOf(h) + '-' + scoreOf(a) : '-'} ${a.team.displayName} · ${dshort(ev.date)}`, href = `#/match/${league}/${ev.id}`;
    if (st === 'post' && !/POSTPONED|CANCELED/.test(ev.status?.type?.name || '')) {
      const hs = +scoreOf(h), as = +scoreOf(a);
      add(String(h.team.id), { r: hs > as ? 'W' : hs < as ? 'L' : 'D', d: ev.date, title, href }, 'res');
      add(String(a.team.id), { r: as > hs ? 'W' : as < hs ? 'L' : 'D', d: ev.date, title, href }, 'res');
    } else if (st === 'pre') { add(String(h.team.id), { d: ev.date, title, href }, 'next'); add(String(a.team.id), { d: ev.date, title, href }, 'next'); }
  }
  for (const o of m.values()) o.res.sort((x, y) => new Date(y.d) - new Date(x.d));
  return m;
}
async function standingsHtml(league, season, hl) {
  const j = await get(`${apiSt(league)}/standings${season && season !== curSeasonYear() ? '?season=' + season : ''}`, 120000);
  const groups = j.children || [];
  if (!groups.length) return `<div class="empty">${t('noTable')}</div>`;
  if (sportOf(league) !== 'soccer') return usStandingsHtml(league, groups);
  // games being played right now count in the table as if they ended this minute (3 points for the side that leads)
  const cur = !season || season === curSeasonYear();
  const [liveGames, form] = await Promise.all([cur ? liveScores(league) : [], cur ? leagueForm(league).catch(() => new Map()) : new Map()]);
  let anyLive = false;
  const html = groups.map(g => {
    const entries = [...(g.standings?.entries || [])];
    const sv = (e, n) => e.stats.find(s => s.name === n);
    entries.sort((x, y) => (sv(x, 'rank')?.value ?? 99) - (sv(y, 'rank')?.value ?? 99));
    const notes = new Map();
    const R = entries.map(e => ({ e, rank: sv(e, 'rank')?.value ?? 99, gp: sv(e, 'gamesPlayed')?.value ?? 0, w: sv(e, 'wins')?.value ?? 0, d: sv(e, 'ties')?.value ?? 0, l: sv(e, 'losses')?.value ?? 0, gd: sv(e, 'pointDifferential')?.value ?? 0, pts: sv(e, 'points')?.value ?? 0, live: null }));
    const byId = new Map(R.map(r => [String(r.e.team.id), r]));
    for (const m of liveGames) for (const [me, gf, ga] of [[m.h, m.hs, m.as], [m.a, m.as, m.hs]]) {
      const r = byId.get(String(me)); if (!r) continue;
      r.gp++; r.gd += gf - ga; r.live = { gf, ga, min: m.min };
      if (gf > ga) { r.w++; r.pts += 3; } else if (gf === ga) { r.d++; r.pts += 1; } else r.l++;
    }
    const changed = R.some(r => r.live);
    if (changed) { anyLive = true; R.sort((x, y) => y.pts - x.pts || x.rank - y.rank); }
    const rows = R.map((r, k) => {
      const e = r.e, v = n => sv(e, n)?.displayValue ?? '';
      const nt = e.note && e.note.description !== 'Eliminated' ? e.note : null; // ESPN marks the bottom of a league phase 'Eliminated' long before it ends
      if (nt) notes.set(nt.description, nt.color);
      const pos = changed ? k + 1 : v('rank'), mv = changed ? r.rank - (k + 1) : 0;
      const arrow = mv > 0 ? `<i class="mv up">▲${mv}</i>` : mv < 0 ? `<i class="mv dn">▼${-mv}</i>` : '';
      const lv = r.live ? ' lv' : '', fmt = n => (n > 0 && changed ? '+' : '') + n;
      const zc = nt?.color || '', gf = v('pointsFor'), ga = v('pointsAgainst');
      return `<tr class="${(hl ? [].concat(hl).map(String).includes(String(e.team.id)) : isFav(e.team.id, league)) ? 'fav' : ''}${r.live ? ' livetr' : ''}"><td class="r"><b class="rkbox ${zc ? 'z' : ''}" style="${zc ? `background:${zc}` : ''}">${pos}</b>${arrow}</td>
        <td class="t"><a href="#/team/${league}/${e.team.id}">${img(e.team.id, '', league)}<span>${esc(e.team.displayName)}</span>${r.live ? `<b class="lvdot" title="${esc(r.live.gf + '-' + r.live.ga)}">${r.live.gf}-${r.live.ga}</b>` : ''}${favStar(e.team.id, e.team.displayName, league)}</a></td>
        <td class="${lv}">${r.live ? r.gp : v('gamesPlayed')}</td><td class="${lv}">${r.live ? r.w : v('wins')}</td><td class="${lv}">${r.live ? r.d : v('ties')}</td><td class="${lv}">${r.live ? r.l : v('losses')}</td><td class="gl">${gf !== '' && ga !== '' ? `${esc(gf)}:${esc(ga)}` : ''}</td><td class="${lv}">${r.live ? fmt(r.gd) : v('pointDifferential')}</td><td class="p ${lv}">${r.live ? r.pts : v('points')}</td>${form.size ? `<td class="fm">${formBoxes(form.get(String(e.team.id)))}</td>` : ''}</tr>`;
    }).join('');
    const legend = notes.size ? `<div class="legend">${[...notes].map(([d, c]) => `<div><i style="background:${c}"></i>${esc(t('n.' + d))}</div>`).join('')}</div>` : '';
    return `<div class="card">${groups.length > 1 ? `<h2>${esc(g.name)}</h2>` : ''}<div class="stscroll"><table class="stnew"><thead><tr><th>#</th><th style="text-align:left">${t('th.team')}</th><th>${t('th.P')}</th><th>${t('th.W')}</th><th>${t('th.D')}</th><th>${t('th.L')}</th><th>${t('th.goals')}</th><th>${t('th.GD')}</th><th>${t('th.Pts')}</th>${form.size ? `<th>${t('th.form')}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table></div>${legend}</div>`;
  }).join('');
  return (anyLive ? `<div class="livenote"><span class="lvpulse"></span>${t('lt.note')}</div>` : '') + html;
}
// score of every game in progress in a league (own small scoreboard, 15 s cache)
async function liveScores(league) {
  const j = await get(`${api(league)}/scoreboard`, 15000).catch(() => null);
  return (j?.events || []).filter(e => e.status?.type?.state === 'in').map(e => { const [h, a] = sides(e.competitions[0]); return { h: h.team.id, a: a.team.id, hs: +h.score || 0, as: +a.score || 0, min: e.status?.displayClock || '' }; });
}

async function viewLeague(league = 'tur.1', tab = 'fikstur', start) {
  const L = leagueOf(league);
  setTitle(lname(L));
  if (tab === 'puan') store.set('tableLeague', league);
  const tabs = TFF_PID[league] ? LTABS.slice(0, 2) : isTff(league) ? LTABS.slice(0, 1)
    : LTABS.filter(([k]) => (k !== 'puan' || L.table) && (sportOf(league) === 'soccer' || !['gol', 'asist'].includes(k)));
  if (!tabs.some(([k]) => k === tab)) tab = 'fikstur';
  const sb = isTff(league) ? null : await get(`${api(league)}/scoreboard`, HOUR).catch(() => null);
  const yr = (sb?.leagues?.[0]?.season?.displayName || '').match(/\d{4}(-\d{2})?/)?.[0];
  const head = `<div class="card lhead">${lgIcon(league, 'big')}
    <div><b>${esc(lname(L))}</b>${regionLine(league)}${yr ? `<small>${t('season', yr)}</small>` : ''}</div>
    <button class="pin ${pinned.includes(league) ? 'on' : ''}" data-pin="${league}" aria-label="${t('pin')}">${pinned.includes(league) ? '★' : '☆'}</button></div>`;
  const segHtml = `<div class="seg">${tabs.map(([k, l]) => `<a data-replace href="#/league/${league}/${k}" class="${k === tab ? 'on' : ''}">${t(l)}</a>`).join('')}</div>`;
  if (TFF_PID[league]) return head + segHtml + await kslHtml(tab, start, league);
  if (isTff(league)) return head + segHtml + await tffCupHtml(start);
  const soccerPast = sportOf(league) === 'soccer' && selSeason(league) !== curSeasonYear();
  const seasonBar = sportOf(league) === 'soccer' ? `<div class="seasonbar">${seasonSelect(`data-league-season="${league}"`, selSeason(league))}</div>` : '';
  const body = tab === 'puan' ? await standingsHtml(league, selSeason(league))
    : tab === 'gol' || tab === 'asist' ? await leadersHtml(league, tab)
    : tab === 'takim' ? await teamsHtml(league)
    : soccerPast ? await pastFixturesHtml(league, selSeason(league), start)
    : await fixturesHtml(league, start);
  return head + seasonBar + segHtml + body;
}

// ---- Turkish sources through the user's own Cloudflare server (TFF + beIN) ----
const workerBase = () => (notif.url || DEFAULT_WORKER).replace(/\/$/, '');
const needWorkerHtml = () => `<div class="empty">${t('needWorker')}<br><br><a href="#/settings" style="color:var(--accent)">${t('nav.settings')} ›</a></div>`;
// "AĞRI 1970 SPOR KULÜBÜ" → "Ağrı 1970 Spor"
// 1. Lig clubs carry sponsor names in the registry (e.g. "METRO HOLDİNG KAYSERİSPOR"): the usual short names
const TFF_SHORT = [['IĞDIR', 'Iğdır FK'], ['KEÇİÖRENGÜCÜ', 'Keçiörengücü'], ['MANİSA', 'Manisa FK'], ['VAN SPOR', 'Vanspor'], ['SİVASSPOR', 'Sivasspor'], ['MUĞLASPOR', 'Muğlaspor'], ['EROKSPOR', 'Esenler Erokspor'],
  ['PENDİKSPOR', 'Pendikspor'], ['İSTANBULSPOR', 'İstanbulspor'], ['BANDIRMA', 'Bandırmaspor'], ['KARAGÜMRÜK', 'Fatih Karagümrük'], ['ÜMRANİYESPOR', 'Ümraniyespor'], ['KAYSERİSPOR', 'Kayserispor'],
  ['SARIYER', 'Sarıyer'], ['BATMAN PETROL', 'Batman Petrolspor'], ['BODRUM', 'Bodrum FK'], ['BOLUSPOR', 'Boluspor'], ['MARDİN 1969', 'Mardin 1969 Spor'], ['BURSASPOR', 'Bursaspor'], ['ANTALYASPOR', 'Antalyaspor']];
function tffName(n) {
  { const up = String(n || '').toLocaleUpperCase('tr'); const hit = TFF_SHORT.find(([k]) => up.includes(k)); if (hit) return hit[1]; }
  const s = String(n || '').replace(/\s+(A\.\s?Ş\.?|FUTBOL KULÜBÜ|SPOR KULÜBÜ DERNEĞİ|KULÜBÜ|DERNEĞİ)$/u, '');
  // Turkish casing (I -> ı) only where the name has Turkish letters; "CHRIST OTINIEL" would turn into "Chrıst"
  const loc = /[İÇĞÖŞÜ]/.test(String(n || '')) ? 'tr' : 'en';
  return s.toLocaleLowerCase(loc).replace(/(^|[\s(\-./])(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase(loc));
}
function tffRoundName(n) {
  if (/son\s*16/i.test(n)) return t('rd.r16');
  if (/çeyrek/i.test(n)) return t('rd.qf');
  if (/yarı/i.test(n)) return t('rd.sf');
  if (/^final/i.test(n.trim())) return t('rd.f');
  const m = n.match(/(\d+)\.?\s*Tur/i);
  return m ? t('roundN', m[1]) : n;
}
const tffScore = s => { const m = String(s || '').match(/^(\d+)\s*-\s*(\d+)/); return m ? [m[1], m[2]] : null; };
function tffRow(m, lg = 'tur.cup', withDate = false) {
  const sc = tffScore(m.score);
  const team = (n, g, win) => `<div class="tm ${win ? 'win' : ''}">${tffLogo(n)}<span class="tn">${esc(tffName(n))}</span><b class="ts post">${g ?? ''}</b></div>`;
  return `<a class="match" href="#/tff/${m.id}/${lg}"><div class="mtime ${sc ? 'post' : 'pre'}">${withDate && m.iso ? dshort(m.iso) + '<small>' : ''}${sc ? t('st.FT') : (m.iso ? hm(m.iso) : '')}${withDate && m.iso ? '</small>' : ''}</div>
    <div class="teams">${team(m.home, sc?.[0], sc && +sc[0] > +sc[1])}${team(m.away, sc?.[1], sc && +sc[1] > +sc[0])}</div></a>`;
}
const ztkData = () => get(`${workerBase()}/ztk`, 300000);
const tgrpGet = lg => (store.get('tgrp', {})[lg]) || '';
const kslData = (around, hafta, lg = 'tur.w.1', back = 0) => TFF_GROUPED(lg)
  ? get(`${workerBase()}/tfflig?${[`pid=${TFF_PID[lg]}`, tgrpGet(lg) ? 'grup=' + tgrpGet(lg) : '', hafta ? 'hafta=' + hafta : around ? 'around=1' : '', back ? 'back=' + back : ''].filter(Boolean).join('&')}`, 120000)
  : get(`${workerBase()}/ksl?${[hafta ? 'hafta=' + hafta : around ? 'around=1' : '', lg === 'tur.2' ? 'lig=142' : '', back ? 'back=' + back : ''].filter(Boolean).join('&')}`, 120000);
// TFF form column from the weeks the server sent along (newest result first, then a ? for the next game)
function tffForm(d, lg) {
  const m = new Map(), up = s => String(s || '').toUpperCase();
  const ms = (d.rounds || []).flatMap(r => r.matches || []).filter(x => x.iso).sort((a, b) => b.iso.localeCompare(a.iso));
  for (const x of ms) {
    const sc = tffScore(x.score), title = `${tffName(x.home)} ${sc ? sc.join('-') : '-'} ${tffName(x.away)} · ${dshort(x.iso)}`, href = x.id ? `#/tff/${x.id}/${lg}` : '#';
    for (const [me, mine, theirs] of [[up(x.home), 0, 1], [up(x.away), 1, 0]]) {
      const o = m.get(me) || { res: [], next: null };
      if (sc) { const a = +sc[mine], b = +sc[theirs]; o.res.push({ r: a > b ? 'W' : a < b ? 'L' : 'D', title, href }); }
      else o.next = { title, href }; // the list runs newest first: the last unplayed one seen is the nearest
      m.set(me, o);
    }
  }
  return m;
}
// Turkish women's Super League: week-by-week fixtures and the table
// league table of a TFF league; every club links to its own page
const tffTableHtml = (d, lg, hl = '') => {
  if (!d.table?.length) return `<div class="empty">${t('noTable')}</div>`;
  const form = (d.rounds || []).length > 2 ? tffForm(d, lg) : new Map(), n = d.table.length;
  // the zone colours of the Turkish leagues: promotion (green), play-off (light green / blue), relegation (red)
  const zone = r => lg === 'tur.2' ? (r.rank <= 2 ? '#16a34a' : r.rank <= 6 ? '#22c55e99' : r.rank > n - 4 ? '#dc2626' : '') : TFF_GROUPED(lg) ? (r.rank <= 1 ? '#16a34a' : r.rank <= 5 ? '#22c55e99' : r.rank > n - 3 ? '#dc2626' : '') : (r.rank <= 1 ? '#16a34a' : r.rank > n - 2 ? '#dc2626' : '');
  const rows = d.table.map(r => { const zc = zone(r), f = form.get(String(r.name).toUpperCase());
    return `<tr class="${hl && r.name === hl ? 'me' : ''}"><td class="r"><b class="rkbox ${zc ? 'z' : ''}" style="${zc ? `background:${zc}` : ''}">${r.rank}</b></td><td class="t"><a class="tl" href="#/tt/${lg}/${encodeURIComponent(r.name)}/${esc(d.grup || '')}">${tffLogo(r.name)}<span>${esc(tffName(r.name))}</span></a></td><td>${esc(r.o)}</td><td>${esc(r.g)}</td><td>${esc(r.b)}</td><td>${esc(r.m)}</td><td class="gl">${r.a !== '' && r.y !== '' && r.a != null ? `${esc(r.a)}:${esc(r.y)}` : ''}</td><td>${esc(r.av)}</td><td class="p">${esc(r.p)}</td>${form.size ? `<td class="fm">${formBoxes(f)}</td>` : ''}</tr>`; }).join('');
  const legend = `<div class="legend"><div><i style="background:#16a34a"></i>${t(lg === 'tur.w.1' ? 'z.champ' : 'z.promo')}</div><div><i style="background:#22c55e99"></i>${t('z.playoff')}</div><div><i style="background:#dc2626"></i>${t('n.Relegation')}</div></div>`;
  return `<div class="card"><div class="stscroll"><table class="stnew"><thead><tr><th>#</th><th style="text-align:left">${t('th.team')}</th><th>${t('th.P')}</th><th>${t('th.W')}</th><th>${t('th.D')}</th><th>${t('th.L')}</th><th>${t('th.goals')}</th><th>${t('th.GD')}</th><th>${t('th.Pts')}</th>${form.size ? `<th>${t('th.form')}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table></div>${legend}</div>`;
};

// 2. and 3. Lig are played in groups: one chip per group
const groupBar = (d, lg) => TFF_GROUPED(lg) && d.groups?.length > 1
  ? `<div class="chipwrap" style="padding:0 0 10px">${d.groups.map(g => `<button class="btn ${String(g.id) === String(d.grup) ? '' : 'ghost'}" style="padding:6px 14px" data-tgrp="${lg}|${esc(g.id)}">${esc(g.name)}</button>`).join('')}</div>` : '';
async function kslHtml(tab, start, lg = 'tur.w.1') {
  if (!workerBase()) return needWorkerHtml();
  if (tab === 'puan') {
    const d = await kslData(false, 0, lg, 5);
    return groupBar(d, lg) + tffTableHtml(d, lg);
  }
  const d = await kslData(false, start ? +start : 0, lg);
  const cur = +start || d.current, total = d.total || 30, base = `#/league/${lg}/fikstur/`;
  const nav = `<div class="roundnav"><a data-replace href="${cur > 1 ? base + (cur - 1) : '#'}" class="${cur > 1 ? '' : 'off'}" aria-label="${t('prevRound')}">‹</a>
    <select data-ksl-week="${lg}">${Array.from({ length: total }, (_, k) => `<option value="${k + 1}" ${k + 1 === cur ? 'selected' : ''}>${t('roundN', k + 1)}</option>`).join('')}</select>
    <a data-replace href="${cur < total ? base + (cur + 1) : '#'}" class="${cur < total ? '' : 'off'}" aria-label="${t('nextRound')}">›</a></div>`;
  const ms = [...(d.rounds?.[0]?.matches || [])].sort((a, b) => (a.iso || '').localeCompare(b.iso || ''));
  const byDay = new Map();
  for (const m of ms) { const k = m.iso ? fmtD(m.iso, { weekday: 'long', day: 'numeric', month: 'long' }) : ''; (byDay.get(k) || byDay.set(k, []).get(k)).push(m); }
  return groupBar(d, lg) + nav + `<div class="weektitle">${t('roundN', cur)}</div>` + ([...byDay].map(([k, l]) => `<div class="card"><h2 style="text-transform:capitalize">${esc(k)}</h2>${l.map(m => tffRow(m, lg)).join('')}</div>`).join('') || `<div class="empty">${t('noMatches')}</div>`);
}

async function tffCupHtml(start) {
  if (!workerBase()) return needWorkerHtml();
  const d = await ztkData();
  const rs = [...(d.rounds || [])].reverse(); // TFF lists the newest round first
  if (!rs.length) return `<div class="empty">${t('noMatches')}</div>`;
  let i = start ? rs.findIndex(r => r.name === decodeURIComponent(start)) : -1;
  if (i < 0) i = rs.length - 1; // newest round
  const base = '#/league/tur.cup/fikstur/';
  const nav = `<div class="roundnav"><a data-replace href="${i > 0 ? base + encodeURIComponent(rs[i - 1].name) : '#'}" class="${i > 0 ? '' : 'off'}" aria-label="${t('prevRound')}">‹</a>
    <select data-tff-round>${rs.map((r, k) => `<option value="${esc(encodeURIComponent(r.name))}" ${k === i ? 'selected' : ''}>${esc(tffRoundName(r.name))} · ${r.matches.length}</option>`).join('')}</select>
    <a data-replace href="${i < rs.length - 1 ? base + encodeURIComponent(rs[i + 1].name) : '#'}" class="${i < rs.length - 1 ? '' : 'off'}" aria-label="${t('nextRound')}">›</a></div>`;
  const byDay = new Map();
  for (const m of [...rs[i].matches].sort((a, b) => (a.iso || '').localeCompare(b.iso || ''))) {
    const k = m.iso ? fmtD(m.iso, { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    (byDay.get(k) || byDay.set(k, []).get(k)).push(m);
  }
  return nav + `<div class="weektitle">${esc(tffRoundName(rs[i].name))}</div>`
    + [...byDay].map(([k, ms]) => `<div class="card"><h2 style="text-transform:capitalize">${esc(k)}</h2>${ms.map(tffRow).join('')}</div>`).join('');
}

// a club of a TFF league (1. / 2. / 3. Lig, women's Super League): its place in the table and the whole season
async function viewTffTeam(lg, rawName, grup = '') {
  const name = decodeURIComponent(rawName || ''); setTitle(tffName(name));
  if (!workerBase()) return needWorkerHtml();
  if (!TFF_PID[lg]) return `<div class="empty">${t('noInfo')}</div>`;
  const d = await get(`${workerBase()}/tffteam?pid=${TFF_PID[lg]}&grup=${encodeURIComponent(grup || '')}&name=${encodeURIComponent(name)}`, 300000).catch(() => null);
  if (!d || d.error) return `<div class="empty">${t('loadFail')}</div>`;
  const r = d.row;
  const hero = `<div class="card hero">${tffLogo(name, true)}<div style="font-size:20px;font-weight:700;margin-top:8px">${esc(tffName(name))}</div>
    <div class="st">${r ? esc(`${t('rankIn', r.rank, lname(leagueOf(lg)))} · ${r.o} ${t('th.P')} · ${r.g}-${r.b}-${r.m} · ${r.p} ${t('th.Pts')}`) : esc(lname(leagueOf(lg)))}</div>
    ${(() => { const fid = 'tff:' + name.toUpperCase(), on = isFav(fid, lg); return `<button class="favbtn ${on ? 'on' : ''}" data-fav="${esc(fid)}" data-name="${esc(tffName(name))}" data-league="${esc(lg)}" data-grup="${esc(d.grup || grup || '')}">${on ? t('inFavs') : t('addFav')}</button>`; })()}</div>`;
  const ms = d.matches || [], done = ms.filter(m => tffScore(m.score)).reverse(), next = ms.filter(m => !tffScore(m.score));
  const rows = list => list.map(m => tffRow(m, lg, true)).join('');
  const fx = (next.length ? `<div class="fxsec">${t('upcoming')}</div><div class="card">${rows(next)}</div>` : '') + (done.length ? `<div class="fxsec">${t('recentMatches')}</div><div class="card">${rows(done)}</div>` : '') || `<div class="empty">${t('noMatches')}</div>`;
  const tb = d.table?.length ? tffTableHtml(d, lg, d.row?.name || name) : `<div class="empty">${t('noTable')}</div>`;
  return hero + seg('tt', [t('fixtures'), t('o.standings')]) + pane('tt', 0, fx) + pane('tt', 1, tb);
}
async function viewTffMatch(id, lg = 'tur.cup') {
  setTitle(lname(leagueOf(lg)));
  if (!workerBase()) return needWorkerHtml();
  const m = await get(`${workerBase()}/tffmatch?id=${encodeURIComponent(id)}`, 120000);
  const played = m.homeScore !== '' || m.awayScore !== '';
  const tlink = n => TFF_PID[lg] ? `<a href="#/tt/${lg}/${encodeURIComponent(n)}"><span>${esc(tffName(n))}</span></a>` : `<span>${esc(tffName(n))}</span>`;
  const logo = src => src ? `<img class="logo big" src="${esc(src)}" alt="" onerror="this.style.visibility='hidden'">` : '';
  const html = `<div class="card hero"><div class="row">
    <div class="side">${logo(m.homeLogo)}${tlink(m.home)}</div>
    <div class="mid"><div class="sc">${played ? `${esc(m.homeScore)} - ${esc(m.awayScore)}` : (m.iso ? esc(hm(m.iso)) : '')}</div><div class="st ${played ? 'post' : 'pre'}">${played ? t('st.FT') : (m.iso ? dshort(m.iso) : '')}</div></div>
    <div class="side">${logo(m.awayLogo)}${tlink(m.away)}</div></div></div>`;
  // goals, cards and substitutions all come with their minute ("MS" = after the final whistle)
  const nm = x => typeof x === 'string' ? x : (x?.name || '');
  const mn = x => { const v = typeof x === 'string' ? '' : (x?.minute || ''); return !v ? '' : /^\d/.test(v) ? v + "'" : v; };
  const items = [];
  for (const [side, ev] of [['home', m.homeEvents], ['away', m.awayEvents]]) {
    for (const g of ev.goals) items.push({ side, kind: 'goal', name: esc(tffName(nm(g))), min: mn(g) });
    ev.in.forEach((p, k) => items.push({ side, kind: 'sub', name: esc(tffName(nm(p))), out: esc(tffName(nm(ev.out[k]))), min: mn(p) }));
    for (const c of ev.cards) items.push({ side, kind: c.red ? 'red' : 'yellow', name: esc(tffName(nm(c))), min: mn(c) });
  }
  const minOf = v => /^MS/i.test(v) ? 999 : (parseInt(v) || 998) + (/\+(\d+)/.exec(v)?.[1] ? (+/\+(\d+)/.exec(v)[1]) / 100 : 0);
  items.sort((a, b) => minOf(a.min) - minOf(b.min));
  const evHtml = items.length ? timelineHtml(items) : `<div class="empty">${played ? t('noEvents') : t('notStarted')}</div>`;
  const info = [
    ['📅', t('date'), m.iso ? new Date(m.iso).toLocaleString(LOCALE(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : m.date],
    ['🏆', t('competition'), m.org],
    ['🏟️', t('venue'), tffName(m.stadium)],
    ...(m.referees || []).map(r => ['🧑‍⚖️', t('role.' + r.role), tffName(r.name)]),
  ].filter(r => r[2]);
  const infoHtml = `<div class="card">${info.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>`;
  return html + tabsHtml('match', [[t('events'), evHtml], [t('info'), infoHtml + calBtn(`${tffName(m.home)} – ${tffName(m.away)}`, m.iso, tffName(m.stadium))], [t('c.chat'), chatHtml('m-tff-' + id)]], !played, [1, 2]);
}

// beIN SPORTS 1–4 listings matched to a game by kick-off time (±20 min) and both team names
const trClock = iso => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
const trDay = iso => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(iso));
const normName = s => String(s || '').toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' })[c])
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ');
const NAME_STOP = new Set(['fk', 'sk', 'fc', 'afc', 'cf', 'ac', 'as', 'sc', 'club', 'the', 'de', 'spor', 'sport', 'city', 'united']);
const nameToks = s => normName(s).split(' ').filter(w => w.length >= 3 && !NAME_STOP.has(w));
// a shared word or an abbreviation ("Man" ↔ "Manchester", "Nott'm" ↔ "Nottingham" via "Forest")
const sameTeam = (a, b) => { const A = nameToks(a), B = nameToks(b); return A.some(x => B.some(y => x === y || y.startsWith(x) || x.startsWith(y))); };
async function tvList(day) {
  if (!workerBase()) return [];
  try { return (await get(`${workerBase()}/tv?date=${day}`, 1800000)).items || []; } catch { return []; }
}

// who holds the Turkish rights of a competition (2026-27): used when no channel listing matches the game
const TR_CLUB = /galatasaray|fenerbah|be[sş]ikta[sş]|trabzonspor|ba[sş]ak[sş]ehir|samsunspor|konyaspor|sivasspor|kas[ıi]mpa[sş]a|alanyaspor|antalyaspor|gaziantep|g[oö]ztepe|rizespor|kayserispor|e[uü]pspor|hatayspor|bodrum|[sş]anl[ıi]urfa|kocaelispor|gen[cç]lerbirli|ankarag[uü]c[uü]|karag[uü]mr[uü]k|eyupspor/i;
function rightsTv(league, home, away) {
  const l = String(league || '');
  if (/^uefa\.(champions|europa|europa\.conf)$/.test(l)) return TR_CLUB.test(home) || TR_CLUB.test(away) ? 'TRT 1 / tabii' : 'tabii Spor';
  if (/^(esp|ita|ger|ned|por|sco|sau)\.1$/.test(l)) return 'S Sport';
  if (/^(eng|fra|tur)\.1$|^tur\.2$/.test(l)) return 'beIN SPORTS';
  if (/^tff|^tur\.(cup|super)|^uefa\.nations/.test(l)) return 'A Spor / atv';
  return '';
}
function tvFor(items, iso, home, away, league) {
  const [h, mi] = trClock(iso).split(':').map(Number), k = h * 60 + mi;
  const hit = items.find(it => {
    const [a, b] = it.time.split(':').map(Number);
    if (Math.abs(a * 60 + b - k) > 20) return false;
    const [x, y] = it.name.split(' - ');
    return (sameTeam(home, x) && sameTeam(away, y)) || (sameTeam(home, y) && sameTeam(away, x));
  });
  return hit?.ch || rightsTv(league, home, away);
}

// ---- Notifications (Cloudflare Worker + ntfy) ----
const NPREFS = ['goal', 'red', 'var', 'remind', 'start', 'ht', 'end', 'summary', 'morning', 'pline', 'pcard'];
let notif = store.get('notify', null);
if (!notif) {
  const rnd = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
  notif = { url: '', key: '', topic: 'grafondex-' + rnd, prefs: { goal: true, red: true, var: true, remind: true, start: true, ht: false, end: true } };
  store.set('notify', notif);
}
const b64uBytes = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function callWorker(path, extra = {}) {
  const r = await fetch(workerBase() + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: notif.key, ...extra }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'HTTP ' + r.status);
  return d;
}
const syncNotify = () => callWorker('/sync', {
  // the notification server follows football only
  topic: notif.topic, prefs: notif.prefs, lang: LANG, teams: [...favs.map(f => ({ id: f.id, name: f.name, sport: String(f.id).startsWith('tff:') ? 'tff' : sportOf(f.league), league: f.league, ...(f.grup ? { grup: f.grup } : {}) })), ...xfavs.map(f => ({ id: f.name, name: f.name, sport: f.sport }))],
  players: pfavs.filter(f => f.sport === 'soccer').map(f => ({ id: f.id, name: f.name, team: f.team || '' })),
  app: location.href.split('#')[0], push: notif.push || null,
});

function notifyCard() {
  return `<div class="card"><h2>${t('notifs')}</h2>
    <div class="form-block"><button class="btn" id="n-push">${t('pushBtn')}</button><div class="hint">${t('pushHint')}</div></div>
    ${NPREFS.map(k => `<label class="setrow"><span>${t('np.' + k)}</span><input type="checkbox" data-nprefs="${k}" ${notif.prefs[k] ?? true ? 'checked' : ''}></label>`).join('')}
    <div class="form-block"><button class="btn" id="n-save">${t('saveTest')}</button><div class="hint" id="n-msg"></div></div>
  </div>`;
}


const ctryCount = sp => { const el = document.querySelector(`[data-ccount="${sp}"]`); if (!el) return; const all = document.querySelectorAll(`[data-ctry^="${sp}|"]`); el.textContent = t('set.nOf', [...all].filter(x => x.checked).length, all.length); };
const otherSportsCards = () => {
  const spCard = `<div class="card"><h2>🏅 ${t('set.sports')}</h2><div>${SPORTS.filter(x => x[0] !== 'soccer').map(([s, ic, k]) => `<label class="setrow"><span>${ic} ${t(k)}</span><input type="checkbox" data-sport-vis="${s}" ${sportShown(s) ? 'checked' : ''}></label>`).join('')}</div></div>`;
  const ALL = ['Europe', 'World', ...[...CTRY_ALL].sort((a, b) => ctryName(a).localeCompare(ctryName(b), LOCALE()))];
  const one = (sp, label) => { const on = ALL.filter(cn => ctryOn(sp, cn)).length; return `<details class="card setsec"><summary><span>🌍 ${label}</span><small data-ccount="${sp}">${t('set.nOf', on, ALL.length)}</small></summary><div class="hint" style="padding:0 14px 6px">${t('set.countriesHint')}</div>
    <div class="form-block selrow"><button class="btn ghost" data-ctry-all="${sp}|all">${t('set.all')}</button><button class="btn ghost" data-ctry-all="${sp}|none">${t('set.none')}</button></div>
    <div class="chipwrap" data-cwrap="${sp}">${ALL.map(cn => `<label class="chk"><input type="checkbox" data-ctry="${sp}|${cn}" ${ctryOn(sp, cn) ? 'checked' : ''}><span>${esc(ctryName(cn))}</span></label>`).join('')}</div></details>`; };
  return spCard + one('eubasket', t('sp.basketball')) + one('volley', t('sp.volley')) + one('handball', t('sp.handball'));
};
async function viewSettings(sub) {
  if (sub === 'icerik') return viewSettingsContent();
  setTitle(t('nav.settings'));
  const langCard = `<div class="card"><button class="langcur" data-lang-toggle aria-expanded="false"><span>🌐 ${t('language')}</span><b>${esc(LANGS[LANG_IDX()][1])} ▾</b></button><div class="langs" hidden>${LANGS.map(([c, n]) =>
    `<button class="langbtn ${c === LANG ? 'on' : ''}" data-lang="${c}">${n}</button>`).join('')}</div></div>`;
  const soundCard = `<div class="card"><h2>🔔 ${t('fx.sounds')}</h2><div class="hint" style="padding:0 14px 6px">${t('fx.soundsHint')}</div>
    <label class="setrow sndvol"><span>🔊 ${t('fx.vol')}</span><input type="range" min="0" max="100" step="5" value="${Math.round(fx.vol * 100)}" data-fxvol><b data-fxvolv>${Math.round(fx.vol * 100)}%</b></label>
    ${[['goal', t('np.goal')], ['concede', t('fx.concede')], ['cancel', t('fx.cancel')], ['miss', t('fx.miss')], ['var', t('np.var')], ['red', t('np.red')], ['remind', t('np.remind')], ['start', t('np.start')], ['ht', t('np.ht')], ['end', t('np.end')], ['chime', t('fx.chime')]].map(([k, n]) => `<div class="setrow sndrow"><button class="sndplay" data-snd="${k}" aria-label="▶">▶</button><span>${esc(n)}</span><input type="checkbox" data-sndon="${k}" ${fx.mute[k] ? '' : 'checked'}></div>`).join('')}</div>`;
  const fxCard = `<div class="card"><h2>⚽ ${t('fx.title')}</h2>
    <label class="setrow"><span>${t('fx.anim')}</span><input type="checkbox" data-fx="anim" ${fx.anim ? 'checked' : ''}></label>
    <label class="setrow"><span>${t('fx.favOnly')}</span><input type="checkbox" data-fx="favOnly" ${fx.favOnly ? 'checked' : ''}></label>
    <label class="setrow"><span>${t('fx.sound')}</span><input type="checkbox" data-fx="sound" ${fx.sound ? 'checked' : ''}></label>
    <label class="setrow"><span>${t('fx.voice')}</span><input type="checkbox" data-fx="voice" ${fx.voice ? 'checked' : ''}></label>
    <label class="setrow"><span>${t('fx.vib')}</span><input type="checkbox" data-fx="vib" ${fx.vib ? 'checked' : ''}></label>
    <div class="form-block"><button class="btn ghost" data-fx-test>▶ ${t('fx.test')}</button></div><div class="hint" style="padding:0 14px 12px">${t('fx.hint')}</div></div>`;
  const contentLink = `<a class="card setlink" href="#/settings/icerik"><span class="slic">🏅</span><span class="slt"><b>${t('set.content')}</b><small>${t('set.contentHint')}</small></span><i>›</i></a>`;
  return langCard + themeCard() + contentLink + fxCard + soundCard + notifyCard() + `<div class="card about"><img src="logo.png" alt="Grafondex Live Score"><div class="note">${t('about')}</div><div class="note">${t('version')}: ${APP_VERSION}</div><div class="note" style="font-size:11px;opacity:.7">${t('sndcredit')}</div></div>`;
}
// Settings › sports, countries and leagues (its own page; every section folds open on tap)
function viewSettingsContent() {
  setTitle(t('set.content'));
  const grp = (ls, g) => { ls = ls.filter(shownL); if (!ls.length) return ''; const on = ls.filter(L => enabled.includes(L.id)).length;
    return `<details class="card setsec"><summary><span>${t('grp.' + g)}</span><small data-gcount="${g}">${t('set.nOf', on, ls.length)}</small></summary>
    <div class="form-block selrow"><button class="btn ghost" data-grp-all="${g}|1">${t('set.all')}</button><button class="btn ghost" data-grp-all="${g}|0">${t('set.none')}</button></div>
    ${ls.map(L => `<label class="setrow">${lgIcon(L.id)}<span>${esc(lname(L))}</span><input type="checkbox" data-league-toggle="${L.id}" data-g="${g}" ${enabled.includes(L.id) ? 'checked' : ''}></label>`).join('')}</details>`; };
  return otherSportsCards() + `<h3 class="sethead">⚽ ${t('set.leagues')}</h3><p class="note" style="text-align:left;padding:0 4px 8px">${t('pickLeaguesNote')}</p>
    <div class="selbar"><button class="btn" data-leagues-all="1">${t('set.all')}</button><button class="btn ghost" data-leagues-all="0">${t('set.none')}</button></div>
    ${GROUPS.map(grp).join('')}`;

}

// ---- Community: accounts, forum, match chat, moderation (Cloudflare D1 behind the same Worker) ----
const apiBase = () => (notif.url || DEFAULT_WORKER).replace(/\/$/, '') + '/api';
let acct = store.get('acct', null); // { token, user: { id, username, role } }
async function capi(method, path, body) {
  const r = await fetch(apiBase() + path, {
    method, headers: { 'Content-Type': 'application/json', ...(acct ? { Authorization: 'Bearer ' + acct.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && acct && j.error === 'login_required') { acct = null; store.set('acct', null); }
  if (!r.ok) { const e = new Error(j.error || 'HTTP ' + r.status); e.code = j.error; e.data = j; throw e; }
  return j;
}
const errText = e => {
  if (e.code === 'match_unknown' && e.data?.why) return t('c.err.match_unknown') + ' (' + e.data.why + ')';
  if (e.code === 'slow_down' && e.data?.wait) return t('c.err.slow_wait', e.data.wait);
  if (e.code === 'muted' && e.data?.until) return t('c.err.muted', new Date(e.data.until * 1000).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit' }));
  return I18N['c.err.' + e.code] ? t('c.err.' + e.code) : (e.code && e.code !== 'Failed to fetch' ? e.code : t('c.err.network'));
};
const isAdminUser = () => acct?.user?.role === 'admin';
const ago = ts => {
  const d = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (d < 60) return t('c.now');
  if (d < 3600) return Math.floor(d / 60) + ' ' + t('c.min');
  if (d < 86400) return Math.floor(d / 3600) + ' ' + t('c.hour');
  return Math.floor(d / 86400) + ' ' + t('c.day');
};
const AVATAR_COLORS = ['#1667f2', '#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6']; // same list the server accepts
const hashColor = n => AVATAR_COLORS[[...String(n)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const avatar = (m, size = 30) => `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .45)}px;background:${m.color || hashColor(m.username)}">${esc(String(m.username || '?')[0].toUpperCase())}</span>`;
const favBadge = m => m.fav_id ? `<img class="favlogo" loading="lazy" src="${logoUrl(m.fav_id, m.fav_league)}" title="${esc(m.fav_name || '')}" alt="" onerror="this.style.display='none'">` : '';
const nameHtml = m => `<a class="cu ${m.role === 'admin' ? 'adm' : ''}" href="#/user/${encodeURIComponent(m.username)}" style="color:${m.color || hashColor(m.username)}">${esc(m.username)}</a><span class="rkslot" data-rk-u="${esc(m.username)}"></span>${m.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}${favBadge(m)}`;

// is e-mail sign-up switched on in the Worker? (asked once a session; until it answers, the form works the old way)
let mailCfg = null;
const mailOnP = () => mailCfg ??= capi('GET', '/mailcfg').then(r => !!r.on).catch(() => false);
// ---- sign in / sign up / forgot password: one card with three tabs. What the user typed and the step they are on
// (waiting for the e-mail code) survive switching to the mail app and back, and a page reload (15 min, password kept in memory only)
let mailOnV = null;
const authDraft = (() => { try { const d = JSON.parse(sessionStorage.getItem('authDraft') || '{}'); return Date.now() - (d.at || 0) < 15 * 60e3 ? d : {}; } catch { return {}; } })();
let authPass = '';
const saveDraft = () => { authDraft.at = Date.now(); try { sessionStorage.setItem('authDraft', JSON.stringify(authDraft)); } catch {} };
const clearDraft = () => { for (const k of Object.keys(authDraft)) delete authDraft[k]; authPass = ''; try { sessionStorage.removeItem('authDraft'); } catch {} };
let authMode = authDraft.mode || 'login';
const redrawAuth = () => { const c = document.querySelector('.authcard'); if (c) c.outerHTML = authForm(); };
function authForm() {
  if (mailOnV === null) mailOnP().then(on => { mailOnV = on; redrawAuth(); });
  const mail = !!mailOnV, D = authDraft, v = k => esc(D[k] || '');
  const tab = (m, ic, label) => `<button class="${authMode === m ? 'on' : ''}" data-authmode="${m}">${ic} ${label}</button>`;
  let body;
  if (authMode === 'register' && mail && D.regStep === 'code') {
    body = `<div class="authstep">📩 ${t('em.sentTo', esc(D.mail))}</div>
      <label>${t('em.code')}<input id="a-code" class="codein" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" value="${v('code')}"></label>
      ${authPass ? '' : `<label>${t('em.passAgain')}<input id="a-pass" type="password" autocomplete="new-password" maxlength="100"></label>`}
      <button class="btn" data-auth="register">✅ ${t('em.create')}</button>
      <div class="authlinks"><button class="linkbtn" data-regresend>🔁 ${t('em.resend')}</button><button class="linkbtn" data-regback>✏️ ${t('em.change')}</button></div>`;
  } else if (authMode === 'register') {
    body = `<label>${t('c.username')}<input id="a-user" autocomplete="username" autocapitalize="off" maxlength="20" placeholder="${esc(t('em.userPh'))}" value="${v('user')}"></label>
      ${mail ? `<label>${t('em.email')}<input id="a-mail" type="email" autocomplete="email" autocapitalize="off" maxlength="120" placeholder="ornek@mail.com" value="${v('mail')}"></label>` : ''}
      <label>${t('c.password')}<input id="a-pass" type="password" autocomplete="new-password" maxlength="100" value="${esc(authPass)}"></label>
      <button class="btn" data-auth="register">${mail ? '✉️ ' + t('em.sendCode') : t('c.register')}</button>
      <div class="hint">${t('c.passHint')}</div>`;
  } else if (authMode === 'forgot') {
    const mailPart = !mail ? '' : D.resetStep === 'code'
      ? `<div class="authstep">📩 ${t('em.sentTo', esc(D.resetMail))}</div>
        <label>${t('em.code')}<input id="e-code" class="codein" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" value="${v('resetCode')}"></label>
        <label>${t('c.newPass')}<input id="e-pass" type="password" autocomplete="new-password" maxlength="100"></label>
        <button class="btn" data-mailreset>🔐 ${t('c.recover')}</button>
        <div class="authlinks"><button class="linkbtn" data-resetresend>🔁 ${t('em.resend')}</button><button class="linkbtn" data-resetback>✏️ ${t('em.change')}</button></div>`
      : `<div class="hint">${t('em.resetHint')}</div>
        <label>${t('em.email')}<input id="e-mail" type="email" autocomplete="email" autocapitalize="off" maxlength="120" placeholder="ornek@mail.com" value="${v('resetMail')}"></label>
        <button class="btn" data-resetsend>✉️ ${t('em.sendCode')}</button>`;
    const oldPart = `<div class="hint">${t('c.forgotHint')}</div>
        <input id="r-user" autocapitalize="off" maxlength="20" placeholder="${esc(t('c.username'))}">
        <input id="r-code" autocapitalize="characters" maxlength="12" placeholder="${esc(t('c.recCode'))}">
        <input id="r-pass" type="password" autocomplete="new-password" maxlength="100" placeholder="${esc(t('c.newPass'))}">
        <button class="btn ghost" data-recover>${t('c.recover')}</button><div class="hint" id="r-msg"></div>`;
    body = mail ? `${mailPart}<details class="oldrec"><summary>🔑 ${t('em.haveRec')}</summary><div class="form-block" style="padding:8px 0 0">${oldPart}</div></details>` : oldPart;
  } else {
    body = `<label>${mail ? t('em.userOrMail') : t('c.username')}<input id="a-user" autocomplete="username" autocapitalize="off" maxlength="120" value="${v('login')}"></label>
      <label>${t('c.password')}<input id="a-pass" type="password" autocomplete="current-password" maxlength="100" value="${esc(authPass)}"></label>
      <button class="btn" data-auth="login">${t('c.login')}</button>
      <button class="linkbtn" data-authmode="forgot">${t('c.forgot')}?</button>`;
  }
  return `<div class="card authcard"><div class="authhead"><img src="logo-g.png" alt=""><b>Grafondex</b><small>${t('em.welcome')}</small></div>
    <div class="authtabs">${tab('login', '🔑', t('c.login'))}${tab('register', '✨', t('c.register'))}${tab('forgot', '❓', t('em.forgotTab'))}</div>
    <div class="form-block">${body}<div class="hint" id="a-msg">${esc(D.msg || '')}</div></div></div>`;
}
const adminLink = () => `<a class="card adminlink" href="#/admin"><span>🛡️</span><b>${t('admin.title')}</b><i>›</i></a>`;
async function viewAdmin() {
  setTitle(t('admin.title'));
  if (!isAdminUser()) return `<div class="empty">${t('admin.no')}</div>`;
  return `<div class="card adminhero"><b>🛡️ ${t('admin.title')}</b><div class="hint">${t('admin.hint')}</div></div>` + modCard() + serverCard();
}
// notification server / ntfy: only the admin sees and changes these
const serverCard = () => `<div class="card"><h2>⚙️ ${t('admin.server')}</h2><div class="form-block">
      <label>${t('serverUrl')}<input id="n-url" type="url" placeholder="https://grafondex.….workers.dev" value="${esc(notif.url)}"></label>
      <label>${t('secretKey')}<input id="n-key" type="password" autocomplete="off" value="${esc(notif.key)}"></label>
      <label>${t('topic')}<input id="n-topic" value="${esc(notif.topic)}"></label>
      <div class="hint">${t('ntfyHint')}</div>
      <button class="btn" id="a-save">${t('save')}</button><div class="hint" id="a-msg"></div></div></div>`;
function modCard() {
  return `<div class="card"><h2>🛡️ ${t('c.mod')}</h2><div class="form-block">
    <label>${t('c.username')}<input id="m-user" autocapitalize="off"></label>
    <div class="modbtns"><button data-mod="mute" data-min="10">${t('c.mute10')}</button><button data-mod="mute" data-min="60">${t('c.mute60')}</button><button data-mod="mute" data-min="1440">${t('c.mute1d')}</button>
      <button data-mod="mute" data-min="0">${t('c.unmute')}</button><button data-mod="ban" class="danger">${t('c.ban')}</button><button data-mod="unban">${t('c.unban')}</button></div>
    <label>${t('c.words')}<input id="m-word" autocapitalize="off"></label>
    <div class="modbtns"><button data-mod="addword">${t('c.addWord')}</button><button data-mod="rmword">${t('c.rmWord')}</button></div>
    <label>${t('c.newPass')}<input id="m-pass" type="password" autocomplete="new-password"></label>
    <div class="modbtns"><button data-mod="resetpass">${t('c.resetPass')}</button></div>
    <div class="hint" id="m-msg"></div></div><div id="m-reports"></div></div>`;
}
const accountCard = () => acct
  ? `<div class="card"><div class="profhead">${avatar({ username: acct.user.username, color: acct.user.color }, 48)}<div><b style="font-size:16px">${esc(acct.user.username)}</b>${isAdminUser() ? ' <i class="adminbadge">ADMIN</i>' : ''}
      ${acct.user.fav ? `<div class="hint">⭐ ${esc(acct.user.fav.name)}</div>` : ''}</div></div>
      <div class="form-block"><a class="btn" href="#/profile" style="text-align:center">${t('c.myProfile')} ›</a><button class="btn ghost" data-auth="logout">${t('c.logout')}</button></div></div>${isAdminUser() ? adminLink() : ''}`
  : authForm();
async function loadReports() {
  const box = document.getElementById('m-reports');
  if (!box || !isAdminUser()) return;
  try {
    const { reports } = await capi('GET', '/mod/reports');
    box.innerHTML = reports.length ? `<h2 style="border-top:1px solid var(--line)">🚩 ${t('c.reports')}</h2>` + reports.map(r =>
      `<div class="lrow" style="align-items:flex-start"><span class="nm" style="padding:10px 12px;white-space:normal"><b>${esc(r.author || '?')}</b> · ${esc(r.kind)} #${r.target_id} × ${r.n}<br><small class="sub">${esc(String(r.preview || '').slice(0, 160))}${r.reasons ? '<br>🚩 ' + esc(r.reasons) : ''}</small></span><button class="pin" data-rdismiss data-kind="${esc(r.kind)}" data-id="${r.target_id}" aria-label="OK">✓</button><button class="pin" data-mod="delitem" data-kind="${esc(r.kind)}" data-id="${r.target_id}" aria-label="${t('c.delete')}">🗑</button></div>`).join('') : '';
  } catch {}
}

// ---------- profile: avatar colour, bio, favourite team (public page: #/user/NAME)
async function viewProfile() {
  setTitle(t('c.profile'));
  if (!acct) return authForm();
  capi('GET', '/me').then(r => { if (acct && JSON.stringify(r.user) !== JSON.stringify(acct.user)) { acct.user = r.user; store.set('acct', acct); if (location.hash === '#/profile') render(true); } }).catch(() => {});
  const u = acct.user, me = { username: u.username, role: u.role, color: u.color, fav_id: u.fav?.id, fav_league: u.fav?.league, fav_name: u.fav?.name };
  // e-mail of the account: shown when set, otherwise a box to add one (needed for "forgot password")
  const mailBox = lazy(capi('GET', '/me').then(r => !r.mail ? badgeShowcase(r) : r.email
    ? `${badgeShowcase(r)}<div class="card"><div class="inforow"><span class="ic">📧</span><span class="k">${t('em.email')}</span><span class="v">${esc(r.email)} ✓</span></div></div>`
    : `<div class="card"><h2>📧 ${t('em.addTitle')}</h2><div class="form-block"><div class="hint">${t('em.addHint')}</div><input id="m-mail" type="email" autocomplete="email" autocapitalize="off" maxlength="120" placeholder="${esc(t('em.email'))}"><button class="btn ghost" data-mailcode="attach">✉️ ${t('em.send')}</button><input id="m-code" inputmode="numeric" maxlength="6" placeholder="${esc(t('em.code'))}"><button class="btn" data-mailattach>${t('em.save')}</button><div class="hint" id="m-msg"></div></div></div>`).catch(() => ''));
  const swatches = AVATAR_COLORS.map(c => `<button class="swatch ${c === (u.color || hashColor(u.username)) ? 'on' : ''}" style="background:${c}" data-color="${c}" aria-label="${c}"></button>`).join('');
  const FLs = favListOf(u);
  const favNow = FLs.length ? FLs.map(f => favItemHtml(f, true)).join('') : `<div class="hint">${t('c.noFavs')}</div>`;
  const addBtn = f => `<button class="tcell" data-favl-add data-k="${f.k}" data-id="${esc(f.id)}" data-name="${esc(f.name)}" data-league="${esc(f.league)}" data-sport="${esc(f.sport || 'soccer')}">${f.k === 'p' ? `<span class="pph sm" style="--pc:${pcol(f.name)}"><span class="pin_">${esc(initials(f.name))}</span></span>` : img(f.id, 'mid', f.league)}<span>${esc(f.name)}</span></button>`;
  const has = f => FLs.some(x => x.k === f.k && String(x.id) === String(f.id));
  const mine = [...favs.map(f => ({ k: 't', id: f.id, name: f.name, league: f.league, sport: 'soccer' })), ...pfavs.map(f => ({ k: 'p', id: f.id, name: f.name, league: f.league, sport: f.sport }))].filter(f => !has(f)).slice(0, 20).map(addBtn).join('');
  return `<div class="card profhead">${avatar(me, 64)}<div><b style="font-size:18px">${esc(u.username)}</b>${u.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}
      <div><a href="#/user/${encodeURIComponent(u.username)}" style="color:var(--accent);font-size:13px">${t('c.publicView')} ›</a></div></div></div>${mailBox}
    ${u.role === 'admin' ? adminLink() : ''}
    ${await rankCard()}
    ${u.badges?.length ? `<div class="card">${badgeRow(u.badges)}</div>` : ''}
    ${blocked.size ? `<div class="card"><h2>⛔ ${t('dm.blockedList')}</h2>${[...blocked].map(b => `<div class="lrow"><span class="nm" style="padding:10px 12px">${esc(b)}</span><button class="cbtn txt" data-block-user="${esc(b)}">${t('dm.unblock')}</button></div>`).join('')}</div>` : ''}
    <div class="card"><h2>🎨 ${t('c.avatarColor')}</h2><div class="swatches">${swatches}</div></div>
    <div class="card"><h2>📝 ${t('c.bio')}</h2><div class="form-block"><textarea id="pf-bio" maxlength="140" rows="3" placeholder="${t('c.bioPh')}">${esc(u.bio || '')}</textarea>
      <button class="btn" data-profile-save>${t('c.save')}</button><div class="hint" id="pf-msg"></div></div></div>
    <div class="card"><h2>⭐ ${t('c.favs')}</h2><div class="form-block">${favNow}
      ${mine ? `<div class="hint">${t('c.fromFavs')}</div><div class="tgrid">${mine}</div>` : ''}
      <div class="hint">${t('c.searchFav')}</div><input id="pf-q" type="search" autocomplete="off" autocapitalize="off" placeholder="${esc(t('search.ph'))}"><div id="pf-teams" class="tgrid"></div></div></div>
    <div class="card"><h2>🔒 ${t('c.security')}</h2><div class="form-block">
      <input id="pw-old" type="password" autocomplete="current-password" placeholder="${t('c.oldPass')}">
      <input id="pw-new" type="password" autocomplete="new-password" placeholder="${t('c.newPass')}">
      <button class="btn" data-pw-change>${t('c.changePass')}</button><div class="hint" id="pw-msg"></div>
      <button class="btn ghost" data-rec-new>${t('c.recNew')}</button><div class="hint" id="rec-msg">${t('c.recHint')}</div>
      <button class="btn ghost danger" data-acct-delete>${t('c.deleteAcct')}</button></div></div>
    <div class="card"><div class="form-block"><button class="btn ghost" data-auth="logout">${t('c.logout')}</button></div></div>`;
}
async function viewUser(name) {
  setTitle(name);
  const { user: u } = await capi('GET', '/users/' + encodeURIComponent(name));
  const m = { username: u.username, role: u.role, color: u.color, fav_id: u.fav?.id, fav_league: u.fav?.league, fav_name: u.fav?.name };
  const own = acct?.user?.username === u.username;
  if (u.rank != null) rankMap.set(u.username, u.rank);
  return `<div class="card profhead">${avatar(m, 64)}<div><b style="font-size:18px">${esc(u.username)}</b>${u.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}
      ${u.rank != null ? `<div class="rkline on">${RANK_UI[u.rank][0]} <b>${t(RANK_UI[u.rank][1])}</b>${u.weeklyWins ? ` · 🏆 ×${u.weeklyWins}` : ''}</div>` : ''}
      <div class="hint">${t('c.joined', fmtD(u.created * 1000, { day: 'numeric', month: 'long', year: 'numeric' }))}</div></div></div>
    ${u.badges?.length ? `<div class="card">${badgeRow(u.badges)}</div>` : ''}
    ${u.bio ? `<div class="card"><div class="form-block ptext">${esc(u.bio)}</div></div>` : ''}
    ${favListOf(u).length ? `<div class="card"><h2>⭐ ${t('c.favs')}</h2><div class="form-block">${favListOf(u).map(f => favItemHtml(f, false)).join('')}</div></div>` : ''}
    ${await followBox(u.username)}
    <div class="card"><div class="statrow"><div><b>${u.posts}</b><small>${t('c.topics')}</small></div><div><b>${u.messages}</b><small>${t('c.msgs')}</small></div></div></div>
    ${own ? `<a class="btn" href="#/profile" style="display:block;text-align:center">${t('c.editProfile')}</a>` : acct ? `<div class="card"><div class="form-block profact"><a class="btn" href="#/dm/${encodeURIComponent(u.username)}">✉️ ${t('dm.send')}</a><button class="btn ghost" data-block-user="${esc(u.username)}">${blocked.has(u.username) ? '✅ ' + t('dm.unblock') : '⛔ ' + t('dm.block')}</button></div></div>` : ''}${u.mod && !own ? umodCard(u) : ''}`;
}
// admins: the member's moderation state and the buttons to change it, right on the profile
function umodCard(u) {
  const s = u.mod, muted = s.muted_until > s.now, nm = esc(u.username);
  const state = s.banned ? `<b class="mst ban">⛔ ${t('u.banned')}</b>` : muted ? `<b class="mst mute">🔇 ${t('u.mutedTill', new Date(s.muted_until * 1000).toLocaleString(LOCALE(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</b>` : `<b class="mst ok">✅ ${t('u.active')}</b>`;
  const b = (act, label, min = '') => `<button class="btn ghost" data-cact="${act}" data-user="${nm}"${min !== '' ? ` data-min="${min}"` : ''}>${label}</button>`;
  return `<div class="card umod"><h2>🛡️ ${t('c.mod')}</h2><div class="form-block">${state}<div class="hint">${t('u.strikes', s.strikes)}</div>
    <div class="modbtns">${b('mute', t('c.mute10'), 10)}${b('mute', t('c.mute60'), 60)}${b('mute', t('c.mute1d'), 1440)}${muted ? b('mute', t('c.unmute'), 0) : ''}${s.banned ? b('unban', t('c.unban')) : b('ban', '⛔ ' + t('c.ban'))}</div></div></div>`;
}
// member search: everybody can find a member; admins also see banned / muted members
async function viewMembers(q = '') {
  setTitle(t('u.members'));
  q = decodeURIComponent(q || '');
  let list = '';
  if (q.length >= 2) {
    const d = await capi('GET', '/users?q=' + encodeURIComponent(q)).catch(() => ({ users: [] }));
    list = d.users.length ? `<div class="card">${d.users.map(u => `<a class="lrow" href="#/user/${encodeURIComponent(u.username)}">${avatar(u, 30)}<span class="nm" style="padding:10px 12px">${esc(u.username)}${u.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}${u.banned ? ` <b class="mst ban">⛔ ${t('u.banned')}</b>` : u.muted_until > d.now ? ` <b class="mst mute">🔇</b>` : ''}${u.strikes ? ` <small class="hint">⚠️ ${u.strikes}</small>` : ''}</span><span class="go">›</span></a>`).join('')}</div>` : `<div class="empty">${t('u.none')}</div>`;
  }
  return communityNav('members') + `<div class="card"><div class="form-block"><input id="mem-q" type="search" autocapitalize="off" placeholder="${esc(t('u.search'))}" value="${esc(q)}"></div></div>` + list;
}
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'mem-q') location.replace('#/members/' + encodeURIComponent(e.target.value.trim())); });
// Settings › sound volume (saved as you slide, a short ding to hear the level)
document.addEventListener('input', e => { const r = e.target.closest?.('[data-fxvol]'); if (!r) return; fx.vol = Math.max(0, Math.min(1, +r.value / 100)); store.set('fx', fx); const v = r.parentNode.querySelector('[data-fxvolv]'); if (v) v.textContent = r.value + '%'; clearTimeout(window._volT); window._volT = setTimeout(() => sfxPlay('chime', 0.8), 250); });
document.addEventListener('input', e => { if (e.target.id !== 'mem-q') return; clearTimeout(window._memT); window._memT = setTimeout(() => { const v = e.target.value.trim(); if (v.length >= 2 || !v) { history.replaceState(history.state, '', '#/members/' + encodeURIComponent(v)); render(true); } }, 450); });

document.addEventListener('click', async e => {
  const ch = e.target.closest('[data-pw-change]'), dl = e.target.closest('[data-acct-delete]');
  if (!ch && !dl) return;
  const msg = document.getElementById('pw-msg'), oldEl = document.getElementById('pw-old'), newEl = document.getElementById('pw-new');
  try {
    if (ch) { const np = newEl.value; await capi('POST', '/password', { old: oldEl.value, new: np }); msg.textContent = '✅ ' + t('c.passChanged'); oldEl.value = newEl.value = '';
      if (await loadLocalKey()) capi('POST', '/dm/key', { pub: dmPub, wrapped: await wrapPriv(dmPriv, np) }).catch(() => {}); } // the DM key follows the new password
    else {
      if (!oldEl.value) { msg.textContent = t('c.enterPass'); return; }
      if (!confirm(t('c.confirmDelete'))) return;
      await capi('POST', '/account/delete', { password: oldEl.value });
      acct = null; store.set('acct', null); location.hash = '#/settings'; render();
    }
  } catch (err) { msg.textContent = '❌ ' + errText(err); }
});

// ---------- theme: automatic / light / dark
let themeMode = store.get('theme', 'auto');
// team colours: the app takes the colours of a favourite team (ESPN's team colour + alternate colour)
let teamTheme = store.get('teamTheme', null); // { id, league, name, c1, c2 }
const lum = hex => { const n = parseInt(String(hex || '').replace('#', ''), 16); if (!Number.isFinite(n)) return .5; const [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
// "by daylight": dark from sunset to sunrise, worked out for the phone's time zone (NOAA approximation)
const TZ_LON = { 'Europe/Istanbul': [41, 29], 'Europe/Berlin': [52.5, 13.4], 'Europe/London': [51.5, -0.1], 'Europe/Paris': [48.9, 2.35], 'Europe/Madrid': [40.4, -3.7], 'Europe/Moscow': [55.75, 37.6], 'Europe/Warsaw': [52.2, 21], 'Asia/Baghdad': [36.2, 44] };
function sunTimes(d = new Date()) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone, [lat, lon] = TZ_LON[tz] || [45, -d.getTimezoneOffset() / 4];
  const rad = Math.PI / 180, n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const g = 2 * Math.PI / 365 * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g);
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec)) - Math.tan(lat * rad) * Math.tan(dec)) / rad;
  const utcMid = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return { rise: new Date(utcMid + (720 - 4 * (lon + ha) - eq) * 60e3), set: new Date(utcMid + (720 - 4 * (lon - ha) - eq) * 60e3) };
}
const sunDark = () => { try { const { rise, set } = sunTimes(), n = new Date(); return n < rise || n > set; } catch { const h = new Date().getHours(); return h < 7 || h >= 19; } };
setInterval(() => { if (themeMode === 'sun') { const want = sunDark() ? 'dark' : 'light'; if (document.documentElement.dataset.theme !== want) applyTheme(); } }, 60000);
const applyTheme = () => {
  const dark = themeMode === 'dark' || (themeMode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches) || (themeMode === 'sun' && sunDark());
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  if (teamTheme?.c1) {
    // an accent that stays readable: black kits get their second colour (or a light grey) in dark mode, white ones a dark tone in light mode
    let a = '#' + teamTheme.c1, b = '#' + (teamTheme.c2 || teamTheme.c1);
    if (dark && lum(a) < .06) a = lum(b) > .06 ? b : '#d1d5db';
    if (!dark && lum(a) > .7) a = lum(b) < .7 ? b : '#334155';
    const g1 = '#' + teamTheme.c1, g2 = lum('#' + teamTheme.c1) < .03 && lum(b) < .03 ? '#3f3f46' : b;
    root.style.setProperty('--accent', a); root.style.setProperty('--accent2', a);
    root.style.setProperty('--grad', `linear-gradient(100deg,${g1},${g1} 45%,${g2})`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', g1);
  } else {
    for (const k of ['--accent', '--accent2', '--grad']) root.style.removeProperty(k);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f4fd8');
  }
};
async function setTeamTheme(v) {
  if (!v) { teamTheme = null; store.set('teamTheme', null); applyTheme(); return; }
  const [league, id] = v.split('|'), f = favs.find(x => String(x.id) === id && x.league === league);
  const j = await get(`${api(league)}/teams/${id}`, 86400000).catch(() => null);
  const tm = j?.team;
  if (!tm?.color) { alert(t('tt.noColor')); return; }
  teamTheme = { id, league, name: f?.name || tm.displayName, c1: tm.color, c2: tm.alternateColor || '' };
  store.set('teamTheme', teamTheme); applyTheme();
}
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => themeMode === 'auto' && applyTheme()); } catch {}
applyTheme();
const themeCard = () => { const tf = favs.filter(f => sportOf(f.league) === 'soccer' && !String(f.id).startsWith('tff:'));
  return `<div class="card"><h2>🎨 ${t('theme.title')}</h2><div class="langs l4">${['auto', 'sun', 'light', 'dark'].map(m =>
  `<button class="langbtn ${m === themeMode ? 'on' : ''}" data-theme-set="${m}">${t('theme.' + m)}</button>`).join('')}</div>
  <div class="form-block"><label>⚽ ${t('tt.title')}<select data-team-theme><option value="">${t('tt.off')}</option>${tf.map(f => `<option value="${esc(f.league)}|${esc(f.id)}" ${teamTheme && String(teamTheme.id) === String(f.id) ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>${tf.length ? '' : `<div class="hint">${t('tt.needFav')}</div>`}</div></div>`; };

// the profile's favourites: several teams and players (older accounts have just the one team)
const favListOf = u => { const l = [...(u?.favlist || [])]; if (u?.fav && !l.some(f => f.k === 't' && String(f.id) === String(u.fav.id))) l.unshift({ k: 't', id: u.fav.id, name: u.fav.name, league: u.fav.league, sport: 'soccer' }); return l; };
const favItemHtml = (f, rm) => `<div class="favcur">${f.k === 'p' ? `<span class="pph sm" style="--pc:${pcol(f.name)}"><span class="pin_">${esc(initials(f.name))}</span>${phImg(hsUrl(f.sport, f.league, f.id), f.name, f.sport)}</span>` : img(f.id, 'mid', f.league)}<a href="${f.k === 'p' ? `#/player/${esc(f.sport)}/${esc(f.league)}/${esc(f.id)}` : `#/team/${esc(f.league)}/${esc(f.id)}`}"><b>${esc(f.name)}</b></a>${rm ? `<button class="cbtn txt" data-favl-rm="${f.k}|${esc(f.id)}">✕ ${t('c.remove')}</button>` : ''}</div>`;
document.addEventListener('click', async e => {
  const add = e.target.closest('[data-favl-add]'), rm = e.target.closest('[data-favl-rm]');
  if (!add && !rm) return;
  e.preventDefault();
  try {
    let list = favListOf(acct.user), body = {};
    if (add) {
      const { k, id, name, league, sport } = add.dataset;
      if (!list.some(f => f.k === k && String(f.id) === id)) list.push({ k, id, name, league, sport });
      if (k === 't') { if (!acct.user.fav) body.fav = { id, name, league }; if (!isFav(id, league)) { favs = [...favs, { id, name, league }]; store.set('favs', favs); if (notif.key || notif.push) syncNotify().catch(() => {}); } }
      else if (!isPFav(id, sport)) { pfavs = [...pfavs, { id, name, sport, league, team: '' }]; store.set('pfavs', pfavs); }
    } else {
      const [k, id] = rm.dataset.favlRm.split('|');
      list = list.filter(f => !(f.k === k && String(f.id) === id));
      if (k === 't' && String(acct.user.fav?.id) === id) { const nx = list.find(f => f.k === 't'); body.fav = nx ? { id: nx.id, name: nx.name, league: nx.league } : null; }
    }
    const r = await capi('POST', '/profile', { ...body, favlist: list });
    acct.user = r.user; store.set('acct', acct); render(true);
  } catch (err) { alert(errText(err)); }
});
let pfTimer = 0;
document.addEventListener('input', e => {
  if (e.target.id !== 'pf-q') return;
  clearTimeout(pfTimer); const v = e.target.value.trim(), box = document.getElementById('pf-teams');
  if (v.length < 2) { box.innerHTML = ''; return; }
  pfTimer = setTimeout(async () => {
    box.innerHTML = '<div class="hint">…</div>';
    const [jt, jp] = await Promise.all(['team', 'player'].map(ty => get(`${ESPN_Q}query=${encodeURIComponent(v)}&limit=12&type=${ty}`, 120000).catch(() => ({}))));
    const teams = ((jt.results || []).find(r => r.type === 'team')?.contents || []).map(c => ({ k: 't', id: uidId(c.uid, 't'), name: c.displayName, sport: 'soccer', league: c.defaultLeagueSlug || '', sub: c.subtitle || '', sp: c.sport }))
      .filter(x => x.id && x.league && (x.sp === 'soccer' || LEAGUES.some(l => l.id === x.league)));
    const players = ((jp.results || []).find(r => r.type === 'player')?.contents || []).map(c => ({ k: 'p', id: uidId(c.uid, 'a'), name: c.displayName, sport: c.sport || 'soccer', league: c.defaultLeagueSlug || c.sport || 'soccer', sub: [c.subtitle, c.description].filter(Boolean).join(' · ') })).filter(x => x.id);
    const list = [...teams, ...players];
    if (document.getElementById('pf-q')?.value.trim() !== v) return;
    box.innerHTML = list.length ? list.map(x => `<button class="tcell" data-favl-add data-k="${x.k}" data-id="${esc(x.id)}" data-name="${esc(x.name)}" data-league="${esc(x.league)}" data-sport="${esc(x.sport)}">${x.k === 'p' ? `<span class="pph sm" style="--pc:${pcol(x.name)}"><span class="pin_">${esc(initials(x.name))}</span></span>` : img(x.id, 'mid', x.league)}<span>${esc(x.name)}<small class="hint" style="display:block">${x.k === 'p' ? '👤 ' : ''}${esc(x.sub)}</small></span></button>`).join('') : `<div class="hint">${t('search.none')}</div>`;
  }, 300);
});
document.addEventListener('click', async e => {
  const th = e.target.closest('[data-theme-set]');
  if (th) { themeMode = th.dataset.themeSet; store.set('theme', themeMode); applyTheme(); render(true); return; }
  const co = e.target.closest('[data-color]');
  const pt = e.target.closest('[data-pick-team]');
  const fc = e.target.closest('[data-fav-clear]');
  const ps = e.target.closest('[data-profile-save]');
  if (!co && !pt && !fc && !ps) return;
  const msg = document.getElementById('pf-msg');
  try {
    let r;
    if (co) r = await capi('POST', '/profile', { color: co.dataset.color });
    else if (fc) r = await capi('POST', '/profile', { fav: null });
    else if (ps) { r = await capi('POST', '/profile', { bio: document.getElementById('pf-bio').value }); if (msg) msg.textContent = '✅ ' + t('c.saved'); }
    else {
      const { id, name, league } = pt.dataset;
      r = await capi('POST', '/profile', { fav: { id, name, league } });
      // the profile team is also a favourite: it shows in Favourites and gets goal notifications
      if (!isFav(id, league)) { favs = [...favs, { id, name, league }]; store.set('favs', favs); if ((notif.key || notif.push)) syncNotify().catch(() => {}); }
    }
    acct.user = r.user; store.set('acct', acct);
    if (!ps) render(true);
  } catch (err) { if (msg) msg.textContent = '❌ ' + errText(err); else alert(errText(err)); }
});

// ---------- forum
let notifCount = 0, notifAt = 0;
const communityNav = active => { const games = ['lb', 'games', 'fantasy', 'quiz'].includes(active); return `<div class="seg segscroll"><a data-replace href="#/forum" class="${active === 'forum' ? 'on' : ''}">💬 ${t('cat.topics')}</a>${acct ? `<a data-replace href="#/feed" class="${active === 'feed' ? 'on' : ''}">📰 ${t('fd.tab')}</a>` : ''}<a data-replace href="#/dm" class="${active === 'dm' ? 'on' : ''}">✉️ ${t('dm.title')}${dmUnread ? `<i class="nbadge">${dmUnread}</i>` : ''}</a><a data-replace href="#/notifs" class="${active === 'notifs' ? 'on' : ''}">🔔 ${t('nt.title')}${notifCount ? `<i class="nbadge">${notifCount}</i>` : ''}</a><a data-replace href="#/games" class="${games ? 'on' : ''}">🎮 ${t('gm.tab')}</a><a data-replace href="#/members" class="${active === 'members' ? 'on' : ''}">👥 ${t('u.members')}</a></div>${games ? gamesBar(active) : ''}`; };
async function pollNotifs(force) {
  if (!acct || (!force && Date.now() - notifAt < 45000)) return;
  notifAt = Date.now();
  try { const r = await capi('GET', '/notifs?count=1'); notifCount = r.unread || 0; dmUnread = r.dm || 0; } catch { return; }
  const tab = document.querySelector('#tabs a[data-tab="forum"]'); if (!tab) return;
  tab.querySelector('.tbadge')?.remove();
  paintDmBtn();
  const all = notifCount + dmUnread;
  if (all) tab.insertAdjacentHTML('beforeend', `<i class="tbadge">${all > 9 ? '9+' : all}</i>`);
}
const FORUM_CATS = [['genel', '💬'], ['superlig', '🇹🇷'], ['avrupa', '🌍'], ['transfer', '🔁'], ['tahmin', '🎯'], ['taktik', '🧠'], ['nostalji', '📼'], ['basket', '🏀'], ['tenis', '🎾'], ['f1', '🏎️'], ['diger', '🏐'], ['takim', '🛡️'], ['oneri', '🛠️']];
const FORUM_SECTIONS = [['general', ['genel', 'oneri']], ['football', ['superlig', 'avrupa', 'transfer', 'tahmin', 'taktik', 'nostalji']], ['other', ['basket', 'tenis', 'f1', 'diger']], ['teams', ['takim']]];
const catName = k => t('cat.' + k);
const catIcon = k => (FORUM_CATS.find(c => c[0] === k) || ['', '💬'])[1];
const catChip = k => `<a class="catchip" href="#/forum/${k}">${catIcon(k)} ${esc(catName(k))}</a>`;
const refLink = p => { const mm = /^match:([^:]+):(\d+)$/.exec(p.ref || ''); if (mm) return `<a class="reflink" href="#/match/${esc(mm[1])}/${esc(mm[2])}" title="${t('mt.goto')}">⚽</a> `; const m = /^team:([^:]+):(\d+)$/.exec(p.ref || ''); return m ? `<a class="reflink" href="#/team/${esc(m[1])}/${esc(m[2])}" title="${t('cat.openTeam')}">🛡️</a> ` : ''; };
// every topic has a short code (#0042) that can be shared and typed into the code box
const codeOf = id => '#' + String(id).padStart(4, '0');
const codeBox = () => `<div class="card codebox"><div class="form-block"><div class="hint">🔎 ${t('cat.codeHint')}</div><div class="coderow"><input id="code-q" maxlength="12" placeholder="${esc(t('cat.codePh'))}" autocomplete="off" autocapitalize="off"><button class="btn" data-code-go>${t('cat.codeGo')}</button></div><div class="hint" id="code-msg"></div></div></div>`;
const postRow = (p, showCat) => `<div class="lrow postrow trow" data-href="#/post/${p.id}"><div class="pbody"><a class="ptitle" href="#/post/${p.id}"><b>${p.pinned ? '<span class="pin">📌</span>' : ''}${esc(p.title)}</b></a>
  <small><i class="pcode">${codeOf(p.id)}</i> ${refLink(p)}${showCat ? `${catIcon(p.category)} ${esc(catName(p.category))} · ` : ''}${nameHtml(p)} · ${ago(p.last || p.created)}</small></div><div class="tstats"><span>💬 ${p.replies}</span><span>👁 ${p.views || 0}</span></div></div>`;
const loginCard = () => `<div class="card"><div class="form-block"><div class="hint">${t('c.needLogin')}</div><a class="btn" href="#/profile" style="text-align:center">${t('c.login')} ›</a></div></div>`;
const retryBox = e => `<div class="empty">⚠️ ${esc(errText(e))}<br><button class="btn" data-retry style="margin-top:12px">${t('refresh')}</button></div>`;
async function viewForum(cat, sort) {
  setTitle(t('nav.forum'));
  if (!FORUM_CATS.some(c => c[0] === cat)) return viewForumHome();
  sort = ['active', 'new', 'top'].includes(sort) ? sort : 'active';
  let posts;
  try { posts = (await capi('GET', `/posts?cat=${cat}&sort=${sort}`)).posts; } catch (e) { return communityNav('forum') + retryBox(e); }
  const composer = cat === 'takim' ? `<div class="card"><div class="form-block"><div class="hint">${t('cat.teamHint')}</div><a class="btn ghost" href="#/search" style="text-align:center">${t('search.title')} ›</a></div></div>`
    : topicLock() ? topicLock() : acct ? `<div class="card"><h2>✍️ ${t('c.newTopic')} · ${catIcon(cat)} ${esc(catName(cat))}</h2><div class="form-block">
        <input id="p-title" maxlength="100" placeholder="${esc(t('cat.' + cat + '.ph'))}"><textarea id="p-body" maxlength="2000" rows="4" placeholder="${t('c.text')}"></textarea>
        ${pollFields()}<button class="btn" data-post-send="${cat}">${t('c.post')}</button><div class="hint" id="p-msg"></div></div></div>` : loginCard();
  const sorts = `<div class="sortbar">${[['active', 'cat.sortActive'], ['new', 'cat.sortNew'], ['top', 'cat.sortTop']].map(([k, l]) => `<a data-replace href="#/forum/${cat}/${k}" class="${sort === k ? 'on' : ''}">${t(l)}</a>`).join('')}</div>`;
  const list = posts.length ? `<div class="card">${posts.map(p => postRow(p, false)).join('')}</div>` : `<div class="empty">${t('c.noPosts')}</div>`;
  return communityNav('forum') + scrollBar(`<div class="catbar"><a class="catchip" href="#/forum">‹ ${t('cat.all')}</a>${FORUM_CATS.filter(c => c[0] !== cat).map(c => catChip(c[0])).join('')}</div>`)
    + `<div class="card"><div class="form-block"><b style="font-size:17px">${catIcon(cat)} ${esc(catName(cat))}</b><div class="hint">${esc(t('cat.' + cat + '.d'))}</div></div></div>` + codeBox() + composer + sorts + list;
}
async function viewForumHome() {
  // an older Worker has no /posts/cats: the page must still open
  const [cr, pr] = await Promise.allSettled([capi('GET', '/posts/cats'), capi('GET', '/posts?sort=active')]);
  if (pr.status === 'rejected') return communityNav('forum') + retryBox(pr.reason);
  const posts = pr.value.posts.filter(p => !p.pinned), cats = cr.status === 'fulfilled' ? cr.value.cats : [];
  const info = Object.fromEntries(cats.map(c => [c.category, c]));
  const nT = cats.reduce((x, c) => x + c.n, 0), nR = cats.reduce((x, c) => x + c.replies, 0);
  const board = k => { const i = info[k], l = i?.last; return `<a class="board" href="#/forum/${k}"><span class="bi">${catIcon(k)}</span><span class="bm"><b>${esc(catName(k))}</b><small>${esc(t('cat.' + k + '.d'))}</small>
    ${l ? `<span class="bl">↳ ${esc(l.title)} · ${esc(l.username)} · ${ago(l.last)}</span>` : ''}</span><span class="bn"><b>${i ? i.n : 0}</b>${t('cat.topicsLbl')}<br>${i ? i.replies : 0} ${t('cat.repliesLbl')}</span></a>`; };
  const sections = FORUM_SECTIONS.map(([sk, ks]) => `<div class="secthead">${t('cat.sec.' + sk)}</div><div class="card" style="overflow:hidden">${ks.map(board).join('')}</div>`).join('');
  const hot = posts.length ? `<div class="secthead">🔥 ${t('cat.recent')}</div><div class="card">${posts.slice(0, 8).map(p => postRow(p, true)).join('')}</div>` : '';
  return communityNav('forum') + codeBox() + `<div class="card"><div class="form-block"><b style="font-size:17px">${t('cat.welcome')}</b><div class="tstats" style="margin:2px 0 4px"><span>📚 ${nT} ${t('cat.topicsLbl')}</span><span>💬 ${nR} ${t('cat.repliesLbl')}</span></div><div class="hint">${t('cat.rules')}</div></div></div>` + sections + hot;
}
async function teamForumHtml(league, id) {
  const ref = `team:${league}:${id}`;
  let posts = [];
  try { posts = (await capi('GET', `/posts?cat=takim&ref=${encodeURIComponent(ref)}&sort=active`)).posts; } catch { return `<div class="empty">⚠️ ${t('c.err.network')}</div>`; }
  const composer = topicLock() ? topicLock() : acct ? `<div class="card"><h2>✍️ ${t('c.newTopic')}</h2><div class="form-block"><input id="p-title" maxlength="100" placeholder="${t('c.title')}"><textarea id="p-body" maxlength="2000" rows="3" placeholder="${t('c.text')}"></textarea>
      <button class="btn" data-post-send="takim" data-ref="${esc(ref)}">${t('c.post')}</button><div class="hint" id="p-msg"></div></div></div>` : loginCard();
  return composer + (posts.length ? `<div class="card">${posts.map(p => postRow(p, false)).join('')}</div>` : `<div class="empty">${t('cat.noTeamPosts')}</div>`);
}

const BADGE_ICON = { admin: '🛡️', weekly: '🏆', sharp: '🎯', sniper: '🏅', oracle: '🧠', streak7: '🔥', streak30: '🔥', writer: '✍️', chatty: '💬', veteran: '🎖️' };
const badgeRow = list => (list && list.length) ? `<div class="badges">${list.map(b => `<span class="bdg" title="${esc(t('bdg.' + b + '.d'))}">${BADGE_ICON[b] || '⭐'} ${t('bdg.' + b)}</span>`).join('')}</div>` : '';
const likeBtn = (kind, m) => `<button class="cbtn txt like ${m.liked ? 'on' : ''}" data-cact="like" data-kind="${kind}" data-id="${m.id}" aria-label="${t('c.like')}">${m.liked ? '♥' : '♡'} <span>${m.likes || 0}</span></button>`;
const delBtn = (kind, id, owner) => (acct && (isAdminUser() || acct.user.username === owner)) ? `<button class="cbtn txt" data-cact="del" data-kind="${kind}" data-id="${id}" aria-label="${t('c.delete')}">🗑 ${t('c.delete')}</button>` : '';
async function viewPost(id) {
  setTitle(t('nav.forum'));
  const { post, comments } = await capi('GET', '/posts/' + encodeURIComponent(id));
  const cm = comments.map(c => `<div class="cmsg" data-id="${c.id}" data-user="${esc(c.username)}" data-kind="comment"><div class="cmeta">${nameHtml(c)}<small>${ago(c.created)}</small>
      <span class="cact">${likeBtn('comment', c)}${delBtn('comment', c.id, c.username)}${modBtns(c.username, 'comment', c.id)}</span></div><div class="ctext">${esc(c.body)}</div></div>`).join('');
  const composer = acct
    ? `<div class="card"><div class="form-block"><textarea id="c-body" maxlength="1000" rows="3" placeholder="${t('c.writeComment')}"></textarea>
        <button class="btn" data-comment-send="${post.id}">${t('c.send')}</button><div class="hint" id="c-msg"></div></div></div>`
    : `<div class="card"><div class="form-block"><div class="hint">${t('c.needLogin')}</div><a class="btn" href="#/settings" style="text-align:center">${t('c.login')} ›</a></div></div>`;
  return `<div class="catbar"><a class="catchip" href="#/forum/${esc(post.category || 'genel')}">‹ ${catIcon(post.category)} ${esc(catName(post.category || 'genel'))}</a></div>
    <div class="card"><div class="form-block"><b style="font-size:17px">${esc(post.title)}</b><small class="hint"><button class="pcode big" data-copy="${codeOf(post.id)}" title="${esc(t('cat.codeCopy'))}">${codeOf(post.id)} ⧉</button> ${refLink(post)}${nameHtml(post)} · ${ago(post.created)} · 👁 ${post.views || 0}${post.pinned ? ' · 📌' : ''}</small>
    <div class="ptext">${esc(post.body)}</div><span class="cact">${isAdminUser() ? `<button class="cbtn txt" data-cact="pin" data-kind="post" data-id="${post.id}" data-pinned="${post.pinned ? 0 : 1}">📌 ${post.pinned ? t('cat.unpin') : t('cat.pin')}</button>` : ''}${likeBtn('post', post)}${delBtn('post', post.id, post.username)}${modBtns(post.username, 'post', post.id)}</span></div></div>
    ${post.poll ? lazy(topicPollHtml(post.id)) : ''}
    <div class="card"><h2>${t('c.comments')} (${comments.length})</h2>${cm || `<div class="empty" style="padding:14px">${t('c.noComments')}</div>`}</div>` + composer;
}

// ---------- moderation buttons next to a message (admins) and report/delete (members)
const modBtns = (user, kind, id) => {
  if (!acct) return '';
  const mine = acct.user.username === user;
  const rep = !mine && !isAdminUser() ? `<button class="cbtn txt" data-cact="report" data-kind="${kind}" data-id="${id}" aria-label="${t('c.report')}">🚩 ${t('c.report')}</button>` : '';
  const adm = isAdminUser() && !mine ? `<button class="cbtn txt" data-cact="mute" data-user="${esc(user)}" data-min="10">🔇 ${t('c.mute10')}</button><button class="cbtn txt" data-cact="mute" data-user="${esc(user)}" data-min="60">🔇 ${t('c.mute60')}</button><button class="cbtn txt" data-cact="mute" data-user="${esc(user)}" data-min="1440">🔇 ${t('c.mute1d')}</button><button class="cbtn txt" data-cact="ban" data-user="${esc(user)}" aria-label="${t('c.ban')}">⛔ ${t('c.ban')}</button>` : '';
  return rep + adm;
};

// ---------- match chat: everybody reads, only members write; polls every 3 s while the pane is on screen
const clockOf = ts => new Date(ts * 1000).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit' });
const dayOfTs = ts => isoDay(new Date(ts * 1000));
const daySep = ts => { const k = dayOfTs(ts); return `<div class="daysep"><span>${k === isoDay(new Date()) ? t('today') : k === isoDay(addDays(new Date(), -1)) ? t('yesterday') : fmtD(ts * 1000, { day: 'numeric', month: 'long' })}</span></div>`; };
const chatMsg = m => {
  const mine = acct && m.username === acct.user.username;
  const acts = acct ? `${delBtn('chat', m.id, m.username)}${modBtns(m.username, 'chat', m.id)}` : '';
  return `<div class="bub ${mine ? 'mine' : ''}" data-id="${m.id}" data-user="${esc(m.username)}" data-kind="chat">${mine ? '' : avatar(m, 30)}
    <div class="bubbody"><div class="bubhead">${nameHtml(m)}</div><div class="bubtext">${esc(m.body)}</div><div class="bubfoot">${clockOf(m.created)}${likeBtn('chat', m)}</div>${acts ? `<div class="bubact">${acts}</div>` : ''}</div></div>`;
};
function chatRows(msgs, prevDay) {
  let html = '', last = prevDay;
  for (const m of msgs) { const d = dayOfTs(m.created); if (d !== last) { html += daySep(m.created); last = d; } html += chatMsg(m); }
  return { html, last };
}
function chatHtml(room, closed) {
  const bar = closed ? `<div class="chatbar login"><div class="hint">🔒 ${closed}</div></div>` : acct
    ? `<div class="chatbar"><input class="chatin" maxlength="300" placeholder="${t('c.chatPlaceholder')}" enterkeyhint="send" autocomplete="off"><button class="chatsend" aria-label="${t('c.send')}">➤</button></div><div class="chaterr"></div>`
    : `<div class="chatbar login"><div class="hint">${t('c.chatNeedLogin')}</div><a class="btn" href="#/profile">${t('c.login')} ›</a></div>`;
  return `<div class="chat" data-room="${esc(room)}"><div class="chatlog"><div class="empty">…</div></div>${bar}</div>`;
}
let chatTick = 0;
async function chatPoll(el, full) {
  if (el.dataset.busy) return;
  el.dataset.busy = '1';
  try {
    const after = full ? 0 : +el.dataset.last || 0;
    const { messages } = await capi('GET', `/chat/${encodeURIComponent(el.dataset.room)}${after ? '?after=' + after : ''}`);
    const log = el.querySelector('.chatlog');
    const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 80 || !el.dataset.last;
    if (after === 0) {
      const sig = messages.map(m => m.id).join(',');
      if (sig !== el.dataset.sig) { // rebuild only when something was added or deleted (keeps scroll position and open menus)
        el.dataset.sig = sig;
        const r = chatRows(messages, '');
        log.innerHTML = messages.length ? r.html : `<div class="empty">${t('c.chatEmpty')}</div>`;
        el.dataset.day = r.last;
      }
      el.dataset.last = messages.length ? messages.at(-1).id : 0;
    } else if (messages.length) {
      log.querySelector('.empty')?.remove();
      const r = chatRows(messages, el.dataset.day || '');
      log.insertAdjacentHTML('beforeend', r.html);
      el.dataset.day = r.last; el.dataset.last = messages.at(-1).id;
      el.dataset.sig = (el.dataset.sig ? el.dataset.sig + ',' : '') + messages.map(m => m.id).join(',');
    }
    if (atEnd) log.scrollTop = log.scrollHeight;
  } catch {}
  delete el.dataset.busy;
}
// ---- live connection: new messages and deletions arrive over a WebSocket; polling only fills in when it is not open
const chatSockets = new Set();
function chatPush(el, d) {
  const log = el.querySelector('.chatlog');
  if (d.t === 'msg' && d.m && d.m.id > (+el.dataset.last || 0)) {
    const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    log.querySelector('.empty')?.remove();
    const r = chatRows([d.m], el.dataset.day || '');
    log.insertAdjacentHTML('beforeend', r.html);
    el.dataset.day = r.last; el.dataset.last = d.m.id; el.dataset.sig = (el.dataset.sig ? el.dataset.sig + ',' : '') + d.m.id;
    if (atEnd || (acct && d.m.username === acct.user.username)) log.scrollTop = log.scrollHeight;
  } else if (d.t === 'del') {
    log.querySelector(`.bub[data-id="${+d.id}"]`)?.remove();
    el.dataset.sig = (el.dataset.sig || '').split(',').filter(x => x !== String(d.id)).join(',');
  }
}
function chatConnect(el) {
  if (el.__ws || !('WebSocket' in window)) return;
  try {
    const ws = new WebSocket(apiBase().replace(/^http/, 'ws') + `/chat/${encodeURIComponent(el.dataset.room)}/ws`);
    el.__ws = ws; chatSockets.add(ws);
    ws.onmessage = e => { if (e.data === 'pong') return; try { chatPush(el, JSON.parse(e.data)); } catch {} };
    ws.onclose = () => { chatSockets.delete(ws); el.__ws = null; if (el.isConnected) setTimeout(() => el.isConnected && chatConnect(el), 4000); };
    ws.onerror = () => { try { ws.close(); } catch {} };
  } catch {}
}
setInterval(() => { for (const ws of chatSockets) if (ws.readyState === 1) ws.send('ping'); }, 25000); // keep-alive
setInterval(() => {
  if (document.hidden) return;
  chatTick++;
  if (chatNext > Date.now() && !chatTimer) chatCooldown(Math.ceil((chatNext - Date.now()) / 1000));
  for (const el of document.querySelectorAll('.chat[data-room]')) {
    if (!el.offsetParent) continue;
    const live = el.__ws?.readyState === 1;
    if (live && chatTick % 8 !== 0) continue; // the socket delivers; every 8th round still reloads the list so nothing is missed
    chatPoll(el, chatTick % 8 === 0);
  }
  for (const ws of [...chatSockets]) if (![...document.querySelectorAll('.chat[data-room]')].some(el => el.__ws === ws)) { try { ws.close(); } catch {} } // left the page
}, 3000);
let chatNext = 0, chatTimer = 0;
function chatCooldown(sec) {
  chatNext = Date.now() + sec * 1000; clearInterval(chatTimer);
  const tick = () => {
    const left = Math.ceil((chatNext - Date.now()) / 1000);
    // while the minute runs the whole box is locked and shows the countdown (no red warning line)
    document.querySelectorAll('.chat').forEach(c => {
      const inp = c.querySelector('.chatin'), btn = c.querySelector('.chatsend'); if (!inp) return;
      c.querySelector('.chatbar').classList.toggle('cool', left > 0);
      inp.disabled = left > 0; btn.disabled = left > 0;
      inp.placeholder = left > 0 ? '⏳ ' + t('c.chatWait', left) : t('c.chatPlaceholder');
      btn.textContent = left > 0 ? left : '➤';
      if (left > 0) c.querySelector('.chaterr').textContent = '';
    });
    if (left <= 0) { clearInterval(chatTimer); chatTimer = 0; }
  };
  tick(); chatTimer = setInterval(tick, 1000);
}
async function chatSend(el) {
  const input = el.querySelector('.chatin'), err = el.querySelector('.chaterr');
  const body = input.value.trim();
  if (!body) return;
  err.textContent = '';
  const left = Math.ceil((chatNext - Date.now()) / 1000);
  if (left > 0 && !isAdminUser()) return;
  try {
    await capi('POST', `/chat/${encodeURIComponent(el.dataset.room)}`, { body });
    input.value = '';
    if (!isAdminUser()) chatCooldown(60);
    chatPoll(el);
  } catch (e) {
    if (e.code === 'slow_down' && e.data?.wait) { chatCooldown(e.data.wait); return; }
    err.textContent = '⚠️ ' + errText(e);
  }
}
// the chat box survives the automatic page refreshes of a live match (typed text, scroll position)
function keepChat(prev) {
  if (!prev) return;
  const ph = app.querySelector(`.chat[data-room="${CSS.escape(prev.node.dataset.room)}"]`);
  if (!ph) return;
  ph.replaceWith(prev.node);
  if (prev.focus) prev.node.querySelector('.chatin')?.focus();
}
// arrows only where there is more to scroll
const updArrows = bar => { const w = bar.parentElement; if (!w?.classList.contains('sbwrap')) return; w.classList.toggle('cl', bar.scrollLeft > 4); w.classList.toggle('cr', bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4); };
document.addEventListener('scroll', e => { if (e.target.matches?.('.sportbar, .catbar')) updArrows(e.target); }, true);
addEventListener('resize', () => document.querySelectorAll('.sportbar, .catbar').forEach(updArrows));
// mouse wheel scrolls the chip bars sideways
document.addEventListener('wheel', e => {
  const bar = e.target.closest?.('.sportbar, .catbar, .chips, .datebar');
  if (bar && Math.abs(e.deltaY) > Math.abs(e.deltaX) && bar.scrollWidth > bar.clientWidth) { bar.scrollLeft += e.deltaY; e.preventDefault(); }
}, { passive: false });
function paintProfileTab() {
  const ti = document.querySelector('#tabs a[data-tab="profile"] .ti'); if (!ti) return;
  if (!acct) { if (ti.dataset.av) { ti.innerHTML = ti.dataset.icon; delete ti.dataset.av; } return; }
  if (!ti.dataset.icon) ti.dataset.icon = ti.innerHTML;
  ti.dataset.av = '1'; ti.innerHTML = `<i class="tav" style="background:${esc(acct.user.color || hashColor(acct.user.username))}">${esc(String(acct.user.username)[0].toUpperCase())}</i>`;
}
// slow, non-critical parts of a page (news, forum, other tables ...) load after the page is already on screen
const lazyJobs = new Map(), lazyDone = new Map(); let lzSeq = 0;
const LZ_PH = '<i class="sk w70" style="display:block;margin:14px"></i>';
function lazy(p, tag = 'div') {
  const n = ++lzSeq;
  lazyJobs.set(n, Promise.resolve(p).then(h => h ?? '', () => '').then(h => { lazyDone.set(n, h); return h; }));
  if (lazyJobs.size > 200) { const k = lazyJobs.keys().next().value; lazyJobs.delete(k); lazyDone.delete(k); }
  return `<${tag} class="lz" data-lz="${n}">${LZ_PH}</${tag}>`;
}
function fillLazy() {
  document.querySelectorAll('[data-lz]:not([data-lzd])').forEach(el => {
    const n = +el.dataset.lz, tag = el.tagName.toLowerCase(), ph = `<${tag} class="lz" data-lz="${n}">${LZ_PH}</${tag}>`;
    const put = h => {
      if (el.isConnected) { el.dataset.lzd = '1'; el.innerHTML = h; afterRender(); }
      const done = `<${tag} class="lz" data-lz="${n}" data-lzd="1">${h}</${tag}>`;
      for (const [k, v] of pageCache) if (v.html.includes(ph)) pageCache.set(k, { ...v, html: v.html.replace(ph, () => done) });
    };
    if (lazyDone.has(n)) put(lazyDone.get(n)); else lazyJobs.get(n)?.then(put);
  });
}
const afterRender = () => {
  photoWatch();
  fillLazy();
  paintProfileTab();
  fillBadges(); fillLeagueLogos(); fillValues();
  { const ab = document.getElementById('adminbtn'); if (ab) ab.hidden = !isAdminUser(); }
  paintDmBtn();
  pollNotifs();
  const sq = document.getElementById('sq'); if (sq && !sq.value) sq.focus();
  const on = document.querySelector('.sportbar button.on'); if (on) { const bar = on.parentElement; bar.scrollLeft = Math.max(0, on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2); }
  document.querySelectorAll('.sportbar, .catbar').forEach(updArrows);
  document.querySelectorAll('.chat[data-room]:not([data-init])').forEach(el => { el.dataset.init = '1'; chatPoll(el, true); chatConnect(el); });
  loadReports();
};

// ---------- clicks
function goCode() {
  const q = document.getElementById('code-q'), msg = document.getElementById('code-msg'); if (!q) return;
  const n = +String(q.value).replace(/\D/g, '');
  if (!n) { msg.textContent = t('cat.codeBad'); return; }
  location.hash = '#/post/' + n;
}
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'code-q') { e.preventDefault(); goCode(); return; }
  if (e.key === 'Enter' && e.target.classList?.contains('chatin')) { e.preventDefault(); chatSend(e.target.closest('.chat')); }
});
document.addEventListener('click', async e => {
  const bub = e.target.closest('.bub');
  if (bub && !e.target.closest('a,button')) { document.querySelectorAll('.bub.open').forEach(x => x !== bub && x.classList.remove('open')); bub.classList.toggle('open'); return; }
  const send = e.target.closest('.chatsend');
  if (send) { chatSend(send.closest('.chat')); return; }

  const am = e.target.closest('[data-authmode]');
  if (am) { authMode = authDraft.mode = am.dataset.authmode; authDraft.msg = ''; saveDraft(); redrawAuth(); return; }
  const amsg = (txt, keep) => { const m = document.getElementById('a-msg'); if (m) m.textContent = txt; authDraft.msg = keep ? txt : ''; saveDraft(); };
  const signedIn = (r, password) => { clearDraft(); authMode = 'login'; acct = { token: r.token, user: r.user }; store.set('acct', acct); render(); dmPriv = null; if (password) dmSetup(password).catch(() => {}); loadBlocks(); };
  const sendCode = async (email, purpose) => { await capi('POST', '/email/code', { email, purpose, lang: LANG }); };
  if (e.target.closest('[data-regback]')) { authDraft.regStep = ''; authDraft.msg = ''; saveDraft(); redrawAuth(); return; }
  if (e.target.closest('[data-resetback]')) { authDraft.resetStep = ''; authDraft.msg = ''; saveDraft(); redrawAuth(); return; }
  const rs = e.target.closest('[data-regresend],[data-resetresend]');
  if (rs) {
    const reg = rs.hasAttribute('data-regresend');
    amsg(t('sending')); rs.disabled = true; setTimeout(() => { rs.disabled = false; }, 60000);
    try { await sendCode(reg ? authDraft.mail : authDraft.resetMail, reg ? 'register' : 'reset'); amsg('📩 ' + t('em.resent'), true); } catch (err) { amsg('❌ ' + errText(err)); rs.disabled = false; }
    return;
  }
  if (e.target.closest('[data-resetsend]')) {
    const email = document.getElementById('e-mail')?.value.trim() || '';
    if (!email) { amsg('❌ ' + t('em.need')); return; }
    amsg(t('sending'));
    try { await sendCode(email, 'reset'); authDraft.resetMail = email; authDraft.resetStep = 'code'; authDraft.msg = ''; saveDraft(); redrawAuth(); document.getElementById('e-code')?.focus(); }
    catch (err) { amsg('❌ ' + errText(err)); }
    return;
  }
  if (e.target.closest('[data-mailreset]')) {
    amsg(t('sending'));
    try {
      const np = document.getElementById('e-pass').value;
      const r = await capi('POST', '/email/reset', { email: authDraft.resetMail, code: document.getElementById('e-code').value.trim(), password: np });
      signedIn(r, np);
    } catch (err) { amsg('❌ ' + errText(err)); }
    return;
  }
  const au = e.target.closest('[data-auth]');
  if (au) {
    const kind = au.dataset.auth;
    if (kind === 'logout') { clearDraft(); authMode = 'login'; try { await capi('POST', '/logout'); } catch {} acct = null; store.set('acct', null); dmPriv = null; dmPub = ''; sharedKeys.clear(); render(); return; }
    const val = id => document.getElementById(id)?.value.trim() || '';
    if (kind === 'login') {
      const username = val('a-user'), password = document.getElementById('a-pass').value;
      amsg(t('sending'));
      try { signedIn(await capi('POST', '/login', { username, password }), password); } catch (err) { amsg('❌ ' + errText(err)); }
      return;
    }
    // sign-up: step 1 sends the code to the e-mail, step 2 (code typed in) creates the account
    if (await mailOnP() && authDraft.regStep !== 'code') {
      const username = val('a-user'), email = val('a-mail'), password = document.getElementById('a-pass').value;
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) { amsg('❌ ' + errText({ code: 'bad_username' })); return; }
      if (!email) { amsg('❌ ' + t('em.need')); return; }
      if (password.length < 8) { amsg('❌ ' + errText({ code: 'bad_password' })); return; }
      amsg(t('sending'));
      try { await sendCode(email, 'register'); Object.assign(authDraft, { user: username, mail: email, regStep: 'code', msg: '' }); authPass = password; saveDraft(); redrawAuth(); document.getElementById('a-code')?.focus(); }
      catch (err) { amsg('❌ ' + errText(err)); }
      return;
    }
    const password = authPass || document.getElementById('a-pass')?.value || '';
    const body = authDraft.regStep === 'code' ? { username: authDraft.user, email: authDraft.mail, code: val('a-code'), password } : { username: val('a-user'), password };
    if (password.length < 8) { amsg('❌ ' + errText({ code: 'bad_password' })); return; }
    amsg(t('sending'));
    try { signedIn(await capi('POST', '/register', body), password); }
    catch (err) { if (['username_taken', 'bad_username', 'profanity', 'email_taken'].includes(err.code)) { authDraft.regStep = ''; saveDraft(); redrawAuth(); } amsg('❌ ' + errText(err), true); }
    return;
  }
  const mc = e.target.closest('[data-mailcode]');
  if (mc) { // profile: adding an e-mail to an existing account
    const box = mc.closest('.form-block'), m = box.querySelector('.hint[id]'), email = box.querySelector('input[type=email]').value.trim();
    if (!email) { m.textContent = '❌ ' + t('em.need'); return; }
    m.textContent = t('sending'); mc.disabled = true; setTimeout(() => { mc.disabled = false; }, 60000);
    try { await capi('POST', '/email/code', { email, purpose: mc.dataset.mailcode, lang: LANG }); m.textContent = '📩 ' + t('em.sent', email); box.querySelector('input[inputmode=numeric]')?.focus(); }
    catch (err) { m.textContent = '❌ ' + errText(err); mc.disabled = false; }
    return;
  }
  if (e.target.closest('[data-mailattach]')) {
    const m = document.getElementById('m-msg'); m.textContent = t('sending');
    try { await capi('POST', '/email/attach', { email: document.getElementById('m-mail').value.trim(), code: document.getElementById('m-code').value.trim() }); mailCfg = null; render(true); }
    catch (err) { m.textContent = '❌ ' + errText(err); }
    return;
  }
  if (e.target.closest('[data-recover]')) {
    const msg = document.getElementById('r-msg');
    try {
      const np = document.getElementById('r-pass').value;
      const r = await capi('POST', '/recover', { username: document.getElementById('r-user').value.trim(), code: document.getElementById('r-code').value, password: np });
      acct = { token: r.token, user: r.user }; store.set('acct', acct); render();
      dmPriv = null; dmSetup(np).catch(() => {});
    } catch (err) { msg.textContent = '❌ ' + errText(err); }
    return;
  }
  if (e.target.closest('[data-rec-new]')) {
    const msg = document.getElementById('rec-msg');
    try { const r = await capi('POST', '/recovery'); msg.innerHTML = `<b style="font-size:20px;letter-spacing:2px;user-select:all">${esc(r.code)}</b><br>${t('c.recSaved')}`; } catch (err) { msg.textContent = '❌ ' + errText(err); }
    return;
  }
  const rd = e.target.closest('[data-rdismiss]');
  if (rd) { try { await capi('POST', '/mod/dismiss', { kind: rd.dataset.kind, id: +rd.dataset.id, restore: true }); loadReports(); } catch {} return; }
  const ps = e.target.closest('[data-post-send]');
  if (ps) {
    const msg = document.getElementById('p-msg');
    try {
      const poll = [...document.querySelectorAll('.pollopt')].map(i => i.value.trim()).filter(Boolean);
      const r = await capi('POST', '/posts', { title: document.getElementById('p-title').value, body: document.getElementById('p-body').value, category: ps.dataset.postSend, ref: ps.dataset.ref, ...(poll.length ? { poll } : {}) });
      location.hash = '#/post/' + r.id;
    } catch (err) { msg.textContent = '❌ ' + errText(err); }
    return;
  }
  const cs = e.target.closest('[data-comment-send]');
  if (cs) {
    const msg = document.getElementById('c-msg');
    try { await capi('POST', `/posts/${cs.dataset.commentSend}/comments`, { body: document.getElementById('c-body').value }); render(); }
    catch (err) { msg.textContent = '❌ ' + errText(err); }
    return;
  }

  // message buttons: delete / report / mute / ban
  const ca = e.target.closest('[data-cact]');
  if (ca) {
    const row = ca.closest('[data-id][data-user]'), id = +(ca.dataset.id || row?.dataset.id), user = ca.dataset.user || row?.dataset.user, kind = ca.dataset.kind || row?.dataset.kind;
    try {
      if (ca.dataset.cact === 'like') {
        if (!acct) { alert(t('c.needLogin')); return; }
        const was = ca.classList.contains('on'), n0 = +(ca.querySelector('span')?.textContent || 0), paint = (on, n) => { ca.classList.toggle('on', on); ca.innerHTML = `${on ? '♥' : '♡'} <span>${n}</span>`; };
        paint(!was, Math.max(0, n0 + (was ? -1 : 1))); // instant feedback, the server answer settles it
        try { const r = await capi('POST', '/like', { kind, id }); paint(r.liked, r.n); } catch (err) { paint(was, n0); throw err; }
      } else if (ca.dataset.cact === 'pin') { await capi('POST', '/mod/pin', { id, pinned: +ca.dataset.pinned }); render(true);
      } else if (ca.dataset.cact === 'del') { await capi('POST', '/delete', { kind, id }); row ? row.remove() : render(); if (kind === 'post') history.back(); }
      else if (ca.dataset.cact === 'report') { await capi('POST', '/report', { kind, id }); ca.textContent = '✓'; ca.disabled = true; }
      else if (ca.dataset.cact === 'mute') { await capi('POST', '/mod/mute', { username: user, minutes: +ca.dataset.min }); ca.textContent = '✓'; }
      else if (ca.dataset.cact === 'ban') { if (confirm(t('c.confirmBan', user))) { await capi('POST', '/mod/ban', { username: user }); ca.textContent = '✓'; } }
      else if (ca.dataset.cact === 'unban') { await capi('POST', '/mod/ban', { username: user, banned: false }); ca.textContent = '✓'; }
      if (ca.closest(".umod")) render();
    } catch (err) { alert(errText(err)); }
    return;
  }

  // settings → moderation panel
  const mb = e.target.closest('[data-mod]');
  if (mb) {
    const msg = document.getElementById('m-msg'), user = document.getElementById('m-user')?.value.trim(), word = document.getElementById('m-word')?.value.trim();
    const m = mb.dataset.mod;
    try {
      if (m === 'mute') await capi('POST', '/mod/mute', { username: user, minutes: +mb.dataset.min });
      else if (m === 'ban') await capi('POST', '/mod/ban', { username: user });
      else if (m === 'unban') await capi('POST', '/mod/ban', { username: user, banned: false });
      else if (m === 'resetpass') await capi('POST', '/mod/password', { username: user, password: document.getElementById('m-pass').value });
      else if (m === 'addword') await capi('POST', '/mod/words', { word });
      else if (m === 'rmword') await capi('POST', '/mod/words', { word, remove: true });
      else if (m === 'delitem') { await capi('POST', '/delete', { kind: mb.dataset.kind, id: +mb.dataset.id }); loadReports(); return; }
      msg.textContent = '✅ ' + t('c.done');
    } catch (err) { if (msg) msg.textContent = '❌ ' + errText(err); }
  }
});


// ---------- ranks (XP from chat, comments, topics, likes received, prediction points, weekly titles)
const RANK_UI = [['🌱', 'rk.0'], ['🧣', 'rk.1'], ['📣', 'rk.2'], ['©️', 'rk.3'], ['🏆', 'rk.4']];
const rankMap = new Map(Object.entries(store.get('rankmap', {})));
const rankIcon = r => RANK_UI[r] ? `<i class="rkic r${r}" title="${esc(t(RANK_UI[r][1]))}">${RANK_UI[r][0]}</i>` : '';
let rankT = 0;
function fillRanks() {
  const els = [...document.querySelectorAll('[data-rk-u]:not([data-rkd])')];
  if (!els.length || !workerBase()) return;
  const need = [...new Set(els.map(e => e.dataset.rkU))].filter(u => !rankMap.has(u));
  const paint = () => els.forEach(e => { const r = rankMap.get(e.dataset.rkU); if (r != null) { e.dataset.rkd = '1'; e.innerHTML = rankIcon(r); } });
  paint();
  if (!need.length) return;
  clearTimeout(rankT);
  rankT = setTimeout(async () => {
    try { const d = await capi('GET', '/rank?u=' + encodeURIComponent(need.slice(0, 60).join(','))); for (const [u, r] of Object.entries(d.ranks || {})) rankMap.set(u, r); for (const u of need) if (!rankMap.has(u)) rankMap.set(u, 0); store.set('rankmap', Object.fromEntries([...rankMap].slice(-500))); } catch { return; }
    paint();
  }, 150);
}
// my rank, XP bar and how to climb (profile page)
async function rankCard() {
  let d; try { d = await capi('GET', '/rank?me=1'); } catch { return ''; }
  if (!d || !Number.isInteger(d.rank) || !Array.isArray(d.ranks) || !RANK_UI[d.rank]) return '';
  const r = d.rank, next = d.ranks[r + 1], cur = d.ranks[r];
  const pct = next ? Math.min(100, Math.round((d.xp - cur) / (next - cur) * 100)) : 100;
  rankMap.set(acct.user.username, r);
  return `<div class="card rankcard"><h2>${RANK_UI[r][0]} ${t('rk.title')}: <b>${t(RANK_UI[r][1])}</b></h2><div class="form-block">
    <div class="xpbar"><i style="width:${pct}%"></i></div><div class="hint">${next ? t('rk.next', d.xp, next, t(RANK_UI[r + 1][1])) : t('rk.max', d.xp)}</div>
    ${r < d.topicRank ? `<div class="hint">🔒 ${t('rk.topicLock', t(RANK_UI[d.topicRank][1]), d.ranks[d.topicRank])}</div>` : `<div class="hint">✅ ${t('rk.topicOk')}</div>`}
    <details><summary class="hint">${t('rk.how')}</summary><div class="hint">${t('rk.howTxt')}</div>${RANK_UI.map(([ic, k], i) => `<div class="rkline ${i === r ? 'on' : ''}">${ic} <b>${t(k)}</b> <small>${d.ranks[i]} XP</small></div>`).join('')}</details></div></div>`;
}

// ---------- blocking: their messages, comments and topics disappear for me; no DMs either way
let blocked = new Set(store.get('blocked', []));
async function loadBlocks() { if (!acct) return; try { blocked = new Set((await capi('GET', '/blocks')).blocked || []); store.set('blocked', [...blocked]); hideBlocked(); } catch {} }
function hideBlocked() {
  if (!blocked.size) return;
  document.querySelectorAll('[data-user]').forEach(el => { if (blocked.has(el.dataset.user) && !el.closest('.dmthread')) el.classList.add('blk'); });
}
async function setBlock(username, on) {
  await capi('POST', '/blocks', { username, on });
  on ? blocked.add(username) : blocked.delete(username); store.set('blocked', [...blocked]);
}

// ---------- end-to-end encrypted direct messages
// Each member has an ECDH P-256 key pair. The private key never leaves the device unencrypted: it is kept in this browser and,
// once the password is known, a copy wrapped with a key derived from the password (PBKDF2, 210k rounds) is stored on the server
// so other devices can open it. Messages are AES-GCM encrypted with the key both sides derive (ECDH) — the server sees ciphertext only.
const b64e = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const DMK = () => 'dmk:' + (acct?.user?.username || '');
let dmPriv = null, dmPub = '';
const sharedKeys = new Map();
async function pwKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function wrapPriv(priv, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = await crypto.subtle.exportKey('pkcs8', priv);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pwKey(password, salt), raw);
  return JSON.stringify({ s: b64e(salt), i: b64e(iv), c: b64e(ct) });
}
async function unwrapPriv(wrapped, password) {
  const w = JSON.parse(wrapped);
  const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(w.i) }, await pwKey(password, b64d(w.s)), b64d(w.c));
  return crypto.subtle.importKey('pkcs8', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
}
async function keepLocal(priv, pub) {
  dmPriv = priv; dmPub = pub; sharedKeys.clear();
  try { store.set(DMK(), { priv: await crypto.subtle.exportKey('jwk', priv), pub }); } catch {}
}
async function loadLocalKey() {
  if (dmPriv) return true;
  const k = store.get(DMK(), null);
  if (!k?.priv) return false;
  try { dmPriv = await crypto.subtle.importKey('jwk', k.priv, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']); dmPub = k.pub; return true; } catch { return false; }
}
async function newKeyPair(password, reset) {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const pub = JSON.stringify(await crypto.subtle.exportKey('jwk', kp.publicKey));
  await capi('POST', '/dm/key', { pub, wrapped: password ? await wrapPriv(kp.privateKey, password) : '', reset: !!reset });
  await keepLocal(kp.privateKey, pub);
}
// called with the password after login / register / recovery, and from the DM page's unlock box
async function dmSetup(password) {
  if (!acct || !crypto.subtle) return 'nocrypto';
  const s = await capi('GET', '/dm/key').catch(() => null);
  if (!s) return 'offline';
  if (!s.pub) { await newKeyPair(password, false); return 'new'; }
  if (s.wrapped && password) {
    try { await keepLocal(await unwrapPriv(s.wrapped, password), s.pub); return 'ok'; }
    catch { if (await loadLocalKey() && dmPub === s.pub) return 'ok'; await newKeyPair(password, true); return 'reset'; } // the password changed through recovery: the old key is gone
  }
  if (await loadLocalKey() && dmPub === s.pub) { if (!s.wrapped && password) await capi('POST', '/dm/key', { pub: s.pub, wrapped: await wrapPriv(dmPriv, password) }).catch(() => {}); return 'ok'; }
  if (!s.wrapped && password) { await newKeyPair(password, true); return 'reset'; }
  return s.wrapped ? 'locked' : 'otherdevice';
}
// a member who is logged in but never typed the password since this update still gets a key (kept on this device)
async function dmEnsure() {
  if (!acct) return 'nologin';
  if (await loadLocalKey()) {
    const s = await capi('GET', '/dm/key').catch(() => null);
    if (s && s.pub && s.pub !== dmPub) { dmPriv = null; dmPub = ''; return s.wrapped ? 'locked' : 'otherdevice'; }
    if (s && !s.pub) await capi('POST', '/dm/key', { pub: dmPub, wrapped: '' }).catch(() => {});
    return 'ok';
  }
  const s = await capi('GET', '/dm/key').catch(() => null);
  if (!s) return 'offline';
  if (!s.pub) { await newKeyPair('', false); return 'ok'; }
  return s.wrapped ? 'locked' : 'otherdevice';
}
async function sharedKey(theirPub) {
  if (sharedKeys.has(theirPub)) return sharedKeys.get(theirPub);
  const pub = await crypto.subtle.importKey('jwk', JSON.parse(theirPub), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const k = await crypto.subtle.deriveKey({ name: 'ECDH', public: pub }, dmPriv, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  sharedKeys.set(theirPub, k); return k;
}
async function dmEncrypt(theirPub, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sharedKey(theirPub), new TextEncoder().encode(text));
  return { iv: b64e(iv), ct: b64e(ct) };
}
async function dmDecrypt(theirPub, iv, ct) {
  if (!iv || !ct || !theirPub || !dmPriv) return null;
  try { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(iv) }, await sharedKey(theirPub), b64d(ct))); } catch { return null; }
}
const dmUnlockHtml = st => `<div class="card dmlock"><h2>🔐 ${t('dm.lockTitle')}</h2><div class="form-block"><div class="hint">${t(st === 'otherdevice' ? 'dm.otherDevice' : 'dm.lockHint')}</div>
  ${st === 'otherdevice' ? '' : `<input id="dm-pw" type="password" autocomplete="current-password" placeholder="${esc(t('c.password'))}"><button class="btn" data-dm-unlock>${t('dm.unlock')}</button>`}
  <button class="btn ghost" data-dm-reset>${t('dm.resetKey')}</button><div class="hint" id="dm-msg"></div></div></div>`;
let dmUnread = 0;
const fmtAgo = ts => { const s = Date.now() / 1000 - ts; return s < 60 ? t('dm.now') : s < 3600 ? Math.floor(s / 60) + t('dm.m') : s < 86400 ? Math.floor(s / 3600) + t('dm.h') : fmtD(ts * 1000, { day: 'numeric', month: 'short' }); };

async function viewDm(who) {
  const tab = who === '_req' ? 'req' : 'all';
  if (who && who !== '_req') return viewDmThread(decodeURIComponent(who));
  setTitle(t('dm.title'));
  if (!acct) return communityNav('dm') + authForm();
  const st = await dmEnsure();
  const d = await capi('GET', '/dm').catch(() => ({ convs: [] }));
  const reqs = d.convs.filter(c => c.request && c.last && !c.last.me), main = d.convs.filter(c => !(c.request && c.last && !c.last.me));
  const list = tab === 'req' ? reqs : main;
  const rows = await Promise.all(list.map(async c => {
    const txt = c.last ? (c.blocked ? t('dm.blockedShort') : (await dmDecrypt(c.user.pub, c.last.iv, c.last.ct)) ?? '🔒 ' + t('dm.encrypted')) : '';
    return `<a class="dmrow ${c.unread ? 'unread' : ''}" href="#/dm/${encodeURIComponent(c.user.username)}">${avatar(c.user, 44)}<span class="dmmid"><b>${esc(c.user.username)} ${rankIcon(c.user.rank)}</b><small>${c.last?.me ? t('dm.you') + ': ' : ''}${esc(txt.slice(0, 70))}</small></span><span class="dmend"><small>${fmtAgo(c.last_at)}</small>${c.unread ? `<i class="nbadge">${c.unread}</i>` : ''}</span></a>`;
  }));
  const tabs = `<div class="chips"><a data-replace href="#/dm" class="${tab === 'all' ? 'on' : ''}">💬 ${t('dm.chats')}</a><a data-replace href="#/dm/_req" class="${tab === 'req' ? 'on' : ''}">📨 ${t('dm.requests')}${reqs.length ? ` <i class="nbadge">${reqs.length}</i>` : ''}</a></div>`;
  const search = `<div class="card"><div class="form-block"><input id="dm-q" type="search" autocapitalize="off" placeholder="${esc(t('dm.newPh'))}"><div id="dm-qres"></div></div></div>`;
  const lock = st === 'locked' || st === 'otherdevice' ? dmUnlockHtml(st) : '';
  const e2e = `<div class="hint e2e">🔒 ${t('dm.e2e')}</div>`;
  return communityNav('dm') + lock + search + tabs + (rows.length ? `<div class="card dmlist">${rows.join('')}</div>` : `<div class="empty">${t(tab === 'req' ? 'dm.noReq' : 'dm.none')}</div>`) + e2e;
}
let dmPoll = 0, dmState = null;
async function viewDmThread(name) {
  setTitle(name);
  if (!acct) return authForm();
  const st = await dmEnsure();
  const d = await capi('GET', '/dm/u/' + encodeURIComponent(name));
  dmState = { name, pub: d.partner.pub, last: d.msgs.length ? d.msgs[d.msgs.length - 1].id : 0, theirRead: d.theirRead };
  const head = `<div class="card dmhead"><a href="#/user/${encodeURIComponent(name)}">${avatar(d.partner, 40)}<span><b>${esc(name)} ${rankIcon(d.partner.rank)}</b><small>${d.partner.pub ? '🔒 ' + t('dm.e2eShort') : t('dm.noKey')}</small></span></a>
    <details class="dmmenu"><summary>⋯</summary><div><button data-dm-act="block" data-u="${esc(name)}">${d.blockedByMe ? '✅ ' + t('dm.unblock') : '⛔ ' + t('dm.block')}</button><button data-dm-act="hide" data-u="${esc(name)}">🗑️ ${t('dm.deleteChat')}</button><a href="#/user/${encodeURIComponent(name)}">👤 ${t('dm.profile')}</a></div></details></div>`;
  if (st === 'locked' || st === 'otherdevice') return head + dmUnlockHtml(st);
  const bubbles = await dmBubbles(d.msgs, d.partner.pub, d.theirRead);
  const req = d.request && d.msgs.some(m => !m.me) ? `<div class="card dmreq"><div class="form-block"><b>${t('dm.reqTitle', esc(name))}</b><div class="hint">${t('dm.reqHint')}</div><div class="modbtns"><button class="btn" data-dm-act="accept" data-u="${esc(name)}">${t('dm.accept')}</button><button class="btn ghost" data-dm-act="hide" data-u="${esc(name)}">${t('dm.decline')}</button><button class="btn ghost" data-dm-act="block" data-u="${esc(name)}">⛔ ${t('dm.block')}</button></div></div></div>` : '';
  const pending = !d.accepted && d.msgs.some(m => m.me) ? `<div class="hint" style="text-align:center;padding:6px">${t('dm.pending')}</div>` : '';
  const off = d.blockedByMe ? t('dm.youBlocked') : d.blockedMe ? t('dm.cantSend') : !d.partner.pub ? t('dm.noKeyLong') : '';
  const box = off ? `<div class="empty">${off}</div>` : `<div class="dmcompose"><textarea id="dm-text" rows="1" maxlength="2000" placeholder="${esc(t('dm.ph'))}"></textarea><button class="btn" data-dm-send aria-label="${t('dm.send')}">➤</button></div>`;
  return head + req + `<div class="dmthread" id="dm-thread">${bubbles || `<div class="empty">${t('dm.start', esc(name))}</div>`}</div>` + pending + box;
}
async function dmBubbles(msgs, pub, theirRead) {
  let html = '', last = '';
  const lastMine = [...msgs].reverse().find(m => m.me && !m.deleted)?.id;
  for (const m of msgs) {
    const day = dayOfTs(m.created); if (day !== last) { html += daySep(m.created); last = day; }
    const txt = m.deleted ? null : await dmDecrypt(pub, m.iv, m.ct);
    const body = m.deleted ? `<i class="hint">${t('dm.unsent')}</i>` : txt == null ? `<i class="hint">🔒 ${t('dm.cantRead')}</i>` : esc(txt).replace(/\n/g, '<br>');
    html += `<div class="bub ${m.me ? 'mine' : ''}" data-dmid="${m.id}"><div class="bubbody"><div class="bubtext">${body}</div><div class="bubfoot">${clockOf(m.created)}${m.me && m.id === lastMine && theirRead >= m.id ? ` · ${t('dm.seen')}` : ''}
      ${m.deleted ? '' : m.me ? `<button class="cbtn txt" data-dm-act="unsend" data-id="${m.id}">↩︎ ${t('dm.unsend')}</button>` : `<button class="cbtn txt" data-dm-act="report" data-id="${m.id}">🚩</button>`}</div></div></div>`;
  }
  return html;
}
async function dmRefresh() {
  if (!dmState || !location.hash.startsWith('#/dm/') || document.hidden) return;
  const box = document.getElementById('dm-thread'); if (!box) return;
  let d; try { d = await capi('GET', `/dm/u/${encodeURIComponent(dmState.name)}`); } catch { return; }
  const lastId = d.msgs.length ? d.msgs[d.msgs.length - 1].id : 0;
  if (lastId === dmState.last && d.theirRead === dmState.theirRead && d.msgs.length === box.querySelectorAll('[data-dmid]').length && !d.msgs.some(m => m.deleted && box.querySelector(`[data-dmid="${m.id}"] [data-dm-act="unsend"],[data-dmid="${m.id}"] [data-dm-act="report"]`))) return;
  const atEnd = scrollY + innerHeight > document.body.scrollHeight - 160;
  dmState.last = lastId; dmState.theirRead = d.theirRead; dmState.pub = d.partner.pub;
  box.innerHTML = await dmBubbles(d.msgs, d.partner.pub, d.theirRead);
  if (atEnd) scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
}
setInterval(dmRefresh, 3000);
document.addEventListener('click', async e => {
  const send = e.target.closest('[data-dm-send]');
  if (send && dmState) {
    const ta = document.getElementById('dm-text'), text = ta.value.trim();
    if (!text) return;
    send.disabled = true;
    try {
      if (!dmPriv && !(await loadLocalKey())) throw new Error(t('dm.lockTitle'));
      await capi('POST', '/dm/u/' + encodeURIComponent(dmState.name), await dmEncrypt(dmState.pub, text));
      ta.value = ''; await dmRefresh(); scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    } catch (err) { alert(errText(err)); }
    send.disabled = false; ta.focus();
    return;
  }
  const act = e.target.closest('[data-dm-act]');
  if (act) {
    const k = act.dataset.dmAct, u = act.dataset.u || dmState?.name;
    try {
      if (k === 'unsend') { await capi('POST', `/dm/m/${act.dataset.id}/unsend`); await dmRefresh(); return; }
      if (k === 'report') { const txt = act.closest('.bub')?.querySelector('.bubtext')?.innerText || ''; if (!confirm(t('dm.reportQ'))) return; await capi('POST', `/dm/u/${encodeURIComponent(u)}/report`, { text: txt }); act.textContent = '✓'; return; }
      if (k === 'accept') { await capi('POST', `/dm/u/${encodeURIComponent(u)}/accept`); render(); return; }
      if (k === 'hide') { if (!confirm(t('dm.deleteQ'))) return; await capi('POST', `/dm/u/${encodeURIComponent(u)}/hide`); location.hash = '#/dm'; return; }
      if (k === 'block') { const on = !blocked.has(u); if (on && !confirm(t('dm.blockQ', u))) return; await setBlock(u, on); render(); return; }
    } catch (err) { alert(errText(err)); }
    return;
  }
  if (e.target.closest('[data-dm-unlock]')) {
    const msg = document.getElementById('dm-msg'), pw = document.getElementById('dm-pw').value;
    msg.textContent = t('sending');
    // the password is checked by the server first (a wrong one must not reset the key)
    try { await capi('POST', '/login', { username: acct.user.username, password: pw }).then(r => { acct = { token: r.token, user: r.user }; store.set('acct', acct); }); } catch (err) { msg.textContent = '❌ ' + errText(err); return; }
    const r = await dmSetup(pw).catch(() => 'offline');
    msg.textContent = r === 'ok' || r === 'new' ? '✅' : r === 'reset' ? '⚠️ ' + t('dm.wasReset') : '❌ ' + t('c.err.network');
    setTimeout(render, 500);
    return;
  }
  if (e.target.closest('[data-dm-reset]')) {
    if (!confirm(t('dm.resetQ'))) return;
    try { await newKeyPair('', true); render(); } catch (err) { alert(errText(err)); }
    return;
  }
  const blk = e.target.closest('[data-block-user]');
  if (blk) {
    const u = blk.dataset.blockUser, on = !blocked.has(u);
    if (on && !confirm(t('dm.blockQ', u))) return;
    try { await setBlock(u, on); render(); } catch (err) { alert(errText(err)); }
  }
});
document.addEventListener('keydown', e => { if (e.target.id === 'dm-text' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.querySelector('[data-dm-send]')?.click(); } });
document.addEventListener('input', e => {
  if (e.target.id === 'dm-text') { e.target.style.height = 'auto'; e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px'; return; }
  if (e.target.id !== 'dm-q') return;
  clearTimeout(window._dmq);
  window._dmq = setTimeout(async () => {
    const q = e.target.value.trim(), box = document.getElementById('dm-qres'); if (!box) return;
    if (q.length < 2) { box.innerHTML = ''; return; }
    const d = await capi('GET', '/users?q=' + encodeURIComponent(q)).catch(() => ({ users: [] }));
    box.innerHTML = d.users.filter(u => u.username !== acct?.user?.username && !u.banned).slice(0, 8).map(u => `<a class="lrow" href="#/dm/${encodeURIComponent(u.username)}">${avatar(u, 28)}<span class="nm" style="padding:8px 10px">${esc(u.username)}</span><span class="go">✉️</span></a>`).join('') || `<div class="hint">${t('u.none')}</div>`;
  }, 350);
});

// topic composer only for ranked members (the server checks it too)
const topicLock = () => { const r = rankMap.get(acct?.user?.username); return acct && !isAdminUser() && r != null && r < 2 ? `<div class="card"><div class="form-block"><b>🔒 ${t('rk.lockTitle')}</b><div class="hint">${t('rk.topicLock', t(RANK_UI[2][1]), 150)}</div><a class="btn ghost" href="#/profile" style="text-align:center">${t('rk.see')} ›</a></div></div>` : ''; };
// keep blocked members hidden and rank icons filled whatever part of the page changes (chat, comments, lazy boxes)
{ let mo = 0; new MutationObserver(() => { clearTimeout(mo); mo = setTimeout(() => { hideBlocked(); fillRanks(); }, 60); }).observe(document.getElementById('app'), { childList: true, subtree: true }); }
if (acct) setTimeout(() => { loadBlocks(); dmEnsure().catch(() => {}); capi('GET', '/rank?me=1').then(d => { rankMap.set(acct.user.username, d.rank); }).catch(() => {}); }, 2500);

// ---- router ----
const routes = {
  matches: viewMatches, match: viewMatch, team: viewTeam, favs: viewFavs, settings: viewSettings,
  leagues: viewLeagues, league: viewLeague, tff: viewTffMatch, game: viewGame, ostand: viewOtherTable, tx: viewTeamX, forum: viewForum, post: viewPost, player: viewPlayer, search: viewSearch, leaderboard: viewLeaderboard, notifs: viewNotifs, compare: viewCompare, admin: viewAdmin, members: viewMembers, legend: viewLegend, article: viewArticle, dm: viewDm, live: viewLiveScreen, room: viewRoom, games: viewGames, feed: viewFeed, fantasy: viewFantasy, quiz: viewQuiz, vplayer: viewVPlayer, tt: viewTffTeam, profile: viewProfile, user: viewUser,
  table: l => viewLeague(l || store.get('tableLeague', 'tur.1'), 'puan'),
  golive: viewGoLive, pgroup: viewPGroup,
};
// texts that live in the page shell (bottom bar, header buttons)
function applyStatic() {
  document.documentElement.lang = LANG;
  for (const a of document.querySelectorAll('#tabs a')) a.querySelector('span').textContent = t('nav.' + a.dataset.tab);
  $('#back').setAttribute('aria-label', t('back'));
  $('#refresh').setAttribute('aria-label', t('refresh'));
  $('#searchbtn').setAttribute('aria-label', t('search.title'));
  $('#adminbtn').setAttribute('aria-label', t('admin.title'));
}
// soft placeholder cards while a page loads (instead of a bare spinner)
const SKELETON = [0, 1].map(() => `<div class="card skel"><h2><i class="sk w40"></i></h2>${[0, 1, 2].map(() => '<div class="skrow"><i class="sk dot"></i><span><i class="sk w70"></i><i class="sk w50"></i></span></div>').join('')}</div>`).join('');
let lastSig = '';
let renderTok = 0, lastTab = 'matches', lastHash = null;
// pages come back instantly from memory and refresh in the background; scroll position is restored on back
const pageCache = new Map(), scrollMap = {};
let navBack = false;
const cacheable = r => !['profile', 'settings', 'notifs', 'search', 'compare', 'members', 'user', 'article', 'dm', 'feed', 'fantasy', 'quiz'].includes(r);
const pkey = () => [location.hash, curSport, LANG, acct?.user?.id || 0].join('|');
// the start pages (match list, favourites) are also kept on the phone: on the next start they appear at once (up to 12 h old)
// and are replaced by fresh data a moment later
const DISK_ROUTES = ['matches', 'favs'];
for (const x of store.get('pcDisk', [])) if (x?.k && x.html && Date.now() - x.t < 12 * 3600e3) pageCache.set(x.k, { ...x, disk: true });
let diskT = 0;
const diskSave = (k, html, title) => { clearTimeout(diskT); diskT = setTimeout(() => { if (html.length > 400000) return; const keep = store.get('pcDisk', []).filter(x => x.k !== k).slice(-2); try { localStorage.setItem('pcDisk', JSON.stringify([...keep, { k, html, title, t: Date.now() }])); } catch { store.set('pcDisk', []); } }, 800); };
try { history.scrollRestoration = 'manual'; } catch {} // the app restores each page's scroll itself
const TAB_ROUTES = ['matches', 'favs', 'leagues', 'forum', 'profile', 'settings'];
{ let tick = 0; addEventListener('scroll', () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; scrollMap[location.hash] = scrollY; }); }, { passive: true }); }
const topbar = on => { const b = document.getElementById('topbar'); if (b) b.classList.toggle('on', on); };
// which way the user went: every history entry gets a depth number, so 'back' is known for sure
let curDepth = 0, skelT = 0;
const jumpY = y => scrollTo({ top: y, behavior: 'instant' }); // page changes jump; html{scroll-behavior:smooth} is for in-page links
function navDirection() {
  let d = history.state?.gxd;
  if (d == null) { d = curDepth + 1; try { history.replaceState({ ...(history.state || {}), gxd: d }, ''); } catch {} }
  const dir = d < curDepth ? 'back' : d === curDepth ? 'same' : 'fwd';
  curDepth = d; return dir;
}
async function render(silent = false) {
  const [r, ...args] = (location.hash.replace(/^#\/?/, '') || 'matches').split('/');
  const route = routes[r] ? r : 'matches';
  if (['matches', 'favs', 'leagues', 'settings'].includes(route)) lastTab = route;
  if (['league', 'table'].includes(route)) lastTab = 'leagues';
  if (['forum', 'post', 'user', 'leaderboard', 'notifs', 'members', 'dm', 'games', 'feed', 'fantasy', 'quiz', 'room', 'pgroup'].includes(route)) lastTab = 'forum';
  if (route === 'profile' || route === 'admin') lastTab = 'profile';
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === lastTab));
  $('#back').hidden = !['match', 'team', 'league', 'table', 'tff', 'post', 'user', 'player', 'vplayer', 'tt', 'search', 'compare', 'admin', 'legend', 'members', 'article', 'live', 'room', 'pgroup'].includes(route) && !(route === 'settings' && args[0]) && !(route === 'dm' && args[0] && args[0] !== '_req');
  $('#hlogo').hidden = !$('#back').hidden;
  const tok = ++renderTok;
  let instant = null, dir = 'same', instY = null;
  if (!silent) {
    dir = navDirection(); navBack = dir === 'back';
    // bottom-tab switches cross-fade; deeper pages slide in from the side they came from
    document.documentElement.classList.toggle('vt-back', dir === 'back' && !TAB_ROUTES.includes(route));
    document.documentElement.classList.toggle('vt-fwd', dir === 'fwd' && !TAB_ROUTES.includes(route));
    // a different match/team opens on its first tab
    if (location.hash !== lastHash) { delete segState.match; delete segState.team; delete segState.player; delete segState.tt; }
    lastHash = location.hash;
    const hit = cacheable(route) && pageCache.get(pkey());
    if (hit && Date.now() - hit.t < (hit.disk ? 12 * 3600e3 : 600000)) {
      instant = hit; clearTimeout(skelT); app.classList.remove('dim');
      const toY = instY = dir === 'same' ? scrollY : navBack ? scrollMap[location.hash] || 0 : 0; // 'same': the page re-rendered in place
      const show = () => { app.classList.add('still'); app.innerHTML = hit.html; setTitle(hit.title); afterRender(); jumpY(toY); };
      if (dir !== 'same' && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { try { document.startViewTransition(show); } catch { show(); } } else show();
    } else {
      // keep the old page (dimmed) for a moment: a fast answer swaps straight in, without a skeleton flash
      clearTimeout(skelT); app.classList.add('dim');
      skelT = setTimeout(() => { if (tok === renderTok) { app.classList.remove('dim'); app.innerHTML = SKELETON; jumpY(0); } }, 260);
    }
    topbar(true);
  }
  try {
    const html = await routes[route](...args);
    if (tok !== renderTok) return;
    clearTimeout(skelT); app.classList.remove('dim');
    const wasBack = navBack; if (!silent) navBack = false;
    topbar(false);
    if (cacheable(route)) { pageCache.set(pkey(), { html, t: Date.now(), title: $('#title').textContent }); if (pageCache.size > 40) pageCache.delete(pageCache.keys().next().value); if (DISK_ROUTES.includes(route) && !args.length) diskSave(pkey(), html, $('#title').textContent); }
    const sig = location.hash + html.replace(/ data-t="\d+"/g, '');
    if (instant && html === instant.html) { lastSig = sig; return; } // nothing changed since the cached copy
    if (silent && sig === lastSig) return;
    lastSig = sig;
    const keep = silent || !!instant;
    app.classList.toggle('still', keep); // entrance animation only for real page changes, not for the 5-second refresh
    const y = scrollY;
    const prevChat = (() => { const n = document.querySelector('.chat[data-room]'); return n ? { node: n, focus: n.contains(document.activeElement) } : null; })();
    // a refresh of the same page keeps what is already on screen: loaded pictures stay visible and filled lazy boxes keep their content until the new one is ready
    const oldLz = keep ? [...app.querySelectorAll('[data-lz]')].map(el => el.dataset.lzd ? [el.tagName, el.innerHTML] : null) : [];
    const swap = () => {
      app.innerHTML = html;
      if (keep) {
        app.querySelectorAll('[data-lz]').forEach((el, i) => { if (!el.dataset.lzd && oldLz[i] && oldLz[i][0] === el.tagName) el.innerHTML = oldLz[i][1]; });
        app.querySelectorAll('img').forEach(im => { if (im.complete && im.naturalWidth) im.classList.add('ld'); });
      }
      keepChat(prevChat);
      afterRender();
      const on = document.querySelector('.datebar a.on');
      if (on) on.parentElement.scrollLeft = on.offsetLeft - (on.parentElement.clientWidth - on.offsetWidth) / 2;
      jumpY(keep || dir === 'same' ? (instant && wasBack && instY != null ? Math.max(instY, y) : y) : wasBack ? scrollMap[location.hash] || 0 : 0);
    };
    // a soft cross-fade between pages where the browser supports it
    if (!keep && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { try { await document.startViewTransition(swap).updateCallbackDone; } catch { swap(); } } else swap();
  } catch (e) {
    topbar(false);
    if (tok !== renderTok || silent) return;
    clearTimeout(skelT); app.classList.remove('dim'); navBack = false;
    app.innerHTML = `<div class="err">${t('loadFail')}<br><small>${esc(e.message)}</small><br><button onclick="cache.clear();render()">${t('retry')}</button></div>`;
  }
}


// ---- softness: warm the next page on touch/hover, fade images in, pull down to refresh ----
{
  let warmed = '';
  const warm = href => {
    if (href === warmed) return; warmed = href;
    const m = /^#\/(match|player)\/([^/]+)\/(?:([^/]+)\/)?([^/?]+)/.exec(href); if (!m) return;
    if (m[1] === 'match') { if (sportOf(m[2]) === 'soccer') get(`${api(m[2])}/summary?event=${m[4] || m[3]}`, 4000).catch(() => {}); }
    else get(`${ESPN_C}${m[2]}/${m[3]}/athletes/${m[4]}`, 300000).catch(() => {});
  };
  const onTouch = e => { const a = e.target.closest?.('a[href^="#/"]'); if (a) warm(a.getAttribute('href')); };
  document.addEventListener('touchstart', onTouch, { passive: true });
  document.addEventListener('mouseover', onTouch, { passive: true });
  document.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ld'); }, true);
  // pull down at the top of a page
  const ind = document.createElement('div'); ind.id = 'ptr';
  ind.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/></svg>';
  document.body.appendChild(ind);
  let ptr = null;
  addEventListener('touchstart', e => {
    if (scrollY > 0 || e.touches.length !== 1 || e.target.closest('.sportbar,.datebar,.catbar,.chips,.stwrap,.seg,textarea,input,select,.chatlog,.pitch')) { ptr = null; return; }
    ptr = { y: e.touches[0].clientY, d: 0 };
  }, { passive: true });
  addEventListener('touchmove', e => {
    if (!ptr) return;
    const d = Math.max(0, Math.min(110, e.touches[0].clientY - ptr.y)); ptr.d = d;
    ind.style.opacity = String(Math.min(1, d / 70)); ind.style.transform = `translate(-50%, ${d * .55}px) rotate(${d * 3}deg)`;
  }, { passive: true });
  addEventListener('touchend', () => {
    if (!ptr) return;
    const go = ptr.d > 70; ptr = null;
    if (go) { ind.classList.add('spin'); cache.clear(); pageCache.clear(); render(true); setTimeout(() => ind.classList.remove('spin'), 700); }
    ind.style.opacity = '0'; ind.style.transform = 'translate(-50%, 0)';
  });
}

addEventListener('hashchange', () => render());
$('#back').onclick = () => (history.length > 1 ? history.back() : (location.hash = '#/matches'));
$('#refresh').onclick = () => { cache.clear(); render(); };
$('#searchbtn').onclick = () => { location.hash = '#/search'; };
// header: messages with the unread count, for signed-in members
function paintDmBtn() { const b = document.getElementById('dmbtn'); if (!b) return; b.hidden = !acct; const i = b.querySelector('.hbadge'); if (i) { i.hidden = !dmUnread; i.textContent = dmUnread > 9 ? '9+' : dmUnread; } b.setAttribute('aria-label', t('dm.title') || 'DM'); }
$('#dmbtn').onclick = () => { location.hash = '#/dm'; };
$('#adminbtn').onclick = () => { location.hash = '#/admin'; };
document.addEventListener('click', async e => {
  // tabs and round arrows inside a league page don't pile up in history
  const rl = e.target.closest('a[data-replace]');
  if (rl) { e.preventDefault(); if (!rl.classList.contains('off')) location.replace(rl.getAttribute('href')); return; }
  const sp = e.target.closest('[data-sport]');
  if (sp) { curSport = sp.dataset.sport; store.set('sport', curSport); render(); return; }
  const mt = e.target.closest('[data-mthread]');
  if (mt) {
    const d = mt.dataset, cat = /^tur\./.test(d.mthread.split(':')[0]) ? 'superlig' : 'avrupa';
    try { const r = await capi('POST', '/posts', { title: `${d.h} - ${d.a}: maç konusu`, body: 'Bu maç hakkında ne düşünüyorsun? Yorumlarını buraya yaz.', category: cat, ref: 'match:' + d.mthread }); location.hash = '#/post/' + r.id; }
    catch (err) { alert(errText(err)); }
    return;
  }
  const mv = e.target.closest('[data-motm]');
  if (mv) { try { await capi('POST', '/motm/' + mv.dataset.motm, { player_id: mv.dataset.pid }); render(true); } catch (err) { alert(errText(err)); } return; }
  const pr = e.target.closest('[data-predict]');
  if (pr) {
    const msg = document.getElementById('pr-msg'), [lg, ev] = pr.dataset.predict.split('|');
    try { await capi('POST', '/predict', { league: lg, event: ev, home: document.getElementById('pr-h').value, away: document.getElementById('pr-a').value }); msg.textContent = '✅ ' + t('pred.saved'); }
    catch (err) { msg.textContent = '❌ ' + errText(err); }
    return;
  }
  const prow = e.target.closest('.postrow[data-href]');
  if (prow && !e.target.closest('a')) { location.hash = prow.dataset.href; return; }
  const la = e.target.closest('[data-leagues-all]'), ga = e.target.closest('[data-grp-all]'), ca = e.target.closest('[data-ctry-all]');
  if (la || ga) {
    const ids = (la ? GROUPS.flat() : GROUPS[+ga.dataset.grpAll.split('|')[0]]).filter(shownL).map(l => l.id), on = (la ? la.dataset.leaguesAll : ga.dataset.grpAll.split('|')[1]) === '1';
    enabled = on ? [...new Set([...enabled, ...ids])] : enabled.filter(x => !ids.includes(x)); store.set('leagues', enabled);
    document.querySelectorAll('[data-league-toggle]').forEach(x => { x.checked = enabled.includes(x.dataset.leagueToggle); }); grpCounts(); return;
  }
  if (ca) { const [sp, mode] = ca.dataset.ctryAll.split('|'); if (mode === 'all') delete ctryPref[sp]; else ctryPref[sp] = []; store.set('ctry', ctryPref); document.querySelectorAll(`[data-ctry^="${sp}|"]`).forEach(x => { x.checked = mode === 'all'; }); ctryCount(sp); return; }
  const cr = e.target.closest('[data-ctry-reset]');
  if (cr) { delete ctryPref[cr.dataset.ctryReset]; store.set('ctry', ctryPref); render(true); return; }
  const sbr = e.target.closest('[data-sbar]');
  if (sbr) { const bar = sbr.parentElement.querySelector('.sportbar, .catbar'); bar?.scrollBy({ left: +sbr.dataset.sbar * Math.max(160, bar.clientWidth * .7), behavior: 'smooth' }); return; }
  if (e.target.closest('[data-retry]')) { render(); return; }
  if (e.target.closest('[data-code-go]')) { goCode(); return; }
  const cp = e.target.closest('[data-copy]');
  if (cp) { try { navigator.clipboard.writeText(cp.dataset.copy); const o = cp.textContent; cp.textContent = '✓ ' + cp.dataset.copy; setTimeout(() => { cp.textContent = o; }, 1200); } catch {} return; }
  const lt = e.target.closest('[data-lang-toggle]');
  if (lt) { const box = lt.parentElement.querySelector('.langs'); box.hidden = !box.hidden; lt.setAttribute('aria-expanded', String(!box.hidden)); return; }
  const lb = e.target.closest('[data-lang]');
  if (lb) {
    LANG = lb.dataset.lang;
    store.set('lang', LANG);
    applyStatic();
    if ((notif.key || notif.push)) syncNotify().catch(() => {});
    render(true);
    return;
  }
  const pb = e.target.closest('[data-pin]');
  if (pb) {
    const id = pb.dataset.pin;
    pinned = pinned.includes(id) ? pinned.filter(x => x !== id) : [...pinned, id];
    store.set('pinned', pinned);
    render(true);
    return;
  }
  if (e.target.id === 'n-push') {
    const msg = $('#n-msg');
    if (!/^https:\/\//.test(workerBase())) { msg.textContent = t('needUrlKey'); return; }
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error(t('pushUnsupported'));
      if (await Notification.requestPermission() !== 'granted') throw new Error(t('pushDenied'));
      const reg = await navigator.serviceWorker.ready;
      const { pub } = await callWorker('/vapid');
      const old = await reg.pushManager.getSubscription();
      if (old) await old.unsubscribe(); // the server key may differ from an earlier subscription
      notif.push = (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(pub) })).toJSON();
      store.set('notify', notif);
      msg.textContent = t('pushOn');
    } catch (err) { msg.textContent = '❌ ' + err.message; }
    return;
  }
  if (e.target.id === 'a-save') { // admin page: notification server settings
    notif.url = $('#n-url').value.trim(); notif.key = $('#n-key').value.trim(); notif.topic = $('#n-topic').value.trim() || notif.topic;
    store.set('notify', notif); $('#a-msg').textContent = '✓ ' + t('c.saved');
    return;
  }
  if (e.target.id === 'n-save') {
    const msg = $('#n-msg');
    NPREFS.forEach(k => { notif.prefs[k] = document.querySelector(`[data-nprefs="${k}"]`).checked; });
    store.set('notify', notif);
    if (!/^https:\/\//.test(workerBase()) || (!notif.key && !notif.push)) { msg.textContent = t('needUrlKey'); return; }
    if (!/^[\w-]{6,64}$/.test(notif.topic)) { msg.textContent = t('badTopic'); return; }
    msg.textContent = t('sending');
    try {
      const r = await syncNotify();
      await callWorker('/test', { push: notif.push || null, lang: LANG, app: location.href.split('#')[0] });
      msg.textContent = t('saved', r.teams);
    } catch (err) { msg.textContent = '❌ ' + err.message; }
    return;
  }
  const sb = e.target.closest('[data-seg]');
  if (sb) {
    const box = sb.parentElement, key = box.dataset.segkey, i = +sb.dataset.seg;
    segState[key] = i;
    box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === sb));
    document.querySelectorAll(`[data-pane^="${key}:"]`).forEach(p => p.classList.toggle('on', p.dataset.pane === `${key}:${i}`));
    return;
  }
  const pf = e.target.closest('[data-pfav]');
  if (pf) {
    e.preventDefault(); e.stopPropagation();
    const d = pf.dataset, was = isPFav(d.pfav, d.psport);
    pfavs = was ? pfavs.filter(f => !(f.id == d.pfav && f.sport === d.psport)) : [...pfavs, { id: d.pfav, name: d.name, sport: d.psport, league: d.league, team: d.team }];
    store.set('pfavs', pfavs);
    if ((notif.key || notif.push)) syncNotify().catch(() => {});
    document.querySelectorAll(`[data-pfav="${CSS.escape(d.pfav)}"][data-psport="${CSS.escape(d.psport)}"]`).forEach(b => {
      b.classList.toggle('on', !was);
      b.textContent = b.classList.contains('favbtn') ? (was ? t('pl.addFav') : t('pl.inFav')) : (was ? '☆' : '★');
    });
    if (location.hash.startsWith('#/favs')) render(true);
    return;
  }
  const snd = e.target.closest('[data-snd]');
  if (snd) { const k = snd.dataset.snd; sfxLoad(); if (k === 'goal') { kindVib('goal'); const c = audioCtx(); if (c && !sfxPlay('goal')) goalSound(); } else if (k === 'chime') sfxPlay('chime', 0.8); else kindSound(k, true); return; }
  const sndon = e.target.closest('[data-sndon]');
  if (sndon) { const k = sndon.dataset.sndon; if (sndon.checked) delete fx.mute[k]; else fx.mute[k] = 1; store.set('fx', fx); return; }
  const lub = e.target.closest('[data-lu]');
  if (lub) { luSel = +lub.dataset.lu; const box = lub.closest('.pane') || document; box.querySelectorAll('[data-lu]').forEach(b => b.classList.toggle('on', b === lub)); box.querySelectorAll('[data-luteam]').forEach(x => { x.hidden = +x.dataset.luteam !== luSel; }); return; }
  const fxb = e.target.closest('[data-fx]');
  if (fxb) { fx[fxb.dataset.fx] = fxb.checked; store.set('fx', fx); if (fxb.checked && fxb.dataset.fx === 'sound') chimeSound(); return; }
  if (e.target.closest('[data-fx-test]')) {
    const demo = FX_DEMO[fxDemoN++ % FX_DEMO.length], tm = (n, c1, c2, id) => ({ team: { id, displayName: n, shortDisplayName: n, color: c1, alternateColor: c2 } });
    sfxLoad(); setTimeout(() => goalToast({ league: 'tur.1', id: 'demo', h: tm(demo[0], demo[1], demo[2], ''), a: tm('Rakip', '555555', 'ffffff', ''), side: 0, score: '1–0', min: "67'", mine: true }), 150);
    return;
  }
  const ic1 = e.target.closest('[data-ics]');
  if (ic1) { icsSave([{ t: ic1.dataset.icsT, s: ic1.dataset.icsS, w: ic1.dataset.icsW, d: +ic1.dataset.icsD }], icsName(ic1.dataset.icsT, ic1.dataset.icsS)); return; }
  if (e.target.closest('[data-ics-all]')) {
    const btn = e.target.closest('[data-ics-all]'); btn.disabled = true;
    const out = [];
    await Promise.all(favs.map(async f => {
      const ev = await teamEvents(f.id, f.league).catch(() => null);
      for (const x of [...(ev?.live || []), ...(ev?.next || [])]) out.push({ t: x.name || x.shortName || f.name, s: x.date, w: x.competitions?.[0]?.venue?.fullName || '' });
    }));
    await Promise.all(xfavs.map(async f => {
      const c = await get(`${workerBase()}/tcomps?sport=${encodeURIComponent(f.sport)}&name=${encodeURIComponent(f.name)}`, 300000).catch(() => null);
      for (const g of (c?.games || []).filter(g => g.state !== 'post')) out.push({ t: `${g.home} – ${g.away}`, s: g.time, w: g.comp });
    }));
    btn.disabled = false;
    const uniq = [...new Map(out.map(x => [x.s + x.t, x])).values()].sort((a, b) => a.s.localeCompare(b.s));
    if (uniq.length) icsSave(uniq, 'grafondex-favoriler'); else btn.textContent = t('o.calNone');
    return;
  }
  const xb = e.target.closest('[data-xfav]');
  if (xb) {
    e.preventDefault();
    const [sp, ...rest] = xb.dataset.xfav.split('|'), nm = rest.join('|');
    xfavs = xfavs.some(f => f.sport === sp && f.name === nm) ? xfavs.filter(f => !(f.sport === sp && f.name === nm)) : [...xfavs, { sport: sp, name: nm }];
    store.set('xfavs', xfavs);
    if (notif.key || notif.push) syncNotify().catch(() => {});
    render(true);
    return;
  }
  const fb = e.target.closest('[data-fav]');
  if (fb) {
    e.preventDefault(); // stars can sit inside a team link
    const id = fb.dataset.fav;
    favs = isFav(id, fb.dataset.league) ? favs.filter(f => !(f.id == id && sportOf(f.league) === sportOf(fb.dataset.league))) : [...favs, { id, name: fb.dataset.name, league: fb.dataset.league, ...(fb.dataset.grup ? { grup: fb.dataset.grup } : {}) }];
    store.set('favs', favs);
    if ((notif.key || notif.push)) syncNotify().catch(() => {});
    render(true);
  }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-team-theme]')) { setTeamTheme(e.target.value).catch(() => {}); return; }
  if (e.target.matches('[data-team-season]')) { location.replace('#/team/' + e.target.dataset.teamSeason + '/' + e.target.value); return; }
  if (e.target.matches('[data-league-season]')) { leagueSeason[e.target.dataset.leagueSeason] = +e.target.value; location.replace(`#/league/${e.target.dataset.leagueSeason}/fikstur`); render(); return; }
  if (e.target.matches('[data-month-pick]')) { location.replace(`#/league/${e.target.dataset.monthPick}/fikstur/${e.target.value}`); return; }
  { const gb = e.target.closest?.('[data-tgrp]'); if (gb) { const [lg, id] = gb.dataset.tgrp.split('|'); store.set('tgrp', { ...store.get('tgrp', {}), [lg]: id }); pageCache.clear(); render(); return; } }
  if (e.target.matches('[data-ksl-week]')) { location.replace('#/league/' + (e.target.dataset.kslWeek || 'tur.w.1') + '/fikstur/' + e.target.value); return; }
  if (e.target.matches('[data-tff-round]')) { location.replace('#/league/tur.cup/fikstur/' + e.target.value); return; }
  if (e.target.matches('[data-round-pick]')) { location.replace(`#/league/${e.target.dataset.roundPick}/fikstur/${e.target.value}`); return; }
  if (e.target.matches('[data-date-pick]')) { if (e.target.value) location.hash = '#/matches/' + e.target.value.replaceAll('-', ''); return; }
  if (e.target.dataset?.sportVis) {
    const on = new Set(sportsOn || SPORTS.map(x => x[0])); e.target.checked ? on.add(e.target.dataset.sportVis) : on.delete(e.target.dataset.sportVis); on.add('soccer');
    sportsOn = [...on]; store.set('sportsOn', sportsOn); if (!sportShown(curSport)) { curSport = 'soccer'; store.set('sport', curSport); } return;
  }
  if (e.target.dataset?.ctry) {
    const [sp, cn] = e.target.dataset.ctry.split('|'), cur = new Set(ctryPref[sp] || ['Europe', 'World', ...CTRY_ALL]); e.target.checked ? cur.add(cn) : cur.delete(cn);
    ctryPref[sp] = [...cur]; store.set('ctry', ctryPref); ctryCount(sp); return;
  }
  const id = e.target.dataset?.leagueToggle;
  if (!id) return;
  enabled = e.target.checked ? [...new Set([...enabled, id])] : enabled.filter(x => x !== id);
  store.set('leagues', enabled); grpCounts();
});
function grpCounts() { document.querySelectorAll('[data-gcount]').forEach(el => { const all = document.querySelectorAll(`[data-league-toggle][data-g="${el.dataset.gcount}"]`); el.textContent = t('set.nOf', [...all].filter(x => x.checked).length, all.length); }); }

// every data page refreshes itself while open: every 5 s when a live game is on screen, else every 30 s.
// Each source keeps its own cache time (scores 4 s, tables 2 min, TFF referees 2 min, squads 5 min, TV 30 min).
let ticks = 0;
setInterval(() => {
  if (document.hidden) return;
  const r = (location.hash.replace(/^#\/?/, '') || 'matches').split('/')[0];
  if (!['matches', 'match', 'favs', 'league', 'team', 'tff', 'table', 'game', 'live'].includes(r)) return;
  const live = document.querySelector('.mtime.live, .hero .st.live, .ssst.live');
  if (live || ++ticks % 6 === 0) render(true);
}, 5000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !document.querySelector('.authcard')) render(true); }); // the sign-in card is never redrawn under the user's fingers
document.addEventListener('input', e => { const m = { 'a-user': authMode === 'login' ? 'login' : 'user', 'a-mail': 'mail', 'a-code': 'code', 'e-mail': 'resetMail', 'e-code': 'resetCode' }[e.target.id]; if (m) { authDraft[m] = e.target.value; saveDraft(); } if (e.target.id === 'a-pass') authPass = e.target.value; });

// the running minute: add the seconds since the last refresh to ESPN's clock; the shown minute moves when a full minute passes
setInterval(() => {
  const now = Date.now();
  for (const el of document.querySelectorAll('.liveclk')) {
    const c = +el.dataset.c, m = +el.dataset.m, t0 = +el.dataset.t;
    el.textContent = (m + Math.floor((c + (now - t0) / 1000) / 60) - Math.floor(c / 60)) + "'";
  }
}, 1000);

applyStatic();
render();
// offline: a thin bar on top; the service worker answers with the last saved data
{ const bar = () => { let b = document.getElementById('offbar'); if (navigator.onLine) { b?.remove(); return; } if (!b) { b = document.createElement('div'); b.id = 'offbar'; document.body.prepend(b); } b.textContent = '📴 ' + t('off.banner'); };
  addEventListener('online', () => { bar(); render(true); }); addEventListener('offline', bar); bar(); }
setTimeout(() => probeLeagues().catch(() => {}), 4000);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // a new version took over (the service worker updates itself): reload once so the page and its scripts match
  const hadSw = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadSw && !sessionStorage.getItem('gx-reloaded')) { sessionStorage.setItem('gx-reloaded', '1'); location.reload(); } });
  setTimeout(() => sessionStorage.removeItem('gx-reloaded'), 20000);
}

// ---- achievements: every badge, earned ones in colour, the others greyed with how far along you are
const BD_SHOW = [['sharp', 'target', 'exact', 3], ['sniper', 'award', 'exact', 10], ['oracle', 'bulb', 'preds', 50], ['streak7', 'fire', 'streak', 7], ['streak30', 'fire', 'streak', 30], ['writer', 'pen', 'posts', 5], ['chatty', 'chat', 'messages', 50], ['veteran', 'shield', 'days', 90], ['weekly', 'trophy', '', 0]];
function badgeShowcase(r) {
  const got = new Set(r?.user?.badges || []), p = r?.progress || {};
  const n = BD_SHOW.filter(([k]) => got.has(k)).length;
  return `<div class="card"><h2>🏅 ${t('bd.title')} <small class="hint" style="margin-left:auto">${n} / ${BD_SHOW.length}</small></h2><div class="bdgrid">${BD_SHOW.map(([k, ic, pk, goal]) => {
    const on = got.has(k), v = pk ? Math.min(p[pk] || 0, goal) : 0;
    return `<div class="bdtile ${on ? 'on' : ''}" title="${esc(t('bdg.' + k + '.d'))}"><span class="bdic">${svgI(ic)}</span><b>${t('bdg.' + k)}</b><small>${on ? '✓ ' + t('bd.got') : pk ? `${v} / ${goal}` : t('bdg.' + k + '.d')}</small>${!on && pk ? `<i class="bdbar"><i style="width:${v / goal * 100}%"></i></i>` : ''}</div>`;
  }).join('')}</div></div>`;
}

// ---- "my week" picture: the followed teams' results of the last 7 days and my prediction points, to share
async function weekCard(btn) {
  if (btn) btn.disabled = true;
  try {
    const now = Date.now(), from = now - 7 * 864e5;
    const fs = favs.filter(f => /^\d+$/.test(String(f.id)) && sportOf(f.league) === 'soccer').slice(0, 6);
    const rows = (await Promise.all(fs.map(async f => {
      const te = await teamEvents(f.id, f.league).catch(() => null);
      const games = (te?.past || []).filter(e => { const d = new Date(e.date); return d >= from && d <= now; }).map(e => {
        const cs = e.competitions?.[0]?.competitors || [], me = cs.find(c => c.team?.id == f.id), op = cs.find(c => c.team?.id != f.id);
        if (!me || !op || me.score == null) return null;
        const a = +(me.score.value ?? me.score), b = +(op.score.value ?? op.score);
        return { r: a > b ? 'W' : a < b ? 'L' : 'D', s: `${a}-${b}`, op: op.team.shortDisplayName || op.team.displayName, home: me.homeAway === 'home' };
      }).filter(Boolean);
      return { f, games };
    }))).filter(x => x.games.length);
    let pts = null;
    if (acct) { const d = await capi('GET', '/leaderboard?scope=week').catch(() => null); const me = d?.board?.find(x => x.username === acct.user.username); pts = me ? me.pts : 0; }
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563eb';
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b1020'); g.addColorStop(1, '#141b2e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = acc; x.globalAlpha = .18; x.beginPath(); x.arc(W - 120, 120, 340, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
    const F = (w, s) => `${w} ${s}px Inter, system-ui, sans-serif`;
    x.fillStyle = '#fff'; x.textAlign = 'left';
    x.font = F(800, 64); x.fillText(t('wk.title'), 72, 150);
    x.font = F(500, 32); x.fillStyle = '#9aa4b8'; x.fillText(`${fmtD(from, { day: 'numeric', month: 'long' })} – ${fmtD(now, { day: 'numeric', month: 'long' })}`, 72, 205);
    let y = 290;
    const col = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };
    if (!rows.length) { x.font = F(500, 36); x.fillStyle = '#cbd5e1'; x.fillText(t('wk.none'), 72, y + 40); y += 120; }
    for (const { f, games } of rows) {
      if (y > H - 300) break;
      x.fillStyle = 'rgba(255,255,255,.06)'; const bh = 70 + games.length * 58; x.beginPath(); x.roundRect(48, y, W - 96, bh, 28); x.fill();
      x.fillStyle = '#fff'; x.font = F(700, 38); x.fillText(f.name, 84, y + 56);
      const w = games.filter(z => z.r === 'W').length; x.font = F(600, 28); x.fillStyle = '#9aa4b8'; x.textAlign = 'right'; x.fillText(`${w}/${games.length} ${t('wk.wins')}`, W - 84, y + 54); x.textAlign = 'left';
      games.slice(0, 5).forEach((z, i) => {
        const yy = y + 100 + i * 58;
        x.fillStyle = col[z.r]; x.beginPath(); x.roundRect(84, yy - 32, 44, 44, 10); x.fill();
        x.fillStyle = '#fff'; x.font = F(800, 24); x.textAlign = 'center'; x.fillText(t('res.' + z.r), 106, yy - 2); x.textAlign = 'left';
        x.font = F(700, 32); x.fillText(z.s, 150, yy); x.font = F(500, 30); x.fillStyle = '#cbd5e1'; x.fillText((z.home ? 'vs ' : '@ ') + z.op, 250, yy);
      });
      y += bh + 24;
    }
    if (pts != null) {
      x.fillStyle = acc; x.beginPath(); x.roundRect(48, H - 250, W - 96, 120, 28); x.fill();
      x.fillStyle = '#fff'; x.font = F(600, 32); x.fillText(t('wk.pred'), 84, H - 180); x.font = F(800, 56); x.textAlign = 'right'; x.fillText(`${pts} ${t('wk.pts')}`, W - 84, H - 168); x.textAlign = 'left';
    }
    x.fillStyle = '#9aa4b8'; x.font = F(600, 30); x.fillText('Grafondex Live Score', 72, H - 60);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/png'));
    const file = new File([blob], 'grafondex-hafta.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: t('wk.title') + ' · Grafondex Live Score' }).catch(() => {});
    else { const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = file.name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  } finally { if (btn) btn.disabled = false; }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-weekcard]'); if (b) weekCard(b).catch(() => { b.disabled = false; }); });
