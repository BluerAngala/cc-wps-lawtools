<template>
  <div v-if="messages.length === 0 && !isLoading" class="empty-state">
    <div class="quick-grid">
      <button
        v-for="s in quickPrompts"
        :key="s.text"
        class="quick-card"
        @click="$emit('quickPrompt', s.text)"
      >
        <span class="qc-icon">{{ s.icon }}</span>
        <span class="qc-title">{{ s.title }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  messages: { type: Array, default: () => [] }
})

defineEmits(['quickPrompt'])

const quickPrompts = [
  {
    icon: '🔍',
    title: '审查合同',
    desc: '全面审查当前合同风险',
    text: '请全面审查当前合同，指出主要风险点并提供修改建议'
  },
  {
    icon: '🔒',
    title: '信息脱敏',
    desc: '识别并脱敏敏感信息',
    text: '/脱敏'
  },
  { icon: '🚦', title: '保密协议分流', desc: '快速分流保密协议风险等级', text: '/保密' },
  { icon: '⚡', title: '风险评估', desc: '结构化风险矩阵分析', text: '/风险' },
  {
    icon: '📋',
    title: '摘要总结',
    desc: '总结合同核心内容',
    text: '请总结当前合同的核心条款和关键信息'
  },
  {
    icon: '📝',
    title: '生成模板',
    desc: '生成法律合同模板',
    text: '请帮我生成一份常见的法律合同模板'
  }
]
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px 8px;
}
.quick-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 2px;
}
.quick-grid::-webkit-scrollbar {
  display: none;
}
.quick-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid var(--c-border);
  border-radius: 16px;
  background: var(--c-surface);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s;
  box-sizing: border-box;
}
.quick-card:hover {
  border-color: var(--c-accent);
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.08);
  transform: translateY(-1px);
}
.qc-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.qc-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
}
</style>
