<template>
  <Teleport to="body">
    <div v-if="show" class="export-overlay" @click.self="$emit('close')">
      <div class="export-dialog">
        <div class="ed-header">
          <h3>导出审查报告</h3>
          <button class="ed-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="ed-body">
          <div class="ed-preview">
            <pre>{{ reportText }}</pre>
          </div>
        </div>
        <div class="ed-footer">
          <button class="ed-btn" @click="copyToClipboard">复制到剪贴板</button>
          <button class="ed-btn primary" @click="saveAsDocument">保存为新文档</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  messages: { type: Array, default: () => [] }
})

defineEmits(['close'])

const reportText = computed(() => {
  let text = '# 法律审查报告\n\n'
  text += `> 生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`

  const allActions = []
  for (const msg of props.messages) {
    if (msg.actions?.length) {
      allActions.push(...msg.actions)
    }
  }

  const comments = allActions.filter((a) => a.type === 'comment')
  const revisions = allActions.filter((a) => a.type === 'revision')
  const risks = allActions.filter((a) => a.type === 'risk')
  const triages = allActions.filter((a) => a.type === 'triage')
  const compares = allActions.filter((a) => a.type === 'compare')

  text += '## 概览\n\n'
  text += `- 批注: ${comments.length} 项\n`
  text += `- 修订: ${revisions.length} 项\n`
  text += `- 风险评估: ${risks.reduce((s, r) => s + (r.items?.length || 0), 0)} 项\n`
  if (triages.length) text += `- NDA分流: ${triages.length} 次\n`
  if (compares.length)
    text += `- 合同对比: ${compares.reduce((s, c) => s + (c.items?.length || 0), 0)} 项差异\n`
  text += '\n'

  if (comments.length) {
    text += '## 批注\n\n'
    comments.forEach((a, i) => {
      text += `### ${i + 1}. ${a.keyword}\n\n`
      text += `${a.comment}\n\n`
      if (a._applied) text += '> 状态: 已应用\n\n'
    })
  }

  if (revisions.length) {
    text += '## 修订建议\n\n'
    revisions.forEach((a, i) => {
      text += `### ${i + 1}. ${a.keyword}\n\n`
      text += `- **原文**: ${a.keyword}\n`
      text += `- **建议**: ${a.newText}\n`
      if (a.reason) text += `- **理由**: ${a.reason}\n`
      text += '\n'
    })
  }

  if (risks.length) {
    text += '## 风险评估\n\n'
    risks.forEach((r) => {
      r.items?.forEach((item) => {
        text += `### ${item.category}\n\n`
        text += `- 严重度: ${item.severity}\n`
        text += `- 可能性: ${item.likelihood}\n`
        text += `- 描述: ${item.description}\n`
        if (item.recommendation) text += `- 建议: ${item.recommendation}\n`
        text += '\n'
      })
    })
  }

  if (triages.length) {
    text += '## NDA分流\n\n'
    triages.forEach((t) => {
      text += `### 评级: ${t.level}\n\n`
      text += `${t.summary}\n\n`
      t.issues?.forEach((issue) => {
        text += `- **${issue.item}**: ${issue.detail} (${issue.severity})\n`
      })
      if (t.recommendation) text += `\n建议: ${t.recommendation}\n`
      text += '\n'
    })
  }

  if (compares.length) {
    text += '## 合同对比\n\n'
    compares.forEach((c) => {
      c.items?.forEach((item) => {
        text += `### ${item.clause} (${item.change})\n\n`
        if (item.standard) text += `- 标准: ${item.standard}\n`
        if (item.current) text += `- 当前: ${item.current}\n`
        if (item.suggestion) text += `- 建议: ${item.suggestion}\n`
        text += `- 风险: ${item.risk}\n\n`
      })
    })
  }

  return text
})

function copyToClipboard() {
  navigator.clipboard?.writeText(reportText.value)
  window.$message?.success('已复制到剪贴板')
}

function saveAsDocument() {
  try {
    const app = window.Application
    if (!app) {
      window.$message?.error('WPS 环境不可用')
      return
    }
    const doc = app.Documents.Add()
    doc.Content.Text = reportText.value
    window.$message?.success('已创建新文档')
  } catch {
    window.$message?.error('创建文档失败')
  }
}
</script>

<style scoped>
.export-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.export-dialog {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.ed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--c-border, #e0e0e0);
}
.ed-header h3 {
  margin: 0;
  font-size: 16px;
  color: #0a0a0a;
}
.ed-close {
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0 4px;
}
.ed-close:hover {
  color: #e63946;
}
.ed-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.ed-preview {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 50vh;
  overflow-y: auto;
}
.ed-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--c-border, #e0e0e0);
}
.ed-btn {
  padding: 6px 14px;
  border: 1px solid var(--c-border, #e0e0e0);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.ed-btn:hover {
  background: #f5f5f5;
}
.ed-btn.primary {
  background: #e63946;
  color: #fff;
  border-color: #e63946;
}
.ed-btn.primary:hover {
  background: #c62828;
}
</style>
