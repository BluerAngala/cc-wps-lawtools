<template>
  <Transition name="drawer">
    <div v-if="visible" class="drawer-overlay" @click.self="$emit('close')">
      <div class="drawer-panel">
        <div class="drawer-header">
          <h3>助手设置</h3>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>

        <div class="drawer-body">
          <div class="drawer-hint">
            💡 更多配置（AI 模型/金山文档/数据管理）请到 <strong>设置</strong> 面板
          </div>
          <div class="tabs">
            <button
              class="tab-btn"
              :class="{ active: tab === 'playbook' }"
              @click="tab = 'playbook'"
            >
              📋 审查策略
            </button>
            <button class="tab-btn" :class="{ active: tab === 'rag' }" @click="tab = 'rag'">
              🔍 向量检索
            </button>
          </div>

          <div v-if="tab === 'playbook'" class="tab-content">
            <div class="section-head">
              <span class="section-title">审查策略配置</span>
              <div class="section-actions">
                <button class="sm-btn warn" @click="resetPlaybook">恢复默认</button>
              </div>
            </div>

            <p class="section-desc">
              设定 AI 审查合同时的关注要点和回复风格，让审查结果更贴合您的需求。
            </p>

            <div class="pb-section sec-danger">
              <div class="pb-label" @click="sections.positions = !sections.positions">
                <span class="pb-label-left">🔍 审查要点（{{ playbook.positions.length }}）</span>
                <span class="pb-label-right">
                  <button class="add-inline" @click.stop="addPosition">+ 添加</button>
                  <span class="toggle-icon">{{ sections.positions ? '▾' : '▸' }}</span>
                </span>
              </div>

              <Transition name="collapse">
                <div v-if="sections.positions" class="section-body">
                  <div v-for="(pos, idx) in playbook.positions" :key="pos.id" class="acc-card">
                    <div class="acc-head" @click="toggleExpand('pos', pos.id)">
                      <span class="acc-title">
                        <span :class="['sev-dot', pos.severity]"></span>
                        {{ pos.category || '未命名' }}
                      </span>
                      <span class="acc-actions">
                        <button class="del-btn-sm" @click.stop="removePosition(idx)" title="删除">×</button>
                        <span class="acc-arrow">{{ expanded.pos === pos.id ? '▾' : '▸' }}</span>
                      </span>
                    </div>
                    <Transition name="collapse">
                      <div v-if="expanded.pos === pos.id" class="acc-body">
                        <div class="pb-field">
                          <label>条款类别</label>
                          <input
                            :value="pos.category"
                            class="pb-input"
                            placeholder="如：违约金条款"
                            @input="updatePos(idx, 'category', $event.target.value)"
                          />
                        </div>
                        <div class="pb-field">
                          <label>我方底线</label>
                          <textarea
                            :value="pos.standardPosition"
                            rows="2"
                            class="pb-textarea"
                            placeholder="我方对该条款的基本立场"
                            @input="updatePos(idx, 'standardPosition', $event.target.value)"
                          ></textarea>
                        </div>
                        <div class="pb-field">
                          <label>可接受范围</label>
                          <input
                            :value="pos.acceptableRange"
                            class="pb-input"
                            placeholder="可以接受的妥协范围"
                            @input="updatePos(idx, 'acceptableRange', $event.target.value)"
                          />
                        </div>
                        <div class="pb-field">
                          <label>必须预警的情况</label>
                          <input
                            :value="pos.escalationTrigger"
                            class="pb-input"
                            placeholder="遇到这些情况必须提醒我"
                            @input="updatePos(idx, 'escalationTrigger', $event.target.value)"
                          />
                        </div>
                        <div class="pb-field">
                          <label>重要程度</label>
                          <select
                            :value="pos.severity"
                            class="pb-select"
                            @change="updatePos(idx, 'severity', $event.target.value)"
                          >
                            <option value="high">🔴 高 — 必须关注</option>
                            <option value="medium">🟡 中 — 建议关注</option>
                            <option value="low">🟢 低 — 可忽略</option>
                          </select>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="pb-section sec-primary">
              <div class="pb-label" @click="sections.nda = !sections.nda">
                <span class="pb-label-left">🔒 保密协议偏好</span>
                <span class="pb-label-right">
                  <span class="toggle-icon">{{ sections.nda ? '▾' : '▸' }}</span>
                </span>
              </div>

              <Transition name="collapse">
                <div v-if="sections.nda" class="section-body">
                  <div class="pb-field">
                    <label>是否要求互负保密义务</label>
                    <select
                      :value="playbook.ndaDefaults?.mutualRequired"
                      class="pb-select"
                      @change="updateNda('mutualRequired', $event.target.value === 'true')"
                    >
                      <option :value="true">是 — 双方均有保密义务</option>
                      <option :value="false">否 — 可接受单方保密</option>
                    </select>
                  </div>
                  <div class="pb-field">
                    <label>标准保密期限</label>
                    <input
                      :value="playbook.ndaDefaults?.standardTerm"
                      class="pb-input"
                      placeholder="如：2-3年"
                      @input="updateNda('standardTerm', $event.target.value)"
                    />
                  </div>
                  <div class="pb-field">
                    <label>商业秘密保密期限</label>
                    <input
                      :value="playbook.ndaDefaults?.tradeSecretTerm"
                      class="pb-input"
                      placeholder="如：5年"
                      @input="updateNda('tradeSecretTerm', $event.target.value)"
                    />
                  </div>
                  <div class="pb-field">
                    <label>例外条款范围</label>
                    <select
                      :value="playbook.ndaDefaults?.standardCarveouts"
                      class="pb-select"
                      @change="updateNda('standardCarveouts', $event.target.value)"
                    >
                      <option value="narrowly-scoped">窄 — 仅法定例外</option>
                      <option value="broadly-scoped">宽 — 含已有信息例外</option>
                      <option value="none">不设例外</option>
                    </select>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="pb-section sec-accent">
              <div class="pb-label" @click="sections.templates = !sections.templates">
                <span class="pb-label-left">💬 常用回复（{{ playbook.responseTemplates.length }}）</span>
                <span class="pb-label-right">
                  <button class="add-inline" @click.stop="addTemplate">+ 添加</button>
                  <span class="toggle-icon">{{ sections.templates ? '▾' : '▸' }}</span>
                </span>
              </div>

              <Transition name="collapse">
                <div v-if="sections.templates" class="section-body">
                  <div v-for="(tpl, idx) in playbook.responseTemplates" :key="tpl.id" class="acc-card">
                    <div class="acc-head" @click="toggleExpand('tpl', tpl.id)">
                      <span class="acc-title">{{ tpl.name || '未命名回复' }}</span>
                      <span class="acc-actions">
                        <button class="del-btn-sm" @click.stop="removeTemplate(idx)" title="删除">×</button>
                        <span class="acc-arrow">{{ expanded.tpl === tpl.id ? '▾' : '▸' }}</span>
                      </span>
                    </div>
                    <Transition name="collapse">
                      <div v-if="expanded.tpl === tpl.id" class="acc-body">
                        <div class="pb-field">
                          <label>名称</label>
                          <input
                            :value="tpl.name"
                            class="pb-input"
                            placeholder="回复模板名称"
                            @input="updateTpl(idx, 'name', $event.target.value)"
                          />
                        </div>
                        <div class="pb-field">
                          <label>适用场景</label>
                          <input
                            :value="tpl.category"
                            class="pb-input"
                            placeholder="如：合规、争议、询价"
                            @input="updateTpl(idx, 'category', $event.target.value)"
                          />
                        </div>
                        <div class="pb-field">
                          <label>回复内容</label>
                          <textarea
                            :value="tpl.template"
                            rows="4"
                            class="pb-textarea"
                            placeholder="回复模板的具体内容"
                            @input="updateTpl(idx, 'template', $event.target.value)"
                          ></textarea>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </Transition>
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
import { appConfig } from '@/utils/AppConfig.js'
import { qdrantClient } from '@/services/rag/QdrantClient.js'
import { ragService } from '@/services/rag/RagService.js'

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

const sections = ref({ positions: false, nda: false, templates: false })
const expanded = ref({ pos: null, tpl: null })

function toggleExpand(type, id) {
  expanded.value[type] = expanded.value[type] === id ? null : id
}

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
    category: '',
    standardPosition: '',
    acceptableRange: '',
    escalationTrigger: '',
    severity: 'medium'
  })
  sections.value.positions = true
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
    name: '',
    category: 'general',
    template: ''
  })
  sections.value.templates = true
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
  window.$message?.success('已恢复默认设置')
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
.drawer-hint {
  background: var(--c-accent-light);
  color: #991b1b;
  font-size: 11px;
  padding: 8px 16px;
  border-bottom: 1px solid #fecaca;
  line-height: 1.5;
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
  color: var(--c-accent);
  border-bottom-color: var(--c-accent);
}
.tab-btn:hover {
  color: var(--c-accent);
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
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.pb-section.sec-danger .pb-label {
  background: #fef2f2;
}
.pb-section.sec-primary .pb-label {
  background: #eff6ff;
}
.pb-section.sec-accent .pb-label {
  background: #f5f3ff;
}
.section-body {
  padding: 10px 12px;
}
.pb-label {
  font-size: 13px;
  font-weight: 700;
  color: #111;
  padding: 10px 12px;
  margin-bottom: 0;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}
.pb-label-left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pb-label-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.add-inline {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.add-inline:hover {
  background: #eff6ff;
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

.section-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 14px;
  line-height: 1.5;
}

.toggle-icon {
  font-size: 11px;
  color: #9ca3af;
}

.acc-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 6px;
  overflow: hidden;
}
.acc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}
.acc-head:hover {
  background: #f3f4f6;
}
.acc-title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
  display: flex;
  align-items: center;
  gap: 6px;
}
.acc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.acc-arrow {
  font-size: 11px;
  color: #9ca3af;
}
.del-btn-sm {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.del-btn-sm:hover {
  background: #fee2e2;
  color: #dc2626;
}
.acc-body {
  padding: 0 12px 12px;
}
.sev-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.sev-dot.high {
  background: #ef4444;
}
.sev-dot.medium {
  background: #eab308;
}
.sev-dot.low {
  background: #22c55e;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 800px;
}
</style>
