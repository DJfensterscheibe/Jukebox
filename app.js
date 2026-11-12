// ============================================================
//  SONGWUNSCH – gemeinsame Logik (Datenbank + Song-Gruppierung)
// ============================================================

const CFG = window.SONGWUNSCH_CONFIG || {};
export const config = {
  partyName: CFG.partyName || "PARTY",
  cooldownSeconds: Number(CFG.cooldownSeconds ?? 30),
  flameAt: Number(CFG.flameAt ?? 5),
  firebase: CFG.firebase || {}
};
export const MAX_LEN = 80;

// ------------------------------------------------------------
//  Backend: Firebase Realtime Database – oder lokaler Demo-Modus
// ------------------------------------------------------------
export async function initBackend() {
  if (config.firebase && config.firebase.databaseURL) {
    try {
      return await firebaseBackend(config.firebase);
    } catch (e) {
      console.error("Firebase konnte nicht geladen werden:", e);
      throw e;
    }
  }
  return localBackend();
}

async function firebaseBackend(fbConfig) {
  const V = "10.12.2";
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const { getDatabase, ref, push, onValue, update, serverTimestamp, increment } =
    await import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`);
  const app = initializeApp(fbConfig);
  const db = getDatabase(app);
  const reqRef = ref(db, "requests");
  const rootRef = ref(db);
  return {
    demo: false,
    subscribePlayed(cb) {
      return onValue(ref(db, "played"), snap => {
        const val = snap.val() || {};
        cb(Object.entries(val).map(([key, p]) => ({ key, label: String(p.label || ""), artist: String(p.artist || ""), count: Number(p.count) || 0 })));
      }, err => { console.warn("Ranking nicht lesbar (Regeln aktualisiert?)", err); cb([]); });
    },
    // Song als gespielt markieren: Wünsche entfernen + Zähler +1 (in einem Schritt)
    markPlayed(cluster, key, label, artist) {
      const upd = {};
      cluster.ids.forEach(id => (upd["requests/" + id] = null));
      upd["played/" + key + "/label"] = label || cluster.label;
      upd["played/" + key + "/artist"] = artist ?? (cluster.artist || "");
      upd["played/" + key + "/count"] = increment(1);
      return update(rootRef, upd).catch(err => {
        console.warn("Zähler konnte nicht gespeichert werden – entferne nur die Wünsche.", err);
        const u2 = {}; cluster.ids.forEach(id => (u2[id] = null));
        return update(reqRef, u2);
      });
    },
    resetPlayed(keys) {
      if (!keys.length) return Promise.resolve();
      const upd = {};
      keys.forEach(k => (upd["played/" + k] = null));
      return update(rootRef, upd);
    },
    subscribe(cb) {
      return onValue(reqRef, snap => {
        const val = snap.val() || {};
        cb(Object.entries(val).map(([id, r]) => ({ id, text: String(r.text || ""), t: Number(r.t) || 0 })));
      }, err => console.error(err));
    },
    add(text) {
      return push(reqRef, { text, t: serverTimestamp() });
    },
    remove(ids) {
      if (!ids.length) return Promise.resolve();
      const upd = {};
      ids.forEach(id => (upd[id] = null));
      return update(reqRef, upd);
    }
  };
}

function localBackend() {
  const KEY = "songwunsch_demo_requests";
  const PKEY = "songwunsch_demo_played";
  const listeners = new Set();
  const pListeners = new Set();
  const readP = () => { try { return JSON.parse(localStorage.getItem(PKEY) || "{}"); } catch { return {}; } };
  const toList = o => Object.entries(o).map(([key, p]) => ({ key, ...p }));
  const writeP = o => { try { localStorage.setItem(PKEY, JSON.stringify(o)); } catch {} pListeners.forEach(cb => cb(toList(o))); };
  window.addEventListener("storage", e => { if (e.key === PKEY) pListeners.forEach(cb => cb(toList(readP()))); });
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
  const write = list => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
    listeners.forEach(cb => cb(list));
  };
  window.addEventListener("storage", e => { if (e.key === KEY) listeners.forEach(cb => cb(read())); });
  return {
    demo: true,
    subscribe(cb) { listeners.add(cb); cb(read()); return () => listeners.delete(cb); },
    add(text) {
      const list = read();
      list.push({ id: "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, t: Date.now() });
      write(list);
      return Promise.resolve();
    },
    remove(ids) { const s = new Set(ids); write(read().filter(r => !s.has(r.id))); return Promise.resolve(); },
    subscribePlayed(cb) { pListeners.add(cb); cb(toList(readP())); return () => pListeners.delete(cb); },
    markPlayed(cluster, key, label, artist) {
      const o = readP();
      o[key] = { label: label || cluster.label, artist: artist ?? (cluster.artist || ""), count: ((o[key] && o[key].count) || 0) + 1 };
      writeP(o);
      return this.remove(cluster.ids);
    },
    resetPlayed(keys) { const o = readP(); keys.forEach(k => delete o[k]); writeP(o); return Promise.resolve(); }
  };
}

// ------------------------------------------------------------
//  Song-Gruppierung
//  "Ein Ehrenwertes Haus" = "Ehrenwertes Haus"
//  "Aber bitte mit Sahne" = "Aber bitte mit Sahne - Udo Jürgens"
// ------------------------------------------------------------
const ARTICLES = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "the", "a", "an"]);
const SEP = /\s+[-–—]\s*|\s*[-–—]\s+|\s*[\/|:]\s*/;

export function cleanInput(s) {
  return String(s || "").replace(/\s+/g, " ").trim().slice(0, MAX_LEN);
}

function normTokens(s) {
  s = String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ß/g, "ss");
  s = s.replace(/\([^)]*\)|\[[^\]]*\]/g, " ");                 // (Remix), [Live] …
  s = s.replace(/\b(feat|ft|featuring)\b\.?.*$/, " ");          // feat. XY
  s = s.replace(/[^a-z0-9]+/g, " ").trim();
  s = s.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u"); // Jürgens = Juergens = Jurgens
  const t = s ? s.split(" ") : [];
  while (t.length > 1 && ARTICLES.has(t[0])) t.shift();         // führender Artikel weg
  return t;
}

const _cache = new Map();
export function analyze(raw) {
  raw = String(raw);
  let a = _cache.get(raw);
  if (a) return a;
  a = analyzeRaw(raw);
  if (_cache.size > 3000) _cache.clear();
  _cache.set(raw, a);
  return a;
}
function analyzeRaw(raw) {
  const tokens = normTokens(raw);
  const rawParts = String(raw).split(SEP).map(p => p.trim()).filter(Boolean);
  let parts = [];
  if (rawParts.length > 1) {
    parts = rawParts.map(p => ({ raw: p, key: normTokens(p).join(" ") })).filter(p => p.key);
  }
  return { raw, tokens, key: tokens.join(" "), compact: tokens.join(""), parts };
}

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i), cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}
function sim(a, b) { const L = Math.max(a.length, b.length); return L ? 1 - lev(a, b) / L : 1; }
const compact = k => k.replace(/ /g, "");

function partMatch(A, B) {
  // Ein Teil (Titel ODER Künstler) von A entspricht dem ganzen Wunsch B
  for (const p of A.parts) {
    const pc = compact(p.key);
    if (pc === B.compact) return true;
    if (Math.min(pc.length, B.compact.length) >= 6 && sim(pc, B.compact) >= 0.86) return true;
  }
  return false;
}

const nums = a => a.tokens.filter(t => /\d/.test(t)).sort().join(",");

const _mcache = new Map();
export function matches(A, B) {
  const k = A.raw < B.raw ? A.raw + "\u0000" + B.raw : B.raw + "\u0000" + A.raw;
  let r = _mcache.get(k);
  if (r === undefined) {
    r = matchesRaw(A, B);
    if (_mcache.size > 20000) _mcache.clear();
    _mcache.set(k, r);
  }
  return r;
}
function matchesRaw(A, B) {
  if (!A.key || !B.key) return false;
  if (A.compact === B.compact) return true;
  // Unterschiedliche Zahlen = unterschiedliche Songs ("Teil 1" ≠ "Teil 2")
  const na = nums(A), nb = nums(B);
  if (na && nb && na !== nb) return false;
  if (partMatch(A, B) || partMatch(B, A)) return true;
  // Titel + Künstler ohne Trennzeichen: "Aber bitte mit Sahne Udo Jürgens"
  const [s, l] = A.tokens.length <= B.tokens.length ? [A.tokens, B.tokens] : [B.tokens, A.tokens];
  if (s.length < l.length) {
    const okSize = (s.length >= 2 && s.length * 2 >= l.length) || (s.length === 1 && s[0].length >= 6 && l.length <= 3);
    if (okSize) {
      const pre = s.every((x, i) => x === l[i]);
      const suf = s.every((x, i) => x === l[l.length - s.length + i]);
      if (pre || suf) return true;
    }
  }
  // Tippfehler
  if (Math.min(A.compact.length, B.compact.length) >= 6 && sim(A.compact, B.compact) >= 0.85) return true;
  return false;
}

function mostCommon(arr) {
  const m = new Map();
  arr.forEach(x => m.set(x, (m.get(x) || 0) + 1));
  let best = null, bc = -1;
  for (const [k, c] of m) if (c > bc || (c === bc && k.length > best.length)) { best = k; bc = c; }
  return best;
}

/** Fasst Wünsche zu Songs zusammen. Gibt sortierte Liste von Clustern zurück. */
export function clusterRequests(requests) {
  const sorted = [...requests].filter(r => r && r.text).sort((a, b) => (a.t - b.t) || String(a.id).localeCompare(String(b.id)));
  const clusters = [];
  for (const r of sorted) {
    const a = analyze(r.text);
    if (!a.key) continue;
    let best = null, bestScore = 0;
    for (const c of clusters) {
      let score = 0;
      for (const m of c.items) if (matches(a, m.a)) score++;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (best) best.items.push({ r, a });
    else clusters.push({ id: r.id, items: [{ r, a }] });
  }

  return clusters.map(c => {
    // Anzeigename: am liebsten der reine Titel (ohne " - Künstler"),
    // davon die häufigste Variante (bei Gleichstand die kürzere).
    const pure = c.items.filter(it => !it.a.parts.length);
    const pool = pure.length ? pure : c.items;
    const keyCount = new Map();
    pool.forEach(it => keyCount.set(it.a.compact, (keyCount.get(it.a.compact) || 0) + 1));
    // Bonus, wenn die Schreibweise auch in einem "Titel - Künstler"-Wunsch vorkommt
    const partKeys = new Set();
    c.items.forEach(it => it.a.parts.forEach(p => partKeys.add(compact(p.key))));
    const better = (k, t) => {
      const nk = keyCount.get(k), nt = keyCount.get(t);
      if (nk !== nt) return nk > nt;
      const pk = partKeys.has(k), pt = partKeys.has(t);
      if (pk !== pt) return pk;
      return k.length < t.length;
    };
    let topKey = null;
    for (const k of keyCount.keys()) if (topKey === null || better(k, topKey)) topKey = k;
    const spellings = pool.filter(it => it.a.compact === topKey).map(it => cleanInput(it.r.text));
    const sc = new Map();
    spellings.forEach(s => sc.set(s, (sc.get(s) || 0) + 1));
    const nice = s => (/^[A-ZÄÖÜ0-9]/.test(s) ? 1 : 0);
    let label = spellings[0];
    for (const [s, n] of sc) {
      const b = sc.get(label);
      if (n > b || (n === b && nice(s) > nice(label))) label = s;
    }
    if (label && /^[a-zäöü]/.test(label)) label = label[0].toUpperCase() + label.slice(1);
    const la = analyze(label);
    // Künstler-Hinweis: Wenn jemand "Titel - Künstler" geschrieben hat
    let artist = "";
    if (!la.parts.length) {
      const cands = [];
      for (const it of c.items) {
        const ps = it.a.parts;
        if (ps.length < 2) continue;
        const idx = ps.findIndex(p => compact(p.key) === la.compact || sim(compact(p.key), la.compact) >= 0.86);
        if (idx >= 0) cands.push(ps.filter((_, i) => i !== idx).map(p => p.raw).join(" / "));
      }
      if (cands.length) {
        const n = new Map();
        cands.forEach(x => n.set(x, (n.get(x) || 0) + 1));
        artist = cands.reduce((b, x) => (n.get(x) > n.get(b) ? x : b), cands[0]);
      }
    }
    const times = c.items.map(it => it.r.t);
    return {
      id: c.id,
      label,
      artist,
      count: c.items.length,
      ids: c.items.map(it => it.r.id),
      first: Math.min(...times),
      last: Math.max(...times)
    };
  }).sort((x, y) => (y.count - x.count) || (x.first - y.first));
}

/** Schlüssel für die "Meistgespielt"-Liste: gleicher Song = gleicher Eintrag */
export function playedKeyFor(label, played) {
  const a = analyze(label);
  let best = null;
  for (const p of played) {
    if (p.label && matches(a, analyze(p.label)) && (!best || p.count > best.count)) best = p;
  }
  if (best) return best.key;
  const k = a.compact.replace(/[^a-z0-9]/g, "").slice(0, 60);
  return k || ("s" + hash(label));
}

// ------------------------------------------------------------
//  Kleinkram
// ------------------------------------------------------------
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
