<template>
  <div class="app-container">
    <router-view class="app-view">
    </router-view>
  </div>
</template>

<script setup>
</script>

<style lang="scss">
  @use './css/variables.scss' as *;

  * {
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
  }

  html, body {
    background-color: rgba(0, 0, 0, 0);
  }

  body {
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #f8fafc;
  }
</style>

<style lang="scss" scoped>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: transparent;
  }

  .app-view {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>