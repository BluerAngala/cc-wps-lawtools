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

    <div class="form-section">
      <div v-for="(rule, idx) in activeRules" :key="idx" class="rule-card">
        <div class="rule-head">
          <span class="rule-num">#{{ idx + 1 }}</span>
          <button class="del-btn-sm" @click="removeRule(idx)" title="删除">×</button>
        </div>
        <div class="form-group">
          <label>{{ fieldLabels.keyword }}</label>
          <input v-model="rule.keyword" class="text-input" :placeholder="fieldPlaceholders.keyword" />
        </div>
        <div class="form-group">
          <label>操作类型</label>
          <select v-model="rule.actionType" class="text-input">
            <option value="批注">批注</option>
            <option value="修订">修订</option>
          </select>
        </div>
        <div class="form-group">
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

      <div class="sub-section-head">
        <div></div>
        <div class="section-actions">
          <button class="sm-btn" @click="addRule">+ 添加规则</button>
        </div>
      </div>
      <button class="primary-save-btn" @click="saveScheme">保存到当前方案</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { appConfig } from '@/utils/AppConfig.js'
import SchemeSelector from './SchemeSelector.vue'

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

function addRule() {
  activeRules.value.push({ keyword: '', comment: '', actionType: '批注', suggestedText: '' })
}

function removeRule(idx) {
  activeRules.value.splice(idx, 1)
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
</style>
