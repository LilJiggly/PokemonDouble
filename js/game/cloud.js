// =====================================================
// CLOUD SAVE + LEADERBOARDS (Firebase)
// -----------------------------------------------------
// The game always saves to this device first (localStorage).
// When you are signed in with Google, the same save is copied
// to Firestore so another device can pick it up:
//   users/{uid}    your private save: meta, run, hall of fame
//   players/{uid}  your public leaderboard line: name + 3 numbers
// The Firebase SDK is only loaded when js/firebase-config.js has a config.
// =====================================================

import { firebaseConfig } from "../firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const KEYS = { meta: "pd.meta", hof: "pd.hallOfFame", run: "pd.run" };
const SYNC_KEY = "pd.cloud"; // { uid, at }: the last time this device and the cloud agreed
const CHANGED_KEY = "pd.localChanged"; // when this device last saved something

export const LEADERBOARDS = [
  { id: "wins", label: "Champion wins", field: "wins" },
  { id: "fastest", label: "Fastest win", field: "fastestWin", ascending: true, format: (sec) => `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}` },
  { id: "clean", label: "Flawless wins", field: "cleanWins" },
  { id: "trainers", label: "Trainers unlocked", field: "trainers" },
  { id: "badges", label: "Badges", field: "badges", suffix: " of 40" },
];

let fb = null; // { auth, db, fns… } once loaded
let user = null;
let status = "idle"; // idle | syncing | synced | error
let pushTimer = null;
let paused = false; // true while we write into localStorage ourselves
const listeners = new Set();

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const emit = () => listeners.forEach((fn) => fn(state()));
export const state = () => ({ available: !!firebaseConfig, user, status });
export const cloudAvailable = () => !!firebaseConfig;
export function onCloudChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

async function load() {
  if (fb) return fb;
  if (!firebaseConfig) throw new Error("Cloud save is not set up");
  const [app, auth, store] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
  ]);
  const a = app.initializeApp(firebaseConfig);
  fb = { auth: auth.getAuth(a), db: store.getFirestore(a), ...auth, ...store };
  return fb;
}

// Call once at start up: restores the login and syncs
export async function initCloud() {
  if (!firebaseConfig) return;
  try {
    await load();
    fb.onAuthStateChanged(fb.auth, async (u) => {
      user = u;
      emit();
      if (u) await syncNow({ first: true });
    });
  } catch (err) { console.error(err); status = "error"; emit(); }
}

export async function signIn() {
  await load();
  await fb.signInWithPopup(fb.auth, new fb.GoogleAuthProvider());
}
export async function signOutUser() { await load(); await fb.signOut(fb.auth); }

// ---- what the save looks like ----
function localSave() {
  return { meta: read(KEYS.meta), hof: read(KEYS.hof) ?? [], run: read(KEYS.run) };
}
const hasProgress = (s) => !!s.meta && ((s.meta.runs ?? 0) > 0 || (s.meta.tp ?? 0) > 0 || (s.meta.badges?.length ?? 0) > 0 || s.hof.length > 0);
export const summary = (s) => `${s.meta?.runs ?? 0} runs, ${s.meta?.wins ?? 0} wins, ${s.meta?.tp ?? 0} TP`;

// Public name on the leaderboard: the username the player chose, else the first name of the Google account
export const cleanUsername = (t) => String(t ?? "").replace(/[\u0000-\u001f<>&"']/g, "").replace(/\s+/g, " ").trim().slice(0, 16);
export const publicName = (meta = read(KEYS.meta)) => cleanUsername(meta?.username) || (user?.displayName ?? "Trainer").split(/\s+/)[0].slice(0, 20);
// The screens register how to count what only they know (unlocked trainers need the character list and rules)
let extraStats = () => ({});
export function setPublicStats(fn) { extraStats = fn; }

// Which Pokémon the player won with: how many Hall of Fame teams each one was in
function usedFrom(hof) {
  const used = {};
  for (const e of hof ?? []) for (const m of e.team ?? []) used[m.species] = (used[m.species] ?? 0) + 1;
  return used;
}
function publicLine(meta, hof) {
  return {
    name: publicName(meta), wins: meta?.wins ?? 0, best: meta?.best ?? 0, cleanWins: meta?.cleanWins ?? 0,
    trainers: extraStats(meta).trainers ?? 1, badges: meta?.badges?.length ?? 0, used: usedFrom(hof), updatedAt: Date.now(),
    ...(meta?.fastestWin > 0 ? { fastestWin: Math.max(60, Math.round(meta.fastestWin / 1000)) } : {}), // seconds of the fastest win (timed runs only)
  };
}

async function push() {
  if (!user) return;
  const s = localSave();
  const at = Date.now();
  await fb.setDoc(fb.doc(fb.db, "users", user.uid), {
    meta: JSON.stringify(s.meta ?? {}), hof: JSON.stringify(s.hof), run: s.run ? JSON.stringify(s.run) : null, updatedAt: at,
  });
  if (s.meta) await fb.setDoc(fb.doc(fb.db, "players", user.uid), publicLine(s.meta, s.hof));
  localStorage.setItem(SYNC_KEY, JSON.stringify({ uid: user.uid, at }));
}

function applyCloud(d) {
  paused = true;
  try {
    localStorage.setItem(KEYS.meta, d.meta);
    localStorage.setItem(KEYS.hof, d.hof);
    if (d.run) localStorage.setItem(KEYS.run, d.run); else localStorage.removeItem(KEYS.run);
    localStorage.setItem(SYNC_KEY, JSON.stringify({ uid: user.uid, at: d.updatedAt }));
  } finally { paused = false; }
}

// ---- combining two saves (first login on a device that already has progress) ----
// Counters of finished runs add up; "best" style numbers and per-key counters keep the higher one;
// lists (badges, unlocks…) are joined; everything else (character, case layout, settings) stays as on this device.
const SUMMED = new Set(["tp", "earned", "runs", "wins", "cleanWins"]);
function mergeValue(a, b, key, top) {
  if (a === undefined || a === null) return b;
  if (b === undefined || b === null) return a;
  if (typeof a === "number" && typeof b === "number") return top && SUMMED.has(key) ? a + b : Math.max(a, b);
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.every((x) => typeof x !== "object") && b.every((x) => typeof x !== "object")) return [...new Set([...a, ...b])];
    return a;
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = mergeValue(a[k], b[k], k, false);
    return out;
  }
  return a;
}
export function mergeSaves(local, cloud) {
  const meta = {};
  for (const k of new Set([...Object.keys(local.meta ?? {}), ...Object.keys(cloud.meta ?? {})])) meta[k] = mergeValue(local.meta?.[k], cloud.meta?.[k], k, true);
  // The two lists keep a case layout that is valid on its own: the one from this device
  for (const k of ["badgeCase", "badgeLinks", "badgeOff", "setup", "character", "sprites", "cardColor", "username"]) if (local.meta?.[k] !== undefined) meta[k] = local.meta[k];
  const seen = new Set();
  const hof = [...(local.hof ?? []), ...(cloud.hof ?? [])].filter((e) => {
    const id = `${e.date}|${e.gen}|${(e.team ?? []).map((m) => m.species).join(",")}`;
    return seen.has(id) ? false : seen.add(id);
  }).sort((x, y) => String(y.date).localeCompare(String(x.date)));
  return { meta, hof, run: local.run ?? cloud.run ?? null };
}

function applyMerged(m) {
  paused = true;
  try {
    localStorage.setItem(KEYS.meta, JSON.stringify(m.meta));
    localStorage.setItem(KEYS.hof, JSON.stringify(m.hof));
    if (m.run) localStorage.setItem(KEYS.run, JSON.stringify(m.run)); else localStorage.removeItem(KEYS.run);
  } finally { paused = false; }
}

// The window that asks what to do (set by the screens). Answers: "cloud" | "local" | "merge"
let chooser = null;
export function setSyncChooser(fn) { chooser = fn; }

// Make this device and the cloud agree. When both have progress, the chooser decides.
export async function syncNow({ first = false } = {}) {
  if (!user) return "signed-out";
  status = "syncing"; emit();
  try {
    const snap = await fb.getDoc(fb.doc(fb.db, "users", user.uid));
    const local = localSave();
    const last = read(SYNC_KEY);
    const changed = Number(localStorage.getItem(CHANGED_KEY) ?? 0);
    let result = "pushed";
    if (!snap.exists()) await push();
    else {
      const d = snap.data();
      const cloud = { meta: JSON.parse(d.meta), hof: JSON.parse(d.hof) };
      const known = last?.uid === user.uid ? last.at : 0;
      const cloudNewer = d.updatedAt > known;
      const localNewer = changed > known && hasProgress(local);
      if (!hasProgress(local) || (cloudNewer && !localNewer)) { applyCloud(d); result = "pulled"; }
      else if (!cloudNewer) await push();
      else {
        const choice = await (chooser ?? defaultAsk)(summary(cloud), summary(local));
        if (choice === "cloud") { applyCloud(d); result = "pulled"; }
        else if (choice === "merge") { applyMerged(mergeSaves(local, { ...cloud, run: d.run ? JSON.parse(d.run) : null })); await push(); result = "pulled"; }
        else await push();
      }
    }
    status = "synced"; emit();
    if (result === "pulled") location.reload(); // the game reads the new save from the start
    return result;
  } catch (err) { console.error(err); status = "error"; emit(); return "error"; }
}
const defaultAsk = async (cloud, local) => (confirm(`Your online save (${cloud}) differs from this device (${local}).\n\nOK = use the online save.\nCancel = keep this device and replace the online save.`) ? "cloud" : "local");

// Called whenever the game saves: copies it to the cloud a few seconds later
export function noteLocalSave() {
  if (paused) return;
  try { localStorage.setItem(CHANGED_KEY, String(Date.now())); } catch { /* ignore */ }
  if (!user || status === "syncing") return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { push().then(() => { status = "synced"; emit(); }).catch((e) => { console.error(e); status = "error"; emit(); }); }, 3000);
}

// ---- leaderboard ----
// Everyone's public line (the ranks are worked out in ranks.js). Fine for a small community; for thousands of players this would need paging.
export async function allPlayers(count = 300) {
  await load();
  const snap = await fb.getDocs(fb.query(fb.collection(fb.db, "players"), fb.limit(count)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function topPlayers(board, count = 20) {
  await load();
  const q = fb.query(fb.collection(fb.db, "players"), fb.orderBy(board.field, board.ascending ? "asc" : "desc"), fb.limit(count));
  const snap = await fb.getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((p) => (p[board.field] ?? 0) > 0);
}
