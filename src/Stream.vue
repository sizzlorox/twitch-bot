<template>
  <div class="stream-container">
    <div class="stream-view"></div>
    <div class="bottom-bar">
      reeeeeeeeee
    </div>
  </div>
</template>

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