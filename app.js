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

// [slug, official name, ESPN logo number, has a standings table]. Official names are the same in
// every language; the country/region label beside them is translated (t('cc.*')).
const GROUPS = [
  [['tur.1', 'Trendyol Süper Lig', 18, 1], ['tur.2', 'Trendyol 1. Lig', 0, 1], ['tur.cup', 'Ziraat Türkiye Kupası', 0, 0]],
  [['uefa.champions', 'UEFA Champions League', 2, 1], ['uefa.europa', 'UEFA Europa League', 2310, 1], ['uefa.europa.conf', 'UEFA Conference League', 20296, 1], ['uefa.super_cup', 'UEFA Super Cup', 1272, 0]],
  [['eng.1', 'Premier League', 23, 1], ['esp.1', 'LaLiga', 15, 1], ['ita.1', 'Serie A', 12, 1], ['ger.1', 'Bundesliga', 10, 1], ['fra.1', 'Ligue 1', 9, 1]],
  [['ned.1', 'Eredivisie', 11, 1], ['por.1', 'Liga Portugal', 14, 1], ['bel.1', 'Jupiler Pro League', 6, 1], ['sco.1', 'Scottish Premiership', 45, 1],
    ['aut.1', 'Austrian Bundesliga', 5, 1], ['sui.1', 'Swiss Super League', 17, 0], ['gre.1', 'Super League Greece', 98, 1], ['rus.1', 'Russian Premier League', 106, 1]],
  [['eng.2', 'EFL Championship', 24, 1], ['esp.2', 'LaLiga 2', 107, 1], ['ita.2', 'Serie B', 99, 1], ['ger.2', '2. Bundesliga', 97, 1], ['fra.2', 'Ligue 2', 96, 1]],
  [['eng.fa', 'FA Cup', 40, 0], ['eng.league_cup', 'Carabao Cup', 41, 0], ['esp.copa_del_rey', 'Copa del Rey', 80, 0],
    ['ita.coppa_italia', 'Coppa Italia', 2192, 0], ['ger.dfb_pokal', 'DFB-Pokal', 2061, 0], ['fra.coupe_de_france', 'Coupe de France', 182, 0]],
  [['fifa.world', 'FIFA World Cup', 4, 1], ['fifa.worldq.uefa', 'World Cup Qualifying – UEFA', 67, 1], ['uefa.euro', 'UEFA EURO', 74, 1],
    ['uefa.euroq', 'UEFA EURO Qualifying', 56, 1], ['uefa.nations', 'UEFA Nations League', 2395, 1], ['fifa.friendly', 'International Friendly', 53, 0]],
  [['ksa.1', 'Saudi Pro League', 2488, 1], ['usa.1', 'MLS', 19, 1], ['bra.1', 'Brasileirão Série A', 85, 1], ['arg.1', 'Liga Profesional', 1, 1],
    ['conmebol.libertadores', 'CONMEBOL Libertadores', 58, 1], ['fifa.cwc', 'FIFA Club World Cup', 1932, 1]],
].map((ls, g) => ls.map(([id, name, logo, table]) => ({ id, name, logo, table: !!table, group: g })));
// American leagues: their own sport path, league logo and US region
GROUPS.push([['nba', 'NBA', 'basketball/nba'], ['nhl', 'NHL', 'hockey/nhl'], ['nfl', 'NFL', 'football/nfl']].map(([id, name, path]) => ({
  id, name, path, table: true, region: 'usa', group: GROUPS.length,
  logoUrl: `https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/${id}.png&w=64&h=64`,
})));
const LEAGUES = GROUPS.flat();
// ESPN's numeric league ids, used to sort the "all football" list into our leagues
const ESPN_NUM = { 'tur.1': 3946, 'uefa.champions': 775, 'uefa.europa': 776, 'uefa.europa.conf': 20296, 'uefa.super_cup': 5462, 'eng.1': 700, 'esp.1': 740, 'ita.1': 730,
  'ger.1': 720, 'fra.1': 710, 'ned.1': 725, 'por.1': 715, 'bel.1': 3901, 'sco.1': 735, 'aut.1': 3907, 'sui.1': 3944, 'gre.1': 3955, 'rus.1': 3939, 'eng.2': 3914, 'esp.2': 3921,
  'ita.2': 3931, 'ger.2': 3927, 'fra.2': 3926, 'eng.fa': 3918, 'eng.league_cup': 3920, 'esp.copa_del_rey': 3951, 'ita.coppa_italia': 3956, 'ger.dfb_pokal': 3954,
  'fra.coupe_de_france': 3952, 'fifa.world': 606, 'fifa.worldq.uefa': 786, 'uefa.euro': 781, 'uefa.euroq': 3947, 'uefa.nations': 2395, 'fifa.friendly': 3922,
  'ksa.1': 21231, 'usa.1': 770, 'bra.1': 630, 'arg.1': 745, 'conmebol.libertadores': 783, 'fifa.cwc': 5501 };
for (const L of LEAGUES) L.espn = ESPN_NUM[L.id];
const leagueOf = id => LEAGUES.find(l => l.id === id) || { id, name: id, logo: 0 };
const lname = L => L.name;
const isTff = id => id === 'tur.cup'; // Turkish Cup comes from TFF through the user's own server

// region of a competition: flagcdn code + translated label
const CC = { tur: 'tr', eng: 'gb-eng', esp: 'es', ita: 'it', ger: 'de', fra: 'fr', ned: 'nl', por: 'pt', bel: 'be', sco: 'gb-sct', aut: 'at', sui: 'ch', gre: 'gr', rus: 'ru', ksa: 'sa', usa: 'us', bra: 'br', arg: 'ar', uefa: 'eu' };
const regionOf = id => leagueOf(id).region || id.split('.')[0];
const ccOf = id => CC[regionOf(id)];
const regionName = id => t('cc.' + regionOf(id));
const flagImg = (id, cls = '') => ccOf(id) ? `<img class="flag ${cls}" src="https://flagcdn.com/w40/${ccOf(id)}.png" alt="">` : '';
// league logo when ESPN has one, otherwise the country flag in its place
function lgIcon(id, cls = '') {
  const L = leagueOf(id);
  if (L.logoUrl) return `<img class="lgi ${cls}" src="${L.logoUrl}" alt="">`;
  if (!L.logo) return `<span class="lgi lgflag ${cls}">${flagImg(id)}</span>`;
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
let enabled = store.get('leagues', ['tur.1', 'tur.cup', 'uefa.champions', 'uefa.europa', 'uefa.europa.conf', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1']);
// the Turkish Cup arrived later: switch it on once for people who already saved a league list
if (!store.get('cupAdded', false)) { if (!enabled.includes('tur.cup')) enabled.push('tur.cup'); store.set('leagues', enabled); store.set('cupAdded', true); }
// every football league is on by default now (all of them come in one request)
if (!store.get('allSoccerAdded', false)) {
  for (const L of GROUPS.flat()) if (!L.path && !enabled.includes(L.id)) enabled.push(L.id);
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
async function get(url, ttl = 4000) {
  const c = cache.get(url);
  if (c && Date.now() - c.t < ttl) return c.d;
  const r = await fetch(url, ttl < 10000 ? { cache: 'no-store' } : undefined);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json();
  cache.set(url, { t: Date.now(), d });
  return d;
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
  const noScore = ['STATUS_POSTPONED', 'STATUS_CANCELED', 'STATUS_SCHEDULED'].includes(n) || ty.state === 'pre';
  const us = sportOf(league) !== 'soccer';
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

function matchRow(ev, league, withDate = false, tv = '', tbd = false, hideLg = false) {
  const comp = ev.competitions[0];
  const [h, a] = sides(comp);
  const s = status(ev.status || comp.status, league);
  // score sits on the team's own line so long (wrapped) names stay aligned
  const team = c => `<div class="tm ${s.show && c.winner ? 'win' : ''}">${img(c.team.id, '', league)}<span class="tn">${esc(c.team.displayName || c.team.shortDisplayName)}${isFav(c.team.id, league) ? ' <span class="star">★</span>' : ''}</span><b class="ts ${s.cls}">${s.show ? esc(scoreOf(c)) : ''}</b></div>`;
  const comp_ = withDate && !hideLg ? (LEAGUES.some(l => l.id === league) ? lname(leagueOf(league)) : (ev.league?.name || ev.league?.abbreviation)) : '';
  return `<a class="match" href="#/match/${league}/${ev.id}">
    <div class="mtime ${s.cls}">${withDate ? `<small>${tbd ? '' : dshort(ev.date)}</small>` : ''}${s.cls === 'live' ? liveHtml(s) : tbd ? '' : esc(s.txt ?? hm(ev.date))}${tv ? `<small class="tv">📺 ${esc(tv.replace('beIN SPORTS ', 'beIN '))}</small>` : ''}</div>
    <div class="teams">${comp_ ? `<div class="lg">${esc(comp_)}</div>` : ''}${team(h)}${team(a)}</div>
  </a>`;
}

function seg(key, labels) {
  const cur = segState[key] ?? 0;
  return `<div class="seg" data-segkey="${key}">${labels.map((l, i) => `<button data-seg="${i}" class="${i === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
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
const OTHER_SPORTS = ['tennis', 'volley', 'handball', 'baseball', 'f1']; // basketball is one sport: NBA from ESPN, plus European leagues from the server (added below the NBA games)
let curSport = store.get('sport', 'soccer');
const scrollBar = inner => `<div class="sbwrap"><button class="sbarr l" data-sbar="-1" aria-label="‹">‹</button>${inner}<button class="sbarr r" data-sbar="1" aria-label="›">›</button></div>`;
const sportBar = () => scrollBar(`<div class="sportbar">${SPORTS.map(([s, ic, k]) => `<button class="${s === curSport ? 'on' : ''}" data-sport="${s}"><span>${ic}</span>${t(k)}</button>`).join('')}</div>`);

// ---- Matches tab ----
const otherRow = it => {
  if (it.kind === 'race') return `<div class="match static race"><div class="mtime ${it.state}">${it.state === 'in' ? '<span class="livedot"></span>' : ''}${esc(it.state === 'pre' ? hm(it.time) : (it.text || ''))}</div>
    <div class="teams"><b class="racetitle">${esc(I18N['f1.' + it.code] ? t('f1.' + it.code) : it.title)}</b>${it.results.length ? `<ol class="results">${it.results.map(r => `<li><i>${esc(r.pos)}</i>${esc(r.name)}<small>${esc(r.team)}</small></li>`).join('')}</ol>` : ''}</div></div>`;
  const team = x => `<div class="tm ${it.state === 'post' && x.winner ? 'win' : ''}">${x.logo ? `<img class="logo" loading="lazy" src="${esc(x.logo)}" alt="" onerror="this.style.visibility='hidden'">` : '<span class="logo ph"></span>'}<span class="tn">${esc(x.name)}</span>
    <b class="ts ${it.state}">${x.sets?.length ? `<span class="setline">${x.sets.map(v => `<i>${esc(v)}</i>`).join('')}</span>` : ''}${esc(x.score)}</b></div>`;
  return `<div class="match static"><div class="mtime ${it.state}">${it.state === 'in' ? '<span class="livedot"></span>' : ''}${esc(it.state === 'pre' ? hm(it.time) : (it.text || ''))}${it.round ? `<small>${esc(it.round)}</small>` : ''}</div>
    <div class="teams">${team(it.home)}${team(it.away)}</div></div>`;
};
async function otherSportHtml(sport, day, extra = false) {
  const d = await capi('GET', `/sports/${sport}?date=${day}`);
  if (d.error) throw new Error(d.error);
  const cards = (d.groups || []).map(g => `<div class="card"><h2>${esc(g.name)}</h2>${g.items.map(otherRow).join('')}</div>`).join('');
  const limit = d.limit ? `<p class="note">⏳ ${t('c.limitNote')}</p>` : '';
  const note = limit + (d.needKey ? `<p class="note">📌 ${t(cards ? 'c.needKeyNote' : 'c.needKey')}</p>` : '');
  if (!cards) return note || (extra ? '' : d.errors?.length ? `<div class="empty">${t('loadFail')}<br><small>${esc(d.errors[0])}</small></div>` : `<div class="empty">${t('noMatchesDay')}</div>`);
  return cards + note;
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
  const [allDays, res, tvItems, ztk] = await Promise.all([
    soccer ? Promise.allSettled(days.map(day => get(`${SITE}soccer/all/scoreboard?dates=${day}&limit=500`, 60000))) : [],
    Promise.allSettled(single.flatMap(l => days.map(day =>
      get(`${api(l)}/scoreboard?dates=${day}`).then(j => ({ l, events: j.events || [] }))))),
    soccer ? tvList(isoDay(d)) : [],
    soccer && enabled.includes('tur.cup') && workerBase() ? ztkData().catch(() => null) : null,
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
  const byLeague = {}, seen = new Set(), favRows = [];
  for (const r of res) {
    if (r.status !== 'fulfilled') continue;
    for (const ev of r.value.events) {
      if (seen.has(ev.id) || ymd(new Date(ev.date)) !== key) continue;
      seen.add(ev.id);
      (byLeague[r.value.l] ||= []).push(ev);
      if (ev.competitions[0].competitors.some(c => isFav(c.team.id, r.value.l))) favRows.push([ev, r.value.l]);
    }
  }
  if (!soccer && res.length && res.every(r => r.status === 'rejected')) throw new Error(t('noConn'));
  let html = sportBar() + bar;
  const byDate = (x, y) => new Date(x.date) - new Date(y.date);
  if (favRows.length) {
    favRows.sort((x, y) => byDate(x[0], y[0]));
    html += `<div class="card"><h2>${t('myFavs')}</h2>${favRows.map(([e, l]) => matchRow(e, l, false, tvOf(e, l))).join('')}</div>`;
  }
  const head = L => `<h2><a class="lglink" href="#/league/${L.id}">${lgIcon(L.id)}<span class="lgname">${esc(lname(L))}<small>${esc(regionName(L.id))}</small></span></a>${L.table ? `<a href="#/league/${L.id}/puan">${t('table')}</a>` : ''}</h2>`;
  for (const L of LEAGUES.filter(L => sportOf(L.id) === curSport)) {
    if (isTff(L.id)) {
      if (cupToday.length) html += `<div class="card">${head(L)}${cupToday.sort((x, y) => x.iso.localeCompare(y.iso)).map(tffRow).join('')}</div>`;
      continue;
    }
    const evs = byLeague[L.id];
    if (!evs) continue;
    evs.sort(byDate);
    html += `<div class="card">${head(L)}${evs.map(e => matchRow(e, L.id, false, tvOf(e, L.id))).join('')}</div>`;
  }
  const extra = curSport === 'basketball' ? await otherSportHtml('eubasket', isoDay(d), true).catch(() => '') : '';
  if (!seen.size && !cupToday.length && !extra.includes('class="card"')) html += `<div class="empty">${t('noMatchesDay')}<br><br><a href="#/settings" style="color:var(--accent)">${t('pickLeagues')}</a></div>`;
  return html + extra;
}

// ---- Match page ----
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
  const sideHtml = c => `<div class="side"><a href="#/team/${league}/${c.team.id}">${img(c.team.id, 'big', league)}<span>${esc(c.team.displayName)}</span></a>${formHtml(c.form)}${favStar(c.team.id, c.team.displayName, league)}</div>`;
  let html = `<div class="card hero"><div class="row">${sideHtml(h)}
    <div class="mid"><div class="sc">${s.show ? `${esc(scoreOf(h))} - ${esc(scoreOf(a))}` : esc(hm(comp.date))}</div>
    <div class="st ${s.cls}">${s.cls === 'pre' ? dshort(comp.date) : s.cls === 'live' ? `<span class="livetag">${t('live')}</span> ${liveHtml(s)}` : esc(s.txt)}</div></div>
    ${sideHtml(a)}</div><!--tv--></div>`;

  // events as a timeline: home on the left, away on the right, minute in the middle
  const homeId = h.team.id;
  const rawEvs = (j.keyEvents || []).length ? j.keyEvents
    : (comp.details || []).map(d => ({ type: d.type, team: d.team, clock: d.clock, participants: (d.athletesInvolved || []).map(a => ({ athlete: a })) }));
  const evs = rawEvs.filter(e => e.team && /Goal|Card|Substitution|Penalty/.test(e.type?.text || ''))
    .sort((x, y) => (x.clock?.value ?? 0) - (y.clock?.value ?? 0));
  const items = evs.map(e => {
    const ty = e.type.text, p = e.participants || [], name = esc(p[0]?.athlete?.displayName || '');
    const it = { side: e.team.id == homeId ? 'home' : 'away', min: e.clock?.displayValue || '', name, kind: 'other' };
    if (ty === 'Substitution') Object.assign(it, { kind: 'sub', out: esc(p[1]?.athlete?.displayName || '') });
    else if (/Own Goal/.test(ty)) Object.assign(it, { kind: 'goal', note: t('ownGoal') });
    else if (/Penalty - Scored/.test(ty)) Object.assign(it, { kind: 'goal', note: t('penalty') });
    else if (/Penalty/.test(ty)) Object.assign(it, { kind: 'miss', note: t('missedPen') });
    else if (/Goal/.test(ty)) Object.assign(it, { kind: 'goal', note: p[1] ? `${t('assist')}: ${esc(p[1].athlete.displayName)}` : '' });
    else if (/Yellow/.test(ty)) it.kind = 'yellow';
    else if (/Red/.test(ty)) it.kind = 'red';
    return it;
  });
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
    return `<div class="stat"><div class="l"><b>${esc(hv ?? '-')}${suf}</b><span>${t('stat.' + label)}</span><b>${esc(av ?? '-')}${suf}</b></div>
      <div class="bars"><i class="h" style="width:${hn / tot * 100}%"></i><i class="a" style="width:${an / tot * 100}%"></i></div></div>`;
  }).join('');
  const stHtml = stRows && s.cls !== 'pre' ? `<div class="card">${stRows}</div>` : `<div class="empty">${t('noStats')}</div>`;

  // lineups
  const rosters = (j.rosters || []).filter(r => r.roster?.length);
  const lineup = r => {
    const pl = x => `<div class="pl"><span class="no">${esc(x.jersey)}</span><span class="nm">${esc(x.athlete.displayName)}</span>
      ${x.subbedIn ? `<span class="arr up" title="${t('subIn')}">↑</span>` : ''}${x.subbedOut ? `<span class="arr down" title="${t('subOut')}">↓</span>` : ''}<span class="ps">${esc(x.position?.abbreviation)}</span></div>`;
    return `<div class="card"><h2>${img(r.team.id)} ${esc(r.team.displayName)}${r.formation ? ` · ${esc(r.formation)}` : ''}</h2>
      ${r.roster.filter(x => x.starter).map(pl).join('')}
      <h2 style="border-top:1px solid var(--line)">${t('subs')}</h2>${r.roster.filter(x => !x.starter).map(pl).join('')}</div>`;
  };
  const luHtml = rosters.length ? rosters.map(lineup).join('') : `<div class="empty">${t('noLineups')}</div>`;

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

  const k = 'match';
  html += seg(k, [t('events'), t('stats'), t('lineups'), t('recent'), t('info'), t('c.chat')])
    + pane(k, 0, evHtml) + pane(k, 1, stHtml) + pane(k, 2, luHtml) + pane(k, 3, recentHtml(j, [h, a])) + pane(k, 4, infoHtml) + pane(k, 5, chatHtml('m-soccer-' + id));
  return html;
}

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
    <div class="mid"><div class="sc">${s.show ? `${esc(scoreOf(h))} - ${esc(scoreOf(a))}` : esc(hm(comp.date))}</div>
    <div class="st ${s.cls}">${s.cls === 'pre' ? dshort(comp.date) : s.cls === 'live' ? `<span class="livetag">${t('live')}</span> ${liveHtml(s)}` : esc(s.txt)}</div></div>
    ${side(a)}</div>${tvTr ? `<div class="tvtag">📺 ${esc(tvTr)}</div>` : ''}</div>`;

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
    return top ? `<div class="pl"><span class="nm"><b>${esc(top.athlete?.displayName || '')}</b><small class="sub">${esc(cat.displayName || cat.name)}</small></span><span class="ps" style="color:var(--text);font-weight:700">${esc(top.displayValue)}</span></div>` : '';
  }).join('')}</div>`).join('') || `<div class="empty">${t('noStats')}</div>`;

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

  return html + seg('match', [t('score'), t('stats'), t('leaders'), t('info'), t('c.chat')])
    + pane('match', 0, periodHtml) + pane('match', 1, stHtml) + pane('match', 2, ldHtml) + pane('match', 3, infoHtml) + pane('match', 4, chatHtml(`m-${sportOf(league)}-${id}`));
}

// last five games of both teams + earlier meetings, from the match summary
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
const hsUrl = (sport, league, id) => `https://a.espncdn.com/i/headshots/${sport === 'soccer' ? 'soccer' : ['basketball', 'hockey', 'football', 'baseball'].includes(sport) ? league : sport}/players/full/${id}.png`;
const pfavBtn = (p, cls = 'pstar') => `<button class="${cls} ${isPFav(p.id, p.sport) ? 'on' : ''}" data-pfav="${esc(p.id)}" data-name="${esc(p.name)}" data-psport="${esc(p.sport)}" data-league="${esc(p.league)}" data-team="${esc(p.team || '')}" aria-label="${t('pl.favs')}">${isPFav(p.id, p.sport) ? '★' : '☆'}</button>`;
function playerCard(x, sub, sport = 'soccer', league = 'all', team = '') {
  const src = x.headshot?.href || (sport === 'soccer' && x.id ? hsUrl('soccer', league, x.id) : '');
  const pic = src ? `<img loading="lazy" src="${esc(src)}" alt="" onerror="this.remove()">` : '';
  const card = `<a class="pcard p-${posKey(x)}" href="#/player/${esc(sport)}/${esc(league)}/${esc(x.id)}"><div class="pph"><span class="pin_">${esc(initials(x.displayName))}</span>${pic}${x.jersey ? `<i class="pno">${esc(x.jersey)}</i>` : ''}</div>
    <b class="pnm">${esc(x.displayName)}</b><small>${esc(sub)}</small></a>`;
  return `<div class="pcwrap">${card}${pfavBtn({ id: x.id, name: x.displayName, sport, league, team })}</div>`;
}
const pgrid = list => `<div class="pgrid">${list.join('')}</div>`;

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
    const ic = FX_KINDS[order(g.kind)][1];
    const rows = g.items.map(e => matchRow(e, leagueOfEvent(e, league), true, rightsOrEmpty(e, league), dateTbd(e), true)).join('');
    return `<div class="card"><h2>${ic} ${esc(g.name)} <span class="cnt">${g.items.length}</span></h2>${rows}</div>`;
  }).join('');
}

async function viewTeam(league, id, season) {
  season = season ? +season : curSeasonYear();
  const pastSeason = season !== curSeasonYear();
  // ESPN's team-info endpoint is closed to browsers, so name, rank and record come from the standings
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
  const fav = isFav(id, league);
  const rank = stat('rank')?.value || stat('playoffSeed')?.value;
  const summary = rank ? t('rankIn', rank, groups.length > 1 ? group.name : lname(leagueOf(league))) : '';
  const rec = stat('overall')?.displayValue;
  let html = `<div class="card hero">${img(id, 'big', league)}<div style="font-size:20px;font-weight:700;margin-top:8px">${esc(name)}</div>
    <div class="st">${esc(summary)}${rec ? ' · ' + esc(rec) + (sportOf(league) === 'soccer' ? ' ' + t('wdl') : '') : ''}</div>
    <button class="favbtn ${fav ? 'on' : ''}" data-fav="${id}" data-name="${esc(name)}" data-league="${league}">${fav ? t('inFavs') : t('addFav')}</button></div>`;

  const rows = (list, withDate) => list.map(e => matchRow(e, leagueOfEvent(e, league), withDate)).join('');
  const seasonBar = sportOf(league) === 'soccer' ? `<div class="seasonbar">${seasonSelect(`data-team-season="${league}/${id}"`, season)}</div>` : '';
  const sec = (title, inner) => inner ? `<div class="fxsec">${title}</div>${inner}` : '';
  const nextSorted = [...evs.next].sort((x, y) => (dateTbd(x) - dateTbd(y)) || (new Date(x.date) - new Date(y.date)));
  const fxBody = (evs.live.length ? `<div class="card"><h2>${t('live')}</h2>${rows(evs.live, true)}</div>` : '')
    + (!pastSeason ? sec(t('upcoming'), fixtureGroups(nextSorted, league, 40)) : '')
    + sec(pastSeason ? t('season', seasonLabel(season)) + ' · ' + evs.past.length : t('recentMatches'), fixtureGroups(evs.past, league, pastSeason ? 150 : 30))
    || `<div class="empty">${t('noMatches')}</div>`;
  const fx = seasonBar + fxBody;

  if (sportOf(league) !== 'soccer') return html + seg('team', [t('fixtures'), t('squad')]) + pane('team', 0, fx) + pane('team', 1, usRosterHtml(roster, league));
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

  // profile: competitions the club plays in (from its schedule) and the head coach
  const comps = [...new Set([...evs.past, ...evs.live, ...evs.next].map(e => { const sl = leagueOfEvent(e, ''); return LEAGUES.some(l => l.id === sl) ? lname(leagueOf(sl)) : (e.league?.name || e.league?.abbreviation || ''); }).filter(Boolean))];
  const coach = [roster?.coach?.[0]?.firstName, roster?.coach?.[0]?.lastName].filter(Boolean).join(' ');
  const infoRows = [['🏆', t('competitions'), comps.join(', ')], ['🧑‍💼', t('coach'), coach], ['📊', t('th.team'), summary]].filter(r => r[2]);
  const infoPane = infoRows.length ? `<div class="card">${infoRows.map(([ic, kk, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${esc(kk)}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>` : `<div class="empty">${t('noInfo')}</div>`;
  const k = 'team';
  return html + seg(k, [t('fixtures'), t('squad'), t('info')]) + pane(k, 0, fx) + pane(k, 1, sq) + pane(k, 2, infoPane);
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
async function viewPlayer(sport, league, id) {
  let a, o = null;
  try {
    const j = await get(`${ESPN_C}${sport}/${league}/athletes/${id}`, 300000); a = j.athlete;
    var lg = j.league?.slug;
  } catch { return `<div class="empty">${t('pl.noData')}</div>`; }
  if (!a) return `<div class="empty">${t('pl.noData')}</div>`;
  o = await get(`${ESPN_C}${sport}/${league}/athletes/${id}/overview`, 300000).catch(() => null);
  setTitle(a.displayName || a.fullName);
  const team = a.team, teamLeague = sport === 'soccer' ? (lg || league) : league;
  const teamOk = team && (sport === 'soccer' || LEAGUES.some(l => l.id === teamLeague));
  const src = a.headshot?.href || hsUrl(sport, league, id);
  const pos = a.position?.displayName || a.position?.name || '';
  const p = { id, name: a.displayName || a.fullName, sport, league, team: team?.displayName || '' };
  const flag = a.flag?.href ? `<img class="flag" src="${esc(a.flag.href)}" alt="" onerror="this.remove()">` : '';
  const hero = `<div class="card hero plhero"><div class="plpic"><span class="pin_">${esc(initials(p.name))}</span><img src="${esc(src)}" alt="" onerror="this.remove()"></div>
    <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(p.name)}</div>
    <div class="st">${[a.displayJersey, pos].filter(Boolean).map(esc).join(' · ')}</div>
    ${team ? `<div class="plteam">${teamOk ? `<a href="#/team/${esc(teamLeague)}/${esc(team.id)}">${img(team.id, '', teamLeague)} ${esc(team.displayName)}</a>` : esc(team.displayName)}</div>` : ''}
    <button class="favbtn ${isPFav(id, sport) ? 'on' : ''}" data-pfav="${esc(id)}" data-name="${esc(p.name)}" data-psport="${esc(sport)}" data-league="${esc(league)}" data-team="${esc(p.team)}">${isPFav(id, sport) ? t('pl.inFav') : t('pl.addFav')}</button></div>`;
  const rows = [['pl.age', a.age ? t('age', a.age) : ''], ['pl.born', dobOf(a)], ['pl.birthplace', a.displayBirthPlace], ['pl.nation', [a.citizenship].filter(Boolean).join('')],
    ['pl.height', a.displayHeight], ['pl.weight', a.displayWeight], ['pl.exp', a.displayExperience], ['pl.draft', a.displayDraft], ['pl.hand', a.hand?.displayValue]].filter(r => r[1]);
  const info = rows.length ? `<div class="card">${rows.map(([k, v]) => `<div class="inforow"><span class="k">${t(k)}</span><span class="v">${k === 'pl.nation' ? flag : ''}${esc(v)}</span></div>`).join('')}</div>` : '';
  const ss = a.statsSummary?.statistics || [];
  const tiles = ss.length ? `<div class="card"><h2>${t('pl.current')} · ${esc(a.statsSummary.displayName || '')}</h2><div class="stiles">${ss.map(x => `<div class="stile"><b>${esc(x.displayValue ?? '')}</b><small>${esc(x.shortDisplayName || x.displayName || '')}</small></div>`).join('')}</div></div>` : '';
  const st = o?.statistics, labels = st?.labels || [];
  const table = labels.length && st.splits?.length ? `<div class="card"><h2>${t('pl.seasonStats')}</h2><div class="stwrap"><table class="stbl"><thead><tr><th></th>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead>
    <tbody>${st.splits.map(sp => `<tr><td>${esc(sp.displayName)}</td>${sp.stats.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>` : '';
  const ev = o?.nextGame?.league?.events?.[0];
  const next = ev ? `<div class="card"><h2>${t('pl.next')}</h2><div class="inforow"><span class="k">${esc(dshort(ev.date))} · ${esc(hm(ev.date))}</span><span class="v">${esc(ev.name || ev.shortName || '')}</span></div></div>` : '';
  return hero + tiles + table + next + info + (!tiles && !table ? `<div class="empty">${t('pl.noStats')}</div>` : '');
}
async function favPlayers(list) {
  const rows = await Promise.all(list.map(async f => {
    const j = await get(`${ESPN_C}${f.sport}/${f.league}/athletes/${f.id}`, 300000).catch(() => null);
    return { f, a: j?.athlete };
  }));
  return `<div class="card"><h2>⭐ ${t('pl.favs')}</h2><div class="favpl">${rows.map(({ f, a }) => {
    const ss = (a?.statsSummary?.statistics || []).slice(0, 4).map(x => `<span><b>${esc(x.displayValue)}</b> ${esc(x.shortDisplayName || x.displayName)}</span>`).join('');
    return `<div class="pcwrap row"><a class="favplrow" href="#/player/${esc(f.sport)}/${esc(f.league)}/${esc(f.id)}"><span class="pph sm"><span class="pin_">${esc(initials(f.name))}</span><img src="${esc(a?.headshot?.href || hsUrl(f.sport, f.league, f.id))}" alt="" onerror="this.remove()"></span>
      <div class="pbody"><b>${esc(f.name)}</b><small>${esc(a?.team?.displayName || f.team || '')}${a?.position?.abbreviation ? ' · ' + esc(a.position.abbreviation) : ''}</small><div class="ssline">${ss}</div></div></a>${pfavBtn(f)}</div>`;
  }).join('')}</div></div>`;
}
let searchTimer = 0, searchTok = 0;
const uidId = (uid, k) => (String(uid || '').match(new RegExp('~' + k + ':(\\d+)')) || [])[1];
async function runSearch(q) {
  const box = document.getElementById('sres'); if (!box) return;
  q = q.trim();
  if (q.length < 2) { box.innerHTML = `<div class="empty">${t('search.hint')}</div>`; return; }
  const tok = ++searchTok;
  box.innerHTML = '<div class="spin"></div>';
  const call = type => get(`${ESPN_Q}query=${encodeURIComponent(q)}&limit=12&type=${type}`, 120000).then(j => (j.results || []).find(r => r.type === type)?.contents || []).catch(() => []);
  const [teams, players] = await Promise.all([call('team'), call('player')]);
  if (tok !== searchTok) return;
  const row = (c, kind) => {
    const id = uidId(c.uid, kind === 'player' ? 'a' : 't'); if (!id) return '';
    const sport = c.sport || 'soccer', lg = c.defaultLeagueSlug || c.league || (sport === 'soccer' ? 'all' : '');
    const sub = [c.subtitle, c.description].filter(Boolean).join(' · ');
    const ok = kind === 'player' || sport === 'soccer' || LEAGUES.some(l => l.id === lg);
    const href = kind === 'player' ? `#/player/${esc(sport)}/${esc(lg || sport)}/${esc(id)}` : `#/team/${esc(lg)}/${esc(id)}`;
    const pic = c.image?.default ? `<img class="${kind === 'team' ? 'logo' : 'srcpic'}" loading="lazy" src="${esc(c.image.default)}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="srcpic">${sportIcon(sport)}</span>`;
    const inner = `${pic}<span class="nm">${esc(c.displayName)}<small class="hint" style="display:block">${sportIcon(sport)} ${esc(sub)}</small></span>${ok ? '<span class="go">›</span>' : ''}`;
    return ok ? `<div class="lrow"><a href="${href}">${inner}</a></div>` : `<div class="lrow"><span class="srow">${inner}</span></div>`;
  };
  const sec = (title, list, kind) => list.length ? `<div class="card"><h2>${title} (${list.length})</h2>${list.map(c => row(c, kind)).join('')}</div>` : '';
  box.innerHTML = sec(t('search.teams'), teams, 'team') + sec(t('search.players'), players, 'player') || `<div class="empty">${t('search.none')}</div>`;
}
async function viewSearch() {
  setTitle(t('search.title'));
  return `<div class="card"><div class="form-block"><input id="sq" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" placeholder="${esc(t('search.ph'))}"></div></div><div id="sres"><div class="empty">${t('search.hint')}</div></div>`;
}
document.addEventListener('input', e => {
  if (e.target.id !== 'sq') return;
  clearTimeout(searchTimer); const v = e.target.value; searchTimer = setTimeout(() => runSearch(v), 300);
});

// ---- Favourites ----
async function viewFavs() {
  setTitle(t('nav.favs'));
  const other = OTHER_SPORTS.includes(curSport);
  const mineF = other ? [] : favs.filter(f => sportOf(f.league) === curSport);
  const mineP = pfavs.filter(f => tabOfSport(f.sport) === curSport);
  const html = (mineF.length ? await favCards(mineF) : '') + (mineP.length ? await favPlayers(mineP) : '');
  return sportBar() + (html || `<div class="empty">${other ? t('c.otherNote') : t('noFavs')}</div>`);
}
async function favCards(list) {
  const all = await Promise.all(list.map(f => teamEvents(f.id, f.league).then(e => ({ f, e })).catch(() => ({ f, e: { past: [], live: [], next: [] } }))));
  return all.map(({ f, e }) => {
    const rows = [...e.live, ...e.past.slice(0, 1), ...e.next.slice(0, 2)].map(ev => matchRow(ev, leagueOfEvent(ev, f.league), true)).join('');
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
    + GROUPS.map((ls, g) => [g, ls.filter(ofSport)]).filter(([, ls]) => ls.length)
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

async function standingsHtml(league, season) {
  const j = await get(`${apiSt(league)}/standings${season && season !== curSeasonYear() ? '?season=' + season : ''}`, 120000);
  const groups = j.children || [];
  if (!groups.length) return `<div class="empty">${t('noTable')}</div>`;
  if (sportOf(league) !== 'soccer') return usStandingsHtml(league, groups);
  return groups.map(g => {
    const entries = [...(g.standings?.entries || [])];
    const sv = (e, n) => e.stats.find(s => s.name === n);
    entries.sort((x, y) => (sv(x, 'rank')?.value ?? 99) - (sv(y, 'rank')?.value ?? 99));
    const notes = new Map();
    const rows = entries.map(e => {
      const v = n => sv(e, n)?.displayValue ?? '';
      if (e.note) notes.set(e.note.description, e.note.color);
      return `<tr class="${isFav(e.team.id, league) ? 'fav' : ''}"><td class="r" style="border-left-color:${e.note?.color || 'transparent'}">${v('rank')}</td>
        <td class="t"><a href="#/team/${league}/${e.team.id}">${img(e.team.id, '', league)}<span>${esc(e.team.displayName)}</span>${favStar(e.team.id, e.team.displayName, league)}</a></td>
        <td>${v('gamesPlayed')}</td><td>${v('wins')}</td><td>${v('ties')}</td><td>${v('losses')}</td><td>${v('pointDifferential')}</td><td class="p">${v('points')}</td></tr>`;
    }).join('');
    const legend = notes.size ? `<div class="legend">${[...notes].map(([d, c]) => `<div><i style="background:${c}"></i>${esc(t('n.' + d))}</div>`).join('')}</div>` : '';
    return `<div class="card">${groups.length > 1 ? `<h2>${esc(g.name)}</h2>` : ''}<table><thead><tr><th>#</th><th style="text-align:left">${t('th.team')}</th><th>${t('th.P')}</th><th>${t('th.W')}</th><th>${t('th.D')}</th><th>${t('th.L')}</th><th>${t('th.GD')}</th><th>${t('th.Pts')}</th></tr></thead><tbody>${rows}</tbody></table>${legend}</div>`;
  }).join('');
}

async function viewLeague(league = 'tur.1', tab = 'fikstur', start) {
  const L = leagueOf(league);
  setTitle(lname(L));
  if (tab === 'puan') store.set('tableLeague', league);
  const tabs = isTff(league) ? LTABS.slice(0, 1)
    : LTABS.filter(([k]) => (k !== 'puan' || L.table) && (sportOf(league) === 'soccer' || !['gol', 'asist'].includes(k)));
  if (!tabs.some(([k]) => k === tab)) tab = 'fikstur';
  const sb = isTff(league) ? null : await get(`${api(league)}/scoreboard`, HOUR).catch(() => null);
  const yr = (sb?.leagues?.[0]?.season?.displayName || '').match(/\d{4}(-\d{2})?/)?.[0];
  const head = `<div class="card lhead">${lgIcon(league, 'big')}
    <div><b>${esc(lname(L))}</b>${regionLine(league)}${yr ? `<small>${t('season', yr)}</small>` : ''}</div>
    <button class="pin ${pinned.includes(league) ? 'on' : ''}" data-pin="${league}" aria-label="${t('pin')}">${pinned.includes(league) ? '★' : '☆'}</button></div>`;
  const segHtml = `<div class="seg">${tabs.map(([k, l]) => `<a data-replace href="#/league/${league}/${k}" class="${k === tab ? 'on' : ''}">${t(l)}</a>`).join('')}</div>`;
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
function tffName(n) {
  const s = String(n || '').replace(/\s+(A\.\s?Ş\.?|FUTBOL KULÜBÜ|SPOR KULÜBÜ DERNEĞİ|KULÜBÜ|DERNEĞİ)$/u, '');
  return s.toLocaleLowerCase('tr').replace(/(^|[\s(\-./])(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase('tr'));
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
function tffRow(m) {
  const sc = tffScore(m.score);
  const team = (n, g, win) => `<div class="tm ${win ? 'win' : ''}"><span class="tbadge">${esc(tffName(n).slice(0, 1))}</span><span class="tn">${esc(tffName(n))}</span><b class="ts post">${g ?? ''}</b></div>`;
  return `<a class="match" href="#/tff/${m.id}"><div class="mtime ${sc ? 'post' : 'pre'}">${sc ? t('st.FT') : (m.iso ? hm(m.iso) : '')}</div>
    <div class="teams">${team(m.home, sc?.[0], sc && +sc[0] > +sc[1])}${team(m.away, sc?.[1], sc && +sc[1] > +sc[0])}</div></a>`;
}
const ztkData = () => get(`${workerBase()}/ztk`, 300000);

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

async function viewTffMatch(id) {
  setTitle(lname(leagueOf('tur.cup')));
  if (!workerBase()) return needWorkerHtml();
  const m = await get(`${workerBase()}/tffmatch?id=${encodeURIComponent(id)}`, 120000);
  const played = m.homeScore !== '' || m.awayScore !== '';
  const logo = src => src ? `<img class="logo big" src="${esc(src)}" alt="" onerror="this.style.visibility='hidden'">` : '';
  const html = `<div class="card hero"><div class="row">
    <div class="side">${logo(m.homeLogo)}<span>${esc(tffName(m.home))}</span></div>
    <div class="mid"><div class="sc">${played ? `${esc(m.homeScore)} - ${esc(m.awayScore)}` : (m.iso ? esc(hm(m.iso)) : '')}</div><div class="st ${played ? 'post' : 'pre'}">${played ? t('st.FT') : (m.iso ? dshort(m.iso) : '')}</div></div>
    <div class="side">${logo(m.awayLogo)}<span>${esc(tffName(m.away))}</span></div></div></div>`;
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
  return html + seg('match', [t('events'), t('info'), t('c.chat')]) + pane('match', 0, evHtml) + pane('match', 1, infoHtml) + pane('match', 2, chatHtml('m-tff-' + id));
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
const NPREFS = ['goal', 'red', 'start', 'ht', 'end'];
let notif = store.get('notify', null);
if (!notif) {
  const rnd = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
  notif = { url: '', key: '', topic: 'grafondex-' + rnd, prefs: { goal: true, red: true, start: true, ht: false, end: true } };
  store.set('notify', notif);
}
const b64uBytes = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function callWorker(path, extra = {}) {
  const r = await fetch(notif.url.replace(/\/$/, '') + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: notif.key, ...extra }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'HTTP ' + r.status);
  return d;
}
const syncNotify = () => callWorker('/sync', {
  // the notification server follows football only
  topic: notif.topic, prefs: notif.prefs, lang: LANG, teams: favs.filter(f => sportOf(f.league) === 'soccer').map(f => ({ id: f.id, name: f.name })),
  app: location.href.split('#')[0], push: notif.push || null,
});

function notifyCard() {
  return `<div class="card"><h2>${t('notifs')}</h2>
    <div class="form-block">
      <label>${t('serverUrl')}<input id="n-url" type="url" placeholder="https://grafondex.….workers.dev" value="${esc(notif.url)}"></label>
      <label>${t('secretKey')}<input id="n-key" type="password" autocomplete="off" value="${esc(notif.key)}"></label>
      <label>${t('topic')}<input id="n-topic" value="${esc(notif.topic)}"></label>
      <div class="hint">${t('ntfyHint')}</div>
    </div>
    <div class="form-block"><button class="btn" id="n-push">${t('pushBtn')}</button><div class="hint">${t('pushHint')}</div></div>
    ${NPREFS.map(k => `<label class="setrow"><span>${t('np.' + k)}</span><input type="checkbox" data-nprefs="${k}" ${notif.prefs[k] ? 'checked' : ''}></label>`).join('')}
    <div class="form-block"><button class="btn" id="n-save">${t('saveTest')}</button><div class="hint" id="n-msg"></div></div>
  </div>`;
}

async function viewSettings() {
  setTitle(t('nav.settings'));
  const langCard = `<div class="card"><button class="langcur" data-lang-toggle aria-expanded="false"><span>🌐 ${t('language')}</span><b>${esc(LANGS[LANG_IDX()][1])} ▾</b></button><div class="langs" hidden>${LANGS.map(([c, n]) =>
    `<button class="langbtn ${c === LANG ? 'on' : ''}" data-lang="${c}">${n}</button>`).join('')}</div></div>`;
  return langCard + themeCard() + `<div class="card"><div class="form-block"><div class="hint">${t('c.accountMoved')}</div><a class="btn" href="#/profile" style="text-align:center">👤 ${t('c.profile')} ›</a></div></div>` + (isAdminUser() ? modCard() : '') + notifyCard() + `<p class="note" style="text-align:left;padding:0 4px 8px">${t('pickLeaguesNote')}</p>
    ${GROUPS.map((ls, g) => `<div class="card"><h2>${t('grp.' + g)}</h2>
    ${ls.map(L => `<label class="setrow">${lgIcon(L.id)}<span>${esc(lname(L))}</span><input type="checkbox" data-league-toggle="${L.id}" ${enabled.includes(L.id) ? 'checked' : ''}></label>`).join('')}</div>`).join('')}
    <div class="card about"><img src="logo.png" alt="Grafondex Live Score"><div class="note">${t('about')}</div></div>`;
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
const nameHtml = m => `<a class="cu ${m.role === 'admin' ? 'adm' : ''}" href="#/user/${encodeURIComponent(m.username)}" style="color:${m.color || hashColor(m.username)}">${esc(m.username)}</a>${m.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}${favBadge(m)}`;

function authForm() {
  return `<div class="card authcard"><h2>${t('c.loginTitle')}</h2><div class="form-block">
    <label>${t('c.username')}<input id="a-user" autocomplete="username" autocapitalize="off" maxlength="20"></label>
    <label>${t('c.password')}<input id="a-pass" type="password" autocomplete="current-password" maxlength="100"></label>
    <div class="authbtns"><button class="btn" data-auth="login">${t('c.login')}</button><button class="btn ghost" data-auth="register">${t('c.register')}</button></div>
    <div class="hint" id="a-msg">${t('c.passHint')}</div></div></div>`;
}
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
      <div class="form-block"><a class="btn" href="#/profile" style="text-align:center">${t('c.myProfile')} ›</a><button class="btn ghost" data-auth="logout">${t('c.logout')}</button></div></div>${isAdminUser() ? modCard() : ''}`
  : authForm();
async function loadReports() {
  const box = document.getElementById('m-reports');
  if (!box || !isAdminUser()) return;
  try {
    const { reports } = await capi('GET', '/mod/reports');
    box.innerHTML = reports.length ? `<h2 style="border-top:1px solid var(--line)">🚩 ${t('c.reports')}</h2>` + reports.map(r =>
      `<div class="lrow"><span class="nm" style="padding:10px 12px">${esc(r.kind)} #${r.target_id} × ${r.n}</span><button class="pin" data-mod="delitem" data-kind="${esc(r.kind)}" data-id="${r.target_id}" aria-label="${t('c.delete')}">🗑</button></div>`).join('') : '';
  } catch {}
}

// ---------- profile: avatar colour, bio, favourite team (public page: #/user/NAME)
async function viewProfile() {
  setTitle(t('c.profile'));
  if (!acct) return communityNav('profile') + authForm();
  try { acct.user = (await capi('GET', '/me')).user; store.set('acct', acct); } catch {}
  const u = acct.user, me = { username: u.username, role: u.role, color: u.color, fav_id: u.fav?.id, fav_league: u.fav?.league, fav_name: u.fav?.name };
  const swatches = AVATAR_COLORS.map(c => `<button class="swatch ${c === (u.color || hashColor(u.username)) ? 'on' : ''}" style="background:${c}" data-color="${c}" aria-label="${c}"></button>`).join('');
  const favNow = u.fav ? `<div class="favcur">${img(u.fav.id, 'mid', u.fav.league)}<a href="#/team/${esc(u.fav.league)}/${esc(u.fav.id)}"><b>${esc(u.fav.name)}</b></a><button class="cbtn txt" data-fav-clear>✕ ${t('c.remove')}</button></div>` : `<div class="hint">${t('c.noFavTeam')}</div>`;
  const mine = favs.slice(0, 12).map(f => `<button class="tcell" data-pick-team data-id="${esc(f.id)}" data-name="${esc(f.name)}" data-league="${esc(f.league)}">${img(f.id, 'mid', f.league)}<span>${esc(f.name)}</span></button>`).join('');
  const leagueOpts = LEAGUES.filter(L => L.table && !isTff(L.id)).map(L => `<option value="${L.id}">${esc(lname(L))}</option>`).join('');
  return communityNav('profile') + `<div class="card profhead">${avatar(me, 64)}<div><b style="font-size:18px">${esc(u.username)}</b>${u.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}
      <div><a href="#/user/${encodeURIComponent(u.username)}" style="color:var(--accent);font-size:13px">${t('c.publicView')} ›</a></div></div></div>
    <div class="card"><h2>🎨 ${t('c.avatarColor')}</h2><div class="swatches">${swatches}</div></div>
    <div class="card"><h2>📝 ${t('c.bio')}</h2><div class="form-block"><textarea id="pf-bio" maxlength="140" rows="3" placeholder="${t('c.bioPh')}">${esc(u.bio || '')}</textarea>
      <button class="btn" data-profile-save>${t('c.save')}</button><div class="hint" id="pf-msg"></div></div></div>
    <div class="card"><h2>⭐ ${t('c.favTeam')}</h2><div class="form-block">${favNow}
      ${mine ? `<div class="hint">${t('c.fromFavs')}</div><div class="tgrid">${mine}</div>` : ''}
      <div class="hint">${t('c.pickLeague')}</div><select class="picker" id="pf-league" style="margin:0"><option value="">—</option>${leagueOpts}</select><div id="pf-teams" class="tgrid"></div></div></div>
    <div class="card"><h2>🔒 ${t('c.security')}</h2><div class="form-block">
      <input id="pw-old" type="password" autocomplete="current-password" placeholder="${t('c.oldPass')}">
      <input id="pw-new" type="password" autocomplete="new-password" placeholder="${t('c.newPass')}">
      <button class="btn" data-pw-change>${t('c.changePass')}</button><div class="hint" id="pw-msg"></div>
      <button class="btn ghost danger" data-acct-delete>${t('c.deleteAcct')}</button></div></div>
    <div class="card"><div class="form-block"><button class="btn ghost" data-auth="logout">${t('c.logout')}</button></div></div>`;
}
async function viewUser(name) {
  setTitle(name);
  const { user: u } = await capi('GET', '/users/' + encodeURIComponent(name));
  const m = { username: u.username, role: u.role, color: u.color, fav_id: u.fav?.id, fav_league: u.fav?.league, fav_name: u.fav?.name };
  const own = acct?.user?.username === u.username;
  return `<div class="card profhead">${avatar(m, 64)}<div><b style="font-size:18px">${esc(u.username)}</b>${u.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}
      <div class="hint">${t('c.joined', fmtD(u.created * 1000, { day: 'numeric', month: 'long', year: 'numeric' }))}</div></div></div>
    ${u.bio ? `<div class="card"><div class="form-block ptext">${esc(u.bio)}</div></div>` : ''}
    ${u.fav ? `<div class="card"><h2>⭐ ${t('c.favTeam')}</h2><a class="lrow" href="#/team/${esc(u.fav.league)}/${esc(u.fav.id)}" style="padding:12px;gap:12px">${img(u.fav.id, 'mid', u.fav.league)}<b>${esc(u.fav.name)}</b></a></div>` : ''}
    <div class="card"><div class="statrow"><div><b>${u.posts}</b><small>${t('c.topics')}</small></div><div><b>${u.messages}</b><small>${t('c.msgs')}</small></div></div></div>
    ${own ? `<a class="btn" href="#/profile" style="display:block;text-align:center">${t('c.editProfile')}</a>` : ''}`;
}

document.addEventListener('click', async e => {
  const ch = e.target.closest('[data-pw-change]'), dl = e.target.closest('[data-acct-delete]');
  if (!ch && !dl) return;
  const msg = document.getElementById('pw-msg'), oldEl = document.getElementById('pw-old'), newEl = document.getElementById('pw-new');
  try {
    if (ch) { await capi('POST', '/password', { old: oldEl.value, new: newEl.value }); msg.textContent = '✅ ' + t('c.passChanged'); oldEl.value = newEl.value = ''; }
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
const applyTheme = () => {
  const dark = themeMode === 'dark' || (themeMode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
};
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => themeMode === 'auto' && applyTheme()); } catch {}
applyTheme();
const themeCard = () => `<div class="card"><h2>🎨 ${t('theme.title')}</h2><div class="langs">${['auto', 'light', 'dark'].map(m =>
  `<button class="langbtn ${m === themeMode ? 'on' : ''}" data-theme-set="${m}">${t('theme.' + m)}</button>`).join('')}</div></div>`;

document.addEventListener('change', async e => {
  if (e.target.id !== 'pf-league' || !e.target.value) return;
  const league = e.target.value, box = document.getElementById('pf-teams');
  box.innerHTML = '<div class="hint">…</div>';
  const j = await get(`${apiSt(league)}/standings`, 300000).catch(() => null);
  let ts = (j?.children || []).flatMap(g => g.standings?.entries || []).map(x => x.team);
  ts = [...new Map(ts.map(x => [x.id, x])).values()].sort((a, b) => a.displayName.localeCompare(b.displayName, LOCALE()));
  box.innerHTML = ts.length ? ts.map(tm => `<button class="tcell" data-pick-team data-id="${esc(tm.id)}" data-name="${esc(tm.displayName)}" data-league="${esc(league)}">${img(tm.id, 'mid', league)}<span>${esc(tm.displayName)}</span></button>`).join('') : `<div class="empty">${t('noTeams')}</div>`;
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
      if (!isFav(id, league)) { favs = [...favs, { id, name, league }]; store.set('favs', favs); if (notif.url && notif.key) syncNotify().catch(() => {}); }
    }
    acct.user = r.user; store.set('acct', acct);
    if (!ps) render(true);
  } catch (err) { if (msg) msg.textContent = '❌ ' + errText(err); else alert(errText(err)); }
});

// ---------- forum
const communityNav = active => `<div class="seg"><a data-replace href="#/forum" class="${active === 'forum' ? 'on' : ''}">💬 ${t('cat.topics')}</a><a data-replace href="#/profile" class="${active === 'profile' ? 'on' : ''}">👤 ${t('c.profile')}${acct ? '' : ''}</a></div>`;
const FORUM_CATS = [['genel', '💬'], ['superlig', '🇹🇷'], ['avrupa', '🌍'], ['transfer', '🔁'], ['tahmin', '🎯'], ['basket', '🏀'], ['tenis', '🎾'], ['f1', '🏎️'], ['diger', '🏐'], ['oneri', '🛠️']];
const catName = k => t('cat.' + k);
const catIcon = k => (FORUM_CATS.find(c => c[0] === k) || ['', '💬'])[1];
const catChip = k => `<a class="catchip" href="#/forum/${k}">${catIcon(k)} ${esc(catName(k))}</a>`;
const postRow = (p, showCat) => `<div class="lrow postrow" data-href="#/post/${p.id}"><div class="pbody"><a class="ptitle" href="#/post/${p.id}"><b>${esc(p.title)}</b></a>
  <small>${showCat ? `${catIcon(p.category)} ${esc(catName(p.category))} · ` : ''}${nameHtml(p)} · ${ago(p.last || p.created)}</small></div><a class="pcount" href="#/post/${p.id}">💬 ${p.replies}</a></div>`;
const loginCard = () => `<div class="card"><div class="form-block"><div class="hint">${t('c.needLogin')}</div><a class="btn" href="#/profile" style="text-align:center">${t('c.login')} ›</a></div></div>`;
async function viewForum(cat) {
  setTitle(t('nav.forum'));
  if (!FORUM_CATS.some(c => c[0] === cat)) return viewForumHome();
  let posts;
  try { posts = (await capi('GET', '/posts?cat=' + cat)).posts; } catch (e) { return communityNav('forum') + `<div class="empty">⚠️ ${esc(errText(e))}<br><button class="btn" data-retry style="margin-top:12px">${t('refresh')}</button></div>`; }
  const composer = acct
    ? `<div class="card"><h2>✍️ ${t('c.newTopic')} · ${catIcon(cat)} ${esc(catName(cat))}</h2><div class="form-block">
        <input id="p-title" maxlength="100" placeholder="${esc(t('cat.' + cat + '.ph'))}"><textarea id="p-body" maxlength="2000" rows="4" placeholder="${t('c.text')}"></textarea>
        <button class="btn" data-post-send="${cat}">${t('c.post')}</button><div class="hint" id="p-msg"></div></div></div>`
    : loginCard();
  const list = posts.length ? `<div class="card">${posts.map(p => postRow(p, false)).join('')}</div>` : `<div class="empty">${t('c.noPosts')}</div>`;
  return communityNav('forum') + scrollBar(`<div class="catbar"><a class="catchip" href="#/forum">‹ ${t('cat.all')}</a>${FORUM_CATS.filter(c => c[0] !== cat).map(c => catChip(c[0])).join('')}</div>`) + `
    <div class="card"><div class="form-block"><b style="font-size:17px">${catIcon(cat)} ${esc(catName(cat))}</b><div class="hint">${esc(t('cat.' + cat + '.d'))}</div></div></div>` + composer + list;
}
async function viewForumHome() {
  // an older Worker has no /posts/cats: the page must still open
  const [cr, pr] = await Promise.allSettled([capi('GET', '/posts/cats'), capi('GET', '/posts')]);
  if (pr.status === 'rejected') return communityNav('forum') + `<div class="empty">⚠️ ${esc(errText(pr.reason))}<br><button class="btn" data-retry style="margin-top:12px">${t('refresh')}</button></div>`;
  const posts = pr.value.posts, cats = cr.status === 'fulfilled' ? cr.value.cats : [];
  const info = Object.fromEntries(cats.map(c => [c.category, c]));
  const grid = FORUM_CATS.map(([k, ic]) => `<a class="catcard" href="#/forum/${k}"><span class="caticon">${ic}</span><div class="pbody"><b>${esc(catName(k))}</b><small>${esc(t('cat.' + k + '.d'))}</small></div>
      <span class="pcount">${info[k] ? info[k].n : 0}</span></a>`).join('');
  const recent = posts.length ? `<div class="card"><h2>🔥 ${t('cat.recent')}</h2>${posts.slice(0, 8).map(p => postRow(p, true)).join('')}</div>` : '';
  return communityNav('forum') + `<div class="card"><div class="form-block"><b style="font-size:17px">${t('cat.welcome')}</b><div class="hint">${t('cat.rules')}</div></div></div>
    <div class="card"><h2>${t('cat.pick')}</h2>${grid}</div>` + recent;
}
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
    <div class="card"><div class="form-block"><b style="font-size:17px">${esc(post.title)}</b><small class="hint">${nameHtml(post)} · ${ago(post.created)}</small>
    <div class="ptext">${esc(post.body)}</div><span class="cact">${likeBtn('post', post)}${delBtn('post', post.id, post.username)}${modBtns(post.username, 'post', post.id)}</span></div></div>
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
    <div class="bubbody">${mine ? '' : `<div class="bubhead">${nameHtml(m)}</div>`}<div class="bubtext">${esc(m.body)}</div><div class="bubfoot">${clockOf(m.created)}${likeBtn('chat', m)}</div>${acts ? `<div class="bubact">${acts}</div>` : ''}</div></div>`;
};
function chatRows(msgs, prevDay) {
  let html = '', last = prevDay;
  for (const m of msgs) { const d = dayOfTs(m.created); if (d !== last) { html += daySep(m.created); last = d; } html += chatMsg(m); }
  return { html, last };
}
function chatHtml(room) {
  const bar = acct
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
    document.querySelectorAll('.chat .chaterr').forEach(x => { x.textContent = left > 0 ? '⏳ ' + t('c.chatWait', left) : ''; });
    document.querySelectorAll('.chatsend').forEach(x => { x.disabled = left > 0; });
    if (left <= 0) clearInterval(chatTimer);
  };
  tick(); chatTimer = setInterval(tick, 1000);
}
async function chatSend(el) {
  const input = el.querySelector('.chatin'), err = el.querySelector('.chaterr');
  const body = input.value.trim();
  if (!body) return;
  err.textContent = '';
  const left = Math.ceil((chatNext - Date.now()) / 1000);
  if (left > 0 && !isAdminUser()) { err.textContent = '⏳ ' + t('c.err.slow_wait', left); return; }
  try {
    await capi('POST', `/chat/${encodeURIComponent(el.dataset.room)}`, { body });
    input.value = '';
    if (!isAdminUser()) chatCooldown(60);
    chatPoll(el);
  } catch (e) {
    if (e.code === 'slow_down' && e.data?.wait) chatCooldown(e.data.wait);
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
const afterRender = () => {
  const sq = document.getElementById('sq'); if (sq && !sq.value) sq.focus();
  const on = document.querySelector('.sportbar button.on'); if (on) { const bar = on.parentElement; bar.scrollLeft = Math.max(0, on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2); }
  document.querySelectorAll('.sportbar, .catbar').forEach(updArrows);
  document.querySelectorAll('.chat[data-room]:not([data-init])').forEach(el => { el.dataset.init = '1'; chatPoll(el, true); chatConnect(el); });
  loadReports();
};

// ---------- clicks
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList?.contains('chatin')) { e.preventDefault(); chatSend(e.target.closest('.chat')); }
});
document.addEventListener('click', async e => {
  const bub = e.target.closest('.bub');
  if (bub && !e.target.closest('a,button')) { document.querySelectorAll('.bub.open').forEach(x => x !== bub && x.classList.remove('open')); bub.classList.toggle('open'); return; }
  const send = e.target.closest('.chatsend');
  if (send) { chatSend(send.closest('.chat')); return; }

  const au = e.target.closest('[data-auth]');
  if (au) {
    const kind = au.dataset.auth, msg = document.getElementById('a-msg');
    if (kind === 'logout') { try { await capi('POST', '/logout'); } catch {} acct = null; store.set('acct', null); render(); return; }
    const username = document.getElementById('a-user').value.trim(), password = document.getElementById('a-pass').value;
    msg.textContent = t('sending');
    try {
      const r = await capi('POST', '/' + kind, { username, password });
      acct = { token: r.token, user: r.user }; store.set('acct', acct); render();
    } catch (err) { msg.textContent = '❌ ' + errText(err); }
    return;
  }

  const ps = e.target.closest('[data-post-send]');
  if (ps) {
    const msg = document.getElementById('p-msg');
    try {
      const r = await capi('POST', '/posts', { title: document.getElementById('p-title').value, body: document.getElementById('p-body').value, category: ps.dataset.postSend });
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
        const r = await capi('POST', '/like', { kind, id });
        ca.classList.toggle('on', r.liked); ca.innerHTML = `${r.liked ? '♥' : '♡'} <span>${r.n}</span>`;
      } else if (ca.dataset.cact === 'del') { await capi('POST', '/delete', { kind, id }); row ? row.remove() : render(); if (kind === 'post') history.back(); }
      else if (ca.dataset.cact === 'report') { await capi('POST', '/report', { kind, id }); ca.textContent = '✓'; ca.disabled = true; }
      else if (ca.dataset.cact === 'mute') { await capi('POST', '/mod/mute', { username: user, minutes: +ca.dataset.min }); ca.textContent = '✓'; }
      else if (ca.dataset.cact === 'ban') { if (confirm(t('c.confirmBan', user))) { await capi('POST', '/mod/ban', { username: user }); ca.textContent = '✓'; } }
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

// ---- router ----
const routes = {
  matches: viewMatches, match: viewMatch, team: viewTeam, favs: viewFavs, settings: viewSettings,
  leagues: viewLeagues, league: viewLeague, tff: viewTffMatch, forum: viewForum, post: viewPost, player: viewPlayer, search: viewSearch, profile: viewProfile, user: viewUser,
  table: l => viewLeague(l || store.get('tableLeague', 'tur.1'), 'puan'),
};
// texts that live in the page shell (bottom bar, header buttons)
function applyStatic() {
  document.documentElement.lang = LANG;
  for (const a of document.querySelectorAll('#tabs a')) a.querySelector('span').textContent = t('nav.' + a.dataset.tab);
  $('#back').setAttribute('aria-label', t('back'));
  $('#refresh').setAttribute('aria-label', t('refresh'));
  $('#searchbtn').setAttribute('aria-label', t('search.title'));
}
// soft placeholder cards while a page loads (instead of a bare spinner)
const SKELETON = [0, 1].map(() => `<div class="card skel"><h2><i class="sk w40"></i></h2>${[0, 1, 2].map(() => '<div class="skrow"><i class="sk dot"></i><span><i class="sk w70"></i><i class="sk w50"></i></span></div>').join('')}</div>`).join('');
let lastSig = '';
let renderTok = 0, lastTab = 'matches', lastHash = null;
async function render(silent = false) {
  const [r, ...args] = (location.hash.replace(/^#\/?/, '') || 'matches').split('/');
  const route = routes[r] ? r : 'matches';
  if (['matches', 'favs', 'leagues', 'settings'].includes(route)) lastTab = route;
  if (['league', 'table'].includes(route)) lastTab = 'leagues';
  if (['forum', 'post', 'profile', 'user'].includes(route)) lastTab = 'forum';
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === lastTab));
  $('#back').hidden = !['match', 'team', 'league', 'table', 'tff', 'post', 'user', 'player', 'search'].includes(route);
  $('#hlogo').hidden = !$('#back').hidden;
  const tok = ++renderTok;
  if (!silent) {
    app.innerHTML = SKELETON;
    // a different match/team opens on its first tab
    if (location.hash !== lastHash) { delete segState.match; delete segState.team; }
    lastHash = location.hash;
  }
  try {
    const html = await routes[route](...args);
    if (tok !== renderTok) return;
    const sig = location.hash + html.replace(/ data-t="\d+"/g, '');
    if (silent && sig === lastSig) return;
    lastSig = sig;
    app.classList.toggle('still', silent); // entrance animation only for real page changes, not for the 5-second refresh
    const y = scrollY;
    const prevChat = (() => { const n = document.querySelector('.chat[data-room]'); return n ? { node: n, focus: n.contains(document.activeElement) } : null; })();
    app.innerHTML = html;
    keepChat(prevChat);
    afterRender();
    const on = document.querySelector('.datebar a.on');
    if (on) on.parentElement.scrollLeft = on.offsetLeft - (on.parentElement.clientWidth - on.offsetWidth) / 2;
    scrollTo(0, silent ? y : 0);
  } catch (e) {
    if (tok !== renderTok || silent) return;
    app.innerHTML = `<div class="err">${t('loadFail')}<br><small>${esc(e.message)}</small><br><button onclick="cache.clear();render()">${t('retry')}</button></div>`;
  }
}

addEventListener('hashchange', () => render());
$('#back').onclick = () => (history.length > 1 ? history.back() : (location.hash = '#/matches'));
$('#refresh').onclick = () => { cache.clear(); render(); };
$('#searchbtn').onclick = () => { location.hash = '#/search'; };
document.addEventListener('click', async e => {
  // tabs and round arrows inside a league page don't pile up in history
  const rl = e.target.closest('a[data-replace]');
  if (rl) { e.preventDefault(); if (!rl.classList.contains('off')) location.replace(rl.getAttribute('href')); return; }
  const sp = e.target.closest('[data-sport]');
  if (sp) { curSport = sp.dataset.sport; store.set('sport', curSport); render(); return; }
  const prow = e.target.closest('.postrow[data-href]');
  if (prow && !e.target.closest('a')) { location.hash = prow.dataset.href; return; }
  const sbr = e.target.closest('[data-sbar]');
  if (sbr) { const bar = sbr.parentElement.querySelector('.sportbar, .catbar'); bar?.scrollBy({ left: +sbr.dataset.sbar * Math.max(160, bar.clientWidth * .7), behavior: 'smooth' }); return; }
  if (e.target.closest('[data-retry]')) { render(); return; }
  const lt = e.target.closest('[data-lang-toggle]');
  if (lt) { const box = lt.parentElement.querySelector('.langs'); box.hidden = !box.hidden; lt.setAttribute('aria-expanded', String(!box.hidden)); return; }
  const lb = e.target.closest('[data-lang]');
  if (lb) {
    LANG = lb.dataset.lang;
    store.set('lang', LANG);
    applyStatic();
    if (notif.url && notif.key) syncNotify().catch(() => {});
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
    notif.url = $('#n-url').value.trim();
    notif.key = $('#n-key').value.trim();
    if (!/^https:\/\//.test(notif.url) || !notif.key) { msg.textContent = t('needUrlKey'); return; }
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
  if (e.target.id === 'n-save') {
    const msg = $('#n-msg');
    notif.url = $('#n-url').value.trim();
    notif.key = $('#n-key').value.trim();
    notif.topic = $('#n-topic').value.trim();
    NPREFS.forEach(k => { notif.prefs[k] = document.querySelector(`[data-nprefs="${k}"]`).checked; });
    store.set('notify', notif);
    if (!/^https:\/\//.test(notif.url) || !notif.key) { msg.textContent = t('needUrlKey'); return; }
    if (!/^[\w-]{6,64}$/.test(notif.topic)) { msg.textContent = t('badTopic'); return; }
    msg.textContent = t('sending');
    try {
      const r = await syncNotify();
      await callWorker('/test');
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
    document.querySelectorAll(`[data-pfav="${CSS.escape(d.pfav)}"][data-psport="${CSS.escape(d.psport)}"]`).forEach(b => {
      b.classList.toggle('on', !was);
      b.textContent = b.classList.contains('favbtn') ? (was ? t('pl.addFav') : t('pl.inFav')) : (was ? '☆' : '★');
    });
    if (location.hash.startsWith('#/favs')) render(true);
    return;
  }
  const fb = e.target.closest('[data-fav]');
  if (fb) {
    e.preventDefault(); // stars can sit inside a team link
    const id = fb.dataset.fav;
    favs = isFav(id, fb.dataset.league) ? favs.filter(f => !(f.id == id && sportOf(f.league) === sportOf(fb.dataset.league))) : [...favs, { id, name: fb.dataset.name, league: fb.dataset.league }];
    store.set('favs', favs);
    if (notif.url && notif.key) syncNotify().catch(() => {});
    render(true);
  }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-team-season]')) { location.replace('#/team/' + e.target.dataset.teamSeason + '/' + e.target.value); return; }
  if (e.target.matches('[data-league-season]')) { leagueSeason[e.target.dataset.leagueSeason] = +e.target.value; location.replace(`#/league/${e.target.dataset.leagueSeason}/fikstur`); render(); return; }
  if (e.target.matches('[data-month-pick]')) { location.replace(`#/league/${e.target.dataset.monthPick}/fikstur/${e.target.value}`); return; }
  if (e.target.matches('[data-tff-round]')) { location.replace('#/league/tur.cup/fikstur/' + e.target.value); return; }
  if (e.target.matches('[data-round-pick]')) { location.replace(`#/league/${e.target.dataset.roundPick}/fikstur/${e.target.value}`); return; }
  if (e.target.matches('[data-date-pick]')) { if (e.target.value) location.hash = '#/matches/' + e.target.value.replaceAll('-', ''); return; }
  const id = e.target.dataset?.leagueToggle;
  if (!id) return;
  enabled = e.target.checked ? [...new Set([...enabled, id])] : enabled.filter(x => x !== id);
  store.set('leagues', enabled);
});

// every data page refreshes itself while open: every 5 s when a live game is on screen, else every 30 s.
// Each source keeps its own cache time (scores 4 s, tables 2 min, TFF referees 2 min, squads 5 min, TV 30 min).
let ticks = 0;
setInterval(() => {
  if (document.hidden) return;
  const r = (location.hash.replace(/^#\/?/, '') || 'matches').split('/')[0];
  if (!['matches', 'match', 'favs', 'league', 'team', 'tff', 'table'].includes(r)) return;
  const live = document.querySelector('.mtime.live, .hero .st.live');
  if (live || ++ticks % 6 === 0) render(true);
}, 5000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(true); });

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
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
