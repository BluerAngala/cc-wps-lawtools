<template>
  <Transition name="drawer">
    <div v-if="visible" class="drawer-overlay" @click.self="$emit('close')">
      <div class="drawer-panel">
        <div class="drawer-header">
          <h3>助手设置</h3>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>

        <div class="drawer-body">
          <div class="tabs">
            <button
              class="tab-btn"
              :class="{ active: tab === 'playbook' }"
              @click="tab = 'playbook'"
            >
              📋 Playbook
            </button>
            <button class="tab-btn" :class="{ active: tab === 'rag' }" @click="tab = 'rag'">
              🔍 向量检索
            </button>
          </div>

          <div v-if="tab === 'playbook'" class="tab-content">
            <div class="section-head">
              <span class="section-title">谈判手册</span>
              <div class="section-actions">
                <button class="sm-btn" @click="addPosition">+ 立场</button>
                <button class="sm-btn" @click="addTemplate">+ 模板</button>
                <button class="sm-btn warn" @click="resetPlaybook">重置</button>
              </div>
            </div>

            <div class="pb-section">
              <div class="pb-label">标准立场</div>
              <div v-for="(pos, idx) in playbook.positions" :key="pos.id" class="pb-card">
                <div class="pb-card-head">
                  <input
                    :value="pos.category"
                    class="pb-input-inline"
                    placeholder="类别名称"
                    @input="updatePos(idx, 'category', $event.target.value)"
                  />
                  <button class="del-btn" @click="removePosition(idx)">&times;</button>
                </div>
                <div class="pb-field">
                  <label>标准立场</label>
                  <textarea
                    :value="pos.standardPosition"
                    rows="2"
                    class="pb-textarea"
                    @input="updatePos(idx, 'standardPosition', $event.target.value)"
                  ></textarea>
                </div>
                <div class="pb-field">
                  <label>可接受范围</label>
                  <input
                    :value="pos.acceptableRange"
                    class="pb-input"
                    @input="updatePos(idx, 'acceptableRange', $event.target.value)"
                  />
                </div>
                <div class="pb-field">
                  <label>升级触发</label>
                  <input
                    :value="pos.escalationTrigger"
                    class="pb-input"
                    @input="updatePos(idx, 'escalationTrigger', $event.target.value)"
                  />
                </div>
                <div class="pb-field">
                  <label>重要度</label>
                  <select
                    :value="pos.severity"
                    class="pb-select"
                    @change="updatePos(idx, 'severity', $event.target.value)"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="pb-section">
              <div class="pb-label">NDA 默认设置</div>
              <div class="pb-field">
                <label>互负保密义务</label>
                <select
                  :value="playbook.ndaDefaults?.mutualRequired"
                  class="pb-select"
                  @change="updateNda('mutualRequired', $event.target.value === 'true')"
                >
                  <option :value="true">是</option>
                  <option :value="false">否</option>
                </select>
              </div>
              <div class="pb-field">
                <label>标准保密期</label>
                <input
                  :value="playbook.ndaDefaults?.standardTerm"
                  class="pb-input"
                  @input="updateNda('standardTerm', $event.target.value)"
                />
              </div>
              <div class="pb-field">
                <label>商业秘密保密期</label>
                <input
                  :value="playbook.ndaDefaults?.tradeSecretTerm"
                  class="pb-input"
                  @input="updateNda('tradeSecretTerm', $event.target.value)"
                />
              </div>
              <div class="pb-field">
                <label>标准例外条款</label>
                <select
                  :value="playbook.ndaDefaults?.standardCarveouts"
                  class="pb-select"
                  @change="updateNda('standardCarveouts', $event.target.value)"
                >
                  <option value="narrowly-scoped">窄范围</option>
                  <option value="broadly-scoped">宽范围</option>
                  <option value="none">无</option>
                </select>
              </div>
            </div>

            <div class="pb-section">
              <div class="pb-label">回复模板</div>
              <div v-for="(tpl, idx) in playbook.responseTemplates" :key="tpl.id" class="pb-card">
                <div class="pb-card-head">
                  <input
                    :value="tpl.name"
                    class="pb-input-inline"
                    placeholder="模板名称"
                    @input="updateTpl(idx, 'name', $event.target.value)"
                  />
                  <button class="del-btn" @click="removeTemplate(idx)">&times;</button>
                </div>
                <div class="pb-field">
                  <label>类别</label>
                  <input
                    :value="tpl.category"
                    class="pb-input"
                    @input="updateTpl(idx, 'category', $event.target.value)"
                  />
                </div>
                <div class="pb-field">
                  <label>模板内容</label>
                  <textarea
                    :value="tpl.template"
                    rows="3"
                    class="pb-textarea"
                    @input="updateTpl(idx, 'template', $event.target.value)"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div v-if="tab === 'rag'" class="tab-content">
            <div class="section-head">
              <span class="section-title">RAG 向量检索</span>
            </div>

            <div class="rag-section">
              <div class="rag-toggle">
                <label>启用 RAG 检索增强</label>
                <select
                  :value="ragConfig.enabled"
                  class="pb-select"
                  @change="updateRag('enabled', $event.target.value === 'true')"
                >
                  <option :value="true">启用</option>
                  <option :value="false">禁用</option>
                </select>
              </div>
              <div v-if="ragConfig.enabled" class="rag-hint ok">
                ✅ 已启用，AI 对话将自动检索相关上下文
              </div>
              <div v-else class="rag-hint warn">⚠️ 未启用，AI 使用全文模式</div>
            </div>

            <div class="rag-section">
              <div class="pb-label">Qdrant 连接</div>
              <div class="pb-field">
                <label>地址</label>
                <input
                  :value="ragConfig.qdrantUrl"
                  class="pb-input"
                  placeholder="http://your-server:6333"
                  @input="updateRag('qdrantUrl', $event.target.value)"
                />
              </div>
              <div class="pb-field">
                <label>API Key</label>
                <input
                  :value="ragConfig.qdrantApiKey"
                  class="pb-input"
                  type="password"
                  placeholder="可选"
                  @input="updateRag('qdrantApiKey', $event.target.value)"
                />
              </div>
              <div class="rag-actions">
                <button class="sm-btn" :disabled="ragTesting" @click="testConnection">
                  {{ ragTesting ? '测试中...' : '测试连接' }}
                </button>
                <span
                  v-if="ragTestResult"
                  :class="['rag-result', ragTestResult.ok ? 'ok' : 'fail']"
                >
                  {{ ragTestResult.ok ? '✅ 连接成功' : `❌ ${ragTestResult.error}` }}
                </span>
              </div>
            </div>

            <div class="rag-section">
              <div class="pb-label">Embedding 配置</div>
              <div class="rag-hint" style="margin-bottom: 8px">
                地址和密钥留空则自动跟随 AI 服务配置，仅需选择模型
              </div>
              <div class="pb-field">
                <label>Embedding 模型</label>
                <select
                  :value="ragConfig.embeddingModel"
                  class="pb-select"
                  @change="updateRag('embeddingModel', $event.target.value)"
                >
                  <option value="Qwen/Qwen3-Embedding-8B">Qwen3-Embedding-8B（推荐）</option>
                  <option value="BAAI/bge-large-zh-v1.5">BGE-large-zh-v1.5</option>
                  <option value="custom">自定义模型...</option>
                </select>
              </div>
              <div v-if="ragConfig.embeddingModel === 'custom'" class="pb-field">
                <label>自定义模型 ID</label>
                <input
                  :value="ragConfig.embeddingModel"
                  class="pb-input"
                  placeholder="模型 ID"
                  @input="updateRag('embeddingModel', $event.target.value)"
                />
              </div>
              <div class="pb-field">
                <label
                  >API 地址<span v-if="!ragConfig.embeddingBaseUrl" class="inherit-tag"
                    >跟随 AI 服务</span
                  ></label
                >
                <input
                  :value="ragConfig.embeddingBaseUrl"
                  class="pb-input"
                  placeholder="留空则使用 AI 服务地址"
                  @input="updateRag('embeddingBaseUrl', $event.target.value)"
                />
              </div>
              <div class="pb-field">
                <label
                  >API Key<span v-if="!ragConfig.embeddingApiKey" class="inherit-tag"
                    >跟随 AI 服务</span
                  ></label
                >
                <input
                  :value="ragConfig.embeddingApiKey"
                  class="pb-input"
                  type="password"
                  placeholder="留空则使用 AI 服务 Key"
                  @input="updateRag('embeddingApiKey', $event.target.value)"
                />
              </div>
            </div>

            <div class="rag-section">
              <div class="pb-label">数据统计</div>
              <button
                class="sm-btn"
                :disabled="ragStatsLoading"
                @click="loadStats"
                style="margin-bottom: 8px"
              >
                {{ ragStatsLoading ? '加载中...' : '刷新统计' }}
              </button>
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
                  <span>法律知识</span>
                  <span>{{ ragStats.collections?.LAW_KNOWLEDGE?.points_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { playbookService } from '@/services/ai/playbookService.js'
import { appConfig } from '@/utils/appConfig.js'
import { qdrantClient } from '@/services/rag/qdrantClient.js'
import { ragService } from '@/services/rag/ragService.js'

defineProps({
  visible: { type: Boolean, default: false }
})
defineEmits(['close'])

const tab = ref('playbook')
const playbook = ref(playbookService.loadPlaybook())
const ragConfig = ref(loadRagConfig())
const ragTesting = ref(false)
const ragTestResult = ref(null)
const ragStatsLoading = ref(false)
const ragStats = ref(null)

function loadRagConfig() {
  const config = appConfig.getConfig()
  const defaults = appConfig.getDefaultConfig()
  return { ...(defaults.rag || {}), ...(config.rag || {}) }
}

watch(
  () => appConfig.getConfig().rag,
  () => {
    ragConfig.value = loadRagConfig()
  },
  { deep: true }
)

function savePlaybook() {
  playbookService.savePlaybook(playbook.value)
}

function addPosition() {
  playbook.value = playbookService.addPosition({
    category: '新立场',
    standardPosition: '',
    acceptableRange: '',
    escalationTrigger: '',
    severity: 'medium'
  })
}

function removePosition(idx) {
  const id = playbook.value.positions[idx]?.id
  if (id) {
    playbook.value = playbookService.removePosition(id)
  }
}

function updatePos(idx, field, value) {
  playbook.value.positions[idx][field] = value
  savePlaybook()
}

function addTemplate() {
  playbook.value = playbookService.addResponseTemplate({
    name: '新模板',
    category: 'general',
    template: ''
  })
}

function removeTemplate(idx) {
  const id = playbook.value.responseTemplates[idx]?.id
  if (id) {
    playbook.value = playbookService.removeResponseTemplate(id)
  }
}

function updateTpl(idx, field, value) {
  playbook.value.responseTemplates[idx][field] = value
  savePlaybook()
}

function updateNda(field, value) {
  if (!playbook.value.ndaDefaults) playbook.value.ndaDefaults = {}
  playbook.value.ndaDefaults[field] = value
  savePlaybook()
}

function resetPlaybook() {
  playbookService.resetPlaybook()
  playbook.value = playbookService.loadPlaybook()
  window.$message?.success('Playbook 已重置')
}

function updateRag(field, value) {
  ragConfig.value[field] = value
  const config = appConfig.getConfig()
  if (!config.rag) config.rag = {}
  config.rag[field] = value
  appConfig.saveConfig(config)
  qdrantClient.clearConfigCache()
  ragTestResult.value = null
}

async function testConnection() {
  ragTesting.value = true
  ragTestResult.value = null
  try {
    qdrantClient.clearConfigCache()
    const result = await qdrantClient.healthCheck()
    ragTestResult.value = result
    if (result.ok) {
      window.$message?.success('Qdrant 连接成功')
    } else {
      window.$message?.error(`连接失败: ${result.error}`)
    }
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
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}
.drawer-panel {
  width: 360px;
  max-width: 85vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.12);
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  flex-shrink: 0;
}
.drawer-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}
.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}
.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 12px;
  background: #fafafa;
  position: sticky;
  top: 0;
  z-index: 1;
}
.tab-btn {
  flex: 1;
  padding: 10px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}
.tab-btn:hover {
  color: #1d4ed8;
}
.tab-content {
  padding: 14px 16px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #111;
}
.section-actions {
  display: flex;
  gap: 6px;
}
.sm-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.sm-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}
.sm-btn.warn {
  color: #dc2626;
  border-color: #fca5a5;
}
.sm-btn.warn:hover {
  background: #fef2f2;
}
.sm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pb-section {
  margin-bottom: 18px;
}
.pb-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.pb-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.pb-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.pb-input-inline {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 600;
  background: #fff;
}
.pb-input-inline:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.del-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: #fee2e2;
  border-radius: 4px;
  color: #dc2626;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}
.del-btn:hover {
  background: #fecaca;
}
.pb-field {
  margin-bottom: 8px;
}
.pb-field label {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 3px;
  font-weight: 600;
}
.pb-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
  background: #fff;
}
.pb-input:focus {
  outline: none;
  border-color: #2563eb;
}
.pb-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
  resize: vertical;
  background: #fff;
  font-family: inherit;
}
.pb-textarea:focus {
  outline: none;
  border-color: #2563eb;
}
.pb-select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 12px;
  background: #fff;
}
.pb-select:focus {
  outline: none;
  border-color: #2563eb;
}
.rag-section {
  margin-bottom: 16px;
}
.rag-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.rag-toggle label {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}
.rag-toggle .pb-select {
  width: auto;
  min-width: 80px;
}
.rag-hint {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 5px;
  background: #f3f4f6;
  color: #6b7280;
  margin-top: 6px;
}
.rag-hint.ok {
  background: #ecfdf5;
  color: #065f46;
}
.rag-hint.warn {
  background: #fffbeb;
  color: #92400e;
}
.rag-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.rag-result {
  font-size: 12px;
  font-weight: 600;
}
.rag-result.ok {
  color: #16a34a;
}
.rag-result.fail {
  color: #dc2626;
}
.rag-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  padding: 4px 0;
  border-bottom: 1px solid #f3f4f6;
}
.stat-row span:last-child {
  font-weight: 700;
  color: #111;
}
.inherit-tag {
  font-size: 10px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 6px;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.25s ease;
}
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  background: rgba(0, 0, 0, 0);
}
.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
