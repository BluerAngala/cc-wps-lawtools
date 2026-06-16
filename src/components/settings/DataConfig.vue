<template>
  <div>
    <div class="form-section">
      <h4>合同要素提取</h4>
      <p class="field-hint">配置 AI 提取合同时关注的字段，可调整标签顺序</p>
      <div class="tag-list">
        <div v-for="(tag, idx) in extractor.extractTags" :key="idx" class="tag-item">
          <span class="tag-text">{{ tag }}</span>
          <button class="del-btn-sm" @click="removeTag(idx)">×</button>
        </div>
        <button class="add-tag" @click="addTag">+ 添加</button>
      </div>
      <button class="primary-save-btn" @click="saveExtractor">保存</button>
    </div>

    <div class="form-section">
      <h4>配置导入导出</h4>
      <div class="data-actions">
        <button class="sm-btn" @click="handleExport">导出配置</button>
        <label class="sm-btn upload-btn">
          导入配置
          <input type="file" accept=".json" hidden @change="handleImport" />
        </label>
        <button class="sm-btn" @click="showPath">查看配置文件路径</button>
      </div>
      <div v-if="configPath" class="config-path-card">
        <p class="path-label">配置文件位置（已复制到剪贴板）：</p>
        <code class="path-text">{{ configPath }}</code>
      </div>
    </div>

    <div class="form-section danger-zone">
      <h4>危险操作</h4>
      <p class="field-hint">重置后将清空所有自定义配置，恢复到默认状态，不可恢复</p>
      <button class="danger-btn" @click="handleReset">重置所有配置</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { appConfig } from '@/utils/AppConfig.js'
import { reinitializeAIClient } from '@/services/ai/siliconflow.js'

const extractor = ref({ ...appConfig.get('extractor') })
const configPath = ref('')

function addTag() {
  extractor.value.extractTags.push('新字段')
}

function removeTag(idx) {
  extractor.value.extractTags.splice(idx, 1)
}

function saveExtractor() {
  const config = appConfig.getConfig()
  config.extractor = { ...extractor.value }
  appConfig.saveConfig(config)
  window.$message?.success('合同要素配置已保存')
}

function handleExport() {
  appConfig.exportConfig()
  window.$message?.success('配置已导出')
}

async function handleImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    await appConfig.importConfig(file)
    reinitializeAIClient()
    window.$message?.success('配置已导入，请刷新页面生效')
  } catch (err) {
    window.$message?.error('导入失败: ' + err.message)
  }
  e.target.value = ''
}

function showPath() {
  const fullPath = appConfig.getConfigFullPath()
  configPath.value = fullPath || 'WPS 环境不可用'
  navigator.clipboard?.writeText(fullPath).catch(() => {})
  window.$message?.success('路径已复制到剪贴板')
}

function handleReset() {
  if (confirm('确定要重置所有配置吗？此操作不可恢复。')) {
    appConfig.reset()
    reinitializeAIClient()
    window.$message?.success('所有配置已重置')
    setTimeout(() => window.location.reload(), 500)
  }
}
</script>
