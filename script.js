// -- YouTube playlist playback --------------------------------------------
const PLAYLIST_ID = "PLPqtU2yB52Zk";

let ytPlayer = null;
let isPlaying = false;
let isShuffled = false;
let pollHandle = null;

const el = {
  clock: document.getElementById("clock"),
  online: document.getElementById("visitCount"),
  art: document.getElementById("art"),
  eq: document.getElementById("eq"),
  title: document.getElementById("trackTitle"),
  artist: document.getElementById("trackArtist"),
  progressTrack: document.getElementById("progressTrack"),
  progressFill: document.getElementById("progressFill"),
  curTime: document.getElementById("curTime"),
  totalTime: document.getElementById("totalTime"),
  playBtn: document.getElementById("playBtn"),
  playIcon: document.getElementById("playIcon"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  muteBtn: document.getElementById("muteBtn"),
  volumeIcon: document.getElementById("volumeIcon"),
  volumeSlider: document.getElementById("volumeSlider"),
};

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function setPlayingUI(playing) {
  isPlaying = playing;
  el.playIcon.innerHTML = playing
    ? '<rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/>'
    : '<path d="M7 5l12 7-12 7V5z" fill="currentColor"/>';
  el.playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  el.art.classList.toggle("is-spinning", playing);
  el.eq.classList.toggle("is-playing", playing);
}

const VOLUME_ICON =
  '<path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/>';
const MUTE_ICON =
  '<path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/>';

function setMuteUI(muted) {
  el.volumeIcon.innerHTML = muted ? MUTE_ICON : VOLUME_ICON;
  el.muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
}

function renderProgress() {
  if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;
  const duration = ytPlayer.getDuration() || 0;
  const current = ytPlayer.getCurrentTime() || 0;
  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
  el.progressFill.style.width = `${pct}%`;
  el.progressTrack.setAttribute("aria-valuenow", Math.round(pct));
  el.curTime.textContent = formatTime(current);
  el.totalTime.textContent = formatTime(duration);
}

function updateMeta() {
  if (!ytPlayer || typeof ytPlayer.getVideoData !== "function") return;
  const data = ytPlayer.getVideoData();
  if (data && data.title) {
    el.title.textContent = data.title;
    const artist = (data.author || "YouTube Music").replace(
      /\s*-\s*Topic$/i,
      "",
    );
    el.artist.textContent = artist;
  }
}

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player("ytPlayer", {
    width: "100%",
    height: "100%",
    playerVars: {
      listType: "playlist",
      list: PLAYLIST_ID,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        el.title.textContent = "Ready to play";
        el.artist.textContent = "this gali’s playlist";
        updateMeta();
        ytPlayer.setVolume(Number(el.volumeSlider.value));
        setMuteUI(ytPlayer.isMuted());
      },
      onStateChange: (event) => {
        updateMeta();
        if (event.data === YT.PlayerState.PLAYING) {
          setPlayingUI(true);
          clearInterval(pollHandle);
          pollHandle = setInterval(renderProgress, 500);
        } else if (
          event.data === YT.PlayerState.PAUSED ||
          event.data === YT.PlayerState.ENDED
        ) {
          setPlayingUI(false);
          clearInterval(pollHandle);
        }
      },
      onError: () => {
        el.title.textContent = "Playlist unavailable";
        el.artist.textContent = "check the YouTube playlist link";
      },
    },
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

el.playBtn.addEventListener("click", () => {
  if (!ytPlayer) return;
  isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
});
el.prevBtn.addEventListener(
  "click",
  () => ytPlayer && ytPlayer.previousVideo(),
);
el.nextBtn.addEventListener("click", () => ytPlayer && ytPlayer.nextVideo());

el.shuffleBtn.addEventListener("click", () => {
  if (!ytPlayer) return;
  isShuffled = !isShuffled;
  ytPlayer.setShuffle(isShuffled);
  el.shuffleBtn.classList.toggle("is-active", isShuffled);
  el.shuffleBtn.setAttribute("aria-pressed", String(isShuffled));
});

el.muteBtn.addEventListener("click", () => {
  if (!ytPlayer) return;
  if (ytPlayer.isMuted()) {
    ytPlayer.unMute();
    if (Number(el.volumeSlider.value) === 0) el.volumeSlider.value = 40;
    ytPlayer.setVolume(Number(el.volumeSlider.value));
    setMuteUI(false);
  } else {
    ytPlayer.mute();
    setMuteUI(true);
  }
});

el.volumeSlider.addEventListener("input", (e) => {
  if (!ytPlayer) return;
  const value = Number(e.target.value);
  ytPlayer.setVolume(value);
  if (value === 0) {
    ytPlayer.mute();
    setMuteUI(true);
  } else {
    if (ytPlayer.isMuted()) ytPlayer.unMute();
    setMuteUI(false);
  }
});

el.progressTrack.addEventListener("click", (e) => {
  if (!ytPlayer) return;
  const rect = el.progressTrack.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  ytPlayer.seekTo(ratio * (ytPlayer.getDuration() || 0), true);
  renderProgress();
});

el.progressTrack.addEventListener("keydown", (e) => {
  if (!ytPlayer) return;
  const current = ytPlayer.getCurrentTime() || 0;
  const duration = ytPlayer.getDuration() || 0;
  if (e.key === "ArrowRight") {
    ytPlayer.seekTo(Math.min(duration, current + 5), true);
  }
  if (e.key === "ArrowLeft") {
    ytPlayer.seekTo(Math.max(0, current - 5), true);
  }
});

// -- keyboard shortcuts (mirrors YouTube's own player) --------------------
document.addEventListener("keydown", (e) => {
  if (!ytPlayer) return;
  if ((e.target.tagName || "").toLowerCase() === "input") return;

  switch (e.code) {
    case "Space":
      e.preventDefault();
      isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
      break;
    case "ArrowRight":
      if (document.activeElement === el.progressTrack) return;
      e.preventDefault();
      ytPlayer.seekTo(
        Math.min(
          ytPlayer.getDuration() || 0,
          (ytPlayer.getCurrentTime() || 0) + 5,
        ),
        true,
      );
      renderProgress();
      break;
    case "ArrowLeft":
      if (document.activeElement === el.progressTrack) return;
      e.preventDefault();
      ytPlayer.seekTo(Math.max(0, (ytPlayer.getCurrentTime() || 0) - 5), true);
      renderProgress();
      break;
    case "ArrowUp":
      e.preventDefault();
      el.volumeSlider.value = Math.min(100, Number(el.volumeSlider.value) + 5);
      el.volumeSlider.dispatchEvent(new Event("input"));
      break;
    case "ArrowDown":
      e.preventDefault();
      el.volumeSlider.value = Math.max(0, Number(el.volumeSlider.value) - 5);
      el.volumeSlider.dispatchEvent(new Event("input"));
      break;
    case "KeyM":
      el.muteBtn.click();
      break;
  }
});

// -- ambient clock + day/night icon ---------------------------------------
const SUN_ICON =
  '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></g>';
const MOON_ICON =
  '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>';
const dayIcon = document.getElementById("dayIcon");

function tickClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  const suffix = h >= 12 ? "pm" : "am";
  const isDaytime = h >= 6 && h < 18;
  dayIcon.innerHTML = isDaytime ? SUN_ICON : MOON_ICON;
  h = h % 12 || 12;
  el.clock.textContent = `${h}:${m} ${suffix}`;
}
tickClock();
setInterval(tickClock, 15000);

// -- live visit counter ---------------------------------------------------
// abacus.jasoncameron.dev is a free, no-signup hit counter: each call to
// /hit increments and returns the running total. It only counts up (no
// concurrent-presence tracking), so this reads as "N have passed through".
const VISIT_NAMESPACE = "gali-sumitwhodesign";
const VISIT_KEY = "passersby";

fetch(`https://abacus.jasoncameron.dev/hit/${VISIT_NAMESPACE}/${VISIT_KEY}`)
  .then((res) => res.json())
  .then((data) => {
    if (typeof data.value === "number")
      el.online.textContent = data.value.toLocaleString();
  })
  .catch(() => {
    el.online.textContent = "—";
  });

// -- fit tagline to the width of the title --------------------------------
const heroHindi = document.querySelector(".hero-hindi");
const heroTag = document.querySelector(".hero-tag");
function fitHeroTag() {
  heroTag.style.maxWidth = `${heroHindi.getBoundingClientRect().width}px`;
}
document.fonts.ready.then(fitHeroTag);
window.addEventListener("resize", fitHeroTag);
fitHeroTag();

// -- floating dust motes ---------------------------------------------------
const dustLayer = document.getElementById("dustLayer");
const MOTE_COUNT = 16;
for (let i = 0; i < MOTE_COUNT; i++) {
  const mote = document.createElement("div");
  mote.className = "mote";
  const size = (Math.random() * 3 + 2).toFixed(1);
  const duration = (Math.random() * 14 + 16).toFixed(1);
  mote.style.setProperty("--x", `${(Math.random() * 100).toFixed(1)}%`);
  mote.style.setProperty("--size", `${size}px`);
  mote.style.setProperty("--dur", `${duration}s`);
  mote.style.setProperty(
    "--delay",
    `${(Math.random() * -duration).toFixed(1)}s`,
  );
  mote.style.setProperty(
    "--drift",
    `${(Math.random() * 60 - 30).toFixed(0)}px`,
  );
  mote.style.setProperty("--peak", (Math.random() * 0.4 + 0.35).toFixed(2));
  dustLayer.appendChild(mote);
}

// -- mouse parallax ---------------------------------------------------------
// Desktop-only (real mouse pointer) and skipped for prefers-reduced-motion.
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (hasFinePointer && !prefersReducedMotion) {
  const bg = document.querySelector(".bg");
  const heroTitleInner = document.getElementById("heroTitleInner");

  window.addEventListener("mousemove", (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;

    bg.style.setProperty("--mx", `${(-nx * 16).toFixed(2)}px`);
    bg.style.setProperty("--my", `${(-ny * 16).toFixed(2)}px`);
    heroTitleInner.style.setProperty("--tx", `${(nx * 24).toFixed(2)}px`);
    heroTitleInner.style.setProperty("--ty", `${(ny * 24).toFixed(2)}px`);
  });
}
