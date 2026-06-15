<template>
  <div>
    <div class="scheme-bar">
      <SchemeSelector
        v-model="activeId"
        :schemes="schemes"
        :show-new-modal="showNewModal"
        :type-label="typeLabel"
        :new-placeholder="newPlaceholder"
        @new="showNewModal = true"
        @save="saveScheme"
        @delete="deleteScheme"
        @close-new="showNewModal = false"
        @confirm-new="createScheme"
      />
    </div>

    <AccordionSection
      v-model="open"
      :title="`${typeLabel}规则`"
      icon="📋"
      :count="activeRules.length"
      accent="danger"
    >
      <template #actions>
        <button class="add-inline" @click.stop="addRule">+ 添加</button>
      </template>

      <div v-for="(rule, idx) in activeRules" :key="idx" class="acc-card">
        <div class="acc-head" @click="toggleExpand(idx)">
          <span class="acc-title">
            <span :class="['action-tag', rule.actionType]">{{ rule.actionType }}</span>
            <input
              v-if="expanded === idx"
              v-model="rule.keyword"
              class="title-input"
              :placeholder="fieldPlaceholders.keyword"
              @click.stop
            />
            <span v-else>{{ rule.keyword || `规则 #${idx + 1}` }}</span>
          </span>
          <span class="acc-actions">
            <button class="del-btn-sm" @click.stop="removeRule(idx)" title="删除">×</button>
            <span class="acc-arrow">{{ expanded === idx ? '▾' : '▸' }}</span>
          </span>
        </div>
        <Transition name="collapse">
          <div v-if="expanded === idx" class="acc-body">
            <div class="pb-field">
              <label>操作类型</label>
              <select v-model="rule.actionType" class="text-input">
                <option value="批注">批注</option>
                <option value="修订">修订</option>
              </select>
            </div>
            <div class="pb-field">
              <label>{{ rule.actionType === '修订' ? fieldLabels.suggestedText : fieldLabels.comment }}</label>
              <textarea
                v-if="rule.actionType === '批注'"
                v-model="rule.comment"
                rows="3"
                class="text-input"
                :placeholder="fieldPlaceholders.comment"
              ></textarea>
              <input
                v-else
                v-model="rule.suggestedText"
                class="text-input"
                :placeholder="fieldPlaceholders.suggestedText"
              />
            </div>
          </div>
        </Transition>
      </div>

      <button class="primary-save-btn" @click="saveScheme">保存到当前方案</button>
    </AccordionSection>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { appConfig } from '@/utils/AppConfig.js'
import SchemeSelector from './SchemeSelector.vue'
import AccordionSection from './AccordionSection.vue'

const props = defineProps({
  schemeType: { type: String, required: true, validator: (v) => ['keyword', 'review'].includes(v) },
  typeLabel: { type: String, default: '方案' },
  newPlaceholder: { type: String, default: '请输入方案名称' },
  fieldLabels: {
    type: Object,
    default: () => ({ keyword: '关键词', comment: '批注内容', suggestedText: '建议文本' })
  },
  fieldPlaceholders: {
    type: Object,
    default: () => ({
      keyword: '如：付款方式',
      comment: '如：提醒确认金额是否准确无误',
      suggestedText: '如：建议约定仲裁'
    })
  }
})

const schemes = ref([])
const activeId = ref('')
const activeRules = ref([])
const showNewModal = ref(false)
const open = ref(true)
const expanded = ref(null)

onMounted(loadSchemes)

function loadSchemes() {
  const data = appConfig.getSchemes(props.schemeType)
  schemes.value = data.schemes || []
  activeId.value = data.activeSchemeId || ''
  loadActiveRules()
}

function loadActiveRules() {
  const s = schemes.value.find((x) => x.id === activeId.value)
  activeRules.value = s?.rules ? JSON.parse(JSON.stringify(s.rules)) : []
}

watch(activeId, () => loadActiveRules())

function toggleExpand(idx) {
  expanded.value = expanded.value === idx ? null : idx
}

function addRule() {
  activeRules.value.push({ keyword: '', comment: '', actionType: '批注', suggestedText: '' })
  expanded.value = activeRules.value.length - 1
}

function removeRule(idx) {
  activeRules.value.splice(idx, 1)
  if (expanded.value === idx) expanded.value = null
}

function saveScheme() {
  const s = schemes.value.find((x) => x.id === activeId.value)
  if (s) {
    s.rules = JSON.parse(JSON.stringify(activeRules.value))
    s.updatedAt = new Date().toISOString()
    appConfig.saveSchemes(props.schemeType, { schemes: schemes.value, activeSchemeId: activeId.value })
    window.$message?.success('方案已保存')
  }
}

function createScheme(name) {
  if (!name.trim()) {
    window.$message?.warning('请输入方案名称')
    return
  }
  const s = {
    id: `${props.schemeType}_${Date.now()}`,
    name: name.trim(),
    type: props.schemeType,
    rules: JSON.parse(JSON.stringify(activeRules.value)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  schemes.value.push(s)
  activeId.value = s.id
  appConfig.saveSchemes(props.schemeType, { schemes: schemes.value, activeSchemeId: s.id })
  showNewModal.value = false
  window.$message?.success('方案已创建')
}

function deleteScheme() {
  if (schemes.value.length <= 1) return
  if (!confirm('确定删除当前方案？')) return
  const idx = schemes.value.findIndex((x) => x.id === activeId.value)
  if (idx !== -1) {
    schemes.value.splice(idx, 1)
    activeId.value = schemes.value[0].id
    appConfig.saveSchemes(props.schemeType, { schemes: schemes.value, activeSchemeId: activeId.value })
    loadActiveRules()
    window.$message?.success('方案已删除')
  }
}
</script>

<style scoped>
.scheme-bar {
  margin-bottom: 14px;
}
.action-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  margin-right: 4px;
}
.action-tag.批注 {
  background: #dbeafe;
  color: #1e40af;
}
.action-tag.修订 {
  background: #fef3c7;
  color: #92400e;
}
</style>
