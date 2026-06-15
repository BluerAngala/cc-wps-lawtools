<template>
  <div class="chat-root">
    <ChatHeader
      :doc-info="docInfo"
      @refresh-doc="refreshDoc"
      @clear="clearChat"
      @export-chat="toggleSelectMode"
      @toggle-settings="showSettings = !showSettings"
    />

    <div ref="messagesArea" class="messages-area" @scroll="onScroll">
      <EmptyState
        v-if="messages.length === 0 && !isLoading"
        :is-loading="isLoading"
        :messages="messages"
        @quick-prompt="handleQuickPrompt"
      />

      <TransitionGroup name="msg">
        <div
          v-for="(msg, mIdx) in messages"
          :key="msg.id"
          class="msg-row"
          :class="[msg.role, { selected: selectMode && selectedIds.has(msg.id), selecting: selectMode }]"
          @click="selectMode && toggleSelect(msg.id)"
        >
          <label v-if="selectMode" class="msg-check" @click.stop>
            <input type="checkbox" :checked="selectedIds.has(msg.id)" @change="toggleSelect(msg.id)" />
            <span class="check-box"></span>
          </label>
          <div class="msg-avatar" :class="msg.role">
            <span v-if="msg.role === 'user'">👤</span>
            <span v-else>⚖️</span>
          </div>
          <div class="msg-body" :class="msg.role">
            <div v-if="msg.role === 'user'" class="msg-bubble user">
              {{ msg.text }}
            </div>
            <div v-else class="msg-bubble ai">
              <div v-if="msg.statusText" class="status-pill">
                <span class="sp-dot"></span>{{ msg.statusText }}
              </div>
              <div v-if="msg.text" class="md-content" v-html="renderMd(msg.text)"></div>
              <div v-if="msg.isStreaming" class="blink-cursor"></div>

              <RiskMatrix v-if="getRiskAction(msg)" :items="getRiskAction(msg).items" />
              <TriageCard v-if="getTriageAction(msg)" v-bind="getTriageAction(msg)" />
              <CompareView v-if="getCompareAction(msg)" :items="getCompareAction(msg).items" />

              <div v-if="msg.executableActions.length" class="action-list">
                <div class="al-header">
                  <span class="al-title">操作建议 ({{ msg.executableActions.length }})</span>
                  <button
                    v-if="msg.executableActions.length > 1 && hasUnapplied(msg)"
                    class="al-apply-all"
                    @click="handleApplyAll(mIdx)"
                  >
                    ⚡ 全部应用
                  </button>
                </div>
                <ActionCard
                  v-for="(act, aIdx) in msg.executableActions"
                  :key="aIdx"
                  :action="act"
                  @apply="(params) => handleApplyAction(mIdx, aIdx, params)"
                  @locate="handleLocateAction(act)"
                  @reject="handleRejectAction(mIdx, aIdx)"
                  @retry="(params) => handleRetryAction(mIdx, aIdx, params)"
                />
              </div>
            </div>

            <div v-if="!msg.isStreaming && !selectMode" class="msg-actions">
              <button class="ma-btn" title="复制" @click="copyMessage(msg)">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button class="ma-btn" title="删除" @click="deleteMessage(mIdx)">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div ref="scrollAnchor"></div>
    </div>

    <div v-if="selectMode" class="select-bar">
      <label class="sb-check" @click.stop>
        <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
        <span class="check-box"></span>
        <span class="sb-label">全选</span>
      </label>
      <span class="sb-count">已选 {{ selectedIds.size }} 条</span>
      <button class="sb-btn export" :disabled="!selectedIds.size" @click="exportSelected">
        📋 导出选中
      </button>
      <button class="sb-btn cancel" @click="exitSelectMode">取消</button>
    </div>

    <div v-if="isLoading && !streamingText && !selectMode" class="loading-bar">
      <div class="lb-progress"></div>
    </div>

    <div v-if="!selectMode && messages.length" class="action-toolbar">
      <button
        v-for="qa in quickActions"
        :key="qa.value"
        class="qa-btn"
        :title="qa.desc"
        :disabled="isLoading"
        @click="handleQuickAction(qa)"
      >
        <span class="qa-icon">{{ qa.icon }}</span>
        <span class="qa-label">{{ qa.label }}</span>
      </button>
    </div>

    <ChatInput
      v-if="!selectMode"
      v-model="inputText"
      :is-loading="isLoading"
      :show-slash-menu="showSlashMenu"
      :slash-commands="slashCommands"
      @send="handleSend"
      @cancel="handleCancel"
      @keydown="onInputKeydown"
      @select-command="selectCommand"
    />

    <ChatSettings :visible="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { marked } from 'marked'
import { chatService } from '@/services/ai/chatService.js'
import { actionRegistry } from '@/services/workflow/ActionRegistry.js'
import { playbookService } from '@/services/ai/playbookService.js'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import ChatSettings from '@/components/chat/ChatSettings.vue'
import EmptyState from '@/components/chat/EmptyState.vue'
import ActionCard from '@/components/chat/ActionCard.vue'
import RiskMatrix from '@/components/chat/RiskMatrix.vue'
import TriageCard from '@/components/chat/TriageCard.vue'
import CompareView from '@/components/chat/CompareView.vue'

let msgIdCounter = 0
function nextId() {
  return ++msgIdCounter
}

const messages = ref([])
const inputText = ref('')
const showSettings = ref(false)
const isLoading = ref(false)
const streamingText = ref('')
const streamingStatus = ref('')
const showSlashMenu = ref(false)
const docInfo = ref('')
const messagesArea = ref(null)
const scrollAnchor = ref(null)
const isNearBottom = ref(true)
const currentMode = ref('standard')
const selectMode = ref(false)
const selectedIds = ref(new Set())

const isAllSelected = computed(() => messages.value.length > 0 && selectedIds.value.size === messages.value.length)

function toggleSelectMode() {
  selectMode.value = !selectMode.value
  if (!selectMode.value) selectedIds.value = new Set()
}

function exitSelectMode() {
  selectMode.value = false
  selectedIds.value = new Set()
}

function toggleSelect(id) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(messages.value.map((m) => m.id))
  }
}

const quickActions = [
  { icon: '🔍', label: '审查合同', value: '/审查', desc: '全面审查合同风险' },
  { icon: '⚡', label: '风险扫描', value: '请扫描当前文档中的敏感信息，列出位置和类型', desc: '扫描敏感信息' },
  { icon: '🔒', label: '信息脱敏', value: '/脱敏', desc: '识别并脱敏敏感信息' },
  { icon: '📋', label: '合同模板', value: '请帮我生成一份常见的法律合同模板', desc: '生成模板文档' },
  { icon: '🔄', label: '批量处理', value: '请批量处理文档中的关键词，添加批注或修订', desc: '批量关键词处理' },
  { icon: '🚀', label: '一键审查', value: '_fullReview', desc: '全流程审查：识别→分析→提取→逐条审查' }
]

const slashCommands = [
  { icon: '🔍', value: '/审查', label: '/审查 合同', desc: '全面审查合同风险' },
  { icon: '💬', value: '/批注', label: '/批注 风险', desc: '在风险处添加批注' },
  { icon: '✏️', value: '/修改', label: '/修改 条款', desc: '对话式修改条款' },
  { icon: '📋', value: '/总结', label: '/总结 合同', desc: '摘要总结合同内容' },
  { icon: '🔒', value: '/脱敏', label: '/脱敏 信息', desc: '识别并脱敏敏感信息' },
  { icon: '📝', value: '/续写', label: '/续写 条款', desc: '续写或补充合同条款' },
  { icon: '🚦', value: '/保密', label: '/保密 审查', desc: '保密协议快速分流' },
  { icon: '⚡', value: '/风险', label: '/风险 评估', desc: '结构化风险评估' },
  { icon: '⚖️', value: '/对比', label: '/对比 条款', desc: '合同对比分析' },
  { icon: '📨', value: '/回复', label: '/回复 模板', desc: '使用模板生成回复' }
]

const STATUS_MAP = {
  thinking: '🧠 思考中...',
  reading: '📖 阅读文档...',
  generating: '✍️ 生成回复...'
}

marked.setOptions({ gfm: true, breaks: true })

function renderMd(text) {
  if (!text) return ''
  try {
    const clean = text.replace(/```action\s*[\s\S]*?```/g, '')
    return marked.parse(clean)
  } catch {
    return text
  }
}

function getRiskAction(msg) {
  return msg.actions?.find((a) => a.type === 'risk')
}

function getTriageAction(msg) {
  return msg.actions?.find((a) => a.type === 'triage')
}

function getCompareAction(msg) {
  return msg.actions?.find((a) => a.type === 'compare')
}

function hasUnapplied(msg) {
  return msg.executableActions?.some((a) => !a._applied && !a._failed && !a._rejected)
}

function refreshDoc() {
  try {
    const app = window.Application
    if (app?.ActiveDocument) {
      docInfo.value = app.ActiveDocument.Name || '已加载'
    } else {
      docInfo.value = ''
    }
  } catch {
    docInfo.value = ''
  }
}

function clearChat() {
  chatService.clearHistory()
  messages.value = []
  streamingText.value = ''
  streamingStatus.value = ''
  currentMode.value = 'standard'
  persistHistory()
}

function onScroll() {
  const el = messagesArea.value
  if (!el) return
  isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 60
}

function scrollToBottom(force = false) {
  nextTick(() => {
    if (force || isNearBottom.value) {
      scrollAnchor.value?.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

function detectMode(text) {
  const t = text.trim().toLowerCase()
  if (
    t.startsWith('/保密') ||
    t.includes('nda分流') ||
    t.includes('nda审查') ||
    t.includes('保密协议分流')
  )
    return 'triage-nda'
  if (t.startsWith('/风险') || t.includes('风险评估') || t.includes('风险矩阵'))
    return 'risk-assessment'
  if (t.startsWith('/对比') || t.includes('合同对比') || t.includes('条款对比')) return 'compare'
  if (t.startsWith('/回复') || t.includes('模板回复') || t.includes('回复模板')) return 'respond'
  return 'standard'
}

function resolveSendText(text) {
  const t = text.trim()
  const cmdMap = {
    '/审查': '请全面审查当前合同，指出主要风险点并提供修改建议',
    '/批注': '请在当前文档的风险条款处添加法律批注',
    '/修改': '请审查当前合同，对不合理条款提出修订建议',
    '/总结': '请总结当前合同的核心条款和关键信息',
    '/脱敏': '请识别当前文档中的敏感信息并进行脱敏处理',
    '/续写': '请审查当前合同，补充缺失的常见条款',
    '/保密': '请对当前NDA（保密协议）进行快速分流评估（GREEN/YELLOW/RED）',
    '/风险': '请对当前合同进行结构化风险评估，使用严重度×可能性矩阵',
    '/对比': '请对比当前合同与行业标准合同条款的差异',
    '/回复': '请根据法律回复模板生成回复'
  }
  return cmdMap[t] || t
}

async function handleSend() {
  const raw = inputText.value.trim()
  if (!raw || isLoading.value) return

  inputText.value = ''
  showSlashMenu.value = false

  const mode = detectMode(raw)
  const sendText = resolveSendText(raw)
  currentMode.value = mode

  const userMsg = { id: nextId(), role: 'user', text: raw }
  messages.value.push(userMsg)

  const aiMsg = {
    id: nextId(),
    role: 'assistant',
    text: '',
    actions: [],
    executableActions: [],
    statusText: STATUS_MAP.thinking,
    isStreaming: true
  }
  messages.value.push(aiMsg)
  scrollToBottom(true)

  let msgRef = messages.value[messages.value.length - 1]

  let templateContent = ''
  let inquiryType = ''
  if (mode === 'respond') {
    const playbook = playbookService.loadPlaybook()
    if (playbook.responseTemplates?.length) {
      templateContent = playbook.responseTemplates[0].template
      inquiryType = playbook.responseTemplates[0].category
    }
  }

  await chatService.sendMessage(sendText, {
    mode,
    templateContent,
    inquiryType,
    onStatus(status) {
      if (msgRef) msgRef.statusText = STATUS_MAP[status] || ''
    },
    onChunk(delta) {
      if (msgRef) {
        msgRef.text += delta
        streamingText.value += delta
      }
      scrollToBottom()
    },
    onComplete(result) {
      if (msgRef) {
        msgRef.text = result.text || ''
        msgRef.isStreaming = false
        msgRef.statusText = ''

        const allActions = result.actions || []

        msgRef.actions = allActions

        msgRef.executableActions = allActions.filter((a) => actionRegistry.has(a.type))
      }
      streamingText.value = ''
      streamingStatus.value = ''
      persistHistory()
      scrollToBottom(true)
    },
    onError(err) {
      if (msgRef) {
        msgRef.text = `❌ ${err}`
        msgRef.isStreaming = false
        msgRef.statusText = ''
      }
      streamingText.value = ''
      isLoading.value = false
    },
    onAction() {}
  })
}

function handleCancel() {
  chatService.cancel()
  const msgRef = messages.value[messages.value.length - 1]
  if (msgRef?.isStreaming) {
    msgRef.isStreaming = false
    msgRef.statusText = ''
  }
  streamingText.value = ''
  isLoading.value = false
}

async function handleApplyAction(msgIdx, actionIdx, mergedParams) {
  const msg = messages.value[msgIdx]
  if (!msg?.executableActions[actionIdx]) return

  const action = msg.executableActions[actionIdx]
  if (mergedParams) {
    Object.assign(action, mergedParams)
  }
  const result = await chatService.applyAction(action)

  if (result.success) {
    action._applied = true
    window.$message?.info('已应用，可在文档中 Ctrl+Z 撤销')
  } else {
    action._failed = true
    action._errorMsg = result.message
  }
  persistHistory()
}

async function handleRetryAction(msgIdx, actionIdx, mergedParams) {
  const msg = messages.value[msgIdx]
  if (!msg?.executableActions[actionIdx]) return

  const action = msg.executableActions[actionIdx]
  if (mergedParams) {
    Object.assign(action, mergedParams)
  }
  delete action._failed
  delete action._errorMsg

  const result = await chatService.applyAction(action)

  if (result.success) {
    action._applied = true
    window.$message?.info('已应用，可在文档中 Ctrl+Z 撤销')
  } else {
    action._failed = true
    action._errorMsg = result.message
  }
  persistHistory()
}

async function handleApplyAll(msgIdx) {
  const msg = messages.value[msgIdx]
  if (!msg) return

  let applied = 0
  for (const action of msg.executableActions) {
    if (!action._applied && !action._failed && !action._rejected) {
      const result = await chatService.applyAction(action)
      if (result.success) {
        action._applied = true
        applied++
      } else {
        action._failed = true
      }
    }
  }
  if (applied > 0) {
    window.$message?.info(`已应用 ${applied} 个操作，可在文档中 Ctrl+Z 撤销`)
  }
  persistHistory()
}

function handleRejectAction(msgIdx, actionIdx) {
  const msg = messages.value[msgIdx]
  if (msg?.executableActions[actionIdx]) {
    msg.executableActions[actionIdx]._rejected = true
  }
  persistHistory()
}

function copyMessage(msg) {
  let text = msg.text || ''

  const actions = msg.executableActions || msg.actions || []
  if (actions.length > 0) {
    const actionLines = actions.map((a) => {
      const regAction = actionRegistry.get(a.type)
      const label = regAction ? `${regAction.icon} ${regAction.name}` : a.type
      const status = a._applied ? ' ✅已应用' : a._rejected ? ' 已跳过' : a._failed ? ' ❌失败' : ''
      const json = JSON.stringify(a, null, 2).split('\n').map((l) => '  ' + l).join('\n')
      return `- ${label}${status}\n${json}`
    })
    text += '\n\n操作建议:\n' + actionLines.join('\n\n')
  }

  if (!text.trim()) return
  navigator.clipboard.writeText(text).then(
    () => window.$message?.success('已复制'),
    () => {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      window.$message?.success('已复制')
    }
  )
}

function _copyText(text) {
  navigator.clipboard.writeText(text).then(
    () => window.$message?.success('对话记录已复制到剪贴板'),
    () => {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      window.$message?.success('对话记录已复制到剪贴板')
    }
  )
}

function exportSelected() {
  const selected = messages.value.filter((m) => selectedIds.value.has(m.id))
  if (!selected.length) {
    window.$message?.info('请先选择要导出的对话')
    return
  }

  const lines = selected.map((msg) => {
    const role = msg.role === 'user' ? '👤 用户' : '⚖️ AI'
    let text = msg.text || ''

    const actions = msg.executableActions || msg.actions || []
    if (actions.length > 0) {
      const actionLines = actions.map((a) => {
        const regAction = actionRegistry.get(a.type)
        const label = regAction ? `${regAction.icon} ${regAction.name}` : a.type
        const status = a._applied ? ' ✅已应用' : a._rejected ? ' 已跳过' : a._failed ? ' ❌失败' : ''
        const json = JSON.stringify(a, null, 2).split('\n').map((l) => '    ' + l).join('\n')
        return `  - ${label}${status}\n${json}`
      })
      text += '\n\n操作建议:\n' + actionLines.join('\n\n')
    }

    return `${role}:\n${text}`
  })

  const header = `📋 对话记录导出\n文档: ${docInfo.value || '未知'}\n时间: ${new Date().toLocaleString()}\n选中: ${selected.length} 条\n${'─'.repeat(40)}\n\n`
  _copyText(header + lines.join('\n\n' + '─'.repeat(30) + '\n\n'))
  exitSelectMode()
}

function deleteMessage(idx) {
  messages.value.splice(idx, 1)
  persistHistory()
}

async function handleLocateAction(action) {
  try {
    const keyword = action.keyword
    if (!keyword) return
    const { wpsDocument } = await import('@/services/wps/WpsDocument.js')
    const found = wpsDocument.locateAndSelect(keyword, action)
    if (!found) {
      const short = keyword.length > 20 ? keyword.substring(0, 20) + '...' : keyword
      window.$message?.warning(`未找到"${short}"，文本可能已被修改`)
    }
  } catch (e) {
    console.warn('定位失败:', e)
    window.$message?.error('定位失败，请稍后重试')
  }
}

function handleQuickAction(qa) {
  if (qa.value === '_fullReview') {
    handleFullReview()
    return
  }
  inputText.value = qa.value
  nextTick(() => handleSend())
}

async function handleFullReview() {
  if (isLoading.value) return
  showSlashMenu.value = false

  const stages = [
    { prefix: '🔍 第一步：合同类型识别', text: '请识别当前合同的类型（如：买卖合同、保密协议、服务协议等），输出合同名称、类型、子类型。' },
    { prefix: '🌐 第二步：全局分析', text: '请对当前合同进行全局分析，列出整体结构框架，指出高风险区域。' },
    { prefix: '📋 第三步：要素提取', text: '请提取当前合同的关键要素：甲方、乙方、合同金额、期限、管辖法院、违约责任、知识产权归属等。' },
    { prefix: '⚖️ 第四步：逐条审查', text: '请逐条审查当前合同条款，按条款列出风险点、严重程度、修改建议。输出格式使用 ```action 代码块 包含 addComment 或 addRevision 操作。' }
  ]

  for (const stage of stages) {
    const aiMsg = {
      id: nextId(),
      role: 'assistant',
      text: `**${stage.prefix}**\n\n`,
      actions: [],
      executableActions: [],
      statusText: STATUS_MAP.thinking,
      isStreaming: true
    }
    messages.value.push(aiMsg)
    scrollToBottom(true)

    let msgRef = messages.value[messages.value.length - 1]

    await chatService.sendMessage(stage.text, {
      mode: 'standard',
      onStatus(status) {
        if (msgRef) msgRef.statusText = STATUS_MAP[status] || ''
      },
      onChunk(delta) {
        if (msgRef) {
          msgRef.text += delta
        }
        scrollToBottom()
      },
      onComplete(result) {
        if (msgRef) {
          msgRef.text = `**${stage.prefix}**\n\n${result.text || ''}`
          msgRef.isStreaming = false
          msgRef.statusText = ''
          const allActions = result.actions || []
          msgRef.actions = allActions
          msgRef.executableActions = allActions.filter((a) => actionRegistry.has(a.type))
        }
        persistHistory()
        scrollToBottom(true)
      },
      onError(err) {
        if (msgRef) {
          msgRef.text += `\n\n❌ ${err}`
          msgRef.isStreaming = false
          msgRef.statusText = ''
        }
      },
      onAction() {}
    })
  }
}

function handleQuickPrompt(text) {
  inputText.value = text
  nextTick(() => handleSend())
}

function selectCommand(cmd) {
  inputText.value = cmd.value + ' '
  showSlashMenu.value = false
}

function onInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
    return
  }

  if (e.key === '/' && inputText.value === '') {
    showSlashMenu.value = true
    return
  }

  if (showSlashMenu.value) {
    if (e.key === 'Escape') {
      showSlashMenu.value = false
      return
    }
  }

  if (!inputText.value.startsWith('/')) {
    showSlashMenu.value = false
  }
}

function persistHistory() {
  try {
    const app = window.Application
    if (!app?.PluginStorage) return
    const data = messages.value.map((m) => ({
      id: m.id,
      role: m.role,
      text: m.text,
      actions: m.actions,
      executableActions: m.executableActions
    }))
    app.PluginStorage.setItem('ai_chat_history', JSON.stringify(data))
  } catch {
    // silent
  }
}

function restoreHistory() {
  try {
    const app = window.Application
    if (!app?.PluginStorage) return
    const raw = app.PluginStorage.getItem('ai_chat_history')
    if (!raw) return
    const data = JSON.parse(raw)
    if (Array.isArray(data)) {
      messages.value = data
      if (data.length) msgIdCounter = Math.max(...data.map((d) => d.id)) + 1
    }
  } catch {
    // silent
  }
}

watch(inputText, (val) => {
  if (val.startsWith('/') && val.length <= 10) {
    showSlashMenu.value = true
  } else if (!val.startsWith('/')) {
    showSlashMenu.value = false
  }
})

onMounted(() => {
  refreshDoc()
  restoreHistory()
})
</script>

<style scoped>
.chat-root {
  --c-brand: #0a0a0a;
  --c-brand-light: #2d2d2d;
  --c-accent: #e63946;
  --c-accent-light: #fee2e2;
  --c-highlight: #f5c518;
  --c-highlight-light: #fff9c4;
  --c-surface: #ffffff;
  --c-danger: #dc2626;
  --c-success: #16a34a;
  --c-text: #0a0a0a;
  --c-text2: #666666;
  --c-border: #e0e0e0;
  --c-bg: #f8f8f8;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 10px 6px;
  scroll-behavior: smooth;
}

.msg-row {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  padding: 0 4px;
  transition: background 0.15s;
  position: relative;
}
.msg-row.selected {
  background: #eff6ff;
  border-radius: 8px;
  justify-content: flex-start;
}
.msg-check {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
  padding-right: 2px;
  cursor: pointer;
  flex-shrink: 0;
  width: 26px;
  order: -1;
}
.msg-check input {
  display: none;
}
.check-box {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.msg-check input:checked + .check-box {
  background: #3b82f6;
  border-color: #3b82f6;
}
.msg-check input:checked + .check-box::after {
  content: '';
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translateY(-1px);
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-row.selecting {
  justify-content: flex-start;
}
.msg-row.user.selecting .msg-avatar {
  margin-left: auto;
}
.msg-row.selected {
  background: #eff6ff;
  border-radius: 8px;
}

.msg-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}
.msg-avatar.user {
  background: var(--c-accent-light);
}
.msg-avatar.assistant {
  background: var(--c-highlight-light);
}

.msg-body {
  max-width: 90%;
  min-width: 60px;
  display: flex;
  flex-direction: column;
}
.msg-body.user {
  align-items: flex-end;
}
.msg-body.assistant {
  max-width: 100%;
  flex: 1;
  min-width: 0;
  align-items: flex-start;
}

.msg-bubble {
  padding: 8px 10px;
  border-radius: 12px;
  line-height: 1.55;
  font-size: 13px;
  word-break: break-word;
}
.msg-bubble.user {
  background: linear-gradient(135deg, #e63946, #c62828);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg-bubble.ai {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-top-left-radius: 4px;
  width: 100%;
}
.msg-actions {
  display: flex;
  gap: 2px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.msg-row:hover .msg-actions {
  opacity: 1;
}
.ma-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #999;
  transition: all 0.15s;
}
.ma-btn:hover {
  background: #f3f4f6;
  color: #333;
}


.md-content :deep(h1) {
  font-size: 16px;
  font-weight: 700;
  margin: 8px 0 4px;
}
.md-content :deep(h2) {
  font-size: 15px;
  font-weight: 700;
  margin: 8px 0 4px;
}
.md-content :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  margin: 6px 0 3px;
}
.md-content :deep(p) {
  margin: 6px 0;
  line-height: 1.8;
  letter-spacing: 0.3px;
}
.md-content :deep(ul),
.md-content :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
  line-height: 1.8;
  letter-spacing: 0.3px;
}
.md-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0;
  font-size: 12px;
}
.md-content :deep(th),
.md-content :deep(td) {
  border: 1px solid var(--c-border);
  padding: 4px 6px;
  text-align: left;
}
.md-content :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}
.md-content :deep(code) {
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
  color: #c62828;
}
.md-content :deep(pre) {
  background: #f5f5f5;
  color: #1a1a1a;
  padding: 10px 12px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12px;
  margin: 8px 0;
  border: 1px solid #e0e0e0;
}
.md-content :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: inherit;
}
.md-content :deep(blockquote) {
  border-left: 3px solid var(--c-accent);
  padding-left: 10px;
  margin: 6px 0;
  color: var(--c-text2);
  font-style: italic;
}
.md-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--c-border);
  margin: 8px 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--c-accent);
  margin-bottom: 6px;
  padding: 2px 8px;
  background: var(--c-accent-light);
  border-radius: 10px;
}
.sp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-accent);
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.blink-cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--c-accent);
  margin-left: 2px;
  animation: blink 0.8s step-end infinite;
  vertical-align: middle;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.loading-bar {
  height: 2px;
  background: var(--c-border);
  flex-shrink: 0;
  overflow: hidden;
}
.lb-progress {
  height: 100%;
  width: 30%;
  background: var(--c-accent);
  animation: lb-slide 1.2s ease infinite;
}
@keyframes lb-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

.action-list {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--c-border);
}
.al-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.al-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text2);
}
.al-apply-all {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #16a34a;
  border: none;
  border-radius: 6px;
  padding: 5px 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.al-apply-all:hover {
  background: #15803d;
}

.msg-enter-active {
  animation: msg-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.msg-leave-active {
  animation: msg-in 0.2s ease reverse;
}
@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.action-toolbar {
  display: flex;
  gap: 4px;
  padding: 6px 6px 2px;
  flex-shrink: 0;
  overflow-x: auto;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
}
.qa-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: var(--c-surface);
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  color: var(--c-text);
  transition: all 0.15s;
  flex-shrink: 0;
}
.qa-btn:hover:not(:disabled) {
  border-color: var(--c-accent);
  color: var(--c-accent);
  background: var(--c-accent-light);
}
.qa-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.qa-btn:last-child {
  background: linear-gradient(135deg, #e63946, #c62828);
  color: #fff;
  border-color: transparent;
  font-weight: 600;
}
.qa-btn:last-child:hover:not(:disabled) {
  opacity: 0.9;
}
.qa-icon {
  font-size: 14px;
}
.qa-label {
  font-size: 12px;
}

.select-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}
.sb-check {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.sb-label {
  font-size: 13px;
  color: #334155;
}
.sb-count {
  font-size: 12px;
  color: #64748b;
  margin-right: auto;
}
.sb-btn {
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.sb-btn.export {
  background: #3b82f6;
  color: #fff;
}
.sb-btn.export:hover:not(:disabled) {
  background: #2563eb;
}
.sb-btn.export:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sb-btn.cancel {
  background: #f1f5f9;
  color: #475569;
}
.sb-btn.cancel:hover {
  background: #e2e8f0;
}
</style>
