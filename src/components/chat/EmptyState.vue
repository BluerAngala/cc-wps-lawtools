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
  padding: 20px 10px;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  width: 100%;
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
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}
.qc-desc {
  font-size: 11px;
  color: var(--c-text2);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
