<template>
  <div class="risk-matrix">
    <div class="matrix-grid">
      <div class="matrix-cell header-corner"></div>
      <div class="matrix-cell header-col">低可能性</div>
      <div class="matrix-cell header-col">中可能性</div>
      <div class="matrix-cell header-col">高可能性</div>

      <div class="matrix-cell header-row">高严重度</div>
      <div class="matrix-cell level medium" @click="filterByCell('high','low')">
        <span class="cell-count">{{ countBy('high','low') }}</span>
      </div>
      <div class="matrix-cell level high" @click="filterByCell('high','medium')">
        <span class="cell-count">{{ countBy('high','medium') }}</span>
      </div>
      <div class="matrix-cell level critical" @click="filterByCell('high','high')">
        <span class="cell-count">{{ countBy('high','high') }}</span>
        <span class="cell-flag">升级</span>
      </div>

      <div class="matrix-cell header-row">中严重度</div>
      <div class="matrix-cell level low" @click="filterByCell('medium','low')">
        <span class="cell-count">{{ countBy('medium','low') }}</span>
      </div>
      <div class="matrix-cell level medium" @click="filterByCell('medium','medium')">
        <span class="cell-count">{{ countBy('medium','medium') }}</span>
      </div>
      <div class="matrix-cell level high" @click="filterByCell('medium','high')">
        <span class="cell-count">{{ countBy('medium','high') }}</span>
      </div>

      <div class="matrix-cell header-row">低严重度</div>
      <div class="matrix-cell level low" @click="filterByCell('low','low')">
        <span class="cell-count">{{ countBy('low','low') }}</span>
      </div>
      <div class="matrix-cell level low" @click="filterByCell('low','medium')">
        <span class="cell-count">{{ countBy('low','medium') }}</span>
      </div>
      <div class="matrix-cell level medium" @click="filterByCell('low','high')">
        <span class="cell-count">{{ countBy('low','high') }}</span>
      </div>
    </div>

    <div v-if="displayItems.length" class="risk-items">
      <div v-for="(item, i) in displayItems" :key="i" class="risk-item" :class="`sev-${item.severity}`">
        <div class="ri-header">
          <span class="ri-cat">{{ item.category }}</span>
          <span class="ri-levels">
            <span class="ri-sev" :class="`sev-${item.severity}`">{{ sevLabel(item.severity) }}</span>
            <span class="ri-lik" :class="`lik-${item.likelihood}`">{{ likLabel(item.likelihood) }}</span>
          </span>
        </div>
        <div class="ri-desc">{{ item.description }}</div>
        <div v-if="item.recommendation" class="ri-rec">{{ item.recommendation }}</div>
      </div>
    </div>
    <div v-if="filter" class="filter-hint" @click="filter = null">
      筛选中: {{ sevLabel(filter.sev) }} × {{ likLabel(filter.lik) }} — 点击清除
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] }
})

const filter = ref(null)

const displayItems = computed(() => {
  if (!filter.value) return props.items
  return props.items.filter(i => i.severity === filter.value.sev && i.likelihood === filter.value.lik)
})

function countBy(sev, lik) {
  return props.items.filter(i => i.severity === sev && i.likelihood === lik).length
}

function filterByCell(sev, lik) {
  filter.value = filter.value?.sev === sev && filter.value?.lik === lik ? null : { sev, lik }
}

function sevLabel(s) { return { high: '高严重', medium: '中严重', low: '低严重' }[s] || s }
function likLabel(l) { return { high: '高可能', medium: '中可能', low: '低可能' }[l] || l }
</script>

<style scoped>
.risk-matrix { margin-top: 6px; }
.matrix-grid {
  display: grid; grid-template-columns: 56px 1fr 1fr 1fr;
  gap: 2px; margin-bottom: 10px; font-size: 11px;
}
.matrix-cell {
  padding: 5px 3px; text-align: center; border-radius: 4px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 34px;
}
.header-corner { background: #f5f5f5; font-weight: 600; font-size: 9px; color: var(--c-text2); }
.header-col { background: #f5f5f5; font-weight: 600; color: var(--c-text); }
.header-row { background: #f5f5f5; font-weight: 600; writing-mode: vertical-lr; color: var(--c-text); font-size: 9px; }
.level { cursor: pointer; transition: all 0.15s; }
.level:hover { transform: scale(1.05); }
.level.low { background: #dcfce7; }
.level.medium { background: #fef9c3; }
.level.high { background: #fecaca; }
.level.critical { background: #E63946; color: #fff; }
.cell-count { font-size: 15px; font-weight: 700; }
.cell-flag { font-size: 9px; opacity: 0.8; margin-top: 1px; }
.risk-items { display: flex; flex-direction: column; gap: 6px; }
.risk-item {
  padding: 8px 10px; border-radius: 6px; border-left: 3px solid var(--c-border);
  background: var(--c-surface); font-size: 12px;
}
.risk-item.sev-high { border-left-color: #E63946; }
.risk-item.sev-medium { border-left-color: #F5C518; }
.risk-item.sev-low { border-left-color: #16a34a; }
.ri-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.ri-cat { font-weight: 600; color: var(--c-text); }
.ri-levels { display: flex; gap: 6px; }
.ri-sev, .ri-lik { font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 3px; }
.ri-sev.sev-high { background: #fecaca; color: #991b1b; }
.ri-sev.sev-medium { background: #fef9c3; color: #854d0e; }
.ri-sev.sev-low { background: #dcfce7; color: #166534; }
.ri-lik.lik-high { background: #fecaca; color: #991b1b; }
.ri-lik.lik-medium { background: #fef9c3; color: #854d0e; }
.ri-lik.lik-low { background: #dcfce7; color: #166534; }
.ri-desc { color: var(--c-text2); margin-bottom: 4px; }
.ri-rec { color: #D97706; font-size: 11px; }
.filter-hint {
  font-size: 11px; color: var(--c-accent); text-align: center;
  padding: 4px; cursor: pointer; margin-top: 6px;
}
.filter-hint:hover { text-decoration: underline; }
</style>
