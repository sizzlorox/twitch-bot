<template>
  <div class="stream-overlay" :class="`theme-${theme}`" :style="themeVars">

    <transition name="splash-fade">
      <div v-if="splash" class="splash" :class="splash" :key="splash">
        <div class="splash-bg"></div>
        <div class="splash-frame" v-if="theme === 'wow-classic'">
          <div class="splash-frame-tl"></div>
          <div class="splash-frame-tr"></div>
          <div class="splash-frame-bl"></div>
          <div class="splash-frame-br"></div>
        </div>
        <div class="splash-content">
          <template v-if="splash === 'starting'">
            <div class="splash-eyebrow">Welcome</div>
            <div class="splash-title">Starting Soon</div>
            <div class="splash-sub">Stream is starting up — hang tight!</div>
          </template>
          <template v-else-if="splash === 'brb'">
            <div class="splash-eyebrow">One moment</div>
            <div class="splash-title">Be Right Back</div>
            <div class="splash-sub">Back shortly!</div>
          </template>
          <template v-else-if="splash === 'ending'">
            <div class="splash-eyebrow">That's a wrap</div>
            <div class="splash-title">Stream Ending</div>
            <div class="splash-sub">Thanks for watching! See you next time.</div>
          </template>
        </div>
        <div class="splash-glow"></div>
      </div>
    </transition>

    <div class="chat-container" :style="chatStyle">
      <div class="chat-frame-corner tl" v-if="theme === 'wow-classic'"></div>
      <div class="chat-frame-corner tr" v-if="theme === 'wow-classic'"></div>
      <div class="chat-frame-corner bl" v-if="theme === 'wow-classic'"></div>
      <div class="chat-frame-corner br" v-if="theme === 'wow-classic'"></div>
      <transition-group name="fade">
        <div class="chat-message" v-for="msgData in recentMessages" :key="msgData.id">
          <span class="author" v-html="msgData.author" :style="{ color: msgData.authorColor }"></span>
          <span class="colon">:&nbsp;</span>
          <span class="message" v-html="msgData.msg"></span>
        </div>
      </transition-group>
    </div>

    <transition name="arena-fade">
      <div v-if="activeEvent" class="arena-overlay">
        <!-- Party (left) -->
        <div class="party-side">
          <div
            class="fighter-card"
            v-for="(p, i) in activeEvent.party"
            :key="p.username"
            :class="{ dead: p.result === 'lost' && combatPhase === 'result' }"
          >
            <canvas
              class="fighter-canvas"
              :ref="el => { if (el) paperdollCanvases[i] = el }"
              width="68" height="68"
            ></canvas>
            <span
              v-for="n in floatingNumbers.filter(n => n.target === i)"
              :key="n.id"
              class="dmg-number"
              :style="{ top: (4 + n.slot * 16) + 'px' }"
            >{{ n.value }}</span>
            <div class="fighter-hp-bar">
              <div class="fighter-hp-fill" :style="{ width: (combatPhase === 'result' && p.result === 'lost' ? 0 : partyHpPcts[i] ?? 100) + '%', transition: 'width 0.6s ease' }"></div>
            </div>
            <div class="fighter-name" :class="p.result === 'won' ? 'win' : 'loss'">{{ p.username }}</div>
            <transition name="loot-pop">
              <div v-if="p.loot && combatPhase === 'result'" class="loot-badge" :class="p.loot.rarity">✨ {{ p.loot.name }}</div>
            </transition>
          </div>
        </div>

        <!-- Center -->
        <div class="arena-center">
          <div class="arena-vs">⚔️</div>
          <transition name="combat-text-fade" mode="out-in">
            <div class="combat-text" :key="combatText">{{ combatText }}</div>
          </transition>
        </div>

        <!-- Monster (right) -->
        <div class="monster-side" v-if="activeEvent.monster?.avatarUrl">
          <canvas
            class="monster-canvas"
            :ref="el => { if (el) paperdollCanvases[4] = el }"
            width="68" height="68"
          ></canvas>
          <span
            v-for="n in floatingNumbers.filter(n => n.target === 4)"
            :key="n.id"
            class="dmg-number"
            :style="{ top: (4 + n.slot * 16) + 'px' }"
          >{{ n.value }}</span>
          <div class="monster-hp-bar">
            <div class="monster-hp-fill" :style="{ width: monsterHpPct + '%', transition: 'width 0.8s ease' }"></div>
          </div>
          <div class="monster-name">{{ activeEvent.monster.name }}</div>
        </div>
      </div>
    </transition>

    <div class="bottom-bar">
      <span class="bar-text">{{ streamMessage }}</span>
      <div class="rpg-ticker">
        <span class="rpg-badge">⚔️ RPG</span>
        <div class="ticker-track">
          <transition name="ticker-fade" mode="out-in">
            <span v-if="tickerEvent" :key="tickerEvent.id" class="ticker-text" :class="tickerEvent.event_type">{{ tickerEvent.summary }}</span>
            <span v-else key="idle" class="ticker-text idle">Waiting for events…</span>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

const botUrl = import.meta.env.VITE_BOT_URL || 'http://localhost:3000/bot';
const apiBase = botUrl.replace(/\/bot$/, '');

const streamMessage = ref('');
const recentMessages = ref([]);
const chatConfig = ref({ width: 420, height: 480, x: 20, y: 20 });
const splash = ref(null);
const theme = ref('default');

const rpgEvents = ref([]);
const tickerIndex = ref(0);
const tickerEvent = computed(() => rpgEvents.value[tickerIndex.value] ?? null);
let tickerTimer = null;

const activeEvent = ref(null);
const combatText = ref('');
const combatPhase = ref('idle'); // 'idle' | 'party-attack' | 'monster-attack' | 'result'
const monsterHpPct = ref(100);
const partyHpPcts  = ref([100, 100, 100, 100]);
let eventDismissTimer = null;
const paperdollCanvases = [];

// ── Image helpers ──────────────────────────────────────────────────────────

const imageCache = {};
function loadImage(src) {
  if (imageCache[src]) return imageCache[src];
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed: ${src}`));
    img.src = src;
  });
  imageCache[src] = p;
  return p;
}

async function loadFrames(urls) {
  return (await Promise.allSettled(urls.map(u => loadImage(apiBase + u))))
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(Boolean);
}

function stripChromaKey(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i] > 180 && d.data[i + 1] < 80 && d.data[i + 2] > 180) d.data[i + 3] = 0;
  }
  ctx.putImageData(d, 0, 0);
}

// ── Static paperdoll (fallback / idle frame) ───────────────────────────────

async function drawPaperdoll(canvas, player) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 68, 68);
  ctx.imageSmoothingEnabled = false;
  try {
    ctx.drawImage(await loadImage(apiBase + player.avatarUrl), 0, 0, 68, 68);
  } catch { return; }
  for (const slot of ['boots', 'chest', 'weapon', 'helmet']) {
    const item = player.equipment?.[slot];
    if (!item?.spriteUrl) continue;
    try {
      const off = document.createElement('canvas');
      off.width = 68; off.height = 68;
      const offCtx = off.getContext('2d');
      offCtx.imageSmoothingEnabled = false;
      offCtx.drawImage(await loadImage(apiBase + item.spriteUrl), 0, 0, 68, 68);
      stripChromaKey(offCtx, 68, 68);
      ctx.drawImage(off, 0, 0);
    } catch { /* skip */ }
  }
}

// ── Animation system ───────────────────────────────────────────────────────

const manifestCache = {};
async function loadManifest(cls) {
  if (cls in manifestCache) return manifestCache[cls];
  try {
    const r = await fetch(`${apiBase}/assets/avatars/${cls}_animations.json`);
    manifestCache[cls] = r.ok ? await r.json() : null;
  } catch { manifestCache[cls] = null; }
  return manifestCache[cls];
}

let playerAnims = [];
let animRaf = null;
let phase2Timer = null;

function stopAnimLoop() {
  if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
  clearTimeout(phase2Timer);
  playerAnims = [];
}

function setAnim(i, frames, { fps = 8, loop = true, flip = false, onDone = null } = {}) {
  playerAnims[i] = { frames, frameIndex: 0, lastTime: 0, fps, loop, flip, done: false, onDone };
}

function startAnimLoop() {
  if (animRaf) cancelAnimationFrame(animRaf);
  function loop(ts) {
    animRaf = requestAnimationFrame(loop);
    playerAnims.forEach((anim, i) => {
      if (!anim?.frames?.length || anim.done) return;
      const canvas = paperdollCanvases[i];
      if (!canvas) return;
      if (ts - (anim.lastTime || 0) < 1000 / anim.fps) return;
      anim.lastTime = ts;
      const next = anim.frameIndex + 1;
      if (next >= anim.frames.length) {
        if (anim.loop) { anim.frameIndex = 0; }
        else { anim.done = true; anim.onDone?.(i); return; }
      } else {
        anim.frameIndex = next;
      }
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      if (anim.flip) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(anim.frames[anim.frameIndex], -w, 0, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(anim.frames[anim.frameIndex], 0, 0, w, h);
      }
    });
  }
  animRaf = requestAnimationFrame(loop);
}

const timers = [];
function clearTimers() { timers.forEach(clearTimeout); timers.length = 0; }
function after(ms, fn) { timers.push(setTimeout(fn, ms)); }

const floatingNumbers = ref([]);
let dmgIdSeq = 0;
function spawnDmg(target, value, slot = 0) {
  const id = ++dmgIdSeq;
  floatingNumbers.value.push({ id, target, value, slot });
  setTimeout(() => {
    floatingNumbers.value = floatingNumbers.value.filter(n => n.id !== id);
  }, 1600);
}

async function loadCharacterData(cls) {
  const manifest = await loadManifest(cls);
  if (!manifest) return null;
  const [idle, attack, hit, death] = await Promise.all([
    manifest.idle   ? loadFrames(manifest.idle.frames)   : Promise.resolve([]),
    manifest.attack ? loadFrames(manifest.attack.frames) : Promise.resolve([]),
    manifest.hit    ? loadFrames(manifest.hit.frames)    : Promise.resolve([]),
    manifest.death  ? loadFrames(manifest.death.frames)  : Promise.resolve([]),
  ]);
  return { idle, attack, hit, death };
}

const ROUND_MS = 2200;      // ms per visual round
const ATTACK_SPLIT = 0.45;  // party attacks at 0%, monster attacks at 45% of round

watch(activeEvent, async (ev) => {
  stopAnimLoop();
  clearTimers();
  combatText.value = '';
  combatPhase.value = 'idle';
  monsterHpPct.value = 100;
  partyHpPcts.value = [100, 100, 100, 100];
  floatingNumbers.value = [];
  if (!ev) return;
  await nextTick();

  const [partyData, monsterData] = await Promise.all([
    Promise.all(ev.party.map(p => loadCharacterData(p.class?.toLowerCase()))),
    loadCharacterData(ev.monster?.type),
  ]);

  ev.party.forEach((p, i) => {
    const canvas = paperdollCanvases[i];
    if (!canvas) return;
    if (partyData[i]?.idle?.length) setAnim(i, partyData[i].idle, { loop: true, flip: true });
    else drawPaperdoll(canvas, p);
  });

  const monsterCanvas = paperdollCanvases[4];
  if (monsterCanvas && monsterData?.idle?.length) {
    setAnim(4, monsterData.idle, { loop: true, flip: false });
  } else if (monsterCanvas && ev.monster?.avatarUrl) {
    const ctx = monsterCanvas.getContext('2d');
    const mw = monsterCanvas.width, mh = monsterCanvas.height;
    ctx.clearRect(0, 0, mw, mh);
    ctx.imageSmoothingEnabled = false;
    try { ctx.drawImage(await loadImage(apiBase + ev.monster.avatarUrl), 0, 0, mw, mh); } catch {}
  }

  startAnimLoop();
  combatText.value = ev.monster?.name ? `A wild ${ev.monster.name} appears!` : ev.summary;

  const rounds = (ev.rounds || []).slice(0, 6); // cap at 6 visual rounds
  const INTRO = 1200;

  const roundLabels = ['charges!', 'presses the attack!', 'fights on!', 'keeps going!', 'won\'t let up!', 'final push!'];

  rounds.forEach((round, ri) => {
    const tParty   = INTRO + ri * ROUND_MS;
    const tMonster = INTRO + ri * ROUND_MS + Math.round(ROUND_MS * ATTACK_SPLIT);

    // ── Party phase ──
    after(tParty, () => {
      combatPhase.value = 'party-attack';
      combatText.value = `The party ${roundLabels[ri] ?? 'attacks!'}`;

      round.partyAttacks.forEach(({ playerIdx, damage }, pi) => {
        const d = partyData[playerIdx];
        if (d?.attack?.length) {
          setAnim(playerIdx, d.attack, { loop: false, flip: true, onDone: (idx) => {
            if (partyData[idx]?.idle?.length) setAnim(idx, partyData[idx].idle, { loop: true, flip: true });
          }});
        }
        after(pi * 220, () => spawnDmg(4, damage, pi));
      });
      if (round.partyAttacks.length && monsterData?.hit?.length) {
        setAnim(4, monsterData.hit, { loop: false, flip: false, onDone: () => {
          if (monsterData?.idle?.length) setAnim(4, monsterData.idle, { loop: true, flip: false });
        }});
      }
      monsterHpPct.value = round.monsterHpPct;
    });

    // ── Monster phase ──
    if (round.monsterAttacks.length) {
      after(tMonster, () => {
        combatPhase.value = 'monster-attack';
        combatText.value = `${ev.monster?.name ?? 'Enemy'} ${round.monsterAttacks.length > 1 ? 'strikes everyone!' : 'strikes back!'}`;

        if (monsterData?.attack?.length) {
          setAnim(4, monsterData.attack, { loop: false, flip: false, onDone: () => {
            if (monsterData?.idle?.length) setAnim(4, monsterData.idle, { loop: true, flip: false });
          }});
        }
        // Update hero HP bars from actual combat data
        partyHpPcts.value = [...round.playerHpPcts];

        round.monsterAttacks.forEach(({ playerIdx, damage }) => {
          const d = partyData[playerIdx];
          const died = round.playerHpPcts[playerIdx] === 0;
          if (d?.hit?.length) {
            setAnim(playerIdx, d.hit, { loop: false, flip: true, onDone: (idx) => {
              if (died) {
                if (partyData[idx]?.death?.length) setAnim(idx, partyData[idx].death, { loop: false, flip: true });
              } else if (partyData[idx]?.idle?.length) {
                setAnim(idx, partyData[idx].idle, { loop: true, flip: true });
              }
            }});
          } else if (died && d?.death?.length) {
            setAnim(playerIdx, d.death, { loop: false, flip: true });
          }
          spawnDmg(playerIdx, damage);
        });
      });
    }
  });

  // ── Results ──
  const resultsT = INTRO + Math.max(rounds.length, 1) * ROUND_MS;
  after(resultsT, () => {
    combatPhase.value = 'result';
    const anyWon = ev.party.some(p => p.result === 'won');
    const allLost = ev.party.every(p => p.result === 'lost');
    const resultText = allLost
      ? `${ev.monster?.name ?? 'Enemy'} wins — party defeated!`
      : `Victory! ${ev.monster?.name ?? 'Enemy'} defeated!`;
    combatText.value = allLost ? 'Party defeated...' : 'Victory!';

    if (rpgEvents.value.length && rpgEvents.value[0].id === ev.id) {
      rpgEvents.value[0] = { ...rpgEvents.value[0], summary: resultText };
    }
    if (anyWon && monsterData?.death?.length) {
      setAnim(4, monsterData.death, { loop: false, flip: false });
      monsterHpPct.value = 0;
    }
    ev.party.forEach((p, i) => {
      const d = partyData[i];
      if (p.result === 'lost') {
        const alreadyDead = partyHpPcts.value[i] === 0;
        partyHpPcts.value[i] = 0;
        if (!alreadyDead && d?.death?.length) setAnim(i, d.death, { loop: false, flip: true });
      }
      else if (p.result === 'won' && d?.idle?.length) setAnim(i, d.idle, { loop: true, flip: true });
    });

    clearTimeout(eventDismissTimer);
    eventDismissTimer = setTimeout(() => { activeEvent.value = null; }, 5500);
  });
});

fetch(`${apiBase}/settings`)
  .then(r => r.json())
  .then(s => {
    if (s.streamMessage !== undefined) streamMessage.value = s.streamMessage;
    if (s.chat) chatConfig.value = { ...chatConfig.value, ...s.chat };
    if (s.splash !== undefined) splash.value = s.splash;
    if (s.theme !== undefined) theme.value = s.theme;
  })
  .catch(() => {});

fetch(`${apiBase}/rpg/events?limit=10`)
  .then(r => r.json())
  .then(evs => { rpgEvents.value = evs; })
  .catch(() => {});

const themeVars = computed(() => ({
  '--splash-starting-img': `url('${apiBase}/wow/splash-starting.png')`,
  '--splash-brb-img':      `url('${apiBase}/wow/splash-brb.png')`,
  '--splash-ending-img':   `url('${apiBase}/wow/splash-ending.png')`,
  '--chat-frame-img':      `url('${apiBase}/wow/chat-frame.png')`,
}));

const chatStyle = computed(() => ({
  width:  `${chatConfig.value.width}px`,
  height: `${chatConfig.value.height}px`,
  left:   `${chatConfig.value.x}px`,
  top:    `${chatConfig.value.y}px`,
}));

const es = new EventSource(botUrl);

const handleMsg = (e) => {
  const { id, msg, author, authorColor, emotes, badges } = JSON.parse(e.data);

  let newAuthor = author;
  if (badges && badges.length) {
    newAuthor = badges.map(b => `<img src="${b}" class="badge">`).join('') + '&nbsp;' + newAuthor;
  }

  let msgChars = Array.from(msg);
  if (emotes) {
    const placements = [];
    for (const [key, positions] of Object.entries(emotes)) {
      for (const pos of positions) {
        const [start, end] = pos.split('-').map(Number);
        placements.push({ key, start, end });
      }
    }
    placements.sort((a, b) => b.start - a.start);
    for (const { key, start, end } of placements) {
      const img = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${key}/default/dark/1.0" class="emote">`;
      msgChars.splice(start, end - start + 1, img);
    }
  }

  recentMessages.value.push({ id, author: newAuthor, msg: msgChars.join('').trim(), authorColor });
  if (recentMessages.value.length >= 15) recentMessages.value.shift();
};

const handleSettings = (e) => {
  const data = JSON.parse(e.data);
  if (data.streamMessage !== undefined) streamMessage.value = data.streamMessage;
  if (data.chat) chatConfig.value = { ...chatConfig.value, ...data.chat };
  if (data.splash !== undefined) splash.value = data.splash;
  if (data.theme !== undefined) theme.value = data.theme;
};

const handleRpgEvent = (e) => {
  const ev = JSON.parse(e.data);
  rpgEvents.value.unshift(ev);
  if (rpgEvents.value.length > 10) rpgEvents.value.pop();
  tickerIndex.value = 0;

  // Expire from ticker after 90s so it returns to idle
  setTimeout(() => {
    rpgEvents.value = rpgEvents.value.filter(r => r.id !== ev.id);
    if (tickerIndex.value >= rpgEvents.value.length) tickerIndex.value = 0;
  }, 90000);

  if (ev.party && ev.party.length) {
    activeEvent.value = ev;
    clearTimeout(eventDismissTimer);
    eventDismissTimer = setTimeout(() => { activeEvent.value = null; }, 60000); // safety net; real dismiss set in watch results
  }
};

onMounted(() => {
  es.addEventListener('msg', handleMsg);
  es.addEventListener('settings', handleSettings);
  es.addEventListener('rpg_event', handleRpgEvent);

  tickerTimer = setInterval(() => {
    if (rpgEvents.value.length > 1) {
      tickerIndex.value = (tickerIndex.value + 1) % rpgEvents.value.length;
    }
  }, 6000);
});

onBeforeUnmount(() => {
  es.removeEventListener('msg', handleMsg);
  es.removeEventListener('settings', handleSettings);
  es.removeEventListener('rpg_event', handleRpgEvent);
  clearInterval(tickerTimer);
  clearTimeout(eventDismissTimer);
  stopAnimLoop();
  clearTimers();
  es.close();
});
</script>

<!-- Global: badge/emote images inside v-html -->
<style lang="scss">
  .chat-message {
    .badge { height: 18px; vertical-align: middle; border-radius: 2px; }
    .emote { height: 24px; vertical-align: middle; margin: 0 4px; }
  }
</style>

<style lang="scss" scoped>
/* ─────────────────────────────────────────
   BASE OVERLAY
───────────────────────────────────────── */
.stream-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
}

/* ─────────────────────────────────────────
   CHAT CONTAINER  (default)
───────────────────────────────────────── */
.chat-container {
  position: absolute;
  z-index: 200;
  padding: 1.25rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  .fade-enter-active, .fade-leave-active, .fade-move {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fade-enter-from  { opacity: 0; transform: translateY(20px) scale(0.95); }
  .fade-leave-to    { opacity: 0; transform: translateX(-20px); }

  .chat-message {
    -webkit-font-smoothing: antialiased;
    display: inline-block;
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.875rem;
    border-radius: 12px;
    line-height: 1.4;
    font-size: 1rem;
    font-weight: 500;
    word-wrap: break-word;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.04);
    &:last-child { margin-bottom: 0; }
    .author  { font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.8); filter: drop-shadow(0 0 8px currentColor); }
    .colon   { color: rgba(255,255,255,0.4); margin-right: 4px; }
    .message { color: #f1f5f9; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }
  }
}

/* ─────────────────────────────────────────
   BOTTOM BAR  (default)
───────────────────────────────────────── */
.bottom-bar {
  position: absolute;
  z-index: 200;
  bottom: 0; left: 0; right: 0;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.4);
  gap: 1rem;

  .bar-text {
    font-weight: 800;
    font-size: 1.125rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
    flex-shrink: 0;
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rpg-ticker {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    overflow: hidden;
    flex: 1;
    min-width: 0;

    .rpg-badge {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 5px;
      padding: 0.15rem 0.45rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .ticker-track {
      overflow: hidden;
      flex: 1;
      min-width: 0;
      position: relative;
      height: 1.4em;
    }

    .ticker-text {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: rgba(255, 255, 255, 0.75);
      position: absolute;
      width: 100%;
      &.boss     { color: #fca5a5; }
      &.monster  { color: #fdba74; }
      &.treasure { color: #fde047; }
      &.training { color: #86efac; }
      &.idle     { color: rgba(255, 255, 255, 0.3); }
    }
  }

  .ticker-fade-enter-active, .ticker-fade-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .ticker-fade-enter-from { opacity: 0; transform: translateY(6px); }
  .ticker-fade-leave-to   { opacity: 0; transform: translateY(-6px); }
}

/* ─────────────────────────────────────────
   SPLASH  (default)
───────────────────────────────────────── */
.splash {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .splash-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    image-rendering: pixelated;
    z-index: 0;
  }

  &.starting .splash-bg {
    background-color: #0f172a;
    background-image: var(--splash-starting-img, none);
    background-size: cover;
    background-position: center;
  }
  &.brb .splash-bg {
    background-color: #0f172a;
    background-image: var(--splash-brb-img, none);
    background-size: cover;
    background-position: center;
  }
  &.ending .splash-bg {
    background-color: #0f172a;
    background-image: var(--splash-ending-img, none);
    background-size: cover;
    background-position: center;
  }

  &.starting {
    background: radial-gradient(ellipse at 50% 40%, #312e81 0%, #0f172a 60%);
    .splash-eyebrow { color: #818cf8; }
    .splash-title   { background: linear-gradient(135deg, #c7d2fe, #818cf8, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .splash-glow    { background: radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 60%); }
  }
  &.brb {
    background: radial-gradient(ellipse at 50% 40%, #7c2d12 0%, #0f172a 60%);
    .splash-eyebrow { color: #fb923c; }
    .splash-title   { background: linear-gradient(135deg, #fed7aa, #fb923c, #ea580c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .splash-glow    { background: radial-gradient(circle, rgba(251,146,60,0.5) 0%, transparent 60%); }
  }
  &.ending {
    background: radial-gradient(ellipse at 50% 40%, #881337 0%, #0f172a 60%);
    .splash-eyebrow { color: #fb7185; }
    .splash-title   { background: linear-gradient(135deg, #fecdd3, #fb7185, #e11d48); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .splash-glow    { background: radial-gradient(circle, rgba(244,63,94,0.5) 0%, transparent 60%); }
  }
}

.splash-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.08); }
}

.splash-content {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  animation: splash-rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes splash-rise {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}

.splash-eyebrow {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.9;
}
.splash-title {
  font-size: clamp(3rem, 7vw, 6rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
}
.splash-sub {
  font-size: 1.25rem;
  font-weight: 400;
  color: rgba(255,255,255,0.5);
  margin-top: 0.25rem;
}
.splash-frame { display: none; }

.splash-fade-enter-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.splash-fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.splash-fade-enter-from   { opacity: 0; transform: scale(1.03); }
.splash-fade-leave-to     { opacity: 0; transform: scale(0.97); }

/* ─────────────────────────────────────────
   ARENA STRIP  (sits above bottom bar)
───────────────────────────────────────── */
.arena-overlay {
  position: fixed;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 190;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem 0.75rem;
  background: linear-gradient(to top, rgba(15,23,42,0.92) 0%, transparent 50%);
  border-radius: 0;
  border: none;
  pointer-events: none;
  width: 760px;
  height: 170px;
  overflow: visible; /* allow damage numbers to float above */
}

/* ── Party row (left) ── */
.party-side {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex: 0 0 330px;
}

.fighter-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  width: 68px;
  flex-shrink: 0;
  transition: opacity 0.8s ease;
  &.dead { opacity: 0.35; filter: grayscale(0.6); }
}

.fighter-canvas {
  width: 68px;
  height: 68px;
  image-rendering: pixelated;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.7));
  transform: scaleX(1); /* naturally faces right toward monster */
}

.fighter-hp-bar {
  width: 60px;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.fighter-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 2px;
  transition: width 0.8s ease;
}

.fighter-name {
  font-size: 0.6rem;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 68px;
  text-align: center;
  &.win  { color: #86efac; }
  &.loss { color: #fca5a5; }
}

.dmg-number {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1rem;
  font-weight: 900;
  color: #facc15;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  pointer-events: none;
  animation: dmg-float 1.4s ease-out forwards;
  white-space: nowrap;
  z-index: 10;
}

@keyframes dmg-float {
  0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
  20%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(-48px); }
}

.loot-badge {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.5rem;
  font-weight: 700;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  white-space: nowrap;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  &.common    { background: rgba(156,163,175,0.2); color: #9ca3af; border: 1px solid rgba(156,163,175,0.4); }
  &.uncommon  { background: rgba(34,197,94,0.15);  color: #22c55e; border: 1px solid rgba(34,197,94,0.4);  }
  &.rare      { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.4); }
  &.epic      { background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); }
  &.legendary { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4); }
}

/* ── Center ── */
.arena-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex: 0 0 130px;
  padding: 0;
}

.arena-vs {
  font-size: 1.5rem;
  animation: vs-pulse 2s ease-in-out infinite;
}

@keyframes vs-pulse {
  0%, 100% { transform: scale(1);    opacity: 0.7; }
  50%       { transform: scale(1.15); opacity: 1;  }
}

.combat-text {
  font-size: 0.78rem;
  font-weight: 700;
  color: #e2e8f0;
  text-align: center;
  text-shadow: 0 0 10px rgba(226,232,240,0.3);
  min-height: 1.2em;
}

/* ── Monster (right) ── */
.monster-side {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 0 0 100px;
}

.monster-name {
  font-size: 0.65rem;
  font-weight: 800;
  color: #fca5a5;
  text-shadow: 0 0 8px rgba(239,68,68,0.6);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.monster-hp-bar {
  width: 96px;
  height: 5px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.monster-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f87171);
  border-radius: 3px;
}

.monster-canvas {
  width: 96px;
  height: 96px;
  image-rendering: pixelated;
  display: block;
  transform: scaleX(1);
  filter: drop-shadow(0 4px 16px rgba(239,68,68,0.35));
}

/* ── Transitions ── */
.arena-fade-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.arena-fade-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.arena-fade-enter-from   { opacity: 0; transform: translateX(-50%) translateY(100%); }
.arena-fade-leave-to     { opacity: 0; transform: translateX(-50%) translateY(100%); }

.combat-text-fade-enter-active, .combat-text-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.combat-text-fade-enter-from { opacity: 0; transform: translateY(4px); }
.combat-text-fade-leave-to   { opacity: 0; transform: translateY(-4px); }

.loot-pop-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.loot-pop-enter-from   { opacity: 0; transform: scale(0.5); }

/* ═════════════════════════════════════════
   WOW CLASSIC THEME
═════════════════════════════════════════ */

/* -- Variables -- */
.theme-wow-classic {
  --wow-gold:       #c8a243;
  --wow-gold-bright:#ffd700;
  --wow-bronze:     #7a5200;
  --wow-dark:       #030818;
  --wow-brown:      #1a0e00;
  --wow-font:       'Palatino Linotype', 'Palatino', 'Book Antiqua', 'Georgia', serif;

  /* Splash image vars — populated from generated art */
  --splash-starting-img: none;
  --splash-brb-img:      none;
  --splash-ending-img:   none;
}

/* -- Chat container -- */
.theme-wow-classic .chat-container {
  background: rgba(3, 8, 24, 0.96);
  backdrop-filter: none;
  border-radius: 3px;
  border: 2px solid var(--wow-gold);
  box-shadow:
    0 0 0 1px var(--wow-brown),
    0 0 0 3px rgba(3, 8, 24, 0.9),
    0 0 0 4px var(--wow-bronze),
    inset 0 0 0 1px rgba(200, 162, 67, 0.15),
    0 0 24px rgba(200, 162, 67, 0.12);
  padding: 0.875rem;
}

/* Corner ornaments */
.chat-frame-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  z-index: 10;
  pointer-events: none;
  background: var(--wow-gold);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
.chat-frame-corner.tl { top: -7px;  left: -7px;  }
.chat-frame-corner.tr { top: -7px;  right: -7px; }
.chat-frame-corner.bl { bottom: -7px; left: -7px; }
.chat-frame-corner.br { bottom: -7px; right: -7px; }

/* -- Chat messages (WoW flat style, no bubbles) -- */
.theme-wow-classic .chat-container .chat-message {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0.1rem 0;
  margin-bottom: 0.15rem;
  font-family: var(--wow-font);
  font-size: 0.9rem;
  line-height: 1.3;

  .author {
    font-weight: 700;
    filter: none;
    text-shadow: 1px 1px 0 #000, -1px -1px 0 rgba(0,0,0,0.5);
  }
  .colon {
    color: rgba(255, 255, 255, 0.45);
    margin-right: 3px;
  }
  .message {
    color: #f5f0e0;
    text-shadow: 1px 1px 0 #000;
  }
}

/* -- Bottom bar -- */
.theme-wow-classic .bottom-bar {
  background: linear-gradient(180deg, #1c1000 0%, #0a0600 100%);
  border-top: 2px solid var(--wow-gold);
  backdrop-filter: none;
  box-shadow:
    0 0 0 1px var(--wow-bronze),
    inset 0 1px 0 rgba(200, 162, 67, 0.2),
    0 -4px 20px rgba(0, 0, 0, 0.6);

  .bar-text {
    font-family: var(--wow-font);
    font-size: 1rem;
    letter-spacing: 0.08em;
    background: linear-gradient(135deg, #ffd700 0%, #c8a243 40%, #ffd700 80%, #c8a243 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
    filter: drop-shadow(0 0 4px rgba(200,162,67,0.6));
  }

  .rpg-badge {
    color: var(--wow-gold) !important;
    background: rgba(200, 162, 67, 0.15) !important;
    border-color: rgba(200, 162, 67, 0.4) !important;
    font-family: var(--wow-font);
    border-radius: 2px !important;
  }
  .ticker-text { color: #d4b896 !important; font-family: var(--wow-font); }
  .ticker-text.boss     { color: #ff4040 !important; }
  .ticker-text.monster  { color: #ff9f40 !important; }
  .ticker-text.treasure { color: var(--wow-gold-bright) !important; }
  .ticker-text.training { color: #40ff80 !important; }
}

/* -- Splash screens -- */
.theme-wow-classic .splash {
  font-family: var(--wow-font);
}

.theme-wow-classic .splash .splash-bg {
  filter: brightness(0.55) saturate(1.3);
}

/* Dark gradient scrim over bg image */
.theme-wow-classic .splash::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(3,8,24,0.5) 0%,
    rgba(3,8,24,0.15) 35%,
    rgba(3,8,24,0.15) 65%,
    rgba(3,8,24,0.7) 100%
  );
  pointer-events: none;
}

.theme-wow-classic .splash-content { z-index: 3; }
.theme-wow-classic .splash-glow    { z-index: 2; }

.theme-wow-classic .splash.starting {
  background: linear-gradient(180deg, #000510 0%, #050e28 50%, #080318 100%);
  .splash-eyebrow { color: #818cf8; letter-spacing: 0.22em; }
  .splash-title {
    font-size: clamp(3.5rem, 8vw, 7rem);
    background: linear-gradient(135deg, #ffd700 0%, #c8a243 40%, #fff4c2 60%, #c8a243 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(200,162,67,0.7));
    text-shadow: none;
  }
  .splash-sub { color: rgba(200, 162, 67, 0.6); font-style: italic; }
  .splash-glow { background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(200,162,67,0.1) 40%, transparent 70%); }
}

.theme-wow-classic .splash.brb {
  background: linear-gradient(180deg, #1a0800 0%, #0d0500 50%, #050205 100%);
  .splash-eyebrow { color: #c8a243; letter-spacing: 0.22em; }
  .splash-title {
    font-size: clamp(3.5rem, 8vw, 7rem);
    background: linear-gradient(135deg, #ffd700 0%, #c8a243 40%, #fff4c2 60%, #c8a243 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(200,162,67,0.7));
    text-shadow: none;
  }
  .splash-sub { color: rgba(200, 162, 67, 0.6); font-style: italic; }
  .splash-glow { background: radial-gradient(circle, rgba(251,146,60,0.25) 0%, rgba(200,162,67,0.1) 40%, transparent 70%); }
}

.theme-wow-classic .splash.ending {
  background: linear-gradient(180deg, #100005 0%, #1a0008 50%, #0a0000 100%);
  .splash-eyebrow { color: #fb7185; letter-spacing: 0.22em; }
  .splash-title {
    font-size: clamp(3.5rem, 8vw, 7rem);
    background: linear-gradient(135deg, #ffd700 0%, #c8a243 40%, #fff4c2 60%, #c8a243 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(200,162,67,0.7));
    text-shadow: none;
  }
  .splash-sub { color: rgba(200, 162, 67, 0.6); font-style: italic; }
  .splash-glow { background: radial-gradient(circle, rgba(244,63,94,0.25) 0%, rgba(200,162,67,0.1) 40%, transparent 70%); }
}

/* WoW splash frame decorations */
.theme-wow-classic .splash-frame {
  display: block;
  position: absolute;
  inset: 2.5rem;
  z-index: 3;
  pointer-events: none;
  border: 2px solid var(--wow-gold);
  box-shadow:
    0 0 0 1px var(--wow-bronze),
    0 0 0 3px rgba(3,8,24,0.6),
    0 0 0 4px var(--wow-bronze),
    inset 0 0 0 1px rgba(200,162,67,0.12),
    0 0 40px rgba(200,162,67,0.15);
}

.theme-wow-classic .splash-frame-tl,
.theme-wow-classic .splash-frame-tr,
.theme-wow-classic .splash-frame-bl,
.theme-wow-classic .splash-frame-br {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--wow-gold);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
.theme-wow-classic .splash-frame-tl { top: -10px;    left: -10px;  }
.theme-wow-classic .splash-frame-tr { top: -10px;    right: -10px; }
.theme-wow-classic .splash-frame-bl { bottom: -10px; left: -10px;  }
.theme-wow-classic .splash-frame-br { bottom: -10px; right: -10px; }
</style>
