<template>
  <div class="app-container">
    <router-view class="app-view" v-model:recentMessages="botConnection.recentMessages">
    </router-view>
  </div>
</template>

<script>
import TC from './bot/TwitchClient';
import Home from './Home.vue';
import Stream from './Stream.vue';

const {
  SNOWPACK_PUBLIC_USERNAME,
  SNOWPACK_PUBLIC_OAUTH_TOKEN,
  SNOWPACK_PUBLIC_CHANNEL_NAME,
} = import.meta.env;

export default {
  name: 'App',
  data: function() {
    const opts = {
      identity: {
        username: SNOWPACK_PUBLIC_USERNAME,
        password: SNOWPACK_PUBLIC_OAUTH_TOKEN,
      },
      channels: [SNOWPACK_PUBLIC_CHANNEL_NAME],
    };
    const client = new TC(opts, this.$root);
    return {
      botConnection: client,
    }
  },
  created: function() {
    this.botConnection.connect();
  },
};
</script>

<style lang="scss" scoped>
  @import 'src/css/variables.scss';
  .app-container {
    display: flex;
    flex-direction: column;
  }

  .app-view {
    height: 100vh;
    background-color: $secondary-background;
  }
</style>