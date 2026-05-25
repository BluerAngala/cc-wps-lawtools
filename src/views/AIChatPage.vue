<template>
  <PageLayout>
    <div class="chat-root" :class="`mode-${widthMode}`">
      <header class="chat-header">
        <div class="header-left">
          <div class="brand-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18m-6-4l6 4 6-4M6 7l6-4 6 4"/></svg>
          </div>
          <div class="header-info">
            <h1 class="header-title">AI 法律助手</h1>
            <p v-if="docInfo" class="header-sub">{{ docInfo }}</p>
            <p v-else class="header-sub warn">未检测到文档</p>
          </div>
        </div>
        <div class="header-right">
          <button class="hdr-btn" @click="toggleWidth" :title="widthLabel">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><line :x1="widthMode==='wide'?6:widthMode==='compact'?10:7" y1="3" :x2="widthMode==='wide'?6:widthMode==='compact'?10:7" y2="21"/></svg>
          </button>
          <button class="hdr-btn" @click="handleRefreshDoc" title="刷新文档上下文">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <button class="hdr-btn" @click="handleClear" title="清空对话">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </header>

      <div ref="messagesRef" class="messages-area" @scroll="onScroll">
        <div v-if="messages.length === 0 && !isLoading" class="empty-state">
          <div class="empty-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18m-6-4l6 4 6-4M6 7l6-4 6 4"/></svg>
          </div>
          <h2 class="empty-title">AI 法律助手</h2>
          <p class="empty-desc">对话式审查、修改当前合同文档</p>
          <div class="quick-grid">
            <button
              v-for="s in quickPrompts"
              :key="s.text"
              class="quick-card"
              @click="handleQuickPrompt(s.text)"
            >
              <span class="qc-icon">{{ s.icon }}</span>
              <span class="qc-title">{{ s.title }}</span>
              <span class="qc-desc">{{ s.desc }}</span>
            </button>
          </div>
        </div>

        <TransitionGroup name="msg" tag="div" class="msg-list">
          <div
            v-for="(msg, idx) in messages"
            :key="msg._id"
            class="msg-row"
            :class="[msg.role, { streaming: msg._streaming }]"
          >
            <div class="msg-avatar" :class="msg.role">
              <svg v-if="msg.role === 'assistant'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18m-6-4l6 4 6-4M6 7l6-4 6 4"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="msg-body">
              <div v-if="msg._streaming && !streamingText" class="status-pill">
                <span class="status-dots"><i></i><i></i><i></i></span>
                <span class="status-label">{{ statusLabels[streamingStatus] || '思考中...' }}</span>
              </div>
              <div
                v-else-if="msg._streaming && streamingText"
                class="msg-bubble ai streaming"
                v-html="renderMarkdown(streamingText) + cursorHtml"
              ></div>
              <div
                v-else-if="msg.displayText"
                class="msg-bubble"
                :class="msg.role"
                v-html="renderMarkdown(msg.displayText)"
              ></div>

              <TransitionGroup
                v-if="msg.actions?.length && !msg._streaming"
                name="card"
                tag="div"
                class="action-list"
              >
                <div
                  v-for="(action, aIdx) in msg.actions"
                  :key="aIdx"
                  class="act-card"
                  :class="[
                    `act-${action.type}`,
                    { applied: action._applied, failed: action._failed, rejected: action._rejected }
                  ]"
                >
                  <div class="act-header">
                    <span class="act-badge">{{ action.type === 'comment' ? '💬 批注' : '✏️ 修订' }}</span>
                    <span v-if="action._applied" class="act-status ok">✓ 已应用</span>
                    <span v-else-if="action._rejected" class="act-status skip">已跳过</span>
                    <span v-else-if="action._failed" class="act-status err">✗ 失败</span>
                  </div>

                  <div v-if="action.type === 'revision'" class="diff-block">
                    <div class="diff-row del"><span class="diff-p">-</span><span>{{ action.keyword }}</span></div>
                    <div class="diff-row add"><span class="diff-p">+</span><span>{{ action.newText }}</span></div>
                  </div>
                  <div v-else class="cmt-block">
                    <div class="cmt-target">📍 {{ action.keyword }}</div>
                    <div class="cmt-body">{{ action.comment }}</div>
                  </div>

                  <div v-if="action.reason" class="act-reason">💡 {{ action.reason }}</div>

                  <div v-if="!action._applied && !action._failed && !action._rejected" class="act-btns">
                    <button class="abtn ok" @click="handleApplyAction(idx, aIdx)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>应用
                    </button>
                    <button class="abtn locate" @click="handleLocateAction(action)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m-10-10h4m12 0h4"/></svg>定位
                    </button>
                    <button class="abtn skip" @click="handleRejectAction(idx, aIdx)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>跳过
                    </button>
                  </div>
                </div>
              </TransitionGroup>

              <div
                v-if="msg.actions?.some(a => !a._applied && !a._failed && !a._rejected) && !msg._streaming"
                class="act-batch"
              >
                <button class="batch-btn" @click="handleApplyAll(idx)">
                  ✓ 全部应用 ({{ msg.actions.filter(a => !a._applied && !a._failed && !a._rejected).length }})
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>

        <Transition name="fade">
          <button v-if="showScrollBtn" class="scroll-btn" @click="smoothScrollBottom">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </Transition>
      </div>

      <div class="input-area">
        <Transition name="slide-up">
          <div v-if="showSlashMenu" class="slash-menu">
            <div class="slash-title">快捷指令</div>
            <button
              v-for="(cmd, ci) in filteredCommands"
              :key="cmd.value"
              class="slash-item"
              :class="{ active: ci === activeCmdIdx }"
              @click="selectCommand(cmd)"
              @mouseenter="activeCmdIdx = ci"
            >
              <span class="si-icon">{{ cmd.icon }}</span>
              <div class="si-info">
                <span class="si-label">{{ cmd.label }}</span>
                <span class="si-desc">{{ cmd.desc }}</span>
              </div>
            </button>
          </div>
        </Transition>
        <div class="input-row">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="chat-input"
            :placeholder="isLoading ? 'AI 正在回复...' : '输入指令，或按 / 查看快捷指令...'"
            :disabled="isLoading"
            rows="1"
            @keydown="handleKeydown"
            @input="onInputChange"
          ></textarea>
          <button
            class="send-btn"
            :class="{ ready: inputText.trim() && !isLoading }"
            :disabled="!inputText.trim() || isLoading"
            @click="handleSend"
          >
            <svg v-if="!isLoading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <span v-else class="send-spin"></span>
          </button>
          <button v-if="isLoading" class="stop-btn" @click="handleCancel">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
        </div>
        <div class="input-hint">
          <span>Enter 发送 · Shift+Enter 换行</span>
          <span>输入 / 快捷指令</span>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, nextTick, onMounted, computed, watch } from 'vue'
import { marked } from 'marked'
import { PageLayout } from '../components/common'
import chatService from '../services/ai/chatService.js'
import { wpsDocument } from '../services/wps/document.js'
import { useWpsEnvironment } from '../composables/useWpsEnvironment.js'

const { isAvailable, getDocument } = useWpsEnvironment()

const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const streamingText = ref('')
const streamingStatus = ref('')
const messagesRef = ref(null)
const inputRef = ref(null)
const streamingMsgIdx = ref(-1)
const showScrollBtn = ref(false)
const widthMode = ref('normal')
const showSlashMenu = ref(false)
const activeCmdIdx = ref(0)
let msgIdCounter = 0
let isNearBottom = true

const statusLabels = {
  thinking: '思考中...',
  reading: '正在阅读文档...',
  generating: '正在生成回复...'
}

const widthModes = ['compact', 'normal', 'wide']
const widthLabelMap = { compact: '紧凑', normal: '标准', wide: '宽屏' }
const widthLabel = computed(() => widthLabelMap[widthMode.value])

const docInfo = computed(() => {
  if (!isAvailable.value) return null
  const doc = getDocument()
  return doc?.Name || null
})

const cursorHtml = '<span class="blink-cursor"></span>'

const quickPrompts = [
  { icon: '🔍', title: '审查合同', desc: '全面审查当前合同风险', text: '请全面审查当前合同，指出主要风险点并提供修改建议' },
  { icon: '✏️', title: '修改条款', desc: '对话式修改特定条款', text: '请帮我审查并指出需要改进的条款' },
  { icon: '💬', title: '批注风险', desc: '在风险条款处添加批注', text: '请在合同的风险条款处添加批注提醒' },
  { icon: '📋', title: '摘要总结', desc: '总结合同核心内容', text: '请总结当前合同的核心条款和关键信息' }
]

const slashCommands = [
  { icon: '🔍', value: '/审查', label: '/审查 合同', desc: '全面审查合同风险' },
  { icon: '💬', value: '/批注', label: '/批注 风险', desc: '在风险处添加批注' },
  { icon: '✏️', value: '/修改', label: '/修改 条款', desc: '对话式修改条款' },
  { icon: '📋', value: '/总结', label: '/总结 合同', desc: '摘要总结合同内容' },
  { icon: '🔒', value: '/脱敏', label: '/脱敏 信息', desc: '识别并脱敏敏感信息' },
  { icon: '📝', value: '/续写', label: '/续写 条款', desc: '续写或补充合同条款' }
]

const filteredCommands = computed(() => {
  const slashPart = inputText.value.match(/^\/(\S*)/)?.[1] ?? ''
  if (slashPart === '' && inputText.value.startsWith('/')) return slashCommands
  return slashCommands.filter(c => c.value.includes(slashPart))
})

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}

function scrollToBottom() {
  nextTick(() => {
    if (!messagesRef.value) return
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}

function smoothScrollBottom() {
  if (!messagesRef.value) return
  messagesRef.value.scrollTo({ top: messagesRef.value.scrollHeight, behavior: 'smooth' })
}

function onScroll() {
  if (!messagesRef.value) return
  const el = messagesRef.value
  isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  showScrollBtn.value = !isNearBottom
}

function autoResizeInput() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function onInputChange() {
  autoResizeInput()
  const val = inputText.value
  showSlashMenu.value = val.startsWith('/') && val.indexOf('\n') === -1
  if (showSlashMenu.value) activeCmdIdx.value = 0
}

function selectCommand(cmd) {
  inputText.value = cmd.value.replace(/^\//, '') + ' '
  showSlashMenu.value = false
  nextTick(() => inputRef.value?.focus())
}

function toggleWidth() {
  const i = widthModes.indexOf(widthMode.value)
  widthMode.value = widthModes[(i + 1) % widthModes.length]
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return
  showSlashMenu.value = false
  inputText.value = ''
  autoResizeInput()
  isLoading.value = true
  streamingText.value = ''
  streamingStatus.value = 'thinking'

  messages.value.push({ role: 'user', displayText: text, actions: [], _id: ++msgIdCounter })

  const assistantMsg = {
    role: 'assistant',
    displayText: '',
    actions: [],
    rawText: '',
    _streaming: true,
    _id: ++msgIdCounter
  }
  messages.value.push(assistantMsg)
  streamingMsgIdx.value = messages.value.length - 1
  scrollToBottom()

  await chatService.sendMessage(text, {
    onStatus(status) {
      streamingStatus.value = status
    },
    onChunk(_delta, fullText) {
      streamingText.value = fullText
      if (isNearBottom) scrollToBottom()
    },
    onComplete({ text: cleanedText, actions }) {
      streamingText.value = ''
      const idx = streamingMsgIdx.value
      if (messages.value[idx]) {
        messages.value[idx].displayText = cleanedText
        messages.value[idx].actions = actions
        messages.value[idx].rawText = cleanedText
        messages.value[idx]._streaming = false
      }
      streamingMsgIdx.value = -1
      isLoading.value = false
      streamingStatus.value = ''
      scrollIfNear()
      persistHistory()
    },
    onError(errMsg) {
      streamingText.value = ''
      const idx = streamingMsgIdx.value
      if (messages.value[idx]) {
        messages.value[idx].displayText = `⚠️ ${errMsg}`
        messages.value[idx]._streaming = false
      }
      streamingMsgIdx.value = -1
      isLoading.value = false
      streamingStatus.value = ''
    }
  })

  nextTick(() => inputRef.value?.focus())
}

function scrollIfNear() {
  if (isNearBottom) scrollToBottom()
}

function handleKeydown(e) {
  if (showSlashMenu.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeCmdIdx.value = (activeCmdIdx.value + 1) % filteredCommands.value.length
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeCmdIdx.value = (activeCmdIdx.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (filteredCommands.value[activeCmdIdx.value]) {
        selectCommand(filteredCommands.value[activeCmdIdx.value])
      }
      return
    }
    if (e.key === 'Escape') {
      showSlashMenu.value = false
      return
    }
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleQuickPrompt(text) {
  inputText.value = text
  handleSend()
}

async function handleApplyAction(msgIdx, actionIdx) {
  const msg = messages.value[msgIdx]
  if (!msg?.actions?.[actionIdx]) return
  const action = msg.actions[actionIdx]
  const result = await chatService.applyAction(action)
  if (result.success) {
    action._applied = true
    window.$message?.success('操作已应用')
  } else {
    action._failed = true
    action._errorMsg = result.message || '执行失败'
    window.$message?.error(action._errorMsg)
  }
  persistHistory()
}

function handleRejectAction(msgIdx, actionIdx) {
  const msg = messages.value[msgIdx]
  if (!msg?.actions?.[actionIdx]) return
  msg.actions[actionIdx]._rejected = true
  persistHistory()
}

async function handleLocateAction(action) {
  try {
    const doc = wpsDocument.getDocument()
    if (!doc) {
      window.$message?.warning('请先打开文档')
      return
    }
    const range = wpsDocument.findRangeByKeyword(action.keyword)
    if (range) {
      range.Select()
      window.$message?.success('已定位到文档位置')
    } else {
      window.$message?.warning('未找到对应文本位置')
    }
  } catch {
    window.$message?.error('定位失败')
  }
}

async function handleApplyAll(msgIdx) {
  const msg = messages.value[msgIdx]
  if (!msg?.actions) return
  const pending = msg.actions.filter(a => !a._applied && !a._failed && !a._rejected)
  for (const action of pending) {
    const result = await chatService.applyAction(action)
    if (result.success) {
      action._applied = true
    } else {
      action._failed = true
      action._errorMsg = result.message || '执行失败'
    }
  }
  window.$message?.success(`已应用 ${pending.filter(a => a._applied).length} 项操作`)
  persistHistory()
}

function handleCancel() {
  chatService.cancel()
  const idx = streamingMsgIdx.value
  if (messages.value[idx] && messages.value[idx]._streaming) {
    messages.value[idx]._streaming = false
    if (streamingText.value) {
      const { cleanedText, actions } = parseActionsPartial(streamingText.value)
      messages.value[idx].displayText = cleanedText
      messages.value[idx].actions = actions
    }
  }
  streamingText.value = ''
  streamingMsgIdx.value = -1
  isLoading.value = false
  streamingStatus.value = ''
}

function parseActionsPartial(text) {
  const actions = []
  const cleanedText = text.replace(/```action\s*([\s\S]*?)\s*```/g, (_match, jsonStr) => {
    try {
      const action = JSON.parse(jsonStr.trim())
      if (action.type && action.keyword) actions.push(action)
    } catch { /* skip */ }
    return ''
  })
  return { cleanedText: cleanedText.trim(), actions }
}

function handleClear() {
  chatService.clearHistory()
  messages.value = []
  streamingText.value = ''
  streamingMsgIdx.value = -1
  streamingStatus.value = ''
  persistHistory()
}

function handleRefreshDoc() {
  window.$message?.success('文档上下文已刷新')
}

function persistHistory() {
  try {
    const app = window.Application
    if (!app?.PluginStorage) return
    const data = messages.value.map(m => ({
      role: m.role,
      displayText: m.displayText,
      actions: m.actions?.map(a => ({
        type: a.type,
        keyword: a.keyword,
        comment: a.comment,
        newText: a.newText,
        reason: a.reason,
        _applied: a._applied,
        _rejected: a._rejected,
        _failed: a._failed,
        _errorMsg: a._errorMsg
      })),
      _id: m._id
    }))
    app.PluginStorage.setItem('aichat_history', JSON.stringify(data))
  } catch { /* ignore */ }
}

function restoreHistory() {
  try {
    const app = window.Application
    if (!app?.PluginStorage) return
    const raw = app.PluginStorage.getItem('aichat_history')
    if (!raw) return
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || data.length === 0) return
    messages.value = data.map(m => ({ ...m, _streaming: false }))
    msgIdCounter = Math.max(...data.map(m => m._id || 0), 0)
    scrollToBottom()
  } catch { /* ignore */ }
}

watch(messages, () => {
  if (isNearBottom) scrollToBottom()
}, { flush: 'post' })

onMounted(() => {
  restoreHistory()
  nextTick(() => inputRef.value?.focus())
})
</script>

<style scoped>
.chat-root {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 20px);
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --c-brand: #0A0A0A;
  --c-brand-light: #2D2D2D;
  --c-accent: #E63946;
  --c-accent-light: #FEE2E2;
  --c-highlight: #F5C518;
  --c-highlight-light: #FFF9C4;
  --c-surface: #ffffff;
  --c-danger: #DC2626;
  --c-success: #16a34a;
  --c-text: #0A0A0A;
  --c-text2: #666666;
  --c-border: #E0E0E0;
  --c-bg: #F8F8F8;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
}
.mode-compact .msg-bubble { font-size: 12px; }
.mode-compact .act-card { font-size: 11px; }
.mode-wide .msg-bubble { font-size: 14px; }

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--c-brand);
  color: #fff;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-badge {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-highlight);
}
.header-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin: 0;
}
.header-sub {
  font-size: 11px;
  margin: 2px 0 0;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}
.header-sub.warn { color: #F5C518; opacity: 1; }
.header-right {
  display: flex;
  gap: 2px;
}
.hdr-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: none;
  color: rgba(255,255,255,0.7);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.hdr-btn:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 10px 6px;
  position: relative;
}
.messages-area::-webkit-scrollbar { width: 5px; }
.messages-area::-webkit-scrollbar-track { background: transparent; }
.messages-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}
.empty-logo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--c-brand), var(--c-brand-light));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-highlight);
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--c-brand);
  margin: 0 0 6px;
}
.empty-desc {
  font-size: 13px;
  color: var(--c-text2);
  margin: 0 0 24px;
}
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  max-width: 420px;
}
.quick-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.quick-card:hover {
  border-color: var(--c-accent);
  box-shadow: 0 2px 8px rgba(230,57,70,0.08);
  transform: translateY(-1px);
}
.qc-icon { font-size: 18px; margin-bottom: 6px; }
.qc-title { font-size: 13px; font-weight: 600; color: var(--c-text); }
.qc-desc { font-size: 11px; color: var(--c-text2); margin-top: 2px; }

.msg-list { display: flex; flex-direction: column; gap: 10px; }
.msg-row {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.msg-row.user { flex-direction: row-reverse; }

.msg-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}
.msg-avatar.assistant {
  background: linear-gradient(135deg, #1A1A1A, #0A0A0A);
  color: var(--c-highlight);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.msg-avatar.user {
  background: #E5E5E5;
  color: var(--c-brand);
}
.msg-body { max-width: 90%; min-width: 0; }

.msg-bubble {
  padding: 8px 10px;
  border-radius: var(--radius);
  font-size: 13px;
  line-height: 1.65;
  word-break: break-word;
  box-shadow: var(--shadow);
}
.msg-bubble.user {
  background: linear-gradient(135deg, var(--c-brand), var(--c-brand-light));
  color: #fff;
  border-top-right-radius: 4px;
}
.msg-bubble.ai {
  background: var(--c-surface);
  color: var(--c-text);
  border-top-left-radius: 4px;
  border: 1px solid var(--c-border);
}
.msg-bubble.streaming {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 2px rgba(230,57,70,0.15), 0 0 12px rgba(230,57,70,0.06);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}
.status-dots {
  display: flex;
  gap: 4px;
}
.status-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-accent);
  animation: dotPulse 1.4s infinite;
}
.status-dots i:nth-child(2) { animation-delay: 0.2s; }
.status-dots i:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotPulse {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1.1); }
}
.status-label {
  font-size: 12px;
  color: var(--c-text2);
}

.blink-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--c-accent);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: cursorBlink 1s step-end infinite;
}
@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.msg-bubble :deep(p) { margin: 0 0 6px; }
.msg-bubble :deep(p:last-child) { margin-bottom: 0; }
.msg-bubble :deep(h1), .msg-bubble :deep(h2), .msg-bubble :deep(h3),
.msg-bubble :deep(h4), .msg-bubble :deep(h5), .msg-bubble :deep(h6) {
  margin: 10px 0 4px; font-weight: 700; line-height: 1.35; color: #0A0A0A;
}
.msg-bubble :deep(h1) { font-size: 17px; }
.msg-bubble :deep(h2) { font-size: 15px; }
.msg-bubble :deep(h3) { font-size: 14px; }
.msg-bubble :deep(h4) { font-size: 13px; }
.msg-bubble.user :deep(h1), .msg-bubble.user :deep(h2), .msg-bubble.user :deep(h3) { color: #fff; }
.msg-bubble :deep(strong) { font-weight: 700; color: #E63946; }
.msg-bubble.user :deep(strong) { color: #F5C518; }
.msg-bubble :deep(em) { font-style: italic; }
.msg-bubble :deep(code) {
  background: rgba(0,0,0,0.05);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', Consolas, 'Courier New', monospace;
}
.msg-bubble.user :deep(code) { background: rgba(255,255,255,0.15); }
.msg-bubble :deep(pre) {
  background: #1a1a1a;
  border-radius: var(--radius-sm);
  margin: 8px 0;
  padding: 12px 14px;
  overflow-x: auto;
}
.msg-bubble :deep(pre code) { background: none; padding: 0; color: #e2e8f0; font-size: 12px; line-height: 1.5; }
.msg-bubble :deep(ul), .msg-bubble :deep(ol) { margin: 4px 0; padding-left: 20px; }
.msg-bubble :deep(li) { margin: 3px 0; font-size: 13px; }
.msg-bubble :deep(blockquote) {
  border-left: 3px solid var(--c-highlight);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--c-text2);
  font-style: italic;
}
.msg-bubble :deep(hr) { border: none; border-top: 1px solid var(--c-border); margin: 10px 0; }
.msg-bubble :deep(table) { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 12px; }
.msg-bubble :deep(th), .msg-bubble :deep(td) { border: 1px solid var(--c-border); padding: 5px 10px; text-align: left; }
.msg-bubble :deep(th) { background: #f5f5f5; font-weight: 600; color: #0A0A0A; }
.msg-bubble :deep(tr:nth-child(even)) { background: #fafafa; }
.msg-bubble :deep(a) { color: #E63946; text-decoration: none; }
.msg-bubble :deep(a:hover) { text-decoration: underline; }

.action-list {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.act-card {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-left: 3px solid var(--c-accent);
  box-shadow: var(--shadow);
  transition: all 0.2s;
}
.act-card.act-revision { border-left-color: var(--c-accent); }
.act-card.act-comment { border-left-color: var(--c-highlight); }
.act-card.applied { border-left-color: var(--c-success); background: #f0fdf4; }
.act-card.failed { border-left-color: var(--c-danger); background: #fef2f2; }
.act-card.rejected { border-left-color: #94a3b8; background: #f8fafc; opacity: 0.65; }

.act-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.act-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-brand);
}
.act-status {
  font-size: 11px;
  font-weight: 500;
}
.act-status.ok { color: var(--c-success); }
.act-status.skip { color: #94a3b8; }
.act-status.err { color: var(--c-danger); }

.diff-block {
  border-radius: 6px;
  overflow: hidden;
  margin: 4px 0;
  font-family: 'SF Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
}
.diff-row {
  padding: 4px 10px;
  display: flex;
  gap: 6px;
}
.diff-row.del { background: #fef2f2; color: #991b1b; }
.diff-row.add { background: #f0fdf4; color: #166534; }
.diff-p { font-weight: 700; flex-shrink: 0; width: 12px; }

.cmt-block {
  margin: 4px 0;
}
.cmt-target {
  font-size: 12px;
  color: #D97706;
  font-weight: 600;
  margin-bottom: 2px;
}
.cmt-body {
  font-size: 12px;
  color: var(--c-text2);
  line-height: 1.5;
}

.act-reason {
  font-size: 11px;
  color: var(--c-text2);
  margin-top: 4px;
  font-style: italic;
  padding-top: 4px;
  border-top: 1px dashed var(--c-border);
}

.act-btns {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.abtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: var(--c-surface);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--c-text);
  font-weight: 500;
}
.abtn.ok { color: var(--c-success); border-color: #bbf7d0; }
.abtn.ok:hover { background: #f0fdf4; border-color: var(--c-success); }
.abtn.locate { color: #D97706; border-color: #FDE68A; }
.abtn.locate:hover { background: #FFFBEB; border-color: #D97706; }
.abtn.skip { color: var(--c-text2); }
.abtn.skip:hover { background: #f8fafc; border-color: #94a3b8; }

.act-batch { margin-top: 8px; }
.batch-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--c-accent);
  border-radius: 6px;
  background: var(--c-highlight-light);
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.batch-btn:hover { background: #fef3c7; }

.input-area {
  flex-shrink: 0;
  padding: 8px 6px 6px;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  position: relative;
}
.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.chat-input {
  flex: 1;
  resize: none;
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.5;
  font-family: inherit;
  color: var(--c-text);
  background: var(--c-bg);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  max-height: 120px;
  overflow-y: auto;
}
.chat-input:focus {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(230,57,70,0.08);
  background: var(--c-surface);
}
.chat-input::placeholder { color: #94a3b8; }
.chat-input:disabled { opacity: 0.5; }
.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #cbd5e1;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.send-btn.ready {
  background: linear-gradient(135deg, #E63946, #C62828);
  box-shadow: 0 2px 8px rgba(230,57,70,0.3);
}
.send-btn.ready:hover { transform: scale(1.06); }
.send-btn:disabled { cursor: not-allowed; opacity: 0.5; }
.send-spin {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.stop-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: var(--c-danger);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.stop-btn:hover { background: #fee2e2; }
.input-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.slash-menu {
  position: absolute;
  bottom: 100%;
  left: 6px;
  right: 6px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 6px;
  max-height: 220px;
  overflow-y: auto;
  margin-bottom: 6px;
  z-index: 10;
}
.slash-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text2);
  padding: 4px 10px 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.slash-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.slash-item:hover, .slash-item.active { background: #f5f5f5; }
.si-icon { font-size: 16px; flex-shrink: 0; }
.si-info { display: flex; flex-direction: column; }
.si-label { font-size: 13px; font-weight: 500; color: var(--c-text); }
.si-desc { font-size: 11px; color: var(--c-text2); }

.scroll-btn {
  position: absolute;
  bottom: 12px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: all 0.2s;
}
.scroll-btn:hover { background: #f5f5f5; color: var(--c-accent); }

.msg-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.msg-enter-from { opacity: 0; transform: translateY(16px) scale(0.97); }
.msg-enter-to { opacity: 1; transform: translateY(0) scale(1); }

.card-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1); }
.card-enter-from { opacity: 0; transform: translateY(8px) scale(0.95); }
.card-enter-to { opacity: 1; transform: translateY(0) scale(1); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.2s cubic-bezier(0.34, 1.3, 0.64, 1); }
.slide-up-leave-active { transition: all 0.15s; }
.slide-up-enter-from { opacity: 0; transform: translateY(8px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
