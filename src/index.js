import { createApp } from "vue";
import { createRouter, createWebHistory } from 'vue-router';

import App from "./App.vue";

const routes = [
  { path: '/', component: App },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp({});
app.use(router);
app.mount("#app");
