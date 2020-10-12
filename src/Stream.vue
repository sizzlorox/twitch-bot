<template>
  <div class="stream-container">
    <div class="stream-view">
      <div class="chat-container">
        <div class="chat-message" v-for="(msg, index) in parseMessages" :key="index">
          {{ msg }}
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      reeeee
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    recentMessages: localStorage.getItem('recentMessages'),
  }),
  computed: {
    parseMessages() {
      return JSON.parse(this.recentMessages);
    }
  },
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