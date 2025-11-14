<template>
  <n-config-provider>
    <n-message-provider>
      <n-dialog-provider>
        <AppContent />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted, onUnmounted, h } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, useMessage, useDialog } from 'naive-ui'

// 引入文档监听器
import DocumentWatcher from './services/wps/DocumentWatcher.js'
// 引入缓存管理器
import { CacheManager } from './services/ai/CacheManager.js'
// 引入模板管理器
import { templateManager } from './utils/templateManager.js'

// 引入页面组件
import ContractServices from './views/ContractServices.vue'
import SettingsPage from './views/SettingsPage.vue'
import TestPage from './views/TestPage.vue'
import TemplateManager from './views/TemplateManager.vue'
import ContractRiskScan from './views/ContractRiskScan.vue'
import DesensitizePage from './views/DesensitizePage.vue'

// 获取当前页面参数
function getCurrentPage() {
  const params = new URLSearchParams(window.location.search)
  const page = params.get('page') || 'home'
  return page
}

// 创建内部组件来访问消息实例
const AppContent = {
  setup() {
    const message = useMessage()
    const dialog = useDialog()
    
    // 将消息和对话框实例暴露到全局
    window.$message = message
    window.$dialog = dialog
    
    // 根据 URL 参数渲染对应组件
    const currentPage = ref(getCurrentPage())
    
    const renderComponent = () => {
      switch (currentPage.value) {
        case 'template':
          return h(TemplateManager)
        case 'contractreview':
          return h(ContractServices)
        case 'riskscan':
          return h(ContractRiskScan)
        case 'desensitize':
          return h(DesensitizePage)
        case 'settings':
          return h(SettingsPage)
        case 'taskpane':
          return h(TestPage)
        case 'home':
        default:
          return h(ContractServices)
      }
    }
    
    return renderComponent
  }
}

let documentWatcher = null
// window 对象
console.debug('window', window)
// wps Application 对象
console.debug('wps Application', window.Application)
// wps Application.Env 对象
console.debug('wps Application.Env', window.Application.Env)
// wps Application.FileSystem 对象
console.debug('wps Application.FileSystem', window.Application.FileSystem)
// wps PluginStorage 对象
console.debug('wps PluginStorage', window.Application.PluginStorage)

onMounted(() => {
  // 初始化缓存管理器
  const cacheManager = new CacheManager({
    maxCacheSize: 500,
    maxCacheAge: 30 * 60 * 1000, // 30分钟过期（比之前的24小时短）
    storagePrefix: 'contract_ai_cache_'
  })

  // 初始化文档监听器
  documentWatcher = new DocumentWatcher(cacheManager)

  // 延迟启动监听，确保WPS完全加载
  setTimeout(() => {
    if (window.Application) {
      documentWatcher.startWatching()
      console.log('文档监听器已启动，每次打开新文档将自动清除缓存')
      
      // 初始化模板（首次加载时复制内置模板到配置目录）
      templateManager.initializeTemplates().then(() => {
        console.log('模板初始化完成')
      }).catch(error => {
        console.error('模板初始化失败:', error)
      })
    } else {
      console.warn('WPS Application对象未找到，文档监听器未启动')
    }
  }, 2000)

  // 将缓存管理器、文档监听器和模板管理器暴露到全局，供其他组件使用
  window.cacheManager = cacheManager
  window.documentWatcher = documentWatcher
  window.templateManager = templateManager
})

onUnmounted(() => {
  // 清理资源
  if (documentWatcher) {
    documentWatcher.stopWatching()
  }
})

console.log('App组件已加载')
</script>
