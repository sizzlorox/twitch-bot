<template>
  <div class="overlay-canvas">
    <div class="chat-container" :style="chatStyle">
      <transition-group name="fade">
        <div class="chat-message" v-for="msgData in recentMessages" :key="msgData.id">
          <span class="author" v-html="msgData.author" :style="{ color: msgData.authorColor }">
          </span>
          <span class="colon">
            :&nbsp;
          </span>
          <span class="message" v-html="msgData.msg">
          </span>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const botUrl = import.meta.env.VITE_BOT_URL || 'http://localhost:3000/bot';
const apiBase = botUrl.replace(/\/bot$/, '');

const es = new EventSource(botUrl);
const recentMessages = ref([]);
const chatConfig = ref({ width: 420, height: 480, x: 20, y: 20 });

// Fetch initial settings
fetch(`${apiBase}/settings`)
  .then(r => r.json())
  .then(s => { if (s.chat) chatConfig.value = { ...chatConfig.value, ...s.chat }; })
  .catch(() => {});

const chatStyle = computed(() => ({
  width:  `${chatConfig.value.width}px`,
  height: `${chatConfig.value.height}px`,
  left:   `${chatConfig.value.x}px`,
  top:    `${chatConfig.value.y}px`,
}));

const handleMsg = (e) => {
  const { id, msg, author, authorColor, emotes, badges } = JSON.parse(e.data);

  let newAuthor = author;
  if (badges && badges.length) {
    newAuthor = badges.map(b => `<img src="${b}" class="badge"></img>`).join('') + '&nbsp;' + newAuthor;
  }

  // Parse emotes strictly by index using an array of characters
  let msgChars = Array.from(msg);
  if (emotes) {
    const emotePlacements = [];
    for (const [key, positions] of Object.entries(emotes)) {
      for (const pos of positions) {
        const [start, end] = pos.split('-').map(Number);
        emotePlacements.push({ key, start, end });
      }
    }
    // Sort descending by start index to safely replace from end to start without affecting previous indexes
    emotePlacements.sort((a, b) => b.start - a.start);

    for (const { key, start, end } of emotePlacements) {
      const img = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${key}/default/dark/1.0" class="emote"></img>`;
      msgChars.splice(start, end - start + 1, img);
    }
  }

  const newMsg = msgChars.join('');

  recentMessages.value.push({ id, author: newAuthor, msg: newMsg.trim(), authorColor });
  if (recentMessages.value.length >= 15) recentMessages.value.shift();
};

const handleSettings = (e) => {
  const data = JSON.parse(e.data);
  if (data.chat) chatConfig.value = { ...chatConfig.value, ...data.chat };
};

onMounted(() => {
  es.addEventListener('msg', handleMsg);
  es.addEventListener('settings', handleSettings);
});

onBeforeUnmount(() => {
  es.removeEventListener('msg', handleMsg);
  es.removeEventListener('settings', handleSettings);
  es.close();
});
</script>

<style lang="scss">
  /* Global emote styling to ensure inserted HTML aligns nicely */
  .chat-message {
    .badge {
      height: 18px;
      vertical-align: middle;
      border-radius: 2px;
    }
    .emote {
      height: 24px;
      vertical-align: middle;
      margin: 0 4px;
    }
  }
</style>

<style lang="scss" scoped>
  @use './css/variables.scss' as *;

  .overlay-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  .chat-container {
    position: absolute;
    padding: 1.25rem;
    overflow: hidden;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    /* Glassmorphism */
    border-radius: 20px;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

    /* Vue Transition Styles */
    .fade-enter-active, .fade-leave-active, .fade-move {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .fade-enter-from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    .fade-leave-to {
      opacity: 0;
      transform: translateX(-20px);
    }

    .chat-message {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;

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

      &:last-child {
        margin-bottom: 0;
      }

      .author {
        font-weight: 800;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        filter: drop-shadow(0 0 8px currentColor);
      }

      .colon {
        color: rgba(255, 255, 255, 0.4);
        margin-right: 4px;
      }

      .message {
        color: #f1f5f9;
        text-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
    }
  }
</style>
