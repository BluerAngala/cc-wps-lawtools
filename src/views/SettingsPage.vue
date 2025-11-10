<template>
  <n-config-provider>
    <n-message-provider>
      <div class="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 p-0 overflow-y-auto overflow-x-hidden" style="scrollbar-width: none; -ms-overflow-style: none;">
        <n-card class="w-full min-h-screen rounded-none" :bordered="false" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);">
          <!-- 头部 -->
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <n-icon size="24" color="#18a058">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                  </svg>
                </n-icon>
                <span class="text-xl font-bold">默认设置</span>
              </div>
              <n-button quaternary circle @click="closeDialog">
                <template #icon>
                  <n-icon size="18">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </n-icon>
                </template>
              </n-button>
            </div>
          </template>

          <!-- 标签页 -->
          <n-tabs v-model:value="activeTab" type="segment" animated size="large" class="mt-4">
            <!-- AI 服务 -->
            <n-tab-pane name="ai" tab="🤖 AI 服务">
              <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <n-text>配置 AI 服务参数，修改后自动保存</n-text>
                <n-button size="small" @click="resetTab('ai')">恢复默认</n-button>
              </div>
              <n-form label-placement="left" label-width="120">
                <n-form-item label="API Key">
                  <n-input v-model:value="config.ai.apiKey" @update:value="autoSave" type="password" show-password-on="click" placeholder="请输入 API Key"/>
                </n-form-item>
                <n-form-item label="API 地址">
                  <n-input v-model:value="config.ai.baseUrl" @update:value="autoSave" placeholder="https://api.siliconflow.cn/v1"/>
                </n-form-item>
                <n-form-item label="模型">
                  <n-input v-model:value="config.ai.model" @update:value="autoSave" placeholder="Qwen/Qwen2.5-7B-Instruct"/>
                </n-form-item>
                <n-form-item label="超时时间(ms)">
                  <n-input-number v-model:value="config.ai.timeout" @update:value="autoSave" :min="5000" :max="120000" :step="1000" class="w-full"/>
                </n-form-item>
              </n-form>
            </n-tab-pane>

            <!-- 金山文档 -->
            <n-tab-pane name="kdocs" tab="📄 金山文档">
              <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <n-text>配置金山文档接口参数</n-text>
                <n-button size="small" @click="resetTab('kdocs')">恢复默认</n-button>
              </div>
              <n-form label-placement="left" label-width="120">
                <n-form-item label="Webhook URL">
                  <n-input v-model:value="config.kdocs.webhookUrl" @update:value="autoSave" placeholder="请输入 Webhook URL"/>
                </n-form-item>
                <n-form-item label="Token">
                  <n-input v-model:value="config.kdocs.token" @update:value="autoSave" type="password" show-password-on="click" placeholder="请输入 Token"/>
                </n-form-item>
                <n-form-item label="Sheet ID">
                  <n-input-number v-model:value="config.kdocs.sheetId" @update:value="autoSave" :min="1" :step="1" class="w-full" placeholder="5"/>
                </n-form-item>
              </n-form>
            </n-tab-pane>

            <!-- 系统设置 -->
            <n-tab-pane name="system" tab="⚙️ 系统">
              <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <n-text>系统设置与数据管理</n-text>
                <n-button size="small" @click="resetTab('system')">恢复默认</n-button>
              </div>
              
              <n-space vertical size="large">
                <!-- 系统偏好 -->
                <n-card title="系统偏好" size="small" :bordered="false" class="bg-gray-50">
                  <n-space>
                    <n-space align="center">
                      <n-text>显示欢迎页面</n-text>
                      <n-switch v-model:value="config.system.showWelcome" @update:value="autoSave"/>
                    </n-space>
                    <n-space align="center">
                      <n-text>自动保存</n-text>
                      <n-switch v-model:value="config.system.autoSave" @update:value="autoSave"/>
                    </n-space>
                  </n-space>
                </n-card>

                <!-- 数据管理 -->
                <n-card title="数据管理" size="small" :bordered="false" class="bg-gray-50">
                  <n-space>
                    <n-button @click="handleResetFirstLoad">重置首次加载</n-button>
                    <n-button type="warning" @click="handleResetAll">重置所有配置</n-button>
                  </n-space>
                </n-card>

                <!-- 配置导入导出 -->
                <n-card title="配置导入导出" size="small" :bordered="false" class="bg-gray-50">
                  <n-space vertical>
                    <n-space>
                      <n-button @click="handleExport">导出配置</n-button>
                      <n-upload :show-file-list="false" accept=".json" @before-upload="handleImport">
                        <n-button>导入配置</n-button>
                      </n-upload>
                      <n-button @click="showConfigPath">查看配置文件路径</n-button>
                    </n-space>
                    <n-alert v-if="configPath" type="info" style="margin-top: 8px;">
                      <template #header>配置文件位置</template>
                      <n-text style="font-size: 12px; word-break: break-all; font-family: monospace;">
                        {{ configPath }}
                      </n-text>
                    </n-alert>
                  </n-space>
                </n-card>
              </n-space>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  NConfigProvider, NMessageProvider, NCard, NTabs, NTabPane, NForm, NFormItem,
  NInput, NInputNumber, NSwitch, NButton, NIcon, NText,
  NSpace, NUpload, NAlert
} from 'naive-ui'
import { appConfig } from '../utils/appConfig.js'
import { reinitializeAIClient } from '../services/ai/siliconflow.js'

const activeTab = ref('ai')
const config = ref({
  ai: { apiKey: '', baseUrl: '', model: '', timeout: 30000 },
  kdocs: { webhookUrl: '', token: '', sheetId: 5, apiUrl: '' },
  system: { firstLoadCompleted: false, showWelcome: true, autoSave: true }
})
const configPath = ref('')

onMounted(() => {
  loadConfig()
})

// 加载配置
const loadConfig = () => {
  try {
    config.value = appConfig.getConfig()
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 自动保存配置
const autoSave = () => {
  try {
    appConfig.saveConfig(config.value)
    // 当 AI 配置更新时，重新初始化 AI 客户端
    if (activeTab.value === 'ai') {
      reinitializeAIClient()
      console.log('AI 配置已更新，客户端已重新初始化')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
  }
}

// 重置当前标签页
const resetTab = (tab) => {
  const defaults = {
    ai: { apiKey: '', baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct', timeout: 30000 },
    kdocs: { webhookUrl: '', token: '', sheetId: 5, apiUrl: '' },
    system: { firstLoadCompleted: false, showWelcome: true, autoSave: true }
  }
  
  config.value[tab] = defaults[tab]
  autoSave()
  
  // 如果重置的是 AI 配置，需要重新初始化客户端
  if (tab === 'ai') {
    reinitializeAIClient()
  }
  
  window.$message?.success('已恢复默认配置')
}

// 重置首次加载
const handleResetFirstLoad = () => {
  try {
    appConfig.resetFirstLoad()
    config.value.system.firstLoadCompleted = false
    window.$message?.success('首次加载状态已重置')
  } catch (error) {
    window.$message?.error('重置失败')
  }
}

// 重置所有配置
const handleResetAll = () => {
  if (confirm('确定要重置所有配置吗？此操作不可恢复。')) {
    config.value = appConfig.reset()
    reinitializeAIClient() // 重置后需要重新初始化 AI 客户端
    window.$message?.success('所有配置已重置')
  }
}

// 导出配置
const handleExport = () => {
  appConfig.exportConfig()
  window.$message?.success('配置已导出')
}

// 导入配置
const handleImport = async (options) => {
  try {
    const importedConfig = await appConfig.importConfig(options.file.file)
    config.value = importedConfig
    reinitializeAIClient() // 导入配置后需要重新初始化 AI 客户端
    window.$message?.success('配置已导入')
  } catch (error) {
    window.$message?.error('导入失败')
  }
  return false
}

// 显示配置文件路径（合并了 debugConfig 和 showConfigPath 的功能）
const showConfigPath = () => {
  try {
    const fullPath = appConfig.getConfigFullPath()
    
    if (!fullPath) {
      configPath.value = 'WPS 环境不可用'
      window.$message?.warning('WPS 环境不可用，无法获取配置文件路径')
      return
    }

    configPath.value = fullPath
    
    // 输出调试信息到控制台
    const info = appConfig.getConfigInfo()
    console.log('配置信息:', info)
    
    // 尝试复制到剪贴板
    navigator.clipboard?.writeText(fullPath).then(() => {
      window.$message?.success('路径已复制到剪贴板')
    }).catch(() => {
      window.$message?.info('路径已显示')
    })
  } catch (error) {
    console.error('获取路径失败:', error)
    configPath.value = '获取失败: ' + error.message
    window.$message?.error('获取路径失败')
  }
}

// 关闭对话框
const closeDialog = () => {
  window.close()
}
</script>

<style scoped>
/* 隐藏滚动条 */
div::-webkit-scrollbar {
  display: none;
}
</style>
