import './assets/main.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createDiscreteApi } from 'naive-ui'
import App from './App.vue'
import router from './router/index.js'

// 提前初始化 ribbon，确保在 WPS 加载时就可用
import ribbon from './ribbon.js'
window.ribbon = ribbon

const app = createApp(App)

app.use(router)
app.mount('#app')

// 使用 createDiscreteApi 创建全局消息和对话框实例
const { message, dialog, notification } = createDiscreteApi(['message', 'dialog', 'notification'])
window.$message = message
window.$dialog = dialog
window.$notification = notification
