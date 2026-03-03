import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import './style.css'

import { routes } from './router'
import { installMocksIfNeeded } from './mocks/install'

const app = createApp(App)

app.use(createPinia())

const router = createRouter({
  history: createWebHistory(),
  routes,
})
app.use(router)

installMocksIfNeeded()
  .catch(() => {
    // mock 安装失败不阻塞启动
  })
  .finally(() => {
    app.mount('#app')
  })
