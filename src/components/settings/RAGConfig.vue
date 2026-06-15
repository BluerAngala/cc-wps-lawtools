<template>
  <div>
    <div class="form-section">
      <div class="form-group">
        <label class="toggle-row">
          <span>启用 RAG 检索增强</span>
          <label class="switch">
            <input
              type="checkbox"
              :checked="rag.enabled"
              @change="updateRag('enabled', $event.target.checked)"
            />
            <span class="slider"></span>
          </label>
        </label>
        <div v-if="rag.enabled" class="field-hint hint-ok">✅ 已启用，AI 对话将自动检索相关上下文</div>
        <div v-else class="field-hint hint-warn">⚠️ 未启用，AI 使用全文模式</div>
      </div>
    </div>

    <div class="form-section">
      <h4>Qdrant 连接</h4>
      <div class="form-group">
        <label>地址</label>
        <input
          v-model="rag.qdrantUrl"
          class="text-input"
          placeholder="http://your-server:6333"
          @input="updateRag('qdrantUrl', $event.target.value)"
        />
      </div>
      <div class="form-group">
        <label>API Key</label>
        <input
          v-model="rag.qdrantApiKey"
          type="password"
          class="text-input"
          placeholder="可选"
          @input="updateRag('qdrantApiKey', $event.target.value)"
        />
      </div>
      <div class="rag-actions">
        <button class="sm-btn" :disabled="ragTesting" @click="testConnection">
          {{ ragTesting ? '测试中...' : '测试连接' }}
        </button>
        <span v-if="ragTestResult" :class="['rag-result', ragTestResult.ok ? 'ok' : 'fail']">
          {{ ragTestResult.ok ? '✅ 连接成功' : `❌ ${ragTestResult.error}` }}
        </span>
      </div>
    </div>

    <div class="form-section">
      <h4>Embedding 配置</h4>
      <p class="field-hint">地址和密钥留空则自动跟随 AI 服务配置，仅需选择模型</p>
      <div class="form-group">
        <label>Embedding 模型</label>
        <select
          v-model="rag.embeddingModel"
          class="text-input"
          @change="updateRag('embeddingModel', $event.target.value)"
        >
          <option value="Qwen/Qwen3-Embedding-8B">Qwen3-Embedding-8B（推荐）</option>
          <option value="BAAI/bge-large-zh-v1.5">BGE-large-zh-v1.5</option>
        </select>
      </div>
      <div class="form-group">
        <label>API 地址<span v-if="!rag.embeddingBaseUrl" class="inherit-tag">跟随 AI 服务</span></label>
        <input
          v-model="rag.embeddingBaseUrl"
          class="text-input"
          placeholder="留空则使用 AI 服务地址"
          @input="updateRag('embeddingBaseUrl', $event.target.value)"
        />
      </div>
      <div class="form-group">
        <label>API Key<span v-if="!rag.embeddingApiKey" class="inherit-tag">跟随 AI 服务</span></label>
        <input
          v-model="rag.embeddingApiKey"
          type="password"
          class="text-input"
          placeholder="留空则使用 AI 服务 Key"
          @input="updateRag('embeddingApiKey', $event.target.value)"
        />
      </div>
    </div>

    <div class="form-section">
      <h4>数据统计</h4>
      <div class="rag-actions">
        <button class="sm-btn" :disabled="ragStatsLoading" @click="loadStats">
          {{ ragStatsLoading ? '加载中...' : '刷新统计' }}
        </button>
      </div>
      <div v-if="ragStats" class="rag-stats">
        <div class="stat-row">
          <span>文档分块</span>
          <span>{{ ragStats.collections?.DOCUMENT_CHUNKS?.points_count || 0 }}</span>
        </div>
        <div class="stat-row">
          <span>对话记忆</span>
          <span>{{ ragStats.collections?.CONVERSATION_MEMORY?.points_count || 0 }}</span>
        </div>
        <div class="stat-row">
          <span>审查历史</span>
          <span>{{ ragStats.collections?.REVIEW_HISTORY?.points_count || 0 }}</span>
        </div>
        <div class="stat-row">
          <span>法律法规</span>
          <span>{{ ragStats.collections?.LAW_KNOWLEDGE?.points_count || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { appConfig } from '@/utils/AppConfig.js'
import { qdrantClient } from '@/services/rag/QdrantClient.js'
import { ragService } from '@/services/rag/RagService.js'

const rag = ref({ ...appConfig.get('rag') })
const ragTesting = ref(false)
const ragTestResult = ref(null)
const ragStatsLoading = ref(false)
const ragStats = ref(null)

function updateRag(field, value) {
  rag.value[field] = value
  const config = appConfig.getConfig()
  if (!config.rag) config.rag = {}
  config.rag[field] = value
  appConfig.saveConfig(config)
  qdrantClient.clearConfigCache()
  ragTestResult.value = null
}

async function testConnection() {
  ragTesting.value = true
  try {
    qdrantClient.clearConfigCache()
    const result = await qdrantClient.healthCheck()
    ragTestResult.value = result
    if (result.ok) window.$message?.success('Qdrant 连接成功')
    else window.$message?.error(`连接失败: ${result.error}`)
  } catch (e) {
    ragTestResult.value = { ok: false, error: e.message }
  } finally {
    ragTesting.value = false
  }
}

async function loadStats() {
  ragStatsLoading.value = true
  try {
    qdrantClient.clearConfigCache()
    ragStats.value = await ragService.getStats()
  } catch (e) {
    window.$message?.error(`获取统计失败: ${e.message}`)
  } finally {
    ragStatsLoading.value = false
  }
}

watch(
  () => appConfig.getConfig().rag,
  () => {
    rag.value = { ...appConfig.get('rag') }
  },
  { deep: true }
)
</script>
