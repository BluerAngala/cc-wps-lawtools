<template>
  <n-config-provider>
    <n-message-provider>
      <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-0">
        <n-card 
          class="w-full h-full backdrop-blur-md rounded-none shadow-none m-0"
          :bordered="false"
        >
            <template #header>
              <div class="relative">
                <n-button 
                  quaternary 
                  circle 
                  size="small"
                  class="absolute -right-2 -top-2 z-10"
                  @click="closeDialog"
                >
                  <template #icon>
                    <n-icon size="16">
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </template>
          
          <n-space vertical size="large" class="px-6 py-4">
            <div class="text-center">
              <h1 class="text-3xl font-bold text-green-600 mb-4">🎉 {{ msg }}</h1>
              <n-text class="text-lg text-gray-600 leading-relaxed">
                专为律师打造的智能文档处理工具，让您的工作更高效！
              </n-text>
            </div>
            
            <div class="grid grid-cols-3 gap-4 my-5">
              <div class="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all hover:-translate-y-1">
                <n-icon size="20" color="#18a058">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </n-icon>
                <span class="text-sm font-medium text-gray-700">合同审查</span>
              </div>
              
              <div class="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all hover:-translate-y-1">
                <n-icon size="20" color="#2080f0">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </n-icon>
                <span class="text-sm font-medium text-gray-700">智能批注</span>
              </div>
              
              <div class="flex flex-col items-center gap-2 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-all hover:-translate-y-1">
                <n-icon size="20" color="#f0a020">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </n-icon>
                <span class="text-sm font-medium text-gray-700">AI助理</span>
              </div>
            </div>
            
            <div class="flex justify-center gap-3 mt-2">
              <n-button type="primary" size="large" @click="closeDialog">
                开始使用
              </n-button>
              <n-button size="large" @click="showFeatures">
                了解更多
              </n-button>
            </div>
            
            <div class="text-center mt-6 pt-4 border-t border-gray-200">
              <n-text depth="3" class="text-sm">
                © 2025 AI律师工具箱 · 作者：@陈恒律师
              </n-text>
            </div>
          </n-space>
        </n-card>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, NCard, NSpace, NAvatar, NText, NButton, NIcon } from 'naive-ui'
import ribbonHandler from '@/ribbon.js'

const msg = ref('欢迎使用！')
const moreURL = ref('https://lawyerch.feishu.cn/wiki/space/7467382510423506963')

onMounted(() => {
  console.log('欢迎页面已加载') 
})

const closeDialog = () => {
  console.log('点击开始使用按钮，调用ribbon.js的AI助理')
  try {
    // 直接调用ribbon.js中的OnAction函数，传入btnShowAI控件
    ribbonHandler.OnAction({ Id: 'btnShowAI' })
    console.log('已调用ribbon.js的AI助理事件')
    
    // 调用AI助理后关闭当前窗口
    setTimeout(() => {
      window.close()
    }, 500)
  } catch (error) {
    console.error('调用AI助理失败:', error)
    window.close()
  }
}

const showFeatures = () => {
  console.log('点击了解更多按钮，调用ribbon.js的关于我事件')
  try {
    // 直接调用ribbon.js中的OnAction函数，传入btnAboutME控件
    ribbonHandler.OnAction({ Id: 'btnAboutME' })
    console.log('已调用ribbon.js的关于我事件')
  } catch (error) {
    console.error('调用关于我事件失败:', error)
  }
}
</script>

<!-- 完全使用UnoCSS，无需自定义样式 -->

