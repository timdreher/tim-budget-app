import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { initDb } from './db/index.js'

initDb().then(() => {
  createApp(App).use(router).mount('#app')
})
