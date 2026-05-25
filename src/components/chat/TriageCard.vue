<template>
  <div class="triage-card" :class="`level-${level.toLowerCase()}`">
    <div class="tc-header">
      <span class="tc-badge">{{ levelIcon }} {{ levelLabel }}</span>
      <span class="tc-level-tag" :class="`tag-${level.toLowerCase()}`">{{ level }}</span>
    </div>
    <div class="tc-summary">{{ summary }}</div>

    <div v-if="issues.length" class="tc-issues">
      <div v-for="(issue, i) in issues" :key="i" class="tc-issue" :class="`sev-${issue.severity}`">
        <span class="ti-dot"></span>
        <div class="ti-body">
          <div class="ti-item">{{ issue.item }}</div>
          <div class="ti-detail">{{ issue.detail }}</div>
        </div>
        <span class="ti-sev" :class="`sev-${issue.severity}`">{{ issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低' }}</span>
      </div>
    </div>

    <div v-if="recommendation" class="tc-rec">{{ recommendation }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: { type: String, required: true },
  summary: { type: String, default: '' },
  issues: { type: Array, default: () => [] },
  recommendation: { type: String, default: '' }
})

const levelIcon = computed(() => ({
  GREEN: '✅',
  YELLOW: '⚠️',
  RED: '🔴'
}[props.level] || '❓'))

const levelLabel = computed(() => ({
  GREEN: '标准通过',
  YELLOW: '需法务审查',
  RED: '重大风险'
}[props.level] || props.level))
</script>

<style scoped>
.triage-card {
  padding: 10px 12px; border-radius: 8px;
  border: 1px solid var(--c-border);
  font-size: 13px;
}
.triage-card.level-green { border-color: #16a34a; background: #f0fdf4; }
.triage-card.level-yellow { border-color: #D97706; background: #FFFBEB; }
.triage-card.level-red { border-color: #E63946; background: #fef2f2; }
.tc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.tc-badge { font-weight: 700; font-size: 14px; }
.tc-level-tag {
  font-size: 11px; font-weight: 700; padding: 2px 8px;
  border-radius: 4px; letter-spacing: 0.5px;
}
.tc-level-tag.tag-green { background: #dcfce7; color: #166534; }
.tc-level-tag.tag-yellow { background: #fef9c3; color: #854d0e; }
.tc-level-tag.tag-red { background: #fecaca; color: #991b1b; }
.tc-summary { color: var(--c-text); margin-bottom: 8px; font-weight: 500; }
.tc-issues { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.tc-issue {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.6);
}
.ti-dot {
  width: 8px; height: 8px; border-radius: 50%;
  margin-top: 4px; flex-shrink: 0;
  background: var(--c-text2);
}
.tc-issue.sev-high .ti-dot { background: #E63946; }
.tc-issue.sev-medium .ti-dot { background: #F5C518; }
.tc-issue.sev-low .ti-dot { background: #16a34a; }
.ti-body { flex: 1; }
.ti-item { font-weight: 600; font-size: 12px; }
.ti-detail { font-size: 11px; color: var(--c-text2); margin-top: 2px; }
.ti-sev {
  font-size: 10px; font-weight: 600; padding: 1px 5px;
  border-radius: 3px; flex-shrink: 0;
}
.ti-sev.sev-high { background: #fecaca; color: #991b1b; }
.ti-sev.sev-medium { background: #fef9c3; color: #854d0e; }
.ti-sev.sev-low { background: #dcfce7; color: #166534; }
.tc-rec {
  padding: 6px 8px; border-radius: 6px; font-size: 12px;
  background: rgba(0,0,0,0.04); color: var(--c-text2);
}
</style>
