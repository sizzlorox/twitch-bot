import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import Home from './Home.vue';
import Stream from './Stream.vue';

// A map between localStorage item keys and a list of Vue instances that depend on it
const storeItemSubscribers = {};

// The Vue instance that is currently being initialised
let target = undefined;

const getItem = window.localStorage.getItem;
localStorage.getItem = (key) => {
  console.info("Getting", key);

  // Collect dependent Vue instance
  if (!storeItemSubscribers[key]) storeItemSubscribers[key] = [];
  if (target) storeItemSubscribers[key].push(target);

  // Call the original function
  return getItem.call(localStorage, key);
};

const setItem = window.localStorage.setItem;
localStorage.setItem = (key, value) => {
  console.info("Setting", key, value);

  // Update the value in the dependent Vue instances
  if (storeItemSubscribers[key]) {
    storeItemSubscribers[key].forEach((dep) => {
      if (dep.hasOwnProperty(key)) dep[key] = value;
    });
  }

  // Call the original function
  setItem.call(localStorage, key, value);
};


const routes = [
  { path: '/', component: Home },
  { path: '/stream', component: Stream, props: true },
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
