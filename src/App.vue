<template>
  <div class="app-container">
    <nav class="nav">
      <router-link to="/">Dashboard</router-link>
      <router-link to="/stream">Stream Interface</router-link>
    </nav>
    <router-view class="app-view"></router-view>
  </div>
</template>

<script>
export default {
};
</script>

<style lang="scss">
  @import 'src/css/variables.scss';
  .app-container {
    display: flex;
    flex-direction: column;
  }

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

  .app-view {
    height: calc(100vh - 48px);
    background-color: $secondary-background;
  }
</style>