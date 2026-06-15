<template>
  <div>
    <div class="form-section">
      <div class="form-group">
        <label>服务商</label>
        <div class="provider-grid">
          <button
            v-for="p in AI_PROVIDERS"
            :key="p.id"
            class="provider-card"
            :class="{ active: ai.provider === p.id }"
            @click="selectProvider(p.id)"
            type="button"
          >
            <div class="provider-name">{{ p.name }}</div>
            <div class="provider-desc">{{ p.description }}</div>
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>API Key</label>
        <input
          v-model="ai.apiKey"
          type="password"
          class="text-input"
          placeholder="请输入 API Key"
          @input="autoSave"
        />
        <p v-if="ai.provider === 'siliconflow'" class="field-hint">
          硅基流动：<a class="link" :href="siliconflowKeyUrl" @click.prevent="openUrl(siliconflowKeyUrl)">获取 API Key →</a>
        </p>
        <p v-else-if="ai.provider === 'deepseek'" class="field-hint">
          DeepSeek：<a class="link" :href="deepseekKeyUrl" @click.prevent="openUrl(deepseekKeyUrl)">获取 API Key →</a>
        </p>
        <p v-else-if="ai.provider === 'kimi'" class="field-hint">
          Kimi：<a class="link" :href="kimiKeyUrl" @click.prevent="openUrl(kimiKeyUrl)">获取 API Key →</a>
        </p>
      </div>

      <div v-if="ai.provider === 'custom'" class="form-group">
        <label>API 地址</label>
        <input
          v-model="ai.baseUrl"
          class="text-input"
          placeholder="https://your-api.com/v1"
          @input="autoSave"
        />
        <p class="field-hint">任何 OpenAI 兼容的中转 API（如 one-api、new-api）</p>
      </div>

      <div class="form-group">
        <label>模型</label>
        <div v-if="currentProviderModels.length" class="model-chips">
          <button
            v-for="m in currentProviderModels"
            :key="m.value"
            class="model-chip"
            :class="{ active: ai.model === m.value }"
            @click="selectModel(m.value)"
            type="button"
          >
            <span v-if="m.tag" :class="['chip-tag', m.tag === '推荐' ? 'tag-recommend' : 'tag-advanced']">{{ m.tag }}</span>
            {{ m.label }}
          </button>
        </div>
        <input
          v-model="ai.model"
          class="text-input"
          :placeholder="currentProviderModels.length ? '或输入自定义模型名' : '请输入模型名称'"
          @input="autoSave"
        />
        <p v-if="!currentProviderModels.length && ai.provider === 'custom'" class="field-hint">
          自定义中转请输入服务商提供的模型 ID
        </p>
        <p v-else class="field-hint">
          切换服务商时会自动选择推荐模型，你也可以输入任何服务商支持的模型名
        </p>
      </div>
    </div>

    <div class="form-section">
      <div class="form-group">
        <label>最大输出 Tokens</label>
        <input
          v-model.number="ai.maxTokens"
          type="number"
          min="1000"
          max="16000"
          step="1000"
          class="text-input"
          @input="autoSave"
        />
        <p class="field-hint">控制 AI 响应的最大长度，合同审查建议 8000+ tokens</p>
      </div>

      <div class="form-group">
        <label>Temperature <span class="value-tag">{{ ai.temperature }}</span></label>
        <input
          v-model.number="ai.temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
          class="range-input"
          @input="autoSave"
        />
        <div class="range-marks">
          <span>精确 (0)</span>
          <span>平衡 (0.5)</span>
          <span>创造 (1)</span>
        </div>
        <p class="field-hint">控制 AI 响应的随机性，法律文档建议 0.1-0.3</p>
      </div>

      <div class="form-group">
        <label>请求超时 <span class="value-tag">{{ ai.timeout / 1000 }} 秒</span></label>
        <input
          v-model.number="ai.timeout"
          type="range"
          min="5000"
          max="300000"
          step="5000"
          class="range-input"
          @input="autoSave"
        />
        <p class="field-hint">长文档审查建议 60 秒以上</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { appConfig } from '@/utils/AppConfig.js'
import { reinitializeAIClient, getAvailableModels } from '@/services/ai/siliconflow.js'
import { AI_PROVIDERS, getProvider, detectProviderByUrl } from '@/config/providerPresets.js'
import { wpsCore } from '@/services/wps/WpsCore.js'

const siliconflowKeyUrl = 'https://cloud.siliconflow.cn/account/ak'
const deepseekKeyUrl = 'https://platform.deepseek.com/api_keys'
const kimiKeyUrl = 'https://platform.moonshot.cn/console/api-keys'

const aiRaw = appConfig.get('ai')
if (!aiRaw.provider) {
  aiRaw.provider = detectProviderByUrl(aiRaw.baseUrl)
}
const ai = ref({ ...aiRaw })
const currentProvider = computed(() => getProvider(ai.value.provider))
const currentProviderModels = computed(() => currentProvider.value.models)

function selectProvider(id) {
  const provider = getProvider(id)
  ai.value.provider = id
  if (provider.baseUrl) ai.value.baseUrl = provider.baseUrl
  if (provider.defaultModel) ai.value.model = provider.defaultModel
  autoSave()
}

function selectModel(value) {
  ai.value.model = value
  autoSave()
}

async function refreshModelList() {
  if (!ai.value.apiKey) {
    window.$message?.warning('请先填 API Key')
    return
  }
  autoSave()
  try {
    const models = await getAvailableModels()
    const provider = getProvider(ai.value.provider)
    if (provider.id === 'custom') {
      const newModels = models.map((m) => ({ label: m.name || m.id, value: m.id, tag: '' }))
      const existing = provider.models.map((m) => m.value)
      const merged = [...provider.models]
      for (const m of newModels) {
        if (!existing.includes(m.value)) merged.push(m)
      }
      provider.models = merged
    }
    window.$message?.success(`已获取 ${models.length} 个模型`)
  } catch (e) {
    window.$message?.error(`获取失败: ${e.message}`)
  }
}

function autoSave() {
  const config = appConfig.getConfig()
  config.ai = { ...config.ai, ...ai.value }
  appConfig.saveConfig(config)
  reinitializeAIClient()
}

function resetToDefault() {
  const defaults = appConfig.getDefaultConfig()
  ai.value = { ...defaults.ai }
  autoSave()
  window.$message?.success('已恢复默认配置')
}

function openUrl(url) {
  const providerNames = {
    siliconflow: '硅基流动',
    deepseek: 'DeepSeek',
    kimi: 'Kimi',
    custom: '服务商'
  }
  const title = `${providerNames[ai.value.provider] || '服务商'} - 获取 API Key`
  const ok = wpsCore.openExternalUrl(url, title)
  if (!ok) window.$message?.warning('无法在 WPS 中打开链接，请手动复制：' + url)
}

defineExpose({ refreshModelList, resetToDefault })
</script>
