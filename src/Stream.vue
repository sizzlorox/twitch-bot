<template>
  <div class="stream-container">
    <div class="stream-view">
      <div class="chat-container">
        <div class="chat-message" v-for="(msgData, index) in recentMessages" :key="index">
          <span :style="{ color: msgData.authorColor }">
            {{ msgData.author }}
          </span>
          :&nbsp;
          <span>
            {{ msgData.msg }}
          </span>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      reeeee
    </div>
  </div>
</template>

<script>
import TextToSpeech from './modules';
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
      const { msg, author, authorColor, emotes } = JSON.parse(data);
      if (!isTrusted) return;
      // https://static-cdn.jtvnw.net/emoticons/v2/<ID>/default/dark/1.0
      // {
      //   "25": [
      //     "19-23"
      //   ],
      //   "86": [
      //     "8-17"
      //   ],
      //   "301182079": [
      //     "0-6"
      //   ]
      // }
      let newMsg = msg;
      const emoteIDs = Object.keys(emotes);
      // Need better way of replacing emotes >:C
      Object.values(emotes).forEach(emote => {
        const spliced = emote[0].split('-');
        const sliced = msg.slice(0, spliced[0]) + msg.slice(spliced[1] + 1, msg.length);
        console.log(sliced, emote, spliced);
      });
      ctx.recentMessages = ctx.recentMessages.concat([{
        author,
        newMsg,
        authorColor,
      }]).slice(0, 10);
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

      & > .chat-message {
        text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;

        display: inherit;

        span {
          color: white;
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