// =====================================================
// MUSIC
// -----------------------------------------------------
// Plays the tracks listed in audio/music/tracks.json (see audio/README.md); the game ships without any.
// play("hub") for the menus, play("battle" | "gym" | "elite" | "champion" | "rival") for a fight.
// Browsers only allow sound after a click, so the first click or key press starts it.
// =====================================================

const DIR = "./audio/music/";
const KEY = "pd.music"; // "off" when the player turned it off
const FALLBACK = { gym: "battle", elite: "battle", champion: "battle", rival: "battle" };
const FADE_MS = 500;

let tracks = null; // kind → file names
let kind = null; // what should be playing
let audio = null;
let unlocked = false;
let on = true;
try { on = localStorage.getItem(KEY) !== "off"; } catch { /* ignore */ }

async function loadTracks() {
  if (tracks) return tracks;
  try { tracks = await (await fetch(`${DIR}tracks.json`, { cache: "no-cache" })).json(); } catch { tracks = {}; }
  return tracks;
}

function fade(el, to, done) {
  const from = el.volume;
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / FADE_MS);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step); else done?.();
  };
  requestAnimationFrame(step);
}

async function refresh() {
  const list = await loadTracks();
  if (!on || !unlocked || !kind) { stopCurrent(); return; }
  const files = list[kind]?.length ? list[kind] : list[FALLBACK[kind]] ?? [];
  if (!files.length) { stopCurrent(); return; }
  const wanted = files.includes(audio?.dataset.file) ? audio.dataset.file : null;
  if (wanted && audio && !audio.paused) return; // already playing one of them
  stopCurrent();
  const file = files[Math.floor(Math.random() * files.length)];
  const el = new Audio(`${DIR}${file}`);
  el.dataset.file = file;
  el.loop = true;
  el.volume = 0;
  el.onerror = () => { if (audio === el) audio = null; };
  audio = el;
  el.play().then(() => fade(el, 0.35)).catch(() => { if (audio === el) audio = null; });
}

function stopCurrent() {
  if (!audio) return;
  const old = audio;
  audio = null;
  fade(old, 0, () => old.pause());
}

export function play(next) {
  if (next === kind && audio) return;
  kind = next;
  refresh();
}

export const musicOn = () => on;
export function setMusic(value) {
  on = value;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* ignore */ }
  refresh();
}

// The first click or key press allows sound
const unlock = () => { unlocked = true; refresh(); };
addEventListener("pointerdown", unlock, { once: true });
addEventListener("keydown", unlock, { once: true });

// The ♪ button only shows when there is music to play
const button = document.getElementById("music-btn");
const paint = () => { if (button) button.classList.toggle("off", !on); };
loadTracks().then((list) => {
  if (!button || !Object.values(list).some((files) => files?.length)) return;
  button.hidden = false;
  paint();
  button.onclick = () => { setMusic(!on); unlocked = true; paint(); };
});
