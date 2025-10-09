// vue 前端路由

import { createRouter, createWebHashHistory } from 'vue-router'

console.log('路由已加载')

const router = createRouter({
  history: createWebHashHistory(''),
  routes: [
    {
      path: '/',
      name: '默认页',
      component: () => import('../views/HomePage.vue')
    },
    {
      path: '/taskpane',
      name: '任务窗格',
      component: () => import('../views/TestPage.vue')
    },
    {
      path: '/contractreview',
      name: '合同审查',
      component: () => import('../views/ContractServices.vue')
    },
    {
      path: '/settings',
      name: '设置',
      component: () => import('../views/SettingsPage.vue')
    }
  ]
})

export default router
