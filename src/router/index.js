import { createRouter, createWebHashHistory } from 'vue-router'

import ContractServices from '../views/ContractServices.vue'
import SettingsPage from '../views/SettingsPage.vue'
import TemplateManager from '../views/TemplateManager.vue'
import ContractRiskScan from '../views/ContractRiskScan.vue'
import DesensitizePage from '../views/DesensitizePage.vue'
import WorkflowPage from '../views/WorkflowPage.vue'
import BatchProcessingPage from '../views/BatchProcessingPage.vue'
import AIChatPage from '../views/AIChatPage.vue'

const devOnly = import.meta.env.DEV
  ? {
      TestPage: () => import('../views/TestPage.vue'),
      PathDiagnostics: () => import('../views/PathDiagnostics.vue')
    }
  : {}

const devRoutes = import.meta.env.DEV
  ? [
      { path: '/taskpane', name: '任务窗格', component: devOnly.TestPage },
      { path: '/pathdiag', name: '路径诊断', component: devOnly.PathDiagnostics }
    ]
  : []

const router = createRouter({
  history: createWebHashHistory(''),
  routes: [
    {
      path: '/',
      redirect: '/contractreview'
    },
    {
      path: '/template',
      name: '模板管理',
      component: TemplateManager
    },
    {
      path: '/contractreview',
      name: '合同审查',
      component: ContractServices
    },
    {
      path: '/riskscan',
      name: '风险扫描',
      component: ContractRiskScan
    },
    {
      path: '/desensitize',
      name: '信息脱敏',
      component: DesensitizePage
    },
    {
      path: '/settings',
      name: '设置',
      component: SettingsPage
    },
    {
      path: '/workflow',
      name: '工作流',
      component: WorkflowPage
    },
    {
      path: '/batch',
      name: '批量处理',
      component: BatchProcessingPage
    },
    {
      path: '/aichat',
      name: 'AI对话',
      component: AIChatPage
    },
    ...devRoutes
  ]
})

export default router
