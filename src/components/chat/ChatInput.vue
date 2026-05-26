<template>
  <div class="input-area">
    <Transition name="slide-up">
      <div v-if="showSlashMenu" class="slash-menu">
        <div class="slash-title">快捷指令</div>
        <button
          v-for="(cmd, ci) in filteredCommands"
          :key="cmd.value"
          class="slash-item"
          :class="{ active: ci === activeCmdIdx }"
          @click="$emit('selectCommand', cmd)"
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
        :value="modelValue"
        class="chat-input"
        :placeholder="isLoading ? 'AI 正在回复...' : '输入指令，或按 / 查看快捷指令...'"
        :disabled="isLoading"
        rows="1"
        @input="onInput"
        @keydown="$emit('keydown', $event)"
      ></textarea>
      <button
        class="send-btn"
        :class="{ ready: modelValue.trim() && !isLoading }"
        :disabled="!modelValue.trim() || isLoading"
        @click="$emit('send')"
      >
        <svg
          v-if="!isLoading"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        <span v-else class="send-spin"></span>
      </button>
      <button v-if="isLoading" class="stop-btn" @click="$emit('cancel')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    </div>
    <div class="input-hint">
      <span>Enter 发送 · Shift+Enter 换行</span>
      <span>输入 / 快捷指令</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  showSlashMenu: { type: Boolean, default: false },
  slashCommands: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'send', 'cancel', 'keydown', 'selectCommand'])

const inputRef = ref(null)
const activeCmdIdx = ref(0)

const filteredCommands = computed(() => {
  const slashPart = props.modelValue.match(/^\/(\S*)/)?.[1] ?? ''
  if (slashPart === '' && props.modelValue.startsWith('/')) return props.slashCommands
  return props.slashCommands.filter((c) => c.value.includes(slashPart))
})

watch(
  () => props.showSlashMenu,
  (v) => {
    if (v) activeCmdIdx.value = 0
  }
)

function onInput(e) {
  const val = e.target.value
  emit('update:modelValue', val)
  autoResizeInput()
}

function autoResizeInput() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

watch(
  () => props.modelValue,
  () => nextTick(autoResizeInput)
)

defineExpose({ inputRef, autoResizeInput })
</script>

<style scoped>
.input-area {
  flex-shrink: 0;
  padding: 8px 6px 6px;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  position: relative;
}
.slash-menu {
  position: absolute;
  bottom: 100%;
  left: 6px;
  right: 6px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm, 8px);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  max-height: 260px;
  overflow-y: auto;
  z-index: 10;
  padding: 6px;
}
.slash-title {
  font-size: 11px;
  font-weight: 700;
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
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.slash-item:hover,
.slash-item.active {
  background: #f5f5f5;
}
.si-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.si-info {
  display: flex;
  flex-direction: column;
}
.si-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
}
.si-desc {
  font-size: 11px;
  color: var(--c-text2);
}
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}
.chat-input {
  flex: 1;
  resize: none;
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius-sm, 8px);
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.5;
  background: var(--c-surface);
  color: var(--c-text);
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.chat-input:focus {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.08);
  background: var(--c-surface);
}
.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.chat-input::placeholder {
  color: var(--c-text2);
}
.send-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: var(--c-border);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.send-btn.ready {
  background: linear-gradient(135deg, #e63946, #c62828);
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.3);
}
.send-btn.ready:hover {
  transform: scale(1.06);
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
.stop-btn {
  width: 34px;
  height: 34px;
  border: 1.5px solid var(--c-accent);
  border-radius: 8px;
  background: transparent;
  color: var(--c-accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.stop-btn:hover {
  background: #f5f5f5;
}
.send-spin {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.input-hint {
  display: flex;
  justify-content: space-between;
  padding: 2px 2px 0;
  font-size: 10px;
  color: var(--c-text2);
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
