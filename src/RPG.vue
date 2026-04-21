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

    <div class="container">
      <header class="dashboard-header">
        <h1>Idle RPG</h1>
        <p>Live leaderboard &amp; event feed</p>
      </header>

      <div class="rpg-grid">
        <!-- Leaderboard -->
        <div class="rpg-card">
          <h2 class="card-title">Leaderboard</h2>
          <div v-if="leaderboard.length === 0" class="empty-state">No data yet</div>
          <ol class="leaderboard-list" v-else>
            <li
              v-for="(entry, i) in leaderboard"
              :key="entry.username"
              class="lb-row"
              :class="{ gold: i === 0, silver: i === 1, bronze: i === 2 }"
            >
              <span class="lb-rank">{{ i + 1 }}</span>
              <span class="lb-name">{{ entry.username }}</span>
              <span class="lb-pts">{{ entry.points }} pts</span>
            </li>
          </ol>
        </div>

        <!-- Event Feed -->
        <div class="rpg-card">
          <h2 class="card-title">Event Feed</h2>
          <div v-if="events.length === 0" class="empty-state">No events yet</div>
          <transition-group name="slide" tag="ul" class="event-list" v-else>
            <li
              v-for="ev in events"
              :key="ev.id"
              class="ev-row"
              :class="ev.event_type"
            >
              <span class="ev-type">{{ typeLabel(ev.event_type) }}</span>
              <span class="ev-summary">{{ ev.summary }}</span>
              <span class="ev-time">{{ formatTime(ev.created_at) }}</span>
            </li>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const botUrl = import.meta.env.VITE_BOT_URL || 'http://localhost:3000/bot';
const apiBase = botUrl.replace(/\/bot$/, '');

const leaderboard = ref([]);
const events = ref([]);

const TYPE_LABELS = { monster: '⚔️ Monster', boss: '🐉 Boss', treasure: '💰 Treasure', training: '📚 Training' };
const typeLabel = (t) => TYPE_LABELS[t] || t;

const formatTime = (ms) => {
  const d = new Date(ms);
  return d.toLocaleTimeString();
};

async function loadInitial() {
  const [lbRes, evRes] = await Promise.all([
    fetch(`${apiBase}/leaderboard?limit=10`),
    fetch(`${apiBase}/rpg/events?limit=20`),
  ]);
  if (lbRes.ok) leaderboard.value = await lbRes.json();
  if (evRes.ok) events.value = await evRes.json();
}

const es = new EventSource(botUrl);

const handleLeaderboard = (e) => {
  leaderboard.value = JSON.parse(e.data);
};

const handleRpgEvent = (e) => {
  const ev = JSON.parse(e.data);
  events.value.unshift(ev);
  if (events.value.length > 20) events.value.pop();
};

onMounted(() => {
  loadInitial();
  es.addEventListener('leaderboard', handleLeaderboard);
  es.addEventListener('rpg_event', handleRpgEvent);
});

onBeforeUnmount(() => {
  es.removeEventListener('leaderboard', handleLeaderboard);
  es.removeEventListener('rpg_event', handleRpgEvent);
  es.close();
});
</script>

<style lang="scss" scoped>
.dashboard-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;

  .nav-brand { font-weight: 800; font-size: 1.25rem; color: #f8fafc; }
  .nav-links { display: flex; gap: 0.5rem; }
  .nav-btn {
    padding: 0.4rem 1rem;
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    &:hover { background: rgba(255,255,255,0.08); color: #f8fafc; }
    &.active { background: rgba(99,102,241,0.2); color: #818cf8; }
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
  h1 { font-size: 1.75rem; font-weight: 800; color: #f8fafc; margin: 0 0 0.25rem; }
  p { color: rgba(255,255,255,0.5); margin: 0; }
}

.rpg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.rpg-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1.5rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 1.25rem;
}

.empty-state {
  color: rgba(255,255,255,0.3);
  text-align: center;
  padding: 2rem 0;
}

/* Leaderboard */
.leaderboard-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lb-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);

  .lb-rank { width: 1.5rem; font-weight: 700; color: rgba(255,255,255,0.4); }
  .lb-name { flex: 1; font-weight: 600; color: #f1f5f9; }
  .lb-pts  { font-size: 0.85rem; color: rgba(255,255,255,0.5); }

  &.gold   { border-color: rgba(234,179,8,0.4);   .lb-rank { color: #eab308; } }
  &.silver { border-color: rgba(148,163,184,0.4);  .lb-rank { color: #94a3b8; } }
  &.bronze { border-color: rgba(180,120,60,0.4);   .lb-rank { color: #b47c3c; } }
}

/* Event Feed */
.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 480px;
  overflow-y: auto;
}

.ev-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: start;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border-left: 3px solid rgba(255,255,255,0.1);
  font-size: 0.85rem;

  .ev-type    { font-weight: 700; white-space: nowrap; color: #f8fafc; }
  .ev-summary { color: rgba(255,255,255,0.7); word-break: break-word; }
  .ev-time    { color: rgba(255,255,255,0.3); white-space: nowrap; font-size: 0.75rem; }

  &.boss     { border-left-color: #ef4444; }
  &.monster  { border-left-color: #f97316; }
  &.treasure { border-left-color: #eab308; }
  &.training { border-left-color: #22c55e; }
}

.slide-enter-active { transition: all 0.3s ease; }
.slide-enter-from   { opacity: 0; transform: translateY(-10px); }
</style>
