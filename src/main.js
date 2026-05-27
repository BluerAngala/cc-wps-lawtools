import './assets/main.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createDiscreteApi } from 'naive-ui'
import App from './App.vue'
import router from './router/index.js'

// 提前初始化 ribbon，确保在 WPS 加载时就可用
import ribbon from './ribbon.js'
window.ribbon = ribbon

// 初始化路径管理器，确保所有必需目录存在
import { pathManager } from './utils/pathManager.js'
if (typeof window !== 'undefined' && window.Application) {
  // 延迟初始化，确保 WPS 环境完全加载
  setTimeout(() => {
    pathManager.ensureAllDirs()
  }, 1000)
}

const app = createApp(App)

app.use(router)
app.mount('#app')

// 使用 createDiscreteApi 创建全局消息和对话框实例
const { message, dialog, notification } = createDiscreteApi(['message', 'dialog', 'notification'], {
  messageProviderProps: { duration: 1500 }
})
window.$message = message
window.$dialog = dialog
window.$notification = notification
