import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import Home from './Home.vue';
import Stream from './Stream.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/stream', component: Stream },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app');
