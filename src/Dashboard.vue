<template>
  <div class="dashboard-wrapper">
    <nav class="nav">
      <div class="nav-brand">SizzBot</div>
      <div class="nav-links">
        <router-link to="/" class="nav-btn" exact-active-class="active">Dashboard</router-link>
        <router-link to="/stream" class="nav-btn" exact-active-class="active">Stream UI</router-link>
        <router-link to="/rpg" class="nav-btn" exact-active-class="active">RPG</router-link>
      </div>
    </nav>

    <!-- Status strip -->
    <div class="status-strip">
      <div class="status-item">
        <span class="status-dot" :class="tts.synth ? 'online' : 'error'"></span>
        TTS {{ tts.synth ? 'Healthy' : 'Disabled' }}
      </div>
      <div class="status-item">
        <span class="status-dot" :class="botConnected ? 'online' : 'error'"></span>
        Bot {{ botConnected ? 'Connected' : 'Disconnected' }}
      </div>
    </div>

    <div class="dashboard-body">
      <!-- Left: controls -->
      <div class="main-col">

        <section class="section">
          <h2 class="section-title">OBS Browser Sources</h2>
          <div class="obs-card" v-for="src in obsSources" :key="src.label">
            <div class="obs-meta">
              <span class="obs-label">{{ src.label }}</span>
              <span class="obs-desc">{{ src.desc }}</span>
            </div>
            <div class="obs-url-row">
              <code class="obs-url">{{ src.url }}</code>
              <button class="copy-btn" @click="copyUrl(src.url, src.label)" :class="{ copied: copiedLabel === src.label }">
                {{ copiedLabel === src.label ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Theme</h2>
          <div class="theme-grid">
            <button
              v-for="t in themes"
              :key="t.key"
              class="theme-card"
              :class="{ active: settings.theme === t.key }"
              @click="setTheme(t.key)"
            >
              <div class="theme-preview" :class="t.key">
                <div class="tp-chat">
                  <div class="tp-corner tl"></div>
                  <div class="tp-corner tr"></div>
                  <div class="tp-corner bl"></div>
                  <div class="tp-corner br"></div>
                  <div class="tp-msg"><span class="tp-author" :style="{ color: t.sampleColor }">Player</span><span class="tp-colon">:</span><span class="tp-text"> Hello!</span></div>
                  <div class="tp-msg"><span class="tp-author" :style="{ color: t.sampleColor2 }">Viewer</span><span class="tp-colon">:</span><span class="tp-text"> gg!</span></div>
                </div>
                <div class="tp-bar">{{ t.barSample }}</div>
              </div>
              <div class="theme-card-info">
                <span class="theme-card-icon">{{ t.icon }}</span>
                <div>
                  <div class="theme-card-name">{{ t.label }}</div>
                  <div class="theme-card-desc">{{ t.desc }}</div>
                </div>
                <span v-if="settings.theme === t.key" class="theme-active-badge">Active</span>
              </div>
            </button>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Splash Screens</h2>
          <div class="control-card">
            <div class="control-card-title">Scene Overlays</div>
            <div class="splash-btns">
              <button
                v-for="s in splashOptions"
                :key="s.key"
                class="splash-btn"
                :class="[s.theme, { active: settings.splash === s.key }]"
                @click="setSplash(s.key)"
              >
                <span class="splash-btn-icon">{{ s.icon }}</span>
                <span class="splash-btn-label">{{ s.label }}</span>
                <span class="splash-btn-hint">{{ settings.splash === s.key ? 'Click to dismiss' : s.hint }}</span>
              </button>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Stream Controls</h2>

          <div class="control-card">
            <div class="control-card-title">
              Preview
              <span class="hint-text">drag chat box to reposition</span>
            </div>
            <div class="preview-canvas" :class="`theme-${settings.theme}`" ref="previewRef">
              <div class="preview-screen"></div>
              <div
                class="preview-chat"
                :style="previewChatStyle"
                @mousedown.prevent="startDrag"
              >
                <template v-if="settings.theme === 'wow-classic'">
                  <span class="preview-wow-corner tl"></span>
                  <span class="preview-wow-corner tr"></span>
                  <span class="preview-wow-corner bl"></span>
                  <span class="preview-wow-corner br"></span>
                </template>
                <span class="preview-chat-label">Chat</span>
              </div>
              <div class="preview-bar">
                <span class="preview-bar-msg">{{ settings.streamMessage || 'Stream message…' }}</span>
                <span class="preview-bar-rpg">
                  <span class="preview-rpg-badge">⚔️ RPG</span>
                  <span class="preview-rpg-text" :class="previewRpgEvent && previewRpgEvent.event_type">
                    {{ previewRpgEvent ? previewRpgEvent.summary : 'Waiting for events…' }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div class="control-card">
            <div class="control-card-title">Bottom Bar Message</div>
            <input
              class="text-input"
              type="text"
              maxlength="200"
              placeholder="Stream message..."
              v-model="settings.streamMessage"
              @input="saveSettings"
            />
          </div>

          <div class="control-card">
            <div class="control-card-title">Chat Overlay</div>
            <div class="control-grid">
              <div class="control-row">
                <label>Width <span class="value-badge">{{ settings.chat.width }}px</span></label>
                <input type="range" min="200" max="800" step="10" v-model.number="settings.chat.width" @input="saveSettings" />
              </div>
              <div class="control-row">
                <label>Height <span class="value-badge">{{ settings.chat.height }}px</span></label>
                <input type="range" min="200" max="900" step="10" v-model.number="settings.chat.height" @input="saveSettings" />
              </div>
              <div class="control-row">
                <label>Position X <span class="value-badge">{{ settings.chat.x }}px</span></label>
                <input type="range" min="0" max="1700" step="10" v-model.number="settings.chat.x" @input="saveSettings" />
              </div>
              <div class="control-row">
                <label>Position Y <span class="value-badge">{{ settings.chat.y }}px</span></label>
                <input type="range" min="0" :max="CANVAS_H - BOTTOM_BAR_H - settings.chat.height" step="10" v-model.number="settings.chat.y" @input="saveSettings" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right: live chat + viewer list -->
      <div class="sidebar">

        <div class="sidebar-card">
          <div class="sidebar-card-title">Live Chat</div>
          <div class="chat-feed" ref="chatFeedRef">
            <div v-if="!chatMessages.length" class="empty-state">No messages yet…</div>
            <div
              v-for="m in chatMessages"
              :key="m.id"
              class="chat-row"
            >
              <span class="chat-badges" v-if="m.badges && m.badges.length">
                <img v-for="(b, i) in m.badges" :key="i" :src="b" class="chat-badge" />
              </span>
              <span class="chat-author" :style="{ color: m.authorColor || '#94a3b8' }">{{ m.author }}</span>
              <span class="chat-colon">:</span>
              <span class="chat-msg">{{ m.msg }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-card">
          <div class="sidebar-card-title">Top Viewers</div>
          <div v-if="!leaderboard.length" class="empty-state">No data yet…</div>
          <ol class="viewer-list" v-else>
            <li
              v-for="(entry, i) in leaderboard"
              :key="entry.username"
              class="viewer-row"
              :class="{ gold: i === 0, silver: i === 1, bronze: i === 2 }"
            >
              <span class="vr-rank">{{ i + 1 }}</span>
              <span class="vr-name">{{ entry.username }}</span>
              <span class="vr-pts">{{ entry.points }}pts</span>
            </li>
          </ol>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import TextToSpeech from './modules/tts';

const defaultBotUrl = import.meta.env.VITE_BOT_URL || 'http://localhost:3000/bot';
const apiBase = defaultBotUrl.replace(/\/bot$/, '');
const es = new EventSource(defaultBotUrl);
const botConnected = ref(es.readyState === 1);

const tts = new TextToSpeech();

const settings = reactive({
  streamMessage: '',
  chat: { width: 420, height: 480, x: 20, y: 20 },
  splash: null,
  theme: 'default',
});

const themes = [
  {
    key: 'default',
    label: 'Default',
    icon: '✨',
    desc: 'Clean modern overlay',
    sampleColor: '#38bdf8',
    sampleColor2: '#818cf8',
    barSample: 'STREAM',
  },
  {
    key: 'wow-classic',
    label: 'WoW: Classic',
    icon: '⚔️',
    desc: 'World of Warcraft Classic',
    sampleColor: '#ffd700',
    sampleColor2: '#40ff80',
    barSample: 'Azeroth',
  },
];

const setTheme = (key) => {
  settings.theme = key;
  saveSettings();
};

const splashOptions = [
  { key: 'starting', label: 'Starting Soon', icon: '🎬', hint: 'Stream is starting up', theme: 'theme-starting' },
  { key: 'brb',      label: 'Be Right Back', icon: '☕', hint: 'Taking a quick break',  theme: 'theme-brb' },
  { key: 'ending',   label: 'Stream Ending', icon: '👋', hint: 'Wrapping up the stream', theme: 'theme-ending' },
];

const setSplash = (key) => {
  settings.splash = settings.splash === key ? null : key;
  saveSettings();
};

fetch(`${apiBase}/settings`)
  .then(r => r.json())
  .then(s => {
    settings.streamMessage = s.streamMessage;
    Object.assign(settings.chat, s.chat);
    settings.splash = s.splash ?? null;
    settings.theme = s.theme ?? 'default';
  })
  .catch(() => {});

let saveTimer = null;
const saveSettings = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch(`${apiBase}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => {});
  }, 300);
};

// OBS Sources
const origin = window.location.origin;
const obsSources = [
  { label: 'Stream Overlay', url: `${origin}/stream`, desc: 'Chat + bottom bar — add as Browser Source in OBS' },
];
const copiedLabel = ref(null);
const copyUrl = (url, label) => {
  navigator.clipboard.writeText(url).then(() => {
    copiedLabel.value = label;
    setTimeout(() => copiedLabel.value = null, 2000);
  });
};

// Preview
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const BOTTOM_BAR_H = 48;
const previewRef = ref(null);

const previewChatStyle = computed(() => ({
  left:   `${(settings.chat.x / CANVAS_W) * 100}%`,
  top:    `${(settings.chat.y / CANVAS_H) * 100}%`,
  width:  `${(settings.chat.width  / CANVAS_W) * 100}%`,
  height: `${(settings.chat.height / CANVAS_H) * 100}%`,
}));

const startDrag = (e) => {
  const rect = previewRef.value.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  const offsetX = (e.clientX - rect.left) * scaleX - settings.chat.x;
  const offsetY = (e.clientY - rect.top)  * scaleY - settings.chat.y;
  const onMove = (e) => {
    const r = previewRef.value.getBoundingClientRect();
    settings.chat.x = Math.max(0, Math.min(Math.round((e.clientX - r.left) * scaleX - offsetX), CANVAS_W - settings.chat.width));
    settings.chat.y = Math.max(0, Math.min(Math.round((e.clientY - r.top)  * scaleY - offsetY), CANVAS_H - BOTTOM_BAR_H - settings.chat.height));
  };
  const onUp = () => {
    saveSettings();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
};

// Live chat
const chatMessages = ref([]);
const chatFeedRef = ref(null);

const scrollChat = () => nextTick(() => {
  if (chatFeedRef.value) chatFeedRef.value.scrollTop = chatFeedRef.value.scrollHeight;
});

watch(chatMessages, scrollChat, { deep: false });

// Leaderboard
const leaderboard = ref([]);

fetch(`${apiBase}/leaderboard?limit=10`)
  .then(r => r.json())
  .then(d => { leaderboard.value = d; })
  .catch(() => {});

// RPG preview event
const previewRpgEvent = ref(null);

fetch(`${apiBase}/rpg/events?limit=1`)
  .then(r => r.json())
  .then(d => { if (d.length) previewRpgEvent.value = d[0]; })
  .catch(() => {});

// SSE handlers
es.addEventListener('open', () => botConnected.value = true);
es.addEventListener('error', () => {
  if (es.readyState === EventSource.CLOSED) botConnected.value = false;
});

const handleTTS = (e) => {
  if (!e.isTrusted) return;
  const parsedData = JSON.parse(e.data);
  if (parsedData && typeof parsedData === 'object') {
    tts.speak(parsedData.msg, parsedData.speed);
  } else {
    tts.speak(String(parsedData));
  }
};

const handleMsg = (e) => {
  if (!e.isTrusted) return;
  const { id, msg, author, authorColor, badges } = JSON.parse(e.data);
  chatMessages.value.push({ id, msg, author, authorColor, badges });
  if (chatMessages.value.length > 100) chatMessages.value.shift();
};

const handleLeaderboard = (e) => {
  leaderboard.value = JSON.parse(e.data);
};

const handleRpgEvent = (e) => {
  previewRpgEvent.value = JSON.parse(e.data);
};

onMounted(() => {
  es.addEventListener('tts', handleTTS);
  es.addEventListener('msg', handleMsg);
  es.addEventListener('leaderboard', handleLeaderboard);
  es.addEventListener('rpg_event', handleRpgEvent);
});

onBeforeUnmount(() => {
  es.removeEventListener('tts', handleTTS);
  es.removeEventListener('msg', handleMsg);
  es.removeEventListener('leaderboard', handleLeaderboard);
  es.removeEventListener('rpg_event', handleRpgEvent);
  es.close();
});
</script>

<style lang="scss" scoped>
.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 56px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 50;

  .nav-brand {
    font-weight: 800;
    font-size: 1.125rem;
    background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-links { display: flex; gap: 0.5rem; }

  .nav-btn {
    color: #94a3b8;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0.4rem 0.875rem;
    border-radius: 8px;
    transition: all 0.15s;

    &:hover { color: #f8fafc; background: rgba(255,255,255,0.05); }
    &.active { color: #fff; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.2); }
  }
}

.status-strip {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem 2rem;
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  .status-item { display: flex; align-items: center; gap: 0.4rem; }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &.online {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    &.error { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.dashboard-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 0;
  flex: 1;
  min-height: 0;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

/* ── Main column ── */
.main-col {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  border-right: 1px solid rgba(255,255,255,0.06);
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
  margin: 0 0 0.875rem;
}

.obs-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

.obs-meta { display: flex; align-items: baseline; gap: 0.625rem; }
.obs-label { font-size: 0.875rem; font-weight: 700; color: #f8fafc; }
.obs-desc  { font-size: 0.75rem; color: #475569; }

.obs-url-row { display: flex; align-items: center; gap: 0.625rem; }

.obs-url {
  flex: 1;
  background: rgba(15,23,42,0.7);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 7px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  color: #94a3b8;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.copy-btn {
  flex-shrink: 0;
  padding: 0.3rem 0.75rem;
  border-radius: 7px;
  border: 1px solid rgba(56,189,248,0.3);
  background: rgba(56,189,248,0.08);
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  font-family: inherit;

  &:hover { background: rgba(56,189,248,0.18); border-color: rgba(56,189,248,0.6); }
  &.copied { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.4); color: #10b981; }
}

.control-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1.125rem 1.25rem;
  margin-bottom: 0.875rem;

  .control-card-title {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }
}

.hint-text {
  font-size: 0.7rem;
  font-weight: 400;
  color: #334155;
  text-transform: none;
  letter-spacing: 0;
}

.preview-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f172a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
}

.preview-screen {
  position: absolute;
  inset: 0;
  bottom: 4.44%;
  background: #00b140;
  opacity: 0.1;
}

.preview-chat {
  position: absolute;
  background: rgba(56,189,248,0.1);
  border: 1.5px dashed rgba(56,189,248,0.55);
  border-radius: 5px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  transition: background 0.15s;

  &:hover { background: rgba(56,189,248,0.18); border-color: rgba(56,189,248,0.85); }
  &:active { cursor: grabbing; }
}

.preview-chat-label {
  font-size: 0.6rem;
  font-weight: 700;
  color: rgba(56,189,248,0.85);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  pointer-events: none;
}

.preview-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4.44%;
  min-height: 12px;
  background: rgba(15,23,42,0.9);
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
  pointer-events: none;
  overflow: hidden;
  gap: 0.4rem;

  .preview-bar-msg {
    font-size: 0.5rem;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    max-width: 40%;
  }

  .preview-bar-rpg {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    overflow: hidden;
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
  }

  .preview-rpg-badge {
    font-size: 0.42rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #818cf8;
    background: rgba(99,102,241,0.2);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 2px;
    padding: 0 0.2rem;
    white-space: nowrap;
    flex-shrink: 0;
    line-height: 1.6;
  }

  .preview-rpg-text {
    font-size: 0.44rem;
    font-weight: 500;
    color: rgba(255,255,255,0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.boss     { color: #fca5a5; }
    &.monster  { color: #fdba74; }
    &.treasure { color: #fde047; }
    &.training { color: #86efac; }
  }
}

/* ── WoW Classic preview overrides ── */
.preview-canvas.theme-wow-classic {
  background: radial-gradient(ellipse at 50% 30%, #0d0a2a 0%, #030818 70%);

  .preview-screen {
    background: transparent;
    opacity: 1;
    /* Subtle star-field hint */
    background-image:
      radial-gradient(circle at 20% 30%, rgba(99,102,241,0.08) 0%, transparent 40%),
      radial-gradient(circle at 80% 60%, rgba(200,162,67,0.05) 0%, transparent 40%);
  }

  .preview-chat {
    background: rgba(3, 8, 24, 0.9);
    border: 1.5px solid #c8a243;
    border-radius: 2px;
    box-shadow:
      0 0 0 1px #5a3800,
      0 0 0 2.5px rgba(3,8,24,0.9),
      0 0 0 3.5px #7a5200,
      0 0 12px rgba(200,162,67,0.18);

    &:hover {
      background: rgba(3, 8, 24, 0.95);
      border-color: #ffd700;
      box-shadow:
        0 0 0 1px #7a5200,
        0 0 0 2.5px rgba(3,8,24,0.9),
        0 0 0 3.5px #c8a243,
        0 0 16px rgba(200,162,67,0.3);
    }
  }

  .preview-chat-label {
    color: #c8a243;
    font-family: 'Palatino Linotype', serif;
    letter-spacing: 0.12em;
    font-weight: 700;
  }

  .preview-bar {
    background: linear-gradient(180deg, #1c1000 0%, #080400 100%);
    border-top: 1.5px solid #c8a243;
    box-shadow: inset 0 1px 0 rgba(200,162,67,0.15);

    .preview-bar-msg {
      color: #c8a243;
      font-family: 'Palatino Linotype', serif;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: none;
    }

    .preview-rpg-badge {
      color: #c8a243;
      background: rgba(200,162,67,0.15);
      border-color: rgba(200,162,67,0.35);
      border-radius: 2px;
    }

    .preview-rpg-text {
      color: #d4b896;
      font-family: 'Palatino Linotype', serif;
      &.boss     { color: #ff4040; }
      &.monster  { color: #ff9f40; }
      &.treasure { color: #ffd700; }
      &.training { color: #40ff80; }
    }
  }
}

/* WoW corner diamond ornaments inside preview chat */
.preview-wow-corner {
  position: absolute;
  width: 7px;
  height: 7px;
  background: #c8a243;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  pointer-events: none;
  z-index: 2;

  &.tl { top: -3.5px;    left: -3.5px;  }
  &.tr { top: -3.5px;    right: -3.5px; }
  &.bl { bottom: -3.5px; left: -3.5px;  }
  &.br { bottom: -3.5px; right: -3.5px; }
}

.text-input {
  width: 100%;
  background: rgba(15,23,42,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.55rem 0.8rem;
  color: #f8fafc;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &:focus { border-color: rgba(56,189,248,0.5); }
  &::placeholder { color: #475569; }
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  input[type="range"] {
    width: 100%;
    accent-color: #38bdf8;
    cursor: pointer;
  }
}

.value-badge {
  background: rgba(56,189,248,0.12);
  color: #38bdf8;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ── Sidebar ── */
.sidebar {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px - 36px); /* nav + status strip */
  position: sticky;
  top: calc(56px + 36px);
  overflow: hidden;
}

.sidebar-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 1rem;

  &:last-child { border-bottom: none; }
}

.sidebar-card-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.empty-state {
  color: #334155;
  font-size: 0.8rem;
  padding: 0.5rem 0;
}

/* Live Chat */
.chat-feed {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
}

.chat-row {
  font-size: 0.8rem;
  line-height: 1.4;
  word-break: break-word;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;

  .chat-badges {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .chat-badge {
    height: 16px;
    width: 16px;
    vertical-align: middle;
    border-radius: 2px;
  }
  .chat-author {
    font-weight: 700;
    margin-right: 1px;
  }
  .chat-colon {
    color: rgba(255,255,255,0.25);
    margin-right: 4px;
  }
  .chat-msg { color: #94a3b8; }
}

/* Viewer List */
.viewer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
}

.viewer-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;

  .vr-rank { width: 1.25rem; color: #334155; font-weight: 700; font-size: 0.7rem; }
  .vr-name { flex: 1; font-weight: 600; color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vr-pts  { font-size: 0.7rem; color: #475569; white-space: nowrap; }

  &.gold   { .vr-rank { color: #eab308; } }
  &.silver { .vr-rank { color: #94a3b8; } }
  &.bronze { .vr-rank { color: #b47c3c; } }
}

/* Theme selector */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.875rem;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(15,23,42,0.5);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s ease;
  overflow: hidden;
  text-align: left;
  padding: 0;

  &:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-1px); }

  &.active {
    border-color: rgba(56,189,248,0.5);
    box-shadow: 0 0 16px rgba(56,189,248,0.15);

    .theme-active-badge { display: inline-flex; }
  }
}

/* Mini preview */
.theme-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  &.default {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    .tp-chat {
      background: rgba(15,23,42,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      backdrop-filter: blur(4px);
    }
    .tp-text { color: #f1f5f9; }
    .tp-bar  { background: rgba(15,23,42,0.85); border-top: 1px solid rgba(255,255,255,0.1); color: #f8fafc; font-size: 0.45rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .tp-corner { display: none; }
  }

  &.wow-classic {
    background: linear-gradient(180deg, #030818 0%, #08051a 100%);
    .tp-chat {
      background: rgba(3,8,24,0.96);
      border: 1.5px solid #c8a243;
      border-radius: 1px;
      box-shadow: 0 0 0 1px #5a3800, 0 0 0 2.5px rgba(3,8,24,0.9), 0 0 0 3px #7a5200;
    }
    .tp-corner {
      display: block;
      background: #c8a243;
      clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    }
    .tp-author { font-family: 'Palatino Linotype', serif; font-weight: 700; }
    .tp-text   { color: #f5f0e0; font-family: 'Palatino Linotype', serif; }
    .tp-colon  { color: rgba(255,255,255,0.4); }
    .tp-bar {
      background: linear-gradient(180deg, #1c1000, #0a0600);
      border-top: 1.5px solid #c8a243;
      color: #c8a243;
      font-family: 'Palatino Linotype', serif;
      font-size: 0.45rem;
      letter-spacing: 0.05em;
    }
  }
}

.tp-chat {
  position: absolute;
  left: 5%;
  top: 5%;
  width: 48%;
  height: 72%;
  padding: 4px 5px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
}

.tp-corner {
  position: absolute;
  width: 6px;
  height: 6px;
  z-index: 1;
}
.tp-corner.tl { top: -3px;    left: -3px;  }
.tp-corner.tr { top: -3px;    right: -3px; }
.tp-corner.bl { bottom: -3px; left: -3px;  }
.tp-corner.br { bottom: -3px; right: -3px; }

.tp-msg {
  font-size: 0.42rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tp-author { font-weight: 700; font-size: 0.42rem; }
.tp-colon  { color: rgba(255,255,255,0.35); margin: 0 1px; font-size: 0.42rem; }
.tp-text   { font-size: 0.42rem; }

.tp-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 11%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tp-bar-text { /* handled per-theme */ }

.theme-card-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.625rem 0.875rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.theme-card-icon { font-size: 1.1rem; flex-shrink: 0; }
.theme-card-name { font-size: 0.8rem; font-weight: 700; color: #f1f5f9; }
.theme-card-desc  { font-size: 0.68rem; color: #475569; }

.theme-active-badge {
  display: none;
  margin-left: auto;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #38bdf8;
  background: rgba(56,189,248,0.12);
  border: 1px solid rgba(56,189,248,0.3);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  flex-shrink: 0;
}

/* Splash controls */
.splash-btns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
}

.splash-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 1rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(15,23,42,0.5);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s ease;
  text-align: center;

  &:hover {
    border-color: rgba(255,255,255,0.15);
    background: rgba(30,41,59,0.7);
    transform: translateY(-1px);
  }

  .splash-btn-icon  { font-size: 1.5rem; line-height: 1; }
  .splash-btn-label { font-size: 0.8rem; font-weight: 700; color: #f1f5f9; }
  .splash-btn-hint  { font-size: 0.68rem; color: #475569; }

  &.theme-starting {
    &.active {
      border-color: rgba(99,102,241,0.6);
      background: rgba(99,102,241,0.12);
      box-shadow: 0 0 16px rgba(99,102,241,0.2);
      .splash-btn-label { color: #a5b4fc; }
      .splash-btn-hint  { color: #818cf8; }
    }
  }

  &.theme-brb {
    &.active {
      border-color: rgba(251,146,60,0.6);
      background: rgba(251,146,60,0.1);
      box-shadow: 0 0 16px rgba(251,146,60,0.2);
      .splash-btn-label { color: #fdba74; }
      .splash-btn-hint  { color: #fb923c; }
    }
  }

  &.theme-ending {
    &.active {
      border-color: rgba(244,63,94,0.6);
      background: rgba(244,63,94,0.1);
      box-shadow: 0 0 16px rgba(244,63,94,0.2);
      .splash-btn-label { color: #fda4af; }
      .splash-btn-hint  { color: #fb7185; }
    }
  }
}
</style>
