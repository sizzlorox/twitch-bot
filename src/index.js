import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import Dashboard from './Dashboard.vue';
import Stream from './Stream.vue';
import StreamChat from './StreamChat.vue';


const routes = [
  { path: '/', component: Dashboard },
  { path: '/stream', component: Stream },
  { path: '/stream-chat', component: StreamChat },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App, {
  mixins: [{
    beforeCreate() {
      console.log("beforeCreate", this._uid);
      target = this;
    },
    created() {
      console.log("created", this._uid);
      target = undefined;
    }
  }],
});

app.use(router);
app.mount('#app');
