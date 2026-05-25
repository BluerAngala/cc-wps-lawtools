<template>
  <div class="act-card" :class="[`act-${action.type}`, { applied: action._applied, failed: action._failed, rejected: action._rejected }]">
    <div class="act-header">
      <span class="act-badge">{{ badgeLabel }}</span>
      <span v-if="action._applied" class="act-status ok">✓ 已应用</span>
      <span v-else-if="action._rejected" class="act-status skip">已跳过</span>
      <span v-else-if="action._failed" class="act-status err">✗ 失败</span>
    </div>

    <div v-if="action.type === 'revision'" class="diff-block">
      <div class="diff-section">
        <div class="diff-label del-label">原文</div>
        <div class="diff-text del-text">{{ action.keyword }}</div>
      </div>
      <div class="diff-section">
        <div class="diff-label add-label">改为</div>
        <div class="diff-text add-text">{{ action.newText }}</div>
      </div>
    </div>
    <div v-else-if="action.type === 'comment'" class="cmt-block">
      <div class="cmt-target">📍 {{ action.keyword }}</div>
      <div class="cmt-body">{{ action.comment }}</div>
    </div>

    <div v-if="action.reason" class="act-reason">💡 {{ action.reason }}</div>

    <div v-if="!action._applied && !action._failed && !action._rejected && isExecutable" class="act-btns">
      <button class="abtn locate" @click="$emit('locate')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m-10-10h4m12 0h4"/></svg>定位
      </button>
      <button class="abtn ok" @click="$emit('apply')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>应用
      </button>
      <button class="abtn skip" @click="$emit('reject')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>跳过
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  action: { type: Object, required: true }
})

defineEmits(['apply', 'locate', 'reject'])

const isExecutable = computed(() => props.action.type === 'comment' || props.action.type === 'revision')

const badgeLabel = computed(() => {
  switch (props.action.type) {
    case 'comment': return '💬 批注'
    case 'revision': return '✏️ 修订'
    case 'risk': return '⚡ 风险'
    case 'triage': return '🚦 分流'
    case 'compare': return '⚖️ 对比'
    default: return props.action.type
  }
})
</script>

<style scoped>
.act-card {
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8e8e8;
  font-size: 13px;
  transition: all 0.2s;
  margin-bottom: 10px;
}
.act-card.applied { background: #f0fdf4; opacity: 0.8; }
.act-card.failed { background: #fef2f2; }

.act-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.act-badge { font-size: 12px; font-weight: 600; color: #1a1a1a; }
.act-status { font-size: 11px; font-weight: 500; }
.act-status.ok { color: #16a34a; }
.act-status.skip { color: #999; }
.act-status.err { color: #DC2626; }

.diff-block {
  margin: 6px 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}
.diff-section { padding: 0; }
.diff-label {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  letter-spacing: 0.5px;
}
.del-label { background: #fef2f2; color: #b91c1c; }
.add-label { background: #f0fdf4; color: #166534; border-top: 1px solid #e8e8e8; }
.diff-text {
  font-size: 13px;
  line-height: 1.7;
  padding: 6px 10px;
  white-space: pre-wrap;
  word-break: break-all;
}
.del-text { background: #fff5f5; color: #7f1d1d; }
.add-text { background: #f7fef9; color: #14532d; }

.cmt-block { margin: 4px 0; }
.cmt-target { font-size: 12px; color: #D97706; font-weight: 600; margin-bottom: 4px; }
.cmt-body { font-size: 13px; color: #333; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }

.act-reason {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #e0e0e0;
  line-height: 1.6;
}

.act-btns { display: flex; gap: 8px; margin-top: 10px; }
.abtn {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  flex: 1;
  padding: 8px 0; font-size: 13px; font-weight: 600;
  border: none; border-radius: 6px;
  cursor: pointer; transition: all 0.15s;
  color: #fff;
}
.abtn.ok { background: #16a34a; }
.abtn.ok:hover { background: #15803d; }
.abtn.locate { background: #2563eb; }
.abtn.locate:hover { background: #1d4ed8; }
.abtn.skip { background: #9ca3af; }
.abtn.skip:hover { background: #6b7280; }
</style>
