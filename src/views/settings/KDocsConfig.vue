<template>
  <div>
    <div class="scheme-bar">
      <SchemeSelector
        v-model="activeId"
        :schemes="schemes"
        :show-new-modal="showNewModal"
        type-label="金山文档方案"
        new-placeholder="如：默认方案"
        @new="showNewModal = true"
        @save="saveScheme"
        @delete="deleteScheme"
        @close-new="showNewModal = false"
        @confirm-new="createScheme"
      />
    </div>

    <div class="form-section">
      <div class="form-group">
        <label>Webhook URL</label>
        <input v-model="kdocs.webhookUrl" class="text-input" placeholder="请输入 Webhook URL" @input="autoSave" />
      </div>
      <div class="form-group">
        <label>Token</label>
        <input v-model="kdocs.token" type="password" class="text-input" placeholder="请输入 Token" @input="autoSave" />
      </div>
      <div class="form-group">
        <label>Sheet ID</label>
        <input v-model.number="kdocs.sheetId" type="number" min="1" step="1" class="text-input" placeholder="5" @input="autoSave" />
      </div>
      <div class="form-group">
        <label>Coze API Key</label>
        <input v-model="kdocs.cozeApiKey" type="password" class="text-input" placeholder="请输入 Coze API Key" @input="autoSave" />
      </div>
      <div class="form-group">
        <label>金山文档工作流 ID</label>
        <input v-model="kdocs.workflowId" class="text-input" placeholder="请输入金山文档操作工作流ID" @input="autoSave" />
      </div>
      <div class="form-group">
        <label>企业信息工作流 ID</label>
        <input v-model="kdocs.companyInfoWorkflowId" class="text-input" placeholder="请输入企业信息查询工作流ID" @input="autoSave" />
      </div>
      <div class="form-group">
        <label>合同编号前缀</label>
        <input v-model="kdocs.contractNumberPrefix" class="text-input" placeholder="如 HT" @input="autoSave" />
        <p class="field-hint">合同编号格式：前缀-年份-编号，如 HT-2025-001</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { appConfig } from '@/utils/AppConfig.js'
import SchemeSelector from './SchemeSelector.vue'

const kdocs = ref({ ...appConfig.get('kdocs') })
const schemes = ref([])
const activeId = ref('')
const showNewModal = ref(false)

onMounted(() => {
  const data = appConfig.getSchemes('kdocs')
  schemes.value = data.schemes || []
  activeId.value = data.activeSchemeId || ''
  if (activeId.value) {
    const s = schemes.value.find((x) => x.id === activeId.value)
    if (s?.config) kdocs.value = { ...s.config }
  }
})

watch(activeId, (id) => {
  const s = schemes.value.find((x) => x.id === id)
  if (s?.config) kdocs.value = { ...s.config }
})

function autoSave() {
  const s = schemes.value.find((x) => x.id === activeId.value)
  if (s) s.config = { ...kdocs.value }
  const config = appConfig.getConfig()
  config.kdocs = { ...kdocs.value }
  appConfig.saveConfig(config)
}

function saveScheme() {
  const s = schemes.value.find((x) => x.id === activeId.value)
  if (s) {
    s.config = { ...kdocs.value }
    s.updatedAt = new Date().toISOString()
    appConfig.saveSchemes('kdocs', { schemes: schemes.value, activeSchemeId: activeId.value })
    window.$message?.success('方案已保存')
  }
}

function createScheme(name) {
  if (!name.trim()) {
    window.$message?.warning('请输入方案名称')
    return
  }
  const s = {
    id: `kdocs_${Date.now()}`,
    name: name.trim(),
    type: 'kdocs',
    config: { ...kdocs.value },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  schemes.value.push(s)
  activeId.value = s.id
  appConfig.saveSchemes('kdocs', { schemes: schemes.value, activeSchemeId: s.id })
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
    const first = schemes.value[0]
    if (first?.config) kdocs.value = { ...first.config }
    appConfig.saveSchemes('kdocs', { schemes: schemes.value, activeSchemeId: activeId.value })
    autoSave()
    window.$message?.success('方案已删除')
  }
}
</script>

<style scoped>
.scheme-bar {
  margin-bottom: 14px;
}
</style>
