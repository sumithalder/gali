// -- YouTube playlist playback --------------------------------------------
const PLAYLIST_ID = "PLPqtU2yB52Zk";

let ytPlayer = null;
let isPlaying = false;
let isShuffled = false;
let pollHandle = null;
let autoPlayEnabled = true;

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
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        el.title.textContent = "Ready to play";
        el.artist.textContent = "this gali’s playlist";
        updateMeta();
        ytPlayer.setVolume(Number(el.volumeSlider.value));
        setMuteUI(ytPlayer.isMuted());
        if (autoPlayEnabled) {
          window.setTimeout(() => {
            try {
              ytPlayer.playVideo();
            } catch (error) {
              console.warn("Autoplay could not start:", error);
            }
          }, 250);
        }
      },
      onStateChange: (event) => {
        updateMeta();
        if (event.data === YT.PlayerState.PLAYING) {
          setPlayingUI(true);
          clearInterval(pollHandle);
          pollHandle = setInterval(renderProgress, 500);
        } else if (event.data === YT.PlayerState.ENDED) {
          setPlayingUI(false);
          clearInterval(pollHandle);
          if (autoPlayEnabled) {
            window.setTimeout(() => {
              try {
                ytPlayer.nextVideo();
              } catch (error) {
                console.warn("Unable to advance to the next video:", error);
              }
            }, 250);
          }
        } else if (event.data === YT.PlayerState.PAUSED) {
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
  const scene = document.querySelector(".scene");
  const heroTitleInner = document.getElementById("heroTitleInner");

  window.addEventListener("mousemove", (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;

    scene.style.setProperty("--mx", `${(-nx * 16).toFixed(2)}px`);
    scene.style.setProperty("--my", `${(-ny * 16).toFixed(2)}px`);
    heroTitleInner.style.setProperty("--tx", `${(nx * 24).toFixed(2)}px`);
    heroTitleInner.style.setProperty("--ty", `${(ny * 24).toFixed(2)}px`);
  });
}

// -- ambient street bed -----------------------------------------------------
// Starts on the first user gesture (browser autoplay policy) and stays low,
// as texture behind the music player rather than a second soundtrack.
const ambientBed = document.getElementById("ambientBed");
const AMBIENT_VOLUME = 0.16;
const AMBIENT_DUCK = 0.05;
let ambientUnlocked = false;
let ambientMuted = false;

const fadeHandles = new WeakMap();

function fadeVolume(el, target, duration) {
  const running = fadeHandles.get(el);
  if (running) cancelAnimationFrame(running);
  const start = el.volume;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, Math.max(0, (now - startTime) / duration));
    el.volume = start + (target - start) * t;
    if (t < 1) fadeHandles.set(el, requestAnimationFrame(step));
  }
  fadeHandles.set(el, requestAnimationFrame(step));
}

function unlockAmbient() {
  if (ambientUnlocked) return;
  ambientUnlocked = true;
  ambientBed.volume = 0;
  ambientBed
    .play()
    .then(() => fadeVolume(ambientBed, ambientMuted ? 0 : AMBIENT_VOLUME, 500))
    .catch(() => {
      ambientUnlocked = false;
    });
}

function duckAmbient() {
  if (!ambientUnlocked || ambientMuted) return;
  fadeVolume(ambientBed, AMBIENT_DUCK, 200);
}

function restoreAmbient() {
  if (!ambientUnlocked || ambientMuted) return;
  fadeVolume(ambientBed, AMBIENT_VOLUME, 700);
}

// -- ambient sound toggle ---------------------------------------------------
// Stroke-only (not filled) to match the topbar's existing icon language
// (day-icon, presence-icon) — a filled speaker glyph reads as a solid blob
// at this small size instead of a recognizable icon.
const ambientToggle = document.getElementById("ambientToggle");
const ambientIcon = document.getElementById("ambientIcon");
const AMBIENT_VOLUME_ICON =
  '<path d="M4 9h3.2L12 5v14l-4.8-4H4z"/><path d="M16 9.2a4 4 0 0 1 0 5.6"/>';
const AMBIENT_MUTE_ICON =
  '<path d="M4 9h3.2L12 5v14l-4.8-4H4z"/><line x1="15" y1="9" x2="19.5" y2="13.5"/><line x1="19.5" y1="9" x2="15" y2="13.5"/>';

function setAmbientToggleUI(muted) {
  ambientIcon.innerHTML = muted ? AMBIENT_MUTE_ICON : AMBIENT_VOLUME_ICON;
  ambientToggle.setAttribute("aria-pressed", String(muted));
  ambientToggle.setAttribute(
    "aria-label",
    muted ? "Unmute ambient sound" : "Mute ambient sound",
  );
}

setAmbientToggleUI(ambientMuted);

ambientToggle.addEventListener("click", () => {
  ambientMuted = !ambientMuted;
  setAmbientToggleUI(ambientMuted);

  if (!ambientUnlocked) {
    unlockAmbient();
    return;
  }
  fadeVolume(ambientBed, ambientMuted ? 0 : AMBIENT_VOLUME, 400);
});

["pointerdown", "keydown"].forEach((evt) =>
  document.addEventListener(evt, unlockAmbient, { once: true }),
);

// -- discoverable street hotspots (curiosity is the navigation) -----------
const HOTSPOTS = {
  "chai-shop": {
    caption: "The glass is always too hot to hold.",
    image: "assets/chai_reciept.png",
    audio: "audio/chai-shop.mp3",
  },
  "barber-shop": {
    caption: "The haircut takes twenty minutes. The conversation takes longer.",
    image: "assets/barber_bill.png",
    audio: "audio/barber.mp3",
  },
  "kirana-store": {
    caption: "You came for biscuits. You left with five things.",
    image: "assets/kirana_bill.png",
    audio: "audio/kirana-store.mp3",
  },
  "sleeping-dog": {
    caption: "Doesn't move for anyone.",
    image: "assets/dog_note.png",
    audio: "audio/sleeping-dog.mp3",
  },
  balcony: {
    caption: "Someone here knows everyone's business.",
    image: "assets/balcony_note.png",
    audio: "audio/balcony.mp3",
  },
};

const hotspotCaption = document.getElementById("hotspotCaption");
const hotspotCaptionImg = document.getElementById("hotspotCaptionImg");
const hotspotCaptionGrain = document.getElementById("hotspotCaptionGrain");
const hotspotEls = document.querySelectorAll(".hotspot");
const hotspotAudioCache = {};

function getHotspotAudio(id, src) {
  if (!hotspotAudioCache[id]) hotspotAudioCache[id] = new Audio(src);
  return hotspotAudioCache[id];
}

function showHotspotCaption(hotspot) {
  const data = HOTSPOTS[hotspot.dataset.id];
  if (!data) return;
  const rect = hotspot.querySelector(".hotspot-dot").getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const above = rect.top > 140;

  hotspotCaptionImg.src = data.image;
  hotspotCaptionImg.alt = data.caption;
  hotspotCaptionGrain.style.maskImage = `url('${data.image}')`;
  hotspotCaptionGrain.style.webkitMaskImage = `url('${data.image}')`;
  hotspotCaption.style.left = `${x}px`;
  hotspotCaption.style.top = above
    ? `${rect.top - 6}px`
    : `${rect.bottom + 6}px`;
  hotspotCaption.classList.toggle("is-above", above);
  hotspotCaption.classList.add("is-visible");
}

function hideHotspotCaption() {
  hotspotCaption.classList.remove("is-visible");
}

const HOTSPOT_VOLUME = 0.95;
const HOTSPOT_FADE_MS = 450;

function triggerHotspot(hotspot) {
  const data = HOTSPOTS[hotspot.dataset.id];
  if (!data) return;

  hotspot.classList.remove("is-active");
  void hotspot.offsetWidth;
  hotspot.classList.add("is-active");

  if (!data.audio) return;
  const audio = getHotspotAudio(hotspot.dataset.id, data.audio);
  duckAmbient();
  audio.currentTime = 0;
  audio.volume = 0;
  audio
    .play()
    .then(() => {
      fadeVolume(audio, HOTSPOT_VOLUME, HOTSPOT_FADE_MS);
      audio.addEventListener("ended", restoreAmbient, { once: true });
    })
    .catch(() => restoreAmbient());
}

hotspotEls.forEach((hotspot) => {
  hotspot.addEventListener("pointerenter", () => showHotspotCaption(hotspot));
  hotspot.addEventListener("pointerleave", hideHotspotCaption);
  hotspot.addEventListener("focus", () => showHotspotCaption(hotspot));
  hotspot.addEventListener("blur", hideHotspotCaption);
  hotspot.addEventListener("click", () => triggerHotspot(hotspot));
  hotspot.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerHotspot(hotspot);
    }
  });
});

window.addEventListener("resize", hideHotspotCaption);

// -- explore hint (one-time nudge toward the hotspots) ----------------------
const exploreHint = document.getElementById("exploreHint");
const EXPLORE_HINT_SEEN_KEY = "gali-explore-hint-seen";

if (exploreHint) {
  if (localStorage.getItem(EXPLORE_HINT_SEEN_KEY)) {
    exploreHint.remove();
  } else {
    const showTimer = setTimeout(
      () => exploreHint.classList.add("is-visible"),
      1600,
    );

    function dismissExploreHint() {
      clearTimeout(showTimer);
      clearTimeout(autoHideTimer);
      exploreHint.classList.remove("is-visible");
      localStorage.setItem(EXPLORE_HINT_SEEN_KEY, "1");
    }

    const autoHideTimer = setTimeout(dismissExploreHint, 12000);

    hotspotEls.forEach((hotspot) => {
      hotspot.addEventListener("pointerenter", dismissExploreHint, {
        once: true,
      });
      hotspot.addEventListener("focus", dismissExploreHint, { once: true });
    });
  }
}
