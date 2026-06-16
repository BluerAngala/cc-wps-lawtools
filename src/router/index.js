import { createRouter, createWebHashHistory } from 'vue-router'

import AIChatPage from '../views/AIChatPage.vue'
import SettingsPage from '../views/SettingsPage.vue'

const router = createRouter({
  history: createWebHashHistory(''),
  routes: [
    { path: '/', redirect: '/aichat' },
    { path: '/settings', name: '设置', component: SettingsPage },
    { path: '/aichat', name: 'AI对话', component: AIChatPage }
  ]
})

export default router
