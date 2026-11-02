// Grafondex Live Score — app logic (texts come from i18n.js via t())
// site.web.api is the host espn.com itself uses; site.api.espn.com turns real browsers away ("Access Denied")
const SITE = 'https://site.web.api.espn.com/apis/site/v2/sports/';
const ESPN = SITE + 'soccer/'; // soccer-wide endpoints (soccer/all/…)
const HOUR = 3600000;
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
const hm = iso => new Date(iso).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit' });
const dshort = iso => fmtD(iso, { day: 'numeric', month: 'short' });
// team ids are only unique within a sport (NBA team 19 ≠ a football club 19)
const isFav = (id, league) => favs.some(f => f.id == id && sportOf(f.league) === sportOf(league));
const scoreOf = c => (c.score && typeof c.score === 'object') ? c.score.displayValue : c.score;
const setTitle = s => { $('#title').textContent = s; };

function status(st, league) {
  const ty = st?.type || {}, n = ty.name;
  const noScore = ['STATUS_POSTPONED', 'STATUS_CANCELED', 'STATUS_SCHEDULED'].includes(n) || ty.state === 'pre';
  const us = sportOf(league) !== 'soccer';
  // US sports show the period as well ("Q3 5:21", "2nd 10:00"); finals after overtime keep "/OT"
  if (ty.state === 'in') return { cls: 'live', txt: n === 'STATUS_HALFTIME' ? t('st.HT') : (us ? ty.shortDetail : (st.displayClock || ty.shortDetail)), show: true };
  if (us && ty.state === 'post' && n !== 'STATUS_POSTPONED' && n !== 'STATUS_CANCELED') return { cls: 'post', txt: t('st.FT') + ((ty.shortDetail || '').match(/\/(\d?OT|SO)/)?.[0] || ''), show: true };
  const map = { STATUS_FULL_TIME: 'st.FT', STATUS_FINAL: 'st.FT', STATUS_FINAL_AET: 'st.AET', STATUS_FINAL_PEN: 'st.PEN', STATUS_POSTPONED: 'st.PPD', STATUS_CANCELED: 'st.CANC', STATUS_ABANDONED: 'st.ABD' };
  if (ty.state === 'post' || n === 'STATUS_POSTPONED' || n === 'STATUS_CANCELED') return { cls: 'post', txt: t(map[n] || 'st.FT'), show: !noScore };
  return { cls: 'pre', txt: null, show: false };
}

function sides(comp) {
  const cs = comp.competitors || [];
  return [cs.find(x => x.homeAway === 'home') || cs[0], cs.find(x => x.homeAway === 'away') || cs[1]];
}

function matchRow(ev, league, withDate = false, tv = '') {
  const comp = ev.competitions[0];
  const [h, a] = sides(comp);
  const s = status(ev.status || comp.status, league);
  // score sits on the team's own line so long (wrapped) names stay aligned
  const team = c => `<div class="tm ${s.show && c.winner ? 'win' : ''}">${img(c.team.id, '', league)}<span class="tn">${esc(c.team.displayName || c.team.shortDisplayName)}${isFav(c.team.id, league) ? ' <span class="star">★</span>' : ''}</span><b class="ts ${s.cls}">${s.show ? esc(scoreOf(c)) : ''}</b></div>`;
  const comp_ = withDate ? (LEAGUES.some(l => l.id === league) ? lname(leagueOf(league)) : (ev.league?.name || ev.league?.abbreviation)) : '';
  return `<a class="match" href="#/match/${league}/${ev.id}">
    <div class="mtime ${s.cls}">${withDate ? `<small>${dshort(ev.date)}</small>` : ''}${esc(s.txt ?? hm(ev.date))}${tv ? `<small class="tv">📺 ${esc(tv.replace('beIN SPORTS ', 'beIN '))}</small>` : ''}</div>
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

// ---- Matches tab ----
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

  // ESPN groups days by US time, so the previous US day can hold late European-time games
  const days = [ymd(addDays(d, -1)), key];
  const [res, tvItems, ztk] = await Promise.all([
    Promise.allSettled(enabled.filter(l => !isTff(l)).flatMap(l => days.map(day =>
      get(`${api(l)}/scoreboard?dates=${day}`).then(j => ({ l, events: j.events || [] }))))),
    tvList(isoDay(d)),
    enabled.includes('tur.cup') && workerBase() ? ztkData().catch(() => null) : null,
  ]);
  const tvOf = ev => { const [h, a] = sides(ev.competitions[0]); return tvItems.length ? tvFor(tvItems, ev.date, h.team.displayName, a.team.displayName) : ''; };
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
  if (res.length && res.every(r => r.status === 'rejected')) throw new Error(t('noConn'));
  let html = bar;
  const byDate = (x, y) => new Date(x.date) - new Date(y.date);
  if (favRows.length) {
    favRows.sort((x, y) => byDate(x[0], y[0]));
    html += `<div class="card"><h2>${t('myFavs')}</h2>${favRows.map(([e, l]) => matchRow(e, l, false, tvOf(e))).join('')}</div>`;
  }
  const head = L => `<h2><a class="lglink" href="#/league/${L.id}">${lgIcon(L.id)}<span class="lgname">${esc(lname(L))}<small>${esc(regionName(L.id))}</small></span></a>${L.table ? `<a href="#/league/${L.id}/puan">${t('table')}</a>` : ''}</h2>`;
  for (const L of LEAGUES) {
    if (isTff(L.id)) {
      if (cupToday.length) html += `<div class="card">${head(L)}${cupToday.sort((x, y) => x.iso.localeCompare(y.iso)).map(tffRow).join('')}</div>`;
      continue;
    }
    const evs = byLeague[L.id];
    if (!evs) continue;
    evs.sort(byDate);
    html += `<div class="card">${head(L)}${evs.map(e => matchRow(e, L.id, false, tvOf(e))).join('')}</div>`;
  }
  if (!seen.size && !cupToday.length) html += `<div class="empty">${t('noMatchesDay')}<br><br><a href="#/settings" style="color:var(--accent)">${t('pickLeagues')}</a></div>`;
  return html;
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
    <div class="st ${s.cls}">${s.cls === 'pre' ? dshort(comp.date) : esc(s.txt)}</div></div>
    ${sideHtml(a)}</div><!--tv--></div>`;

  // events as a timeline: home on the left, away on the right, minute in the middle
  const homeId = h.team.id;
  const evs = (j.keyEvents || []).filter(e => e.team && /Goal|Card|Substitution|Penalty/.test(e.type?.text || ''))
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
  const tvTr = tvFor(await tvList(trDay(comp.date)), comp.date, h.team.displayName, a.team.displayName);
  const tv = [...new Set([...(j.broadcasts || []), ...(comp.broadcasts || [])].map(b => b.media?.shortName || b.media?.name || b.names?.[0]).filter(Boolean))];
  const ref = (gi.officials || []).map(o => o.displayName || o.fullName).filter(Boolean);
  const infoRows = [
    ['📅', t('date'), new Date(comp.date).toLocaleString(LOCALE(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
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
  html += seg(k, [t('events'), t('stats'), t('lineups'), t('recent'), t('info')])
    + pane(k, 0, evHtml) + pane(k, 1, stHtml) + pane(k, 2, luHtml) + pane(k, 3, recentHtml(j, [h, a])) + pane(k, 4, infoHtml);
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
  const tvTr = tvFor(await tvList(trDay(comp.date)), comp.date, h.team.displayName, a.team.displayName);
  let html = `<div class="card hero"><div class="row">${side(h)}
    <div class="mid"><div class="sc">${s.show ? `${esc(scoreOf(h))} - ${esc(scoreOf(a))}` : esc(hm(comp.date))}</div>
    <div class="st ${s.cls}">${s.cls === 'pre' ? dshort(comp.date) : esc(s.txt)}</div></div>
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

  return html + seg('match', [t('score'), t('stats'), t('leaders'), t('info')])
    + pane('match', 0, periodHtml) + pane('match', 1, stHtml) + pane('match', 2, ldHtml) + pane('match', 3, infoHtml);
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

// ---- Team page ----
// "all" covers every competition (league, European cups, friendlies)
async function teamEvents(id, league) {
  const soccer = sportOf(league) === 'soccer';
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

// NBA rosters are one flat list; NHL/NFL come grouped ("Centers", "offense", …)
function usRosterHtml(roster) {
  const ath = roster?.athletes || [];
  const groups = ath[0]?.items ? ath.filter(g => g.items?.length).map(g => [g.position, g.items]) : [['', ath]];
  const pl = x => `<div class="pl"><span class="no">${esc(x.jersey ?? '')}</span><span class="nm">${esc(x.displayName)}</span>
    <span class="ps">${esc(x.position?.abbreviation || '')}${x.age ? ' · ' + t('age', x.age) : ''}</span></div>`;
  const label = s => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
  const html = groups.map(([g, list]) => `<div class="card">${g ? `<h2>${esc(label(g))} (${list.length})</h2>` : ''}${[...list].sort((x, y) => (+x.jersey || 999) - (+y.jersey || 999)).map(pl).join('')}</div>`).join('');
  return html || `<div class="empty">${t('noSquad')}</div>`;
}

async function viewTeam(league, id) {
  // ESPN's team-info endpoint is closed to browsers, so name, rank and record come from the standings
  const [table, roster, evs] = await Promise.all([
    get(`${apiSt(league)}/standings`, 120000).catch(() => null),
    get(`${api(league)}/teams/${id}/roster`, 300000).catch(() => null),
    teamEvents(id, league),
  ]);
  const groups = table?.children || [];
  const group = groups.find(g => g.standings?.entries?.some(e => e.team.id == id));
  const entry = group?.standings.entries.find(e => e.team.id == id);
  const stat = n => entry?.stats.find(s => s.name === n);
  const name = entry?.team.displayName || roster?.team?.displayName || favs.find(f => f.id == id)?.name || t('th.team');
  setTitle(name);
  const fav = isFav(id, league);
  const rank = stat('rank')?.value || stat('playoffSeed')?.value;
  const summary = rank ? t('rankIn', rank, groups.length > 1 ? group.name : lname(leagueOf(league))) : '';
  const rec = stat('overall')?.displayValue;
  let html = `<div class="card hero">${img(id, 'big', league)}<div style="font-size:20px;font-weight:700;margin-top:8px">${esc(name)}</div>
    <div class="st">${esc(summary)}${rec ? ' · ' + esc(rec) + (sportOf(league) === 'soccer' ? ' ' + t('wdl') : '') : ''}</div>
    <button class="favbtn ${fav ? 'on' : ''}" data-fav="${id}" data-name="${esc(name)}" data-league="${league}">${fav ? t('inFavs') : t('addFav')}</button></div>`;

  const rows = (list, withDate) => list.map(e => matchRow(e, leagueOfEvent(e, league), withDate)).join('');
  const fx = (evs.live.length ? `<div class="card"><h2>${t('live')}</h2>${rows(evs.live, true)}</div>` : '')
    + (evs.past.length ? `<div class="card"><h2>${t('recentMatches')}</h2>${rows(evs.past.slice(0, 15), true)}</div>` : '')
    + (evs.next.length ? `<div class="card"><h2>${t('upcoming')}</h2>${rows(evs.next.slice(0, 10), true)}</div>` : '')
    || `<div class="empty">${t('noMatches')}</div>`;

  if (sportOf(league) !== 'soccer') return html + seg('team', [t('fixtures'), t('squad')]) + pane('team', 0, fx) + pane('team', 1, usRosterHtml(roster));
  const POS = [['Goalkeeper', 'pos.G'], ['Defender', 'pos.D'], ['Midfielder', 'pos.M'], ['Forward', 'pos.F']];
  const ath = roster?.athletes || [];
  const pl = x => `<div class="pl"><span class="no">${esc(x.jersey ?? '')}</span><span class="nm">${esc(x.displayName)}</span>
    <span class="ps">${x.age ? t('age', x.age) : ''}${x.citizenship ? ' · ' + esc(x.citizenship) : ''}</span></div>`;
  const byNo = (x, y) => (+x.jersey || 99) - (+y.jersey || 99);
  let sq = POS.map(([k, label]) => {
    const g = ath.filter(x => x.position?.name === k).sort(byNo);
    return g.length ? `<div class="card"><h2>${t(label)} (${g.length})</h2>${g.map(pl).join('')}</div>` : '';
  }).join('');
  const other = ath.filter(x => !POS.some(([k]) => k === x.position?.name));
  if (other.length) sq += `<div class="card"><h2>${t('other')}</h2>${other.map(pl).join('')}</div>`;
  if (!sq) sq = `<div class="empty">${t('noSquad')}</div>`;

  const k = 'team';
  return html + seg(k, [t('fixtures'), t('squad')]) + pane(k, 0, fx) + pane(k, 1, sq);
}

// ---- Favourites ----
async function viewFavs() {
  setTitle(t('nav.favs'));
  if (!favs.length) return `<div class="empty">${t('noFavs')}</div>`;
  const all = await Promise.all(favs.map(f => teamEvents(f.id, f.league).then(e => ({ f, e })).catch(() => ({ f, e: { past: [], live: [], next: [] } }))));
  return all.map(({ f, e }) => {
    const rows = [...e.live, ...e.past.slice(0, 1), ...e.next.slice(0, 2)].map(ev => matchRow(ev, leagueOfEvent(ev, f.league), true)).join('');
    return `<div class="card"><h2>${img(f.id, '', f.league)} <span style="color:var(--text);font-size:14px">${esc(f.name)}</span><a href="#/team/${f.league}/${f.id}">${t('teamLink')}</a></h2>${rows || `<div class="empty" style="padding:16px">${t('noMatch')}</div>`}</div>`;
  }).join('');
}

// ---- Leagues: list + one page per league ----
const LTABS = [['fikstur', 'fixtures'], ['puan', 'table'], ['gol', 'tab.goals'], ['asist', 'tab.assists'], ['takim', 'tab.teams']];

async function viewLeagues() {
  setTitle(t('nav.leagues'));
  const row = L => `<div class="lrow"><a href="#/league/${L.id}">${lgIcon(L.id)}<span class="nm">${esc(lname(L))}${regionLine(L.id)}</span><span class="go">›</span></a>
    <button class="pin ${pinned.includes(L.id) ? 'on' : ''}" data-pin="${L.id}" aria-label="${t('pin')}">${pinned.includes(L.id) ? '★' : '☆'}</button></div>`;
  const pins = LEAGUES.filter(L => pinned.includes(L.id));
  return (pins.length ? `<div class="card"><h2>${t('pinned')}</h2>${pins.map(row).join('')}</div>` : '')
    + GROUPS.map((ls, g) => `<div class="card"><h2>${t('grp.' + g)}</h2>${ls.map(row).join('')}</div>`).join('');
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

async function standingsHtml(league) {
  const j = await get(`${apiSt(league)}/standings`, 120000);
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
  const body = tab === 'puan' ? await standingsHtml(league)
    : tab === 'gol' || tab === 'asist' ? await leadersHtml(league, tab)
    : tab === 'takim' ? await teamsHtml(league)
    : await fixturesHtml(league, start);
  return head + segHtml + body;
}

// ---- Turkish sources through the user's own Cloudflare server (TFF + beIN) ----
const workerBase = () => (notif.url || '').replace(/\/$/, '');
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
  // TFF gives goal minutes; cards and substitutions come without minutes and go last
  const items = [];
  for (const [side, ev] of [['home', m.homeEvents], ['away', m.awayEvents]]) {
    for (const g of ev.goals) items.push({ side, kind: 'goal', name: esc(tffName(g.name)), min: g.minute ? g.minute + "'" : '' });
    ev.in.forEach((p, k) => items.push({ side, kind: 'sub', name: esc(tffName(p)), out: esc(tffName(ev.out[k] || '')), min: '' }));
    for (const c of ev.cards) items.push({ side, kind: 'yellow', name: esc(tffName(c)), min: '' });
  }
  items.sort((a, b) => (parseInt(a.min) || 999) - (parseInt(b.min) || 999));
  const evHtml = items.length ? timelineHtml(items) : `<div class="empty">${played ? t('noEvents') : t('notStarted')}</div>`;
  const info = [
    ['📅', t('date'), m.iso ? new Date(m.iso).toLocaleString(LOCALE(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : m.date],
    ['🏆', t('competition'), m.org],
    ['🏟️', t('venue'), tffName(m.stadium)],
    ...(m.referees || []).map(r => ['🧑‍⚖️', t('role.' + r.role), tffName(r.name)]),
  ].filter(r => r[2]);
  const infoHtml = `<div class="card">${info.map(([ic, k, v]) => `<div class="inforow"><span class="ic">${ic}</span><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>`;
  return html + seg('match', [t('events'), t('info')]) + pane('match', 0, evHtml) + pane('match', 1, infoHtml);
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
function tvFor(items, iso, home, away) {
  const [h, mi] = trClock(iso).split(':').map(Number), k = h * 60 + mi;
  const hit = items.find(it => {
    const [a, b] = it.time.split(':').map(Number);
    if (Math.abs(a * 60 + b - k) > 20) return false;
    const [x, y] = it.name.split(' - ');
    return (sameTeam(home, x) && sameTeam(away, y)) || (sameTeam(home, y) && sameTeam(away, x));
  });
  return hit?.ch || '';
}

// ---- Notifications (Cloudflare Worker + ntfy) ----
const NPREFS = ['goal', 'red', 'start', 'ht', 'end'];
let notif = store.get('notify', null);
if (!notif) {
  const rnd = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
  notif = { url: '', key: '', topic: 'grafondex-' + rnd, prefs: { goal: true, red: true, start: true, ht: false, end: true } };
  store.set('notify', notif);
}
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
  app: location.href.split('#')[0],
});

function notifyCard() {
  return `<div class="card"><h2>${t('notifs')}</h2>
    <div class="form-block">
      <label>${t('serverUrl')}<input id="n-url" type="url" placeholder="https://grafondex.….workers.dev" value="${esc(notif.url)}"></label>
      <label>${t('secretKey')}<input id="n-key" type="password" autocomplete="off" value="${esc(notif.key)}"></label>
      <label>${t('topic')}<input id="n-topic" value="${esc(notif.topic)}"></label>
      <div class="hint">${t('ntfyHint')}</div>
    </div>
    ${NPREFS.map(k => `<label class="setrow"><span>${t('np.' + k)}</span><input type="checkbox" data-nprefs="${k}" ${notif.prefs[k] ? 'checked' : ''}></label>`).join('')}
    <div class="form-block"><button class="btn" id="n-save">${t('saveTest')}</button><div class="hint" id="n-msg"></div></div>
  </div>`;
}

async function viewSettings() {
  setTitle(t('nav.settings'));
  const langCard = `<div class="card"><h2>${t('language')}</h2><div class="langs">${LANGS.map(([c, n]) =>
    `<button class="langbtn ${c === LANG ? 'on' : ''}" data-lang="${c}">${n}</button>`).join('')}</div></div>`;
  return langCard + notifyCard() + `<p class="note" style="text-align:left;padding:0 4px 8px">${t('pickLeaguesNote')}</p>
    ${GROUPS.map((ls, g) => `<div class="card"><h2>${t('grp.' + g)}</h2>
    ${ls.map(L => `<label class="setrow">${lgIcon(L.id)}<span>${esc(lname(L))}</span><input type="checkbox" data-league-toggle="${L.id}" ${enabled.includes(L.id) ? 'checked' : ''}></label>`).join('')}</div>`).join('')}
    <div class="card about"><img src="logo.png" alt="Grafondex Live Score"><div class="note">${t('about')}</div></div>`;
}

// ---- router ----
const routes = {
  matches: viewMatches, match: viewMatch, team: viewTeam, favs: viewFavs, settings: viewSettings,
  leagues: viewLeagues, league: viewLeague, tff: viewTffMatch,
  table: l => viewLeague(l || store.get('tableLeague', 'tur.1'), 'puan'),
};
// texts that live in the page shell (bottom bar, header buttons)
function applyStatic() {
  document.documentElement.lang = LANG;
  for (const a of document.querySelectorAll('#tabs a')) a.querySelector('span').textContent = t('nav.' + a.dataset.tab);
  $('#back').setAttribute('aria-label', t('back'));
  $('#refresh').setAttribute('aria-label', t('refresh'));
}
let renderTok = 0, lastTab = 'matches', lastHash = null;
async function render(silent = false) {
  const [r, ...args] = (location.hash.replace(/^#\/?/, '') || 'matches').split('/');
  const route = routes[r] ? r : 'matches';
  if (['matches', 'favs', 'leagues', 'settings'].includes(route)) lastTab = route;
  if (['league', 'table'].includes(route)) lastTab = 'leagues';
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === lastTab));
  $('#back').hidden = !['match', 'team', 'league', 'table', 'tff'].includes(route);
  $('#hlogo').hidden = !$('#back').hidden;
  const tok = ++renderTok;
  if (!silent) {
    app.innerHTML = '<div class="spin"></div>';
    // a different match/team opens on its first tab
    if (location.hash !== lastHash) { delete segState.match; delete segState.team; }
    lastHash = location.hash;
  }
  try {
    const html = await routes[route](...args);
    if (tok !== renderTok) return;
    const y = scrollY;
    app.innerHTML = html;
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
document.addEventListener('click', async e => {
  // tabs and round arrows inside a league page don't pile up in history
  const rl = e.target.closest('a[data-replace]');
  if (rl) { e.preventDefault(); if (!rl.classList.contains('off')) location.replace(rl.getAttribute('href')); return; }
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

applyStatic();
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
