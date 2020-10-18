<template>
  <div class="stream-container">
    <div class="stream-view">
      <div class="chat-container">
        <transition-group name="fade">
          <div class="chat-message" v-for="msgData in recentMessages" :key="msgData.id">
            <span class="author" :style="{ color: msgData.authorColor }">
              {{ msgData.author }}
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
    <div class="bottom-bar">
      reeeee
    </div>
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
      const { id, msg, author, authorColor, emotes } = JSON.parse(data);
      if (!isTrusted) return;

      let newMsg = msg;
      let newLength = 0;
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
        author,
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
  .stream-interface {
    display: flex;
    flex-direction: column;
    justify-content: space;
  }
  .stream-view {
    height: calc(100vh - 2rem);
    background-color: $green-screen;

    & > .chat-container {
      position: absolute;
      overflow: hidden;
      bottom: 32px;
      right: 0;

      height: calc(180px + 8px);
      min-height: calc(180px + 8px);

      width: calc(240px + 8px);
      min-width: calc(240px + 8px);
      max-width: calc(240px + 8px);
      padding: 8px;
      margin: 8px;

      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      float: right;

      border-radius: 4px;
      background: rgba(0, 20, 0, 0.95);

      .fade-enter-active, .fade-leave-active {
        transition: opacity .5s;
      }
      .fade-enter-from, .fade-leave-to {
        opacity: 0;
      }

      .chat-message {
        text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;

        display: inherit;
        transition: all .5s ease;

        span {
          color: white;
        }

        .message {
          display: flex;
          align-items: center;
        }
      }
    }
  }
  .bottom-bar {
    display: flex;
    justify-content: center;
    align-items: center;

    box-shadow: 0 -4px 4px black;

    height: 2rem;
    background-color: black;
    color: white;
  }
</style>