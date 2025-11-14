<template>
  <n-config-provider>
    <n-message-provider>
      <div class="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 p-0 overflow-y-auto overflow-x-hidden" style="scrollbar-width: none; -ms-overflow-style: none;">
        <n-card class="w-full min-h-screen rounded-none" :bordered="false" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);">
          <!-- 头部 - 固定 -->
          <template #header>
            <div class="flex items-center justify-between sticky-header">
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

          <!-- 标签页 - 固定 -->
          <div class="sticky-tabs">
            <n-tabs v-model:value="activeTab" type="segment" animated size="large" class="mt-4">
            <!-- AI 服务 -->
            <n-tab-pane name="ai" tab="🤖 AI 服务">
              <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <n-text>配置 AI 服务参数，修改后自动保存</n-text>
                <n-button size="small" @click="resetTab('ai')">恢复默认</n-button>
              </div>
              
              <n-space vertical size="large">
                <!-- 基础配置 -->
                <n-card title="基础配置" size="small" :bordered="false" class="bg-gray-50">
                  <n-form label-placement="left" label-width="120">
                    <n-form-item label="API Key">
                      <n-input v-model:value="config.ai.apiKey" @update:value="autoSave" type="password" show-password-on="click" placeholder="请输入 API Key"/>
                    </n-form-item>
                    <n-form-item label="API 地址">
                      <n-input v-model:value="config.ai.baseUrl" @update:value="autoSave" placeholder="https://api.siliconflow.cn/v1"/>
                    </n-form-item>
                    <n-form-item label="模型">
                      <n-space vertical class="w-full">
                        <n-select 
                          v-model:value="config.ai.model" 
                          @update:value="autoSave"
                          :options="modelOptions"
                          placeholder="选择模型"
                          filterable
                          :loading="loadingModels"
                        >
                          <template #empty>
                            <n-empty description="未找到模型" size="small">
                              <template #extra>
                                <n-button size="small" @click="refreshModelList">
                                  刷新列表
                                </n-button>
                              </template>
                            </n-empty>
                          </template>
                        </n-select>
                        <n-space size="small">
                          <n-button size="tiny" @click="refreshModelList" :loading="loadingModels">
                            <template #icon>
                              <n-icon>
                                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 20q-3.35 0-5.675-2.325T4 12q0-3.35 2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12q0 2.5 1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20Z"/></svg>
                              </n-icon>
                            </template>
                            刷新模型列表
                          </n-button>
                          <n-text depth="3" style="font-size: 12px;">
                            {{ modelOptions.length }} 个可用模型
                          </n-text>
                        </n-space>
                      </n-space>
                      <template #feedback>
                        <n-alert type="info" size="small" :show-icon="false" style="margin-top: 8px;">
                          <n-text depth="3" style="font-size: 12px;">
                            💡 <strong>推荐</strong>：Qwen2.5-7B/14B（速度快）｜<strong>高级</strong>：DeepSeek-V3/Qwen2.5-72B（功能强）
                          </n-text>
                        </n-alert>
                      </template>
                    </n-form-item>
                  </n-form>
                </n-card>

                <!-- 高级配置 -->
                <n-card title="高级配置" size="small" :bordered="false" class="bg-gray-50">
                  <n-form label-placement="left" label-width="150">
                    <n-form-item label="最大输出 Tokens">
                      <n-input-number 
                        v-model:value="config.ai.maxTokens" 
                        @update:value="autoSave" 
                        :min="1000" 
                        :max="16000" 
                        :step="1000" 
                        class="w-full"
                      >
                        <template #suffix>
                          <n-text depth="3" style="font-size: 12px;">tokens</n-text>
                        </template>
                      </n-input-number>
                      <template #feedback>
                        <n-text depth="3" style="font-size: 12px;">
                          控制AI响应的最大长度。合同审查建议 8000+ tokens
                        </n-text>
                      </template>
                    </n-form-item>

                    <n-form-item label="Temperature">
                      <n-slider 
                        v-model:value="config.ai.temperature" 
                        @update:value="autoSave" 
                        :min="0" 
                        :max="1" 
                        :step="0.1"
                        :marks="{ 0: '精确', 0.5: '平衡', 1: '创造' }"
                      />
                      <template #feedback>
                        <n-text depth="3" style="font-size: 12px;">
                          控制AI响应的随机性。法律文档建议 0.1-0.3
                        </n-text>
                      </template>
                    </n-form-item>

                    <n-form-item label="请求超时(秒)">
                      <n-input-number 
                        v-model:value="timeoutSeconds" 
                        @update:value="updateTimeout" 
                        :min="5" 
                        :max="300" 
                        :step="5" 
                        class="w-full"
                      >
                        <template #suffix>
                          <n-text depth="3" style="font-size: 12px;">秒</n-text>
                        </template>
                      </n-input-number>
                      <template #feedback>
                        <n-text depth="3" style="font-size: 12px;">
                          长文档审查建议 60 秒以上
                        </n-text>
                      </template>
                    </n-form-item>
                  </n-form>
                </n-card>

                <!-- 当前配置预览 -->
                <n-alert type="info" title="当前配置">
                  <n-space vertical size="small">
                    <n-text depth="3" style="font-size: 12px;">
                      模型: {{ config.ai.model || '未配置' }}
                    </n-text>
                    <n-text depth="3" style="font-size: 12px;">
                      最大输出: {{ config.ai.maxTokens || 8000 }} tokens
                    </n-text>
                    <n-text depth="3" style="font-size: 12px;">
                      Temperature: {{ config.ai.temperature !== undefined ? config.ai.temperature : 0.1 }}
                    </n-text>
                    <n-text depth="3" style="font-size: 12px;">
                      超时时间: {{ timeoutSeconds }} 秒
                    </n-text>
                  </n-space>
                </n-alert>
              </n-space>
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
                      <n-text>自动保存</n-text>
                      <n-switch v-model:value="config.system.autoSave" @update:value="autoSave"/>
                    </n-space>
                  </n-space>
                </n-card>

                <!-- 数据管理 -->
                <n-card title="数据管理" size="small" :bordered="false" class="bg-gray-50">
                  <n-space>
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
          </div>
        </n-card>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  NConfigProvider, NMessageProvider, NCard, NTabs, NTabPane, NForm, NFormItem,
  NInput, NInputNumber, NSwitch, NButton, NIcon, NText,
  NSpace, NUpload, NAlert, NSlider, NSelect, NEmpty
} from 'naive-ui'
import { appConfig } from '../utils/appConfig.js'
import { reinitializeAIClient, getAvailableModels } from '../services/ai/siliconflow.js'

const activeTab = ref('ai')
const config = ref({
  ai: { 
    apiKey: '', 
    baseUrl: '', 
    model: '', 
    timeout: 300000, // 增加到300秒（5分钟）
    maxTokens: 8000,
    temperature: 0.1 
  },
  kdocs: { webhookUrl: '', token: '', sheetId: 5, apiUrl: '' },
  system: { autoSave: true }
})
const configPath = ref('')
const modelOptions = ref([])
const loadingModels = ref(false)

// 超时时间（秒）的计算属性
const timeoutSeconds = computed({
  get: () => Math.round(config.value.ai.timeout / 1000),
  set: (value) => {
    config.value.ai.timeout = value * 1000
    autoSave()
  }
})

onMounted(() => {
  loadConfig()
  loadModelList()
})

// 加载模型列表
const loadModelList = async () => {
  loadingModels.value = true
  try {
    const models = await getAvailableModels()
    modelOptions.value = models.map(model => ({
      label: model.name || model.id,
      value: model.id,
      tag: getModelTag(model.id)
    }))
    console.log('模型列表加载成功:', modelOptions.value.length, '个模型')
  } catch (error) {
    console.error('加载模型列表失败:', error)
    // 使用默认模型列表
    modelOptions.value = [
      { label: 'Qwen2.5-7B-Instruct (推荐-快速)', value: 'Qwen/Qwen2.5-7B-Instruct', tag: '推荐' },
      { label: 'Qwen2.5-14B-Instruct (推荐-平衡)', value: 'Qwen/Qwen2.5-14B-Instruct', tag: '推荐' },
      { label: 'Qwen2.5-72B-Instruct (强大)', value: 'Qwen/Qwen2.5-72B-Instruct', tag: '高级' },
      { label: 'DeepSeek-V3 (高性能)', value: 'deepseek-ai/DeepSeek-V3', tag: '高级' },
      { label: 'GLM-4-9B (快速)', value: 'Pro/THUDM/glm-4-9b-chat', tag: '推荐' }
    ]
  } finally {
    loadingModels.value = false
  }
}

// 获取模型标签
const getModelTag = (modelId) => {
  if (modelId.includes('Qwen2.5-7B') || modelId.includes('Qwen2.5-14B') || modelId.includes('glm-4')) {
    return '推荐'
  }
  if (modelId.includes('DeepSeek') || modelId.includes('Qwen2.5-72B')) {
    return '高级'
  }
  return ''
}

// 刷新模型列表
const refreshModelList = () => {
  window.$message?.info('正在刷新模型列表...')
  loadModelList()
}

// 加载配置
const loadConfig = () => {
  try {
    const loadedConfig = appConfig.getConfig()
    // 确保 AI 配置有默认值
    config.value = {
      ...loadedConfig,
      ai: {
        apiKey: loadedConfig.ai?.apiKey || '',
        baseUrl: loadedConfig.ai?.baseUrl || '',
        model: loadedConfig.ai?.model || '',
        timeout: loadedConfig.ai?.timeout || 180000, // 增加到180秒（3分钟）
        maxTokens: loadedConfig.ai?.maxTokens || 8000,
        temperature: loadedConfig.ai?.temperature !== undefined ? loadedConfig.ai.temperature : 0.1
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 更新超时时间（从秒转换为毫秒）
const updateTimeout = (value) => {
  config.value.ai.timeout = value * 1000
  autoSave()
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
    ai: { 
      apiKey: '', 
      baseUrl: 'https://api.siliconflow.cn/v1', 
      model: 'Qwen/Qwen2.5-7B-Instruct', // 改用更快的模型
      timeout: 300000, // 增加到300秒（5分钟）
      maxTokens: 8000,
      temperature: 0.1
    },
    kdocs: { webhookUrl: '', token: '', sheetId: 5, apiUrl: '' },
    system: { autoSave: true }
  }
  
  config.value[tab] = defaults[tab]
  autoSave()
  
  // 如果重置的是 AI 配置，需要重新初始化客户端
  if (tab === 'ai') {
    reinitializeAIClient()
  }
  
  window.$message?.success('已恢复默认配置')
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

/* 固定头部 - 针对 n-card 的 header 区域 */
:deep(.n-card-header) {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  margin-bottom: 0;
}

/* 固定头部内容 */
:deep(.sticky-header) {
  position: relative;
  z-index: 101;
}

/* 固定标签页 */
.sticky-tabs {
  position: sticky;
  top: 60px; /* header 高度 */
  z-index: 99;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding-bottom: 8px;
  margin-top: 0;
}
</style>
