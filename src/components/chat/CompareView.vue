<template>
  <div class="compare-view">
    <div v-if="items.length" class="cv-items">
      <div v-for="(item, i) in items" :key="i" class="cv-item" :class="`chg-${item.change}`">
        <div class="ci-header">
          <span class="ci-clause">{{ item.clause }}</span>
          <span class="ci-change-tag" :class="`chg-${item.change}`">{{ changeLabel(item.change) }}</span>
        </div>
        <div class="ci-diff">
          <div v-if="item.change !== 'added'" class="ci-row del">
            <span class="ci-p">标准</span>
            <span>{{ item.standard }}</span>
          </div>
          <div v-if="item.change !== 'removed'" class="ci-row add">
            <span class="ci-p">当前</span>
            <span>{{ item.current }}</span>
          </div>
        </div>
        <div v-if="item.suggestion" class="ci-suggestion">{{ item.suggestion }}</div>
        <span class="ci-risk" :class="`risk-${item.risk}`">{{ riskLabel(item.risk) }}</span>
      </div>
    </div>
    <div v-else class="cv-empty">暂无对比差异</div>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] }
})

function changeLabel(c) { return { modified: '已修改', added: '新增', removed: '已删除' }[c] || c }
function riskLabel(r) { return { high: '高风险', medium: '中风险', low: '低风险' }[r] || r }
</script>

<style scoped>
.cv-items { display: flex; flex-direction: column; gap: 8px; }
.cv-item {
  padding: 8px 10px; border-radius: 6px;
  border-left: 3px solid var(--c-border);
  background: var(--c-surface); font-size: 12px;
  position: relative;
}
.cv-item.chg-modified { border-left-color: #F5C518; }
.cv-item.chg-added { border-left-color: #3b82f6; }
.cv-item.chg-removed { border-left-color: #E63946; }
.ci-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ci-clause { font-weight: 600; color: var(--c-text); }
.ci-change-tag {
  font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 3px;
}
.ci-change-tag.chg-modified { background: #fef9c3; color: #854d0e; }
.ci-change-tag.chg-added { background: #dbeafe; color: #1e40af; }
.ci-change-tag.chg-removed { background: #fecaca; color: #991b1b; }
.ci-diff { margin-bottom: 4px; font-family: monospace; font-size: 11px; }
.ci-row { display: flex; gap: 6px; padding: 2px 4px; border-radius: 3px; }
.ci-row.del { background: #fef2f2; color: #991b1b; }
.ci-row.add { background: #f0fdf4; color: #166534; }
.ci-p { font-weight: 700; flex-shrink: 0; width: 28px; }
.ci-suggestion { color: #D97706; font-size: 11px; margin-top: 4px; padding-top: 4px; border-top: 1px dashed var(--c-border); }
.ci-risk {
  position: absolute; top: 6px; right: 8px;
  font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
}
.ci-risk.risk-high { background: #fecaca; color: #991b1b; }
.ci-risk.risk-medium { background: #fef9c3; color: #854d0e; }
.ci-risk.risk-low { background: #dcfce7; color: #166534; }
.cv-empty { font-size: 12px; color: var(--c-text2); text-align: center; padding: 10px; }
</style>
