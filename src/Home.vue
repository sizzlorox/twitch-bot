<template>
  <div>
    <nav class="nav">
      <router-link to="/">Dashboard</router-link>
      <router-link to="/stream">Stream Interface</router-link>
    </nav>
    <router-view class="inner-app-view"></router-view>
  </div>
</template>

<script>
import TC from './bot/TwitchClient';

const {
  SNOWPACK_PUBLIC_USERNAME,
  SNOWPACK_PUBLIC_OAUTH_TOKEN,
  SNOWPACK_PUBLIC_CHANNEL_NAME,
} = import.meta.env;

export default {
  data: function() {
    const opts = {
      identity: {
        username: SNOWPACK_PUBLIC_USERNAME,
        password: SNOWPACK_PUBLIC_OAUTH_TOKEN,
      },
      channels: [SNOWPACK_PUBLIC_CHANNEL_NAME],
    };
    const client = new TC(opts);
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
  .inner-app-view {
    height: calc(100vh - 48px);
    background-color: $secondary-background;
  }
</style>