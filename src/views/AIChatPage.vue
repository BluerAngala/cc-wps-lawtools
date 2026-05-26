<template>
  <div class="chat-root">
    <ChatHeader
      :doc-info="docInfo"
      @refresh-doc="refreshDoc"
      @clear="clearChat"
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
        <div v-for="(msg, mIdx) in messages" :key="msg.id" class="msg-row" :class="msg.role">
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
                    class="al-apply-all"
                    @click="handleApplyAll(mIdx)"
                    v-if="hasUnapplied(msg)"
                  >
                    全部应用
                  </button>
                </div>
                <ActionCard
                  v-for="(act, aIdx) in msg.executableActions"
                  :key="aIdx"
                  :action="act"
                  @apply="handleApplyAction(mIdx, aIdx)"
                  @locate="handleLocateAction(act)"
                  @reject="handleRejectAction(mIdx, aIdx)"
                />
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div ref="scrollAnchor"></div>
    </div>

    <div v-if="isLoading && !streamingText" class="loading-bar">
      <div class="lb-progress"></div>
    </div>

    <ChatInput
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
import { ref, nextTick, onMounted, watch } from 'vue'
import { marked } from 'marked'
import { chatService } from '@/services/ai/chatService.js'
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

        msgRef.executableActions = allActions.filter(
          (a) => a.type === 'comment' || a.type === 'revision'
        )
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

async function handleApplyAction(msgIdx, actionIdx) {
  const msg = messages.value[msgIdx]
  if (!msg?.executableActions[actionIdx]) return

  const action = msg.executableActions[actionIdx]
  const result = await chatService.applyAction(action)

  if (result.success) {
    action._applied = true
  } else {
    action._failed = true
    action._errorMsg = result.message
  }
  persistHistory()
}

async function handleApplyAll(msgIdx) {
  const msg = messages.value[msgIdx]
  if (!msg) return

  for (const action of msg.executableActions) {
    if (!action._applied && !action._failed && !action._rejected) {
      const result = await chatService.applyAction(action)
      if (result.success) {
        action._applied = true
      } else {
        action._failed = true
      }
    }
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

async function handleLocateAction(action) {
  try {
    const keyword = action.keyword
    if (!keyword) return
    const { wpsDocument } = await import('@/services/wps/document.js')
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
  margin-bottom: 10px;
  padding: 0 4px;
}
.msg-row.user {
  justify-content: flex-end;
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
}
.msg-body.user {
  display: flex;
  justify-content: flex-end;
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
  font-size: 11px;
  font-weight: 500;
  color: var(--c-accent);
  background: var(--c-accent-light);
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.al-apply-all:hover {
  background: #fecaca;
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
</style>
