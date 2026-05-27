<template>
  <div v-if="messages.length === 0 && !isLoading" class="empty-state">
    <div class="empty-logo">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 3v18m-6-4l6 4 6-4M6 7l6-4 6 4" />
      </svg>
    </div>
    <h2 class="empty-title">AI 法律助手</h2>
    <p class="empty-desc">对话式审查、修改当前合同文档</p>
    <div class="quick-grid">
      <button
        v-for="s in quickPrompts"
        :key="s.text"
        class="quick-card"
        @click="$emit('quickPrompt', s.text)"
      >
        <span class="qc-icon">{{ s.icon }}</span>
        <span class="qc-title">{{ s.title }}</span>
        <span class="qc-desc">{{ s.desc }}</span>
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
  { icon: '🚦', title: '保密协议分流', desc: '快速分流保密协议风险等级', text: '/保密' },
  { icon: '⚡', title: '风险评估', desc: '结构化风险矩阵分析', text: '/风险' },
  {
    icon: '📋',
    title: '摘要总结',
    desc: '总结合同核心内容',
    text: '请总结当前合同的核心条款和关键信息'
  }
]
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 10px;
}
.empty-logo {
  width: 56px;
  height: 56px;
  background: #f5f5f5;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-highlight);
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.empty-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--c-brand);
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
  border-radius: var(--radius-sm, 8px);
  background: var(--c-surface);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s;
}
.quick-card:hover {
  border-color: var(--c-accent);
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.08);
  transform: translateY(-1px);
}
.qc-icon {
  font-size: 18px;
  margin-bottom: 6px;
}
.qc-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
}
.qc-desc {
  font-size: 11px;
  color: var(--c-text2);
  margin-top: 2px;
}
</style>
