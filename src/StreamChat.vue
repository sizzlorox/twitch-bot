<template>
  <div class="chat-container">
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
</template>

<script>
import TextToSpeech from './modules';
// TODO: Get bot port from .env file
const es = new EventSource('http://localhost:3000/bot');

const listeners = [
  {
    event: 'tts',
    // ctx is vue component context
    func: ({ data, isTrusted }, ctx) => {
      if (!isTrusted) return;

      const parsedData = JSON.parse(data);
      if (typeof parsedData === 'object') {
        return ctx.tts.handleTTS(parsedData.msg, parsedData.speed);
      }
      ctx.tts.handleTTS(data);
    },
  },
  {
    event: 'msg',
    func: ({ data, isTrusted }, ctx) => {
      const { id, msg, author, authorColor, emotes, badges } = JSON.parse(data);
      if (!isTrusted) return;

      let newMsg = '';
      let newAuthor = author;
      let newLength = 0;
      if (badges.length) {
        newAuthor = badges.map(b => `<img src="${b}"></img>`).join('') + '&nbsp;' + newAuthor;
      }
      newMsg += msg;
      if (![undefined, null].includes(emotes)) {
        for (const [key, value] of Object.entries(emotes).sort(([,a], [,b]) => a[0].split('-')[0] - b[0].split('-')[0])) {
          for (const emote of value) {
            const se = emote.split('-');
            const start = Number(se[0]) - newLength;
            const end = Number(se[1]) - newLength;

            const oldLength = newMsg.length;
            const img = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${key}/default/dark/1.0"></img>`;
            newMsg = newMsg.replace(newMsg.substring(start, end + 1), img);
            newLength += oldLength - newMsg.length;
          }
        }
      }

      ctx.recentMessages = ctx.recentMessages.concat([{
        id,
        author: newAuthor,
        msg: newMsg.trim(),
        authorColor,
      }]);
      if (ctx.recentMessages.length >= 15) {
        ctx.recentMessages.shift();
      }
    },
  },
];

export default {
  data: function() {
    return {
      recentMessages: [],
      tts: new TextToSpeech(),
    };
  },
  created: function () {
    listeners.forEach(l => es.addEventListener(l.event, e => l.func(e, this)));
  },
  beforeUnmount: function () {
    listeners.forEach(l => es.removeEventListener(l.event, e => l.func(e, this)));
  }
}
</script>

<style lang="scss" scoped>
  @import 'src/css/variables.scss';
  .chat-container {
    padding: 16px;
    overflow: hidden;
    height: 360px;
    width: 420px;

    font-size: 24px;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    border-radius: 8px;
    box-shadow: inset 0px 0px 0px 2px white;
    background: rgba(0, 0, 0, 0.65);

    .fade-enter-active, .fade-leave-active {
      transition: opacity .5s;
    }
    .fade-enter-from, .fade-leave-to {
      opacity: 0;
    }

    .chat-message {
      text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;

      display: inherit;
      transition: all .5s ease;

      span {
        color: white;
      }

      .author, .colon, .message {
        display: flex;
        align-items: center;
      }
    }
  }
</style>