import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './assets/main.css'
import App from './App.vue'

// Create pinia store
const pinia = createPinia()

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./views/ChatView.vue'),
      meta: { title: 'Chat' }
    },
    {
      path: '/workflow',
      component: () => import('./views/WorkflowView.vue'),
      meta: { title: 'Workflow' }
    }
  ]
})

// Create and mount the Vue application
const app = createApp(App)

// Use plugins
app.use(router)
app.use(pinia)
app.use(Antd)

// Mount the app
app.mount('#app')