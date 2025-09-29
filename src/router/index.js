// vue 前端路由

import { createRouter, createWebHashHistory } from 'vue-router'
//import HomeView from '../views/HomeView.vue'

console.log('路由已加载')

const router = createRouter({
  history: createWebHashHistory(''),
  routes: [
    {
      path: '/',
      name: '默认页',
      component: () => import('../views/home.vue')
    },
    {
      path: '/dialog',
      name: '对话框',
      component: () => import('../components/Dialog.vue')
    },
    {
      path: '/taskpane',
      name: '任务窗格',
      component: () => import('../views/TestPage.vue')
    },
    {
      path: '/contractreview',
      name: '合同审查',
      component: () => import('../views/ContractReview.vue')
    }
  ]
})

export default router
