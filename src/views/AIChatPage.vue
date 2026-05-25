<template>
  <PageLayout>
    <div class="flex flex-col h-[calc(100vh-20px)]">
      <!-- 顶栏 -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">AI 对话助手</span>
          <n-tag v-if="docInfo" size="small" type="info">{{ docInfo }}</n-tag>
          <n-tag v-else size="small" type="warning">未检测到文档</n-tag>
        </div>
        <n-space size="small">
          <n-button size="tiny" quaternary @click="handleRefreshDoc">刷新文档</n-button>
          <n-button size="tiny" quaternary @click="handleClear">清空</n-button>
        </n-space>
      </div>

      <!-- 消息列表 -->
      <div ref="messagesRef" class="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-smooth">
        <div v-if="messages.length === 0 && !isLoading" class="flex flex-col items-center justify-center h-full text-gray-400">
          <div class="text-4xl mb-3">💬</div>
          <div class="text-sm">与 AI 助手对话，直接修改当前文档</div>
          <div class="mt-4 grid grid-cols-2 gap-2 w-full max-w-md">
            <div
              v-for="s in quickPrompts"
              :key="s.text"
              class="quick-prompt"
              @click="handleQuickPrompt(s.text)"
            >
              <div class="text-xs font-medium text-gray-700">{{ s.title }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ s.desc }}</div>
            </div>
          </div>
        </div>

        <div v-for="(msg, idx) in messages" :key="idx" class="message-item" :class="msg.role">
          <div class="message-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
          <div class="message-body">
            <!-- 流式输出中：直接用 streamingText 避免 action 块闪烁 -->
            <div
              v-if="msg._streaming && streamingText"
              class="message-text"
              v-html="renderMarkdown(streamingText)"
            ></div>
            <!-- 打字等待中 -->
            <div v-else-if="msg._streaming && !streamingText" class="message-text">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
            <!-- 正常内容 -->
            <div v-else-if="msg.displayText" class="message-text" v-html="renderMarkdown(msg.displayText)"></div>

            <!-- 操作卡片 -->
            <div v-if="msg.actions?.length && !msg._streaming" class="action-cards">
              <div class="text-xs text-gray-500 mb-1">📄 文档操作建议：</div>
              <div
                v-for="(action, aIdx) in msg.actions"
                :key="aIdx"
                class="action-card"
                :class="{
                  applied: action._applied,
                  failed: action._failed,
                  pending: !action._applied && !action._failed
                }"
              >
                <div class="flex items-start gap-2">
                  <span class="text-sm">{{ action.type === 'comment' ? '💬' : '✏️' }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium">
                      {{ action.type === 'comment' ? '添加批注' : '修订文本' }}
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">
                      定位：<span class="text-orange-600">{{ action.keyword }}</span>
                    </div>
                    <div v-if="action.type === 'comment'" class="text-xs text-gray-600 mt-0.5">
                      {{ action.comment }}
                    </div>
                    <div v-if="action.type === 'revision'" class="text-xs text-gray-600 mt-0.5">
                      替换为：<span class="text-green-700">{{ action.newText }}</span>
                    </div>
                    <div v-if="action.reason" class="text-xs text-gray-400 mt-0.5 italic">
                      原因：{{ action.reason }}
                    </div>
                  </div>
                </div>
                <div v-if="!action._applied && !action._failed" class="action-buttons">
                  <n-button size="tiny" type="primary" @click="handleApplyAction(idx, aIdx)">
                    应用
                  </n-button>
                </div>
                <div v-else-if="action._applied" class="text-xs text-green-600">✅ 已应用</div>
                <div v-else class="text-xs text-red-500">❌ {{ action._errorMsg || '执行失败' }}</div>
              </div>
              <div v-if="msg.actions.some(a => !a._applied && !a._failed)" class="mt-1">
                <n-button size="tiny" type="primary" @click="handleApplyAll(idx)">
                  全部应用
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="shrink-0 border-t border-gray-200 px-3 py-2">
        <div class="flex gap-2">
          <n-input
            v-model:value="inputText"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入指令，如：审查违约金条款..."
            :disabled="isLoading"
            @keydown="handleKeydown"
          />
          <div class="flex flex-col gap-1">
            <n-button
              type="primary"
              :disabled="!inputText.trim() || isLoading"
              @click="handleSend"
            >
              {{ isLoading ? '...' : '发送' }}
            </n-button>
            <n-button v-if="isLoading" size="small" type="error" @click="handleCancel">
              停止
            </n-button>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-1">Enter 发送 / Shift+Enter 换行</div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { NTag, NButton, NSpace, NInput } from 'naive-ui'
import { marked } from 'marked'
import { PageLayout } from '../components/common'
import chatService from '../services/ai/chatService.js'
import { useWpsEnvironment } from '../composables/useWpsEnvironment.js'

const { isAvailable, getDocument } = useWpsEnvironment()

const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const streamingText = ref('')
const messagesRef = ref(null)
const streamingMsgIdx = ref(-1)

const docInfo = computed(() => {
  if (!isAvailable.value) return null
  const doc = getDocument()
  return doc?.Name || null
})

const quickPrompts = [
  { title: '🔍 审查合同', desc: '全面审查当前合同风险', text: '请全面审查当前合同，指出主要风险点并提供修改建议' },
  { title: '✏️ 修改条款', desc: '对话式修改特定条款', text: '请帮我审查并指出需要改进的条款' },
  { title: '💬 批注风险', desc: '在风险条款处添加批注', text: '请在合同的风险条款处添加批注提醒' },
  { title: '📋 摘要总结', desc: '总结合同核心内容', text: '请总结当前合同的核心条款和关键信息' }
]

marked.setOptions({
  breaks: true,
  gfm: true
})

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  inputText.value = ''
  isLoading.value = true
  streamingText.value = ''

  messages.value.push({
    role: 'user',
    displayText: text,
    actions: []
  })

  const assistantMsg = {
    role: 'assistant',
    displayText: '',
    actions: [],
    rawText: '',
    _streaming: true
  }
  messages.value.push(assistantMsg)
  streamingMsgIdx.value = messages.value.length - 1
  scrollToBottom()

  await chatService.sendMessage(text, {
    onChunk(_delta, fullText) {
      streamingText.value = fullText
      scrollToBottom()
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
      scrollToBottom()
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
    }
  })
}

function handleKeydown(e) {
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
}

async function handleApplyAll(msgIdx) {
  const msg = messages.value[msgIdx]
  if (!msg?.actions) return

  const pending = msg.actions.filter(a => !a._applied && !a._failed)
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
}

function handleRefreshDoc() {
  window.$message?.success('文档上下文已刷新，下条消息将使用最新文档内容')
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.message-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  background: #f3f4f6;
}

.message-item.user .message-avatar {
  background: #dbeafe;
}

.message-body {
  max-width: 85%;
  min-width: 0;
}

.message-text {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.user .message-text {
  background: #3b82f6;
  color: #fff;
  border-top-right-radius: 2px;
}

.message-item.assistant .message-text {
  background: #f3f4f6;
  color: #1f2937;
  border-top-left-radius: 2px;
}

.message-text :deep(p) {
  margin: 0 0 6px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
  margin: 8px 0 4px;
  font-weight: 600;
  line-height: 1.4;
}

.message-text :deep(h1) { font-size: 16px; }
.message-text :deep(h2) { font-size: 15px; }
.message-text :deep(h3) { font-size: 14px; }
.message-text :deep(h4) { font-size: 13px; }
.message-text :deep(h5) { font-size: 13px; }
.message-text :deep(h6) { font-size: 12px; }

.message-text :deep(strong) {
  font-weight: 600;
}

.message-text :deep(em) {
  font-style: italic;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}

.message-item.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-text :deep(pre) {
  background: #1e293b;
  border-radius: 6px;
  margin: 6px 0;
  padding: 10px 12px;
  overflow-x: auto;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.5;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}

.message-text :deep(li) {
  margin: 2px 0;
  font-size: 13px;
}

.message-text :deep(blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 10px;
  margin: 6px 0;
  color: #6b7280;
  font-style: italic;
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 8px 0;
}

.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 6px 0;
  font-size: 12px;
}

.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  text-align: left;
}

.message-text :deep(th) {
  background: #f3f4f6;
  font-weight: 600;
}

.message-text :deep(tr:nth-child(even)) {
  background: #f9fafb;
}

.message-text :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

/* 操作卡片 */
.action-cards {
  margin-top: 8px;
  padding: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
}

.action-card {
  padding: 8px;
  margin-top: 4px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.action-card.applied {
  background: #f0fdf4;
  border-color: #86efac;
}

.action-card.failed {
  background: #fef2f2;
  border-color: #fca5a5;
}

.action-buttons {
  margin-top: 4px;
}

/* 快捷提示 */
.quick-prompt {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-prompt:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.scrollbar-smooth::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-smooth::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-smooth::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}
</style>
