<template>
  <div class="src-root" :class="`src-${providerType}`">
    <div class="src-header">
      <div class="src-header-left">
        <span class="src-icon">{{ icon }}</span>
        <span class="src-title">{{ title }}</span>
        <span v-if="query" class="src-query">"{{ query }}"</span>
      </div>
      <div class="src-header-right">
        <span v-if="loading" class="src-status loading">查询中…</span>
        <span v-else-if="errorMsg" class="src-status error">查询失败</span>
        <span v-else class="src-status ok">{{ items.length }} 条结果</span>
        <button v-if="items.length" class="src-toggle" @click="expanded = !expanded">
          {{ expanded ? '收起' : '展开' }}
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="src-error">{{ errorMsg }}</div>

    <div v-if="expanded && items.length" class="src-list">
      <div v-for="(item, idx) in items" :key="idx" class="src-item">
        <!-- 法条 -->
        <template v-if="providerType === 'law'">
          <div class="src-item-title">
            <span class="src-statute">{{ item.statuteName }}</span>
            <span class="src-article">{{ item.articleNumber }}</span>
            <span v-if="item.effective" class="src-tag" :class="tagClass(item.effective)">{{
              item.effective
            }}</span>
          </div>
          <div v-if="item.level" class="src-meta">
            <span class="src-meta-item">{{ item.level }}</span>
            <span v-if="item.publishDate" class="src-meta-item">公布：{{ item.publishDate }}</span>
            <span v-if="item.implementDate" class="src-meta-item">实施：{{ item.implementDate }}</span>
          </div>
          <div v-if="item.content" class="src-content">{{ truncate(item.content, 280) }}</div>
        </template>

        <!-- 案例 -->
        <template v-else-if="providerType === 'case'">
          <div class="src-item-title">
            <span v-if="item.caseNumber" class="src-case-no">{{ item.caseNumber }}</span>
            <span class="src-case-title">{{ item.title || '（无标题）' }}</span>
            <span v-if="item.source" class="src-tag" :class="tagClass(item.source)">{{
              item.source
            }}</span>
          </div>
          <div class="src-meta">
            <span v-if="item.court" class="src-meta-item">{{ item.court }}</span>
            <span v-if="item.cause" class="src-meta-item">{{ item.cause }}</span>
            <span v-if="item.judgeDate" class="src-meta-item">{{ item.judgeDate }}</span>
          </div>
          <div v-if="item.content" class="src-content">{{ truncate(item.content, 240) }}</div>
        </template>

        <!-- 企业 -->
        <template v-else-if="providerType === 'company'">
          <div class="src-item-title">
            <span class="src-company-name">{{ item.name }}</span>
            <span v-if="item.creditCode" class="src-credit">{{ item.creditCode }}</span>
          </div>
          <div v-if="item.detail" class="src-company-grid">
            <div v-if="item.detail.legalPerson" class="src-company-row">
              <span class="src-label">法定代表人</span>
              <span>{{ item.detail.legalPerson }}</span>
            </div>
            <div v-if="item.detail.regCapital" class="src-company-row">
              <span class="src-label">注册资本</span>
              <span>{{ item.detail.regCapital }}</span>
            </div>
            <div v-if="item.detail.companyType" class="src-company-row">
              <span class="src-label">企业类型</span>
              <span>{{ item.detail.companyType }}</span>
            </div>
            <div v-if="item.detail.establishDate" class="src-company-row">
              <span class="src-label">成立日期</span>
              <span>{{ item.detail.establishDate }}</span>
            </div>
            <div v-if="item.detail.status" class="src-company-row">
              <span class="src-label">经营状态</span>
              <span class="src-status-text">{{ item.detail.status }}</span>
            </div>
            <div v-if="item.detail.industry" class="src-company-row">
              <span class="src-label">所属行业</span>
              <span>{{ item.detail.industry }}</span>
            </div>
            <div v-if="item.detail.address" class="src-company-row src-company-row-full">
              <span class="src-label">注册地址</span>
              <span>{{ item.detail.address }}</span>
            </div>
            <div v-if="item.detail.businessScope" class="src-company-row src-company-row-full">
              <span class="src-label">经营范围</span>
              <span>{{ truncate(item.detail.businessScope, 200) }}</span>
            </div>
          </div>
          <div
            v-if="item.aggregation && item.aggregation.stats"
            class="src-aggregation"
          >
            <div class="src-agg-title">数据概览</div>
            <div class="src-agg-grid">
              <div
                v-for="(stat, key) in aggSummary(item.aggregation.stats)"
                :key="key"
                class="src-agg-cell"
              >
                <div class="src-agg-num">{{ stat.total }}</div>
                <div class="src-agg-name">{{ aggLabel(key) }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
  query: { type: String, default: '' },
  result: { type: Object, default: () => ({}) }
})

const expanded = ref(true)

const providerType = computed(() => {
  if (props.type === 'searchLaw') return 'law'
  if (props.type === 'searchCase') return 'case'
  if (props.type === 'searchCompany') return 'company'
  return 'unknown'
})

const title = computed(() => {
  if (providerType.value === 'law') return '法条检索'
  if (providerType.value === 'case') return '案例检索'
  if (providerType.value === 'company') return '企业信息'
  return '查询结果'
})

const icon = computed(() => {
  if (providerType.value === 'law') return '📜'
  if (providerType.value === 'case') return '⚖️'
  if (providerType.value === 'company') return '🏢'
  return '🔍'
})

const items = computed(() => {
  const data = props.result?.data
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.items)) return data.items
  return []
})

const loading = computed(() => props.result?.loading === true)
const errorMsg = computed(() => {
  if (props.result?.success === false) return props.result?.message || '查询失败'
  if (props.result?.error) return props.result.error
  return ''
})

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

function tagClass(value) {
  if (!value) return ''
  if (value.includes('有效') || value.includes('典型') || value.includes('参考') || value.includes('公报')) {
    return 'tag-good'
  }
  if (value.includes('失效') || value.includes('失信') || value.includes('违法')) {
    return 'tag-bad'
  }
  return 'tag-neutral'
}

function aggSummary(stats) {
  if (!stats) return {}
  const out = {}
  for (const [k, v] of Object.entries(stats)) {
    if (k === 'id' || k === 'name') continue
    if (v && typeof v === 'object' && typeof v.总数 === 'number') {
      out[k] = v
    }
  }
  return out
}

function aggLabel(key) {
  return key.replace(/统计$/, '')
}
</script>

<style scoped>
.src-root {
  margin: 8px 0;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 10px;
  background: var(--c-bg-card, #fafafa);
  overflow: hidden;
  font-size: 13px;
}

.src-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--c-bg-header, #f3f4f6);
  border-bottom: 1px solid var(--c-border, #e5e7eb);
}

.src-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.src-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.src-icon {
  font-size: 16px;
}

.src-title {
  font-weight: 600;
  color: var(--c-text, #111827);
}

.src-query {
  color: var(--c-text-muted, #6b7280);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.src-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}
.src-status.loading {
  background: #dbeafe;
  color: #1d4ed8;
}
.src-status.error {
  background: #fee2e2;
  color: #b91c1c;
}
.src-status.ok {
  background: #dcfce7;
  color: #15803d;
}

.src-toggle {
  border: none;
  background: transparent;
  color: var(--c-text-muted, #6b7280);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.src-toggle:hover {
  background: var(--c-bg-hover, #e5e7eb);
}

.src-error {
  padding: 12px 14px;
  color: #b91c1c;
  font-size: 12px;
}

.src-list {
  padding: 6px 0;
}

.src-item {
  padding: 10px 14px;
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
}
.src-item:last-child {
  border-bottom: none;
}

.src-item-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.src-statute,
.src-case-title,
.src-company-name {
  font-weight: 600;
  color: var(--c-text, #111827);
  font-size: 13px;
}

.src-article,
.src-case-no,
.src-credit {
  color: var(--c-accent, #e63946);
  font-size: 12px;
  font-weight: 500;
}

.src-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--c-bg-tag, #e5e7eb);
  color: var(--c-text-muted, #4b5563);
}
.src-tag.tag-good {
  background: #dcfce7;
  color: #166534;
}
.src-tag.tag-bad {
  background: #fee2e2;
  color: #991b1b;
}

.src-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 6px 0;
}

.src-meta-item {
  font-size: 11px;
  color: var(--c-text-muted, #6b7280);
  background: var(--c-bg-meta, #f3f4f6);
  padding: 1px 6px;
  border-radius: 4px;
}

.src-content {
  color: var(--c-text-secondary, #374151);
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 12.5px;
}

.src-company-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 16px;
  margin-top: 6px;
}

.src-company-row {
  display: flex;
  font-size: 12px;
  line-height: 1.6;
}

.src-company-row-full {
  grid-column: 1 / -1;
}

.src-label {
  color: var(--c-text-muted, #6b7280);
  min-width: 70px;
  flex-shrink: 0;
}

.src-status-text {
  color: #166534;
  font-weight: 500;
}

.src-aggregation {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--c-border-soft, #e5e7eb);
}

.src-agg-title {
  font-size: 11px;
  color: var(--c-text-muted, #6b7280);
  margin-bottom: 6px;
}

.src-agg-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.src-agg-cell {
  text-align: center;
  padding: 6px 4px;
  background: var(--c-bg-meta, #f9fafb);
  border-radius: 4px;
}

.src-agg-num {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-accent, #e63946);
}

.src-agg-name {
  font-size: 11px;
  color: var(--c-text-muted, #6b7280);
  margin-top: 2px;
}
</style>
