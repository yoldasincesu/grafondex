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
  [['swe.1', 'Allsvenskan', 0, 1], ['nor.1', 'Eliteserien', 0, 1], ['den.1', 'Danish Superliga', 0, 1], ['fin.1', 'Veikkausliga', 0, 1], ['rou.1', 'Romanian Liga 1', 0, 1], ['cze.1', 'Czech First League', 0, 1],
    ['cyp.1', 'Cypriot First Division', 0, 1], ['isr.1', 'Israeli Premier League', 0, 1], ['irl.1', 'League of Ireland', 0, 1], ['nir.1', 'NIFL Premiership', 0, 1], ['wal.1', 'Cymru Premier', 0, 1],
    ['sco.2', 'Scottish Championship', 0, 1], ['eng.3', 'EFL League One', 0, 1], ['ned.2', 'Eerste Divisie', 0, 1], ['swe.2', 'Superettan', 0, 1], ['nor.2', 'OBOS-ligaen', 0, 1], ['den.2', 'Danish 1st Division', 0, 1]],
  [['jpn.1', 'J1 League', 0, 1], ['chn.1', 'Chinese Super League', 0, 1], ['ind.1', 'Indian Super League', 0, 1], ['aus.1', 'A-League Men', 0, 1], ['rsa.1', 'South African Premiership', 0, 1],
    ['nga.1', 'Nigeria Premier League', 0, 1], ['gha.1', 'Ghana Premier League', 0, 1], ['afc.champions', 'AFC Champions League Elite', 0, 0], ['caf.champions', 'CAF Champions League', 0, 0]],
  [['mex.1', 'Liga MX', 0, 1], ['col.1', 'Colombian Primera A', 0, 1], ['chi.1', 'Chilean Primera División', 0, 1], ['uru.1', 'Uruguayan Primera División', 0, 1], ['ecu.1', 'LigaPro Ecuador', 0, 1],
    ['par.1', 'Paraguayan Primera División', 0, 1], ['per.1', 'Peruvian Liga 1', 0, 1], ['ven.1', 'Venezuelan Primera División', 0, 1], ['bol.1', 'Bolivian Liga Profesional', 0, 1], ['crc.1', 'Costa Rican Primera División', 0, 1],
    ['conmebol.sudamericana', 'CONMEBOL Sudamericana', 0, 0], ['concacaf.champions', 'Concacaf Champions Cup', 0, 0], ['concacaf.leagues.cup', 'Leagues Cup', 0, 0]],
  [['usa.nwsl', 'NWSL', 0, 1], ['eng.w.1', 'Women\'s Super League', 0, 1], ['uefa.wchampions', 'UEFA Women\'s Champions League', 0, 0]],
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
  if (!L.logo) return `<span class="lgi lgflag ${cls}">${flagImg(id) || '🌍'}</span>`;
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
    <div class="mtime ${s.cls}">${withDate ? `<small>${tbd ? '' : dshort(ev.date)}</small>` : ''}${s.cls === 'live' ? liveHtml(s) : tbd ? '' : esc(s.txt ?? hm(ev.date))}</div>
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

// other sports: countries the user wants to see (the server sends every league with its country)
const CTRY_EU = ['Turkey', 'Germany', 'Spain', 'Italy', 'France', 'Greece', 'Serbia', 'Lithuania', 'Latvia', 'Estonia', 'Israel', 'Poland', 'Croatia', 'Slovenia', 'Montenegro', 'Bosnia-and-Herzegovina', 'North-Macedonia', 'Russia', 'Belgium', 'Netherlands',
  'Czech-Republic', 'Austria', 'Switzerland', 'Portugal', 'UK', 'England', 'Finland', 'Sweden', 'Hungary', 'Ukraine', 'Bulgaria', 'Romania', 'Denmark', 'Norway', 'Georgia', 'Cyprus', 'Slovakia', 'Europe', 'World'];
const CTRY_ALL = [...CTRY_EU.filter(x => !['Europe', 'World'].includes(x)), 'Iceland', 'Ireland', 'Luxembourg', 'Malta', 'Albania', 'Kosovo', 'Belarus', 'Kazakhstan', 'Azerbaijan', 'USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Uruguay',
  'Venezuela', 'China', 'Japan', 'South-Korea', 'Australia', 'New-Zealand', 'India', 'Iran', 'Qatar', 'Saudi-Arabia', 'Egypt', 'Tunisia', 'Algeria', 'Morocco', 'South-Africa', 'Nigeria', 'Taiwan', 'Thailand', 'Philippines', 'Indonesia'].sort((a, b) => a.localeCompare(b));
const CTRY_DEFAULT = { handball: CTRY_EU, eubasket: CTRY_EU, volley: ['Turkey', 'Europe', 'World'] };
let ctryPref = store.get('ctry', {});
const ctryOn = (sport, country) => (ctryPref[sport] || CTRY_DEFAULT[sport] || []).includes(country || 'World');
const groupOk = (sport, g) => { if (!g.country || !CTRY_DEFAULT[sport]) return true; if (!ctryPref[sport]) return g.def !== false; return ctryPref[sport].includes(g.country); };
const ctryName = c => { try { return c.replace(/-/g, ' '); } catch { return c; } };
let sportsOn = store.get('sportsOn', null);
const sportShown = s => s === 'soccer' || !sportsOn || sportsOn.includes(s);
const OTHER_SPORTS = ['tennis', 'volley', 'handball', 'baseball', 'f1']; // basketball is one sport: NBA from ESPN, plus European leagues from the server (added below the NBA games)
let curSport = store.get('sport', 'soccer');
const scrollBar = inner => `<div class="sbwrap"><button class="sbarr l" data-sbar="-1" aria-label="‹">‹</button>${inner}<button class="sbarr r" data-sbar="1" aria-label="›">›</button></div>`;
const sportBar = () => scrollBar(`<div class="sportbar">${SPORTS.filter(x => sportShown(x[0])).map(([s, ic, k]) => `<button class="${s === curSport ? 'on' : ''}" data-sport="${s}"><span>${ic}</span>${t(k)}</button>`).join('')}</div>`);

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
  const cards = (d.groups || []).filter(g => groupOk(sport, g)).map(g => `<div class="card"><h2>${esc(g.name)}</h2>${g.items.map(otherRow).join('')}</div>`).join('');
  const limit = d.limit ? `<p class="note">⏳ ${t('c.limitNote')}</p>` : '';
  const note = limit + (d.needKey ? `<p class="note">📌 ${t(cards ? 'c.needKeyNote' : 'c.needKey')}</p>` : '');
  if (!cards && !note && /Free plans do not have access/i.test(d.errors?.[0] || '')) return extra ? '' : `<div class="empty">${t('apiWindow')}</div>`;
  if (!cards && !note && sport === 'baseball' && !extra) return `<div class="empty">${t('off.baseball')}</div>`;
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

// one discussion thread per match (the server also opens one when a followed match ends)
async function matchThreadCard(key, h, a) {
  let th = null;
  try { th = (await capi('GET', `/posts?ref=${encodeURIComponent('match:' + key)}`)).posts[0] || null; } catch { return ''; }
  if (th) return `<a class="card mthread" href="#/post/${th.id}"><span>💬 <b>${t('mt.open')}</b></span><span class="pcount">${th.replies} ${t('cat.repliesLbl')} ›</span></a>`;
  if (!acct) return '';
  return `<div class="card mthread"><span>💬 ${t('mt.none')}</span><button class="btn" data-mthread="${esc(key)}" data-h="${esc(h.team.displayName)}" data-a="${esc(a.team.displayName)}">${t('mt.create')}</button></div>`;
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
    const pl = x => `<a class="pl" href="#/player/soccer/${esc(league)}/${esc(x.athlete.id)}"><span class="no">${esc(x.jersey)}</span><span class="nm">${esc(x.athlete.displayName)}</span>
      ${x.subbedIn ? `<span class="arr up" title="${t('subIn')}">↑</span>` : ''}${x.subbedOut ? `<span class="arr down" title="${t('subOut')}">↓</span>` : ''}<span class="ps">${esc(x.position?.abbreviation || '')}</span></a>`;
    const starters = r.roster.filter(x => x.starter), subs = r.roster.filter(x => !x.starter);
    return `<div class="card"><h2>${img(r.team.id)} ${esc(r.team.displayName)}${r.formation ? ` · ${esc(r.formation)}` : ''}</h2><div style="padding:0 10px 12px">${pitchHtml(starters, r.formation, league)}</div></div>
      <div class="card"><h2>${t('subs')}</h2>${subs.map(pl).join('')}</div>`;
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

  const k = 'match', mkey = `${league}:${id}`;
  const threadHtml = await matchThreadCard(mkey, h, a).catch(() => '');
  if (threadHtml) html = html.replace('<!--tv-->', '<!--tv-->') + threadHtml;
  const [mvHtml, prHtml] = await Promise.all([motmHtml(mkey, rosters, s).catch(() => ''), predictHtml(mkey, comp, s, h, a).catch(() => '')]);
  html += seg(k, [t('events'), t('stats'), t('lineups'), t('recent'), t('info'), t('c.chat'), t('mvp.tab'), t('pred.tab')])
    + pane(k, 0, evHtml) + pane(k, 1, stHtml) + pane(k, 2, luHtml) + pane(k, 3, recentHtml(j, [h, a])) + pane(k, 4, infoHtml) + pane(k, 5, chatHtml('m-soccer-' + id)) + pane(k, 6, mvHtml) + pane(k, 7, prHtml);
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
function photoFb(img) {
  const st = +img.dataset.st || 0; img.dataset.st = st + 1;
  if (st === 0 && img.dataset.n) wikiPhoto(img.dataset.n, img.dataset.sp || 'soccer').then(u => { if (u) img.src = u; else img.remove(); });
  else img.remove();
}
window.photoFb = photoFb;
const pcol = n => `hsl(${[...String(n)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7)} 42% 40%)`;
const phImg = (src, name, sport) => `<img loading="lazy" src="${esc(src)}" alt="" data-n="${esc(name || '')}" data-sp="${esc(sport || 'soccer')}" onerror="photoFb(this)">`;
// feet/inches and pounds to metric outside English
const unitH = s => { if (LANG === 'en' || !s) return s; const m = /(\d+)'\s*(\d+)?/.exec(s); return m ? `${Math.round((+m[1] * 12 + +(m[2] || 0)) * 2.54)} cm` : s; };
const unitW = s => { if (LANG === 'en' || !s) return s; const m = /(\d+)\s*lbs?/i.exec(s); return m ? `${Math.round(+m[1] * .4536)} kg` : s; };
const hsUrl = (sport, league, id) => `https://a.espncdn.com/i/headshots/${sport === 'soccer' ? 'soccer' : ['basketball', 'hockey', 'football', 'baseball'].includes(sport) ? league : sport}/players/full/${id}.png`;
const pfavBtn = (p, cls = 'pstar') => `<button class="${cls} ${isPFav(p.id, p.sport) ? 'on' : ''}" data-pfav="${esc(p.id)}" data-name="${esc(p.name)}" data-psport="${esc(p.sport)}" data-league="${esc(p.league)}" data-team="${esc(p.team || '')}" aria-label="${t('pl.favs')}">${isPFav(p.id, p.sport) ? '★' : '☆'}</button>`;
function playerCard(x, sub, sport = 'soccer', league = 'all', team = '') {
  const src = x.headshot?.href || (sport === 'soccer' && x.id ? hsUrl('soccer', league, x.id) : '');
  const pic = src ? phImg(src, x.displayName, sport) : '';
  const card = `<a class="pcard p-${posKey(x)}" href="#/player/${esc(sport)}/${esc(league)}/${esc(x.id)}"><div class="pph" style="--pc:${pcol(x.displayName)}"><span class="pin_">${esc(initials(x.displayName))}</span>${pic}${x.jersey ? `<i class="pno">${esc(x.jersey)}</i>` : ''}</div>
    <b class="pnm">${esc(x.displayName)}</b><small>${esc(sub)}</small></a>`;
  return `<div class="pcwrap">${card}${pfavBtn({ id: x.id, name: x.displayName, sport, league, team })}</div>`;
}
const pgrid = list => `<div class="pgrid">${list.join('')}</div>`;


// ---- pitch view: starters placed by position and formation, with faces and shirt numbers ----
const POS_DEPTH = { G: 0, GK: 0, SW: 1, CD: 1, 'CD-R': 1, 'CD-L': 1, RB: 1, LB: 1, RWB: 1.5, LWB: 1.5, DM: 2, CM: 3, 'CM-R': 3, 'CM-L': 3, RM: 3, LM: 3, AM: 4, 'AM-R': 4, 'AM-L': 4, RW: 4.5, LW: 4.5, SS: 4.6, F: 5, CF: 5, 'CF-R': 5, 'CF-L': 5 };
const posDepth = p => { const k = String(p || '').toUpperCase(); if (k in POS_DEPTH) return POS_DEPTH[k]; if (/^G/.test(k)) return 0; if (/DM/.test(k)) return 2; if (/B|D/.test(k)) return 1; if (/AM|W/.test(k)) return 4.4; if (/M/.test(k)) return 3; return 5; };
const posSide = p => { const k = String(p || '').toUpperCase(); const wide = /^[LR](B|WB|M|W)$/.test(k); if (/^L/.test(k) && wide) return -2; if (/^R/.test(k) && wide) return 2; if (/-L$/.test(k) || /^LF$/.test(k)) return -1; if (/-R$/.test(k) || /^RF$/.test(k)) return 1; return 0; };
function pitchHtml(starters, formation, league) {
  const pl = starters.map((x, i) => ({ x, i, d: posDepth(x.position?.abbreviation), side: posSide(x.position?.abbreviation) }));
  pl.sort((a, b) => a.d - b.d || (+a.x.formationPlace || a.i) - (+b.x.formationPlace || b.i));
  let sizes = String(formation || '').split('-').map(Number).filter(n => n > 0);
  if (sizes.reduce((q, n) => q + n, 0) !== pl.length - 1) { // formation missing or odd: group by depth
    const g = { 1: 0, 2: 0, 3: 0, 4: 0 }; for (const p of pl.slice(1)) g[p.d <= 1.5 ? 1 : p.d < 3.5 ? 2 : p.d < 4.7 ? 3 : 4]++;
    sizes = Object.values(g).filter(n => n > 0);
  }
  const rows = [[pl[0]]]; let k = 1;
  for (const n of sizes) { rows.push(pl.slice(k, k + n)); k += n; }
  rows[rows.length - 1].push(...pl.slice(k)); // never lose a player
  const R = rows.length;
  const html = rows.map((row, ri) => {
    const top = R > 1 ? 88 - ri * 76 / (R - 1) : 50;
    row.sort((a, b) => a.side - b.side || a.i - b.i);
    return row.map((p, j) => {
      const left = row.length === 1 ? 50 : 12 + 76 * (j + .5) / row.length, a = p.x.athlete || {};
      const nm = a.shortName || a.displayName || '';
      return `<a class="pp" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%" href="#/player/soccer/${esc(league)}/${esc(a.id)}"><span class="pph" style="--pc:${pcol(a.displayName)}"><span class="pin_">${esc(initials(a.displayName))}</span>${phImg(hsUrl('soccer', league, a.id), a.displayName, 'soccer')}${p.x.jersey ? `<i class="pno">${esc(p.x.jersey)}</i>` : ''}</span><b>${esc(nm)}</b></a>`;
    }).join('');
  }).join('');
  return `<div class="pitch"><i class="pl-box b"></i><i class="pl-box s"></i><i class="pl-arc"></i>${formation ? `<span class="pfm">${esc(formation)}</span>` : ''}${html}</div>`;
}
// the likely starting eleven of a team = its latest line-up
async function predictedXi(id, past) {
  const ev = past?.[0]; if (!ev) return '';
  const j = await get(`${SITE}soccer/all/summary?event=${ev.id}`, 600000).catch(() => null);
  const r = (j?.rosters || []).find(x => String(x.team?.id) === String(id));
  const st = (r?.roster || []).filter(x => x.starter);
  if (st.length < 9) return '';
  const opp = (ev.competitions?.[0]?.competitors || []).find(c => String(c.team?.id) !== String(id))?.team?.displayName || '';
  return `<div class="card"><h2>⭐ ${t('xi.title')}</h2><div class="hint" style="padding:0 14px 8px">${t('xi.note', esc(opp), dshort(ev.date))}</div><div style="padding:0 10px 12px">${pitchHtml(st, r.formation, 'all')}</div></div>`;
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
  const ranks = sportOf(league) === 'soccer' && !pastSeason ? await teamRanks(id, evs, league).catch(() => []) : [];
  const rank = stat('rank')?.value || stat('playoffSeed')?.value;
  const summary = ranks.length ? ranks.slice(0, 2).map(r => t('rankIn', r.rank, r.name)).join(' · ') : rank ? t('rankIn', rank, groups.length > 1 ? group.name : lname(leagueOf(league))) : '';
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

  if (sportOf(league) !== 'soccer') return html + seg('team', [t('fixtures'), t('squad'), t('news.tab'), t('cat.teamForum')]) + pane('team', 0, fx) + pane('team', 1, usRosterHtml(roster, league)) + pane('team', 2, newsCard(await teamNews(), t('news.title'))) + pane('team', 3, await teamForumHtml(league, id));
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
  sq = (await predictedXi(id, evs.past).catch(() => '')) + sq;

  // profile: competitions the club plays in (from its schedule) and the head coach
  const comps = [...new Set([...evs.past, ...evs.live, ...evs.next].map(e => { const sl = leagueOfEvent(e, ''); return LEAGUES.some(l => l.id === sl) ? lname(leagueOf(sl)) : (e.league?.name || e.league?.abbreviation || ''); }).filter(Boolean))];
  const coach = [roster?.coach?.[0]?.firstName, roster?.coach?.[0]?.lastName].filter(Boolean).join(' ');
  const infoRows = [['🏆', t('competitions'), comps.join(', ')], ['🧑‍💼', t('coach'), coach], ['📊', t('th.team'), summary]].filter(r => r[2]);
  const infoPane = ranksCard(ranks) + (infoRows.length ? `<div class="card">${infoRows.map(([ic, kk, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${esc(kk)}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>` : `<div class="empty">${t('noInfo')}</div>`);
  const k = 'team';
  return html + seg(k, [t('fixtures'), t('squad'), t('info'), t('news.tab'), t('cat.teamForum')]) + pane(k, 0, fx) + pane(k, 1, sq) + pane(k, 2, infoPane) + pane(k, 3, newsCard(await teamNews(), t('news.title'))) + pane(k, 4, await teamForumHtml(league, id));
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
  const hero = `<div class="card hero plhero"><div class="plpic" style="--pc:${pcol(p.name)}"><span class="pin_">${esc(initials(p.name))}</span>${phImg(src, p.name, sport)}</div>
    <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(p.name)}</div>
    <div class="st">${[a.displayJersey, pos].filter(Boolean).map(esc).join(' · ')}</div>
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
  const pn = (await newsFor(`"${p.name}" ${p.team}`.trim())) || (LANG === 'en' ? o?.news : null);
  const news = pn?.length ? newsCard(pn, t('news.title')) : '';
  const cmpBtn = `<a class="btn ghost" href="#/compare/${esc(sport)}/${esc(league)}/${esc(id)}" style="display:block;text-align:center;margin-bottom:10px">${t('cmp.btn')}</a>`;
  const career = await careerHtml(sport, league, id).catch(() => '');
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


// ---- Match extras: man of the match vote, score prediction; community: leaderboard, notifications ----
async function motmHtml(key, rosters, st) {
  if (st.cls === 'pre') return `<div class="empty">${t('mvp.hintPre')}</div>`;
  let d = { votes: [], mine: null, total: 0 };
  try { d = await capi('GET', '/motm/' + key); } catch { return `<div class="empty">${t('c.err.network')}</div>`; }
  const n = Object.fromEntries(d.votes.map(v => [String(v.player_id), v.n]));
  const top = d.votes.slice(0, 3).map(v => `<div class="mvtop"><b>${esc(v.name)}</b><small>${esc(v.team || '')}</small><span>${v.n} · ${Math.round(v.n / d.total * 100)}%</span><i style="width:${Math.round(v.n / d.total * 100)}%"></i></div>`).join('');
  const rows = rosters.map(r => `<div class="card"><h2>${img(r.team.id)} ${esc(r.team.displayName)}</h2>${r.roster.map(x => { const id = String(x.athlete.id), mine = d.mine === id;
    return `<div class="mvrow"><span class="no">${esc(x.jersey ?? '')}</span><span class="nm">${esc(x.athlete.displayName)}${x.starter ? '' : ` <small>${t('subs')}</small>`}</span><small>${n[id] || ''}</small>
      <button class="cbtn ${mine ? 'on' : ''}" data-motm="${esc(key)}" data-pid="${esc(id)}">${mine ? t('mvp.voted') : t('mvp.vote')}</button></div>`; }).join('')}</div>`).join('');
  return `<div class="card"><h2>⭐ ${t('mvp.title')}${d.total ? ` · ${t('mvp.total', d.total)}` : ''}</h2>${top || `<div class="empty" style="padding:14px">${t('mvp.none')}</div>`}${acct ? '' : `<div class="form-block"><div class="hint">${t('mvp.login')}</div><a class="btn" href="#/profile" style="text-align:center">${t('c.login')} ›</a></div>`}</div>` + rows;
}
async function predictHtml(key, comp, st, h, a) {
  const [lg, ev] = key.split(':');
  let mine = null;
  if (acct) { try { mine = (await capi('GET', '/predict/mine?m=' + encodeURIComponent(key))).mine; } catch {} }
  const open = st.cls === 'pre' && new Date(comp.date) > new Date();
  const head = `<h2>🎯 ${t('pred.title')}</h2>`;
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
  return communityNav('lb') + `<div class="card"><div class="form-block"><div class="hint">${t('pred.hint')}</div></div></div>` + chips + board + mine;
}
async function viewNotifs() {
  setTitle(t('nt.title'));
  if (!acct) return communityNav('notifs') + authForm();
  let d; try { d = await capi('GET', '/notifs'); } catch (e) { return communityNav('notifs') + `<div class="empty">⚠️ ${esc(errText(e))}</div>`; }
  const txt = i => t('nt.' + i.kind, i.who);
  const html = d.items.length ? `<div class="card">${d.items.map(i => `<a class="lrow ${i.read ? '' : 'unread'}" href="#/post/${i.post_id}"><span class="nm" style="padding:10px 12px">${esc(txt(i))}<small class="hint" style="display:block">“${esc(i.text || '')}” · ${ago(i.created)}</small></span></a>`).join('')}</div>` : `<div class="empty">${t('nt.empty')}</div>`;
  if (d.unread) { capi('POST', '/notifs/read').then(() => { notifCount = 0; notifAt = 0; document.querySelectorAll('.nbadge,.tbadge').forEach(x => x.remove()); pollNotifs(true); }).catch(() => {}); }
  return communityNav('notifs') + html;
}

// ---- news cards (ESPN) and player comparison ----

// news in the app language through the server (Google News headlines); ESPN's English feed only as a fallback
async function newsFor(q) {
  if (!workerBase()) return null;
  try {
    const r = await fetch(`${workerBase()}/api/news?q=${encodeURIComponent(q)}&lang=${LANG === 'ku' ? 'tr' : LANG}`);
    const j = await r.json();
    return (j.items || []).length ? j.items.map(x => ({ headline: x.title, published: x.date, source: x.source, links: { web: { href: x.link } } })) : null;
  } catch { return null; }
}
const newsCard = (items, title) => {
  const rows = (items || []).filter(a => a.headline && (a.links?.web?.href || a.link)).slice(0, 10).map(a => {
    const pic = a.images?.[0]?.url, d = a.published || a.lastModified;
    return `<a class="newsrow" href="${esc(a.links?.web?.href || a.link)}" target="_blank" rel="noopener">${pic ? `<img loading="lazy" src="${esc(pic)}" alt="" onerror="this.remove()">` : '<span class="nph">📰</span>'}<span><b>${esc(a.headline)}</b><small>${a.source ? esc(a.source) + ' · ' : ''}${d ? esc(fmtD(new Date(d).getTime(), { day: 'numeric', month: 'long' })) : ''}</small></span></a>`;
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
  const row = (label, x, y, cmp) => { const nx = num(x), ny = num(y); const wx = cmp && nx > ny, wy = cmp && ny > nx; return `<tr><td class="${wx ? 'win' : ''}">${esc(x ?? '–')}</td><th>${esc(label)}</th><td class="${wy ? 'win' : ''}">${esc(y ?? '–')}</td></tr>`; };
  const info = [[t('pl.age'), A.age, Bp.age, false], [t('pl.height'), unitH(A.displayHeight), unitH(Bp.displayHeight), false], [t('pl.weight'), unitW(A.displayWeight), unitW(Bp.displayWeight), false], [t('pl.nation'), A.citizenship, Bp.citizenship, false]];
  const sa = A.statsSummary?.statistics || [], sb = Object.fromEntries((Bp.statsSummary?.statistics || []).map(x => [x.name, x]));
  const stats = sa.filter(x => sb[x.name]).map(x => [x.shortDisplayName || x.displayName, x.displayValue, sb[x.name].displayValue, true]);
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
  players: pfavs.filter(f => f.sport === 'soccer').map(f => ({ id: f.id, name: f.name })),
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


const otherSportsCards = () => {
  const spCard = `<div class="card"><h2>🏅 ${t('set.sports')}</h2><div class="chipwrap">${SPORTS.filter(x => x[0] !== 'soccer').map(([s, ic, k]) => `<label class="chk"><input type="checkbox" data-sport-vis="${s}" ${sportShown(s) ? 'checked' : ''}><span>${ic} ${t(k)}</span></label>`).join('')}</div></div>`;
  const one = (sp, label) => `<div class="card"><h2>🌍 ${label}</h2><div class="hint" style="padding:0 14px 6px">${t('set.countriesHint')}</div><div class="chipwrap">${['Europe', 'World', ...CTRY_ALL].map(cn => `<label class="chk"><input type="checkbox" data-ctry="${sp}|${cn}" ${(ctryPref[sp] || CTRY_DEFAULT[sp]).includes(cn) ? 'checked' : ''}><span>${esc(ctryName(cn))}</span></label>`).join('')}</div>
    <div class="form-block selrow"><button class="btn ghost" data-ctry-all="${sp}|all">${t('set.all')}</button><button class="btn ghost" data-ctry-all="${sp}|none">${t('set.none')}</button><button class="btn ghost" data-ctry-reset="${sp}">${t('set.reset')}</button></div></div>`;
  return spCard + one('eubasket', t('sp.basketball')) + one('volley', t('sp.volley')) + one('handball', t('sp.handball'));
};
async function viewSettings() {
  setTitle(t('nav.settings'));
  const langCard = `<div class="card"><button class="langcur" data-lang-toggle aria-expanded="false"><span>🌐 ${t('language')}</span><b>${esc(LANGS[LANG_IDX()][1])} ▾</b></button><div class="langs" hidden>${LANGS.map(([c, n]) =>
    `<button class="langbtn ${c === LANG ? 'on' : ''}" data-lang="${c}">${n}</button>`).join('')}</div></div>`;
  return langCard + themeCard() + '' + (isAdminUser() ? modCard() : '') + notifyCard() + otherSportsCards() + `<p class="note" style="text-align:left;padding:0 4px 8px">${t('pickLeaguesNote')}</p>
    <div class="selbar"><button class="btn" data-leagues-all="1">${t('set.all')}</button><button class="btn ghost" data-leagues-all="0">${t('set.none')}</button></div>
    ${GROUPS.map((ls, g) => `<div class="card"><h2>${t('grp.' + g)}<span class="grpact"><button data-grp-all="${g}|1" aria-label="${t('set.all')}">✓</button><button data-grp-all="${g}|0" aria-label="${t('set.none')}">✕</button></span></h2>
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
  if (!acct) return authForm();
  try { acct.user = (await capi('GET', '/me')).user; store.set('acct', acct); } catch {}
  const u = acct.user, me = { username: u.username, role: u.role, color: u.color, fav_id: u.fav?.id, fav_league: u.fav?.league, fav_name: u.fav?.name };
  const swatches = AVATAR_COLORS.map(c => `<button class="swatch ${c === (u.color || hashColor(u.username)) ? 'on' : ''}" style="background:${c}" data-color="${c}" aria-label="${c}"></button>`).join('');
  const favNow = u.fav ? `<div class="favcur">${img(u.fav.id, 'mid', u.fav.league)}<a href="#/team/${esc(u.fav.league)}/${esc(u.fav.id)}"><b>${esc(u.fav.name)}</b></a><button class="cbtn txt" data-fav-clear>✕ ${t('c.remove')}</button></div>` : `<div class="hint">${t('c.noFavTeam')}</div>`;
  const mine = favs.slice(0, 12).map(f => `<button class="tcell" data-pick-team data-id="${esc(f.id)}" data-name="${esc(f.name)}" data-league="${esc(f.league)}">${img(f.id, 'mid', f.league)}<span>${esc(f.name)}</span></button>`).join('');
  return `<div class="card profhead">${avatar(me, 64)}<div><b style="font-size:18px">${esc(u.username)}</b>${u.role === 'admin' ? ' <i class="adminbadge">ADMIN</i>' : ''}
      <div><a href="#/user/${encodeURIComponent(u.username)}" style="color:var(--accent);font-size:13px">${t('c.publicView')} ›</a></div></div></div>
    ${u.badges?.length ? `<div class="card">${badgeRow(u.badges)}</div>` : ''}
    <div class="card"><h2>🎨 ${t('c.avatarColor')}</h2><div class="swatches">${swatches}</div></div>
    <div class="card"><h2>📝 ${t('c.bio')}</h2><div class="form-block"><textarea id="pf-bio" maxlength="140" rows="3" placeholder="${t('c.bioPh')}">${esc(u.bio || '')}</textarea>
      <button class="btn" data-profile-save>${t('c.save')}</button><div class="hint" id="pf-msg"></div></div></div>
    <div class="card"><h2>⭐ ${t('c.favTeam')}</h2><div class="form-block">${favNow}
      ${mine ? `<div class="hint">${t('c.fromFavs')}</div><div class="tgrid">${mine}</div>` : ''}
      <div class="hint">${t('c.searchTeam')}</div><input id="pf-q" type="search" autocomplete="off" autocapitalize="off" placeholder="${esc(t('search.ph'))}"><div id="pf-teams" class="tgrid"></div></div></div>
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
    ${u.badges?.length ? `<div class="card">${badgeRow(u.badges)}</div>` : ''}
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

let pfTimer = 0;
document.addEventListener('input', e => {
  if (e.target.id !== 'pf-q') return;
  clearTimeout(pfTimer); const v = e.target.value.trim(), box = document.getElementById('pf-teams');
  if (v.length < 2) { box.innerHTML = ''; return; }
  pfTimer = setTimeout(async () => {
    box.innerHTML = '<div class="hint">…</div>';
    const j = await get(`${ESPN_Q}query=${encodeURIComponent(v)}&limit=12&type=team`, 120000).catch(() => ({}));
    const list = ((j.results || []).find(r => r.type === 'team')?.contents || []).map(c => ({ id: uidId(c.uid, 't'), name: c.displayName, sport: c.sport, league: c.defaultLeagueSlug || '', sub: c.subtitle || '' }))
      .filter(x => x.id && x.league && (x.sport === 'soccer' || LEAGUES.some(l => l.id === x.league)));
    if (document.getElementById('pf-q')?.value.trim() !== v) return;
    box.innerHTML = list.length ? list.map(x => `<button class="tcell" data-pick-team data-id="${esc(x.id)}" data-name="${esc(x.name)}" data-league="${esc(x.league)}">${img(x.id, 'mid', x.league)}<span>${esc(x.name)}<small class="hint" style="display:block">${esc(x.sub)}</small></span></button>`).join('') : `<div class="hint">${t('search.none')}</div>`;
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
      if (!isFav(id, league)) { favs = [...favs, { id, name, league }]; store.set('favs', favs); if (notif.url && notif.key) syncNotify().catch(() => {}); }
    }
    acct.user = r.user; store.set('acct', acct);
    if (!ps) render(true);
  } catch (err) { if (msg) msg.textContent = '❌ ' + errText(err); else alert(errText(err)); }
});

// ---------- forum
let notifCount = 0, notifAt = 0;
const communityNav = active => `<div class="seg"><a data-replace href="#/forum" class="${active === 'forum' ? 'on' : ''}">💬 ${t('cat.topics')}</a><a data-replace href="#/leaderboard" class="${active === 'lb' ? 'on' : ''}">🏆 ${t('lb.tab')}</a><a data-replace href="#/notifs" class="${active === 'notifs' ? 'on' : ''}">🔔 ${t('nt.title')}${notifCount ? `<i class="nbadge">${notifCount}</i>` : ''}</a></div>`;
async function pollNotifs(force) {
  if (!acct || (!force && Date.now() - notifAt < 45000)) return;
  notifAt = Date.now();
  try { notifCount = (await capi('GET', '/notifs?count=1')).unread || 0; } catch { return; }
  const tab = document.querySelector('#tabs a[data-tab="forum"]'); if (!tab) return;
  tab.querySelector('.tbadge')?.remove();
  if (notifCount) tab.insertAdjacentHTML('beforeend', `<i class="tbadge">${notifCount > 9 ? '9+' : notifCount}</i>`);
}
const FORUM_CATS = [['genel', '💬'], ['superlig', '🇹🇷'], ['avrupa', '🌍'], ['transfer', '🔁'], ['tahmin', '🎯'], ['taktik', '🧠'], ['nostalji', '📼'], ['basket', '🏀'], ['tenis', '🎾'], ['f1', '🏎️'], ['diger', '🏐'], ['takim', '🛡️'], ['oneri', '🛠️']];
const FORUM_SECTIONS = [['general', ['genel', 'oneri']], ['football', ['superlig', 'avrupa', 'transfer', 'tahmin', 'taktik', 'nostalji']], ['other', ['basket', 'tenis', 'f1', 'diger']], ['teams', ['takim']]];
const catName = k => t('cat.' + k);
const catIcon = k => (FORUM_CATS.find(c => c[0] === k) || ['', '💬'])[1];
const catChip = k => `<a class="catchip" href="#/forum/${k}">${catIcon(k)} ${esc(catName(k))}</a>`;
const refLink = p => { const mm = /^match:([^:]+):(\d+)$/.exec(p.ref || ''); if (mm) return `<a class="reflink" href="#/match/${esc(mm[1])}/${esc(mm[2])}" title="${t('mt.goto')}">⚽</a> `; const m = /^team:([^:]+):(\d+)$/.exec(p.ref || ''); return m ? `<a class="reflink" href="#/team/${esc(m[1])}/${esc(m[2])}" title="${t('cat.openTeam')}">🛡️</a> ` : ''; };
const postRow = (p, showCat) => `<div class="lrow postrow trow" data-href="#/post/${p.id}"><div class="pbody"><a class="ptitle" href="#/post/${p.id}"><b>${p.pinned ? '<span class="pin">📌</span>' : ''}${esc(p.title)}</b></a>
  <small>${refLink(p)}${showCat ? `${catIcon(p.category)} ${esc(catName(p.category))} · ` : ''}${nameHtml(p)} · ${ago(p.last || p.created)}</small></div><div class="tstats"><span>💬 ${p.replies}</span><span>👁 ${p.views || 0}</span></div></div>`;
const loginCard = () => `<div class="card"><div class="form-block"><div class="hint">${t('c.needLogin')}</div><a class="btn" href="#/profile" style="text-align:center">${t('c.login')} ›</a></div></div>`;
const retryBox = e => `<div class="empty">⚠️ ${esc(errText(e))}<br><button class="btn" data-retry style="margin-top:12px">${t('refresh')}</button></div>`;
async function viewForum(cat, sort) {
  setTitle(t('nav.forum'));
  if (!FORUM_CATS.some(c => c[0] === cat)) return viewForumHome();
  sort = ['active', 'new', 'top'].includes(sort) ? sort : 'active';
  let posts;
  try { posts = (await capi('GET', `/posts?cat=${cat}&sort=${sort}`)).posts; } catch (e) { return communityNav('forum') + retryBox(e); }
  const composer = cat === 'takim' ? `<div class="card"><div class="form-block"><div class="hint">${t('cat.teamHint')}</div><a class="btn ghost" href="#/search" style="text-align:center">${t('search.title')} ›</a></div></div>`
    : acct ? `<div class="card"><h2>✍️ ${t('c.newTopic')} · ${catIcon(cat)} ${esc(catName(cat))}</h2><div class="form-block">
        <input id="p-title" maxlength="100" placeholder="${esc(t('cat.' + cat + '.ph'))}"><textarea id="p-body" maxlength="2000" rows="4" placeholder="${t('c.text')}"></textarea>
        <button class="btn" data-post-send="${cat}">${t('c.post')}</button><div class="hint" id="p-msg"></div></div></div>` : loginCard();
  const sorts = `<div class="sortbar">${[['active', 'cat.sortActive'], ['new', 'cat.sortNew'], ['top', 'cat.sortTop']].map(([k, l]) => `<a data-replace href="#/forum/${cat}/${k}" class="${sort === k ? 'on' : ''}">${t(l)}</a>`).join('')}</div>`;
  const list = posts.length ? `<div class="card">${posts.map(p => postRow(p, false)).join('')}</div>` : `<div class="empty">${t('c.noPosts')}</div>`;
  return communityNav('forum') + scrollBar(`<div class="catbar"><a class="catchip" href="#/forum">‹ ${t('cat.all')}</a>${FORUM_CATS.filter(c => c[0] !== cat).map(c => catChip(c[0])).join('')}</div>`)
    + `<div class="card"><div class="form-block"><b style="font-size:17px">${catIcon(cat)} ${esc(catName(cat))}</b><div class="hint">${esc(t('cat.' + cat + '.d'))}</div></div></div>` + composer + sorts + list;
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
  return communityNav('forum') + `<div class="card"><div class="form-block"><b style="font-size:17px">${t('cat.welcome')}</b><div class="tstats" style="margin:2px 0 4px"><span>📚 ${nT} ${t('cat.topicsLbl')}</span><span>💬 ${nR} ${t('cat.repliesLbl')}</span></div><div class="hint">${t('cat.rules')}</div></div></div>` + sections + hot;
}
async function teamForumHtml(league, id) {
  const ref = `team:${league}:${id}`;
  let posts = [];
  try { posts = (await capi('GET', `/posts?cat=takim&ref=${encodeURIComponent(ref)}&sort=active`)).posts; } catch { return `<div class="empty">⚠️ ${t('c.err.network')}</div>`; }
  const composer = acct ? `<div class="card"><h2>✍️ ${t('c.newTopic')}</h2><div class="form-block"><input id="p-title" maxlength="100" placeholder="${t('c.title')}"><textarea id="p-body" maxlength="2000" rows="3" placeholder="${t('c.text')}"></textarea>
      <button class="btn" data-post-send="takim" data-ref="${esc(ref)}">${t('c.post')}</button><div class="hint" id="p-msg"></div></div></div>` : loginCard();
  return composer + (posts.length ? `<div class="card">${posts.map(p => postRow(p, false)).join('')}</div>` : `<div class="empty">${t('cat.noTeamPosts')}</div>`);
}

const BADGE_ICON = { admin: '🛡️', weekly: '🏆', sharp: '🎯', writer: '✍️', chatty: '💬', veteran: '🎖️' };
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
    <div class="card"><div class="form-block"><b style="font-size:17px">${esc(post.title)}</b><small class="hint">${refLink(post)}${nameHtml(post)} · ${ago(post.created)} · 👁 ${post.views || 0}${post.pinned ? ' · 📌' : ''}</small>
    <div class="ptext">${esc(post.body)}</div><span class="cact">${isAdminUser() ? `<button class="cbtn txt" data-cact="pin" data-kind="post" data-id="${post.id}" data-pinned="${post.pinned ? 0 : 1}">📌 ${post.pinned ? t('cat.unpin') : t('cat.pin')}</button>` : ''}${likeBtn('post', post)}${delBtn('post', post.id, post.username)}${modBtns(post.username, 'post', post.id)}</span></div></div>
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
function paintProfileTab() {
  const ti = document.querySelector('#tabs a[data-tab="profile"] .ti'); if (!ti) return;
  if (!acct) { if (ti.dataset.av) { ti.innerHTML = ti.dataset.icon; delete ti.dataset.av; } return; }
  if (!ti.dataset.icon) ti.dataset.icon = ti.innerHTML;
  ti.dataset.av = '1'; ti.innerHTML = `<i class="tav" style="background:${esc(acct.user.color || hashColor(acct.user.username))}">${esc(String(acct.user.username)[0].toUpperCase())}</i>`;
}
const afterRender = () => {
  paintProfileTab();
  pollNotifs();
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
      const r = await capi('POST', '/posts', { title: document.getElementById('p-title').value, body: document.getElementById('p-body').value, category: ps.dataset.postSend, ref: ps.dataset.ref });
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
  leagues: viewLeagues, league: viewLeague, tff: viewTffMatch, forum: viewForum, post: viewPost, player: viewPlayer, search: viewSearch, leaderboard: viewLeaderboard, notifs: viewNotifs, compare: viewCompare, profile: viewProfile, user: viewUser,
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
// pages come back instantly from memory and refresh in the background; scroll position is restored on back
const pageCache = new Map(), scrollMap = {};
let navBack = false;
const cacheable = r => !['profile', 'settings', 'notifs', 'search', 'compare'].includes(r);
const pkey = () => [location.hash, curSport, LANG, acct?.user?.id || 0].join('|');
addEventListener('popstate', () => { navBack = true; });
{ let tick = 0; addEventListener('scroll', () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; scrollMap[location.hash] = scrollY; }); }, { passive: true }); }
const topbar = on => { const b = document.getElementById('topbar'); if (b) b.classList.toggle('on', on); };
async function render(silent = false) {
  const [r, ...args] = (location.hash.replace(/^#\/?/, '') || 'matches').split('/');
  const route = routes[r] ? r : 'matches';
  if (['matches', 'favs', 'leagues', 'settings'].includes(route)) lastTab = route;
  if (['league', 'table'].includes(route)) lastTab = 'leagues';
  if (['forum', 'post', 'user', 'leaderboard', 'notifs'].includes(route)) lastTab = 'forum';
  if (route === 'profile') lastTab = 'profile';
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === lastTab));
  $('#back').hidden = !['match', 'team', 'league', 'table', 'tff', 'post', 'user', 'player', 'search', 'compare'].includes(route);
  $('#hlogo').hidden = !$('#back').hidden;
  const tok = ++renderTok;
  let instant = null;
  if (!silent) {
    // a different match/team opens on its first tab
    if (location.hash !== lastHash) { delete segState.match; delete segState.team; delete segState.player; }
    lastHash = location.hash;
    const hit = cacheable(route) && pageCache.get(pkey());
    if (hit && Date.now() - hit.t < 600000) {
      instant = hit; app.classList.add('still'); app.innerHTML = hit.html; setTitle(hit.title); afterRender();
      scrollTo(0, navBack ? scrollMap[location.hash] || 0 : 0);
    } else app.innerHTML = SKELETON;
    navBack = false;
    topbar(true);
  }
  try {
    const html = await routes[route](...args);
    if (tok !== renderTok) return;
    topbar(false);
    if (cacheable(route)) { pageCache.set(pkey(), { html, t: Date.now(), title: $('#title').textContent }); if (pageCache.size > 40) pageCache.delete(pageCache.keys().next().value); }
    const sig = location.hash + html.replace(/ data-t="\d+"/g, '');
    if (instant && html === instant.html) { lastSig = sig; return; } // nothing changed since the cached copy
    if (silent && sig === lastSig) return;
    lastSig = sig;
    const keep = silent || !!instant;
    app.classList.toggle('still', keep); // entrance animation only for real page changes, not for the 5-second refresh
    const y = scrollY;
    const prevChat = (() => { const n = document.querySelector('.chat[data-room]'); return n ? { node: n, focus: n.contains(document.activeElement) } : null; })();
    const swap = () => {
      app.innerHTML = html;
      keepChat(prevChat);
      afterRender();
      const on = document.querySelector('.datebar a.on');
      if (on) on.parentElement.scrollLeft = on.offsetLeft - (on.parentElement.clientWidth - on.offsetWidth) / 2;
      scrollTo(0, keep ? y : 0);
    };
    // a soft cross-fade between pages where the browser supports it
    if (!keep && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { try { await document.startViewTransition(swap).updateCallbackDone; } catch { swap(); } } else swap();
  } catch (e) {
    topbar(false);
    if (tok !== renderTok || silent) return;
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
    const ids = la ? GROUPS.flat().map(l => l.id) : GROUPS[+ga.dataset.grpAll.split('|')[0]].map(l => l.id), on = (la ? la.dataset.leaguesAll : ga.dataset.grpAll.split('|')[1]) === '1';
    enabled = on ? [...new Set([...enabled, ...ids])] : enabled.filter(x => !ids.includes(x)); store.set('leagues', enabled); render(true); return;
  }
  if (ca) { const [sp, mode] = ca.dataset.ctryAll.split('|'); ctryPref[sp] = mode === 'all' ? ['Europe', 'World', ...CTRY_ALL] : []; store.set('ctry', ctryPref); render(true); return; }
  const cr = e.target.closest('[data-ctry-reset]');
  if (cr) { delete ctryPref[cr.dataset.ctryReset]; store.set('ctry', ctryPref); render(true); return; }
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
    if (notif.url && notif.key) syncNotify().catch(() => {});
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
  if (e.target.dataset?.sportVis) {
    const on = new Set(sportsOn || SPORTS.map(x => x[0])); e.target.checked ? on.add(e.target.dataset.sportVis) : on.delete(e.target.dataset.sportVis); on.add('soccer');
    sportsOn = [...on]; store.set('sportsOn', sportsOn); if (!sportShown(curSport)) { curSport = 'soccer'; store.set('sport', curSport); } return;
  }
  if (e.target.dataset?.ctry) {
    const [sp, cn] = e.target.dataset.ctry.split('|'), cur = new Set(ctryPref[sp] || CTRY_DEFAULT[sp]); e.target.checked ? cur.add(cn) : cur.delete(cn);
    ctryPref[sp] = [...cur]; store.set('ctry', ctryPref); return;
  }
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
