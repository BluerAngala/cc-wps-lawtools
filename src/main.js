import './assets/main.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 提前初始化 ribbon，确保在 WPS 加载时就可用
import ribbon from './ribbon.js'
window.ribbon = ribbon

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

app.mount('#app')
