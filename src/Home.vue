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
export default {
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