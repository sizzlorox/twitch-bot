<template>
  <div class="app-container">
    <router-view class="app-view"></router-view>
  </div>
</template>

<script>
export default {
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