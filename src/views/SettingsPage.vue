<template>
  <n-config-provider>
    <n-message-provider>
      <div class="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-0">
        <n-card class="w-full h-full backdrop-blur-md rounded-none shadow-none m-0" :bordered="false">
          <template #header>
            <div class="relative">
              <n-button quaternary circle size="small" class="absolute -right-2 -top-2 z-10" @click="closeDialog">
                <template #icon>
                  <n-icon size="16">
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </div>
          </template>

          <n-space vertical size="large" class="px-6 py-4">
            <div class="text-center">
              <h1 class="text-3xl font-bold text-green-600 mb-4">⚙️ 设置</h1>
              <n-text class="text-lg text-gray-600 leading-relaxed">
                AI律师工具箱 - 配置与管理
              </n-text>
            </div>

            <!-- 基本设置 -->
            <div class="bg-white rounded-xl p-4 shadow-sm">
              <h3 class="text-lg font-bold mb-3 text-gray-700">基本设置</h3>
              <n-space vertical>
                <n-button type="primary" @click="handleResetFirstLoad">
                  重置首次加载状态
                </n-button>
                <n-text depth="3" class="text-sm">
                  重置后，下次启动将显示欢迎页面
                </n-text>
              </n-space>
            </div>

            <!-- 功能特性 -->
            <div class="bg-white rounded-xl p-4 shadow-sm">
              <h3 class="text-lg font-bold mb-3 text-gray-700">功能特性</h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all hover:-translate-y-1">
                  <n-icon size="20" color="#18a058">
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </n-icon>
                  <span class="text-sm font-medium text-gray-700">合同审查</span>
                </div>

                <div class="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all hover:-translate-y-1">
                  <n-icon size="20" color="#2080f0">
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </n-icon>
                  <span class="text-sm font-medium text-gray-700">智能批注</span>
                </div>

                <div class="flex flex-col items-center gap-2 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-all hover:-translate-y-1">
                  <n-icon size="20" color="#f0a020">
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </n-icon>
                  <span class="text-sm font-medium text-gray-700">AI助理</span>
                </div>
              </div>
            </div>

            <div class="flex justify-center gap-3 mt-2">
              <n-button type="primary" size="large" @click="closeDialog">确定</n-button>
            </div>

            <div class="text-center mt-6 pt-4 border-t border-gray-200">
              <n-text depth="3" class="text-sm">© 2025 AI律师工具箱 · 作者：@陈恒律师</n-text>
            </div>
          </n-space>
        </n-card>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, NCard, NSpace, NText, NButton, NIcon } from 'naive-ui'
import { wpsConfigManager } from '../services/wps/wpsConfigManager.js'

onMounted(() => {
  console.log('设置页面已加载')
})

// 重置首次加载
const handleResetFirstLoad = () => {
  try {
    wpsConfigManager.resetFirstLoad()
    window.$message?.success('首次加载状态已重置，下次启动将显示欢迎页面')
  } catch (error) {
    console.error('重置失败:', error)
    window.$message?.error('重置失败: ' + error.message)
  }
}

// 关闭对话框
const closeDialog = () => {
  console.log('关闭设置页面')
  window.close()
}
</script>

