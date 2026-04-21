import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import Dashboard from './Dashboard.vue';
import Stream from './Stream.vue';
import RPG from './RPG.vue';

const routes = [
  { path: '/', component: Dashboard },
  { path: '/stream', component: Stream },
  { path: '/rpg', component: RPG },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);

app.use(router);
app.mount('#app');
