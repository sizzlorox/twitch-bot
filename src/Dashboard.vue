<template>
  <div>
    <nav class="nav">
      <router-link to="/">Dashboard</router-link>
      <router-link to="/stream">Stream Interface</router-link>
      <router-link to="/stream-chat">Stream Chat</router-link>
    </nav>
    <div class="container">
      <div class="features-list">
        <div class="feature-container">
          <div class="feature-status" v-bind:style=ttsStatusBackground>
          </div>
          <span>
            TTS
          </span>
        </div>
        <div class="feature-container">
          <div class="feature-status" v-bind:style=botStatusBackground>
          </div>
          <span>
            Bot
          </span>
        </div>
      </div>
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
];

export default {
  data: function() {
    return {
      tts: new TextToSpeech(),
    };
  },
  computed: {
    botStatusBackground: function () {
      return {
        'background-color': es.readyState === 1 ? 'lime' : 'red',
      };
    },
    ttsStatusBackground: function () {
      return {
        'background-color': this.tts.speech ? 'lime' : 'red',
      };
    }
  },
  mounted: function () {
    listeners.forEach(l => es.addEventListener(l.event, e => l.func(e, this)));
  },
  beforeUnmount: function () {
    listeners.forEach(l => es.removeEventListener(l.event, e => l.func(e, this)));
  }
};
</script>

<style lang="scss" scoped>
  @import 'src/css/variables.scss';
  .nav {
    display: flex;
    flex-direction: row;
    align-items: center;

    background-color: $primary-background;

    height: 48px;
    min-height: 48px;

    a {
      padding: 0 8px;
      color: $secondary;
    }
  }

  .container {
    display: flex;
    flex-direction: column;

    height: 100%;
    padding: 16px;

    .features-list {
      display: flex;
      flex-direction: row;

      padding: 8px;

      background-color: rgba(0, 0, 0, 0.15);

      .feature-container {
        display: flex;
        flex-direction: row;
        align-items: center;

        .feature-status {
          width: 8px;
          height: 8px;
          margin: 8px;
        }
        padding: 8px;
      }
    }
  }
</style>