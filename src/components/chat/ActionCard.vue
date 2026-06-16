<template>
  <div
    class="act-card"
    :class="[
      `act-${action.type}`,
      { applied: action._applied, failed: action._failed, rejected: action._rejected }
    ]"
  >
    <div class="act-header">
      <span class="act-badge">{{ badgeLabel }}</span>
      <span v-if="action._applied" class="act-status ok">✓ 已应用</span>
      <span v-else-if="action._rejected" class="act-status skip">已跳过</span>
      <span v-else-if="action._failed" class="act-status err">✗ 失败</span>
    </div>

    <div v-if="action.type === 'addRevision' && !isEditing" class="diff-block">
      <div class="diff-section">
        <div class="diff-label del-label">原文</div>
        <div class="diff-text del-text">{{ action.keyword }}</div>
      </div>
      <div class="diff-section">
        <div class="diff-label add-label">改为</div>
        <div class="diff-text add-text">{{ action.newText }}</div>
      </div>
    </div>

    <div v-if="isEditing && schemaFields.length > 0" class="act-form">
      <div v-for="field in schemaFields" :key="field.key" class="af-row">
        <label class="af-label">{{ field.title }}</label>
        <select v-if="field.enum" v-model="formParams[field.key]" class="af-input af-select">
          <option
            v-for="(opt, i) in field.enum"
            :key="opt"
            :value="opt"
          >
            {{ field.enumNames ? field.enumNames[i] : opt }}
          </option>
        </select>
        <textarea
          v-else-if="field.inputType === 'textarea'"
          v-model="formParams[field.key]"
          class="af-input af-textarea"
          :placeholder="field.placeholder || ''"
          rows="2"
        />
        <label v-else-if="field.type === 'boolean'" class="af-toggle">
          <input type="checkbox" v-model="formParams[field.key]" />
          <span class="af-toggle-track">
            <span class="af-toggle-thumb" />
          </span>
          <span class="af-toggle-text">{{ formParams[field.key] ? '是' : '否' }}</span>
        </label>
        <input
          v-else-if="field.type === 'number'"
          type="number"
          v-model.number="formParams[field.key]"
          class="af-input"
          :min="field.minimum"
          :max="field.maximum"
          :step="field.step || 1"
        />
        <input v-else type="text" v-model="formParams[field.key]" class="af-input" :placeholder="field.placeholder || ''" />
        <span v-if="field.description && !field.enum" class="af-hint">{{ field.description }}</span>
      </div>
    </div>

    <div v-if="action.reason" class="act-reason">💡 {{ action.reason }}</div>

    <div
      v-if="!action._applied && !action._failed && !action._rejected && isExecutable"
      class="act-btns"
    >
      <button v-if="schemaFields.length > 0" class="abtn edit" @click="isEditing = !isEditing">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>{{ isEditing ? '收起参数' : '修改参数' }}
      </button>
      <button v-if="action.keyword" class="abtn locate" @click="$emit('locate')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
        </svg>定位
      </button>
      <button class="abtn ok" @click="handleConfirm">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>确认执行
      </button>
      <button class="abtn skip" @click="$emit('reject')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>跳过
      </button>
    </div>

    <div v-if="action._failed" class="act-btns">
      <button class="abtn retry" @click="handleRetry">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>重试
      </button>
      <button class="abtn skip" @click="$emit('reject')">跳过</button>
    </div>

    <div v-if="action._applied" class="act-ctrl-z">💡 可在文档中 Ctrl+Z 撤销此操作</div>
    <div v-if="action._failed" class="act-err">⚠️ {{ action._errorMsg || '执行失败' }}</div>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { actionRegistry } from '@/services/workflow/ActionRegistry.js'
import { registerAllActions } from '@/services/workflow/actions/index.js'

registerAllActions(actionRegistry)

const props = defineProps({
  action: { type: Object, required: true }
})

const emit = defineEmits(['apply', 'locate', 'reject', 'retry'])

const isEditing = ref(true)

const isExecutable = computed(() => {
  const regAction = actionRegistry.get(props.action.type)
  return !!regAction
})

const badgeLabel = computed(() => {
  const regAction = actionRegistry.get(props.action.type)
  if (regAction) return `${regAction.icon} ${regAction.name}`
  const fallbackMap = {
    risk: '⚡ 风险评估',
    triage: '🚦 快速分流',
    compare: '⚖️ 合同对比'
  }
  return fallbackMap[props.action.type] || props.action.type
})

const schemaFields = computed(() => {
  const action = actionRegistry.get(props.action.type)
  if (!action) return []
  const schema = action.getSchema()
  const propsDef = schema.properties || {}
  return Object.entries(propsDef)
    .filter(([, def]) => {
      if (!def.showIf) return true
      return !!formParams[def.showIf]
    })
    .map(([key, def]) => ({
      key,
      title: def.title || key,
      description: def.description || '',
      type: def.type || 'string',
      enum: def.enum || null,
      enumNames: def.enumNames || null,
      default: def.default,
      inputType: def.inputType || null,
      placeholder: def.placeholder || '',
      minimum: def.minimum,
      maximum: def.maximum,
      step: def.step,
      showIf: def.showIf || null
    }))
})

const formParams = reactive({})

function _initFormParams() {
  const action = actionRegistry.get(props.action.type)
  if (!action) return
  const schema = action.getSchema()
  const propsDef = schema.properties || {}
  for (const [key, def] of Object.entries(propsDef)) {
    if (props.action[key] !== undefined) {
      formParams[key] = props.action[key]
    } else if (def.default !== undefined) {
      formParams[key] = def.default
    } else {
      formParams[key] = def.type === 'boolean' ? false : def.type === 'number' ? 0 : ''
    }
  }
}

_initFormParams()

function handleConfirm() {
  const merged = { ...props.action, ...formParams }
  emit('apply', merged)
}

function handleRetry() {
  const merged = { ...props.action, ...formParams }
  delete merged._failed
  delete merged._errorMsg
  emit('retry', merged)
}
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
.act-card.applied {
  background: #f0fdf4;
  opacity: 0.8;
}
.act-card.failed {
  background: #fef2f2;
}

.act-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.act-badge {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
}
.act-status {
  font-size: 11px;
  font-weight: 500;
}
.act-status.ok {
  color: #16a34a;
}
.act-status.skip {
  color: #999;
}
.act-status.err {
  color: #dc2626;
}

.diff-block {
  margin: 6px 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}
.diff-section {
  padding: 0;
}
.diff-label {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  letter-spacing: 0.5px;
}
.del-label {
  background: #fef2f2;
  color: #b91c1c;
}
.add-label {
  background: #f0fdf4;
  color: #166534;
  border-top: 1px solid #e8e8e8;
}
.diff-text {
  font-size: 13px;
  line-height: 1.7;
  padding: 6px 10px;
  white-space: pre-wrap;
  word-break: break-all;
}
.del-text {
  background: #fff5f5;
  color: #7f1d1d;
}
.add-text {
  background: #f7fef9;
  color: #14532d;
}

.act-form {
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.af-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.af-label {
  font-size: 11px;
  font-weight: 600;
  color: #555;
}
.af-input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  background: #fafafa;
}
.af-input:focus {
  border-color: var(--c-accent, #2563eb);
  background: #fff;
}
.af-select {
  appearance: auto;
  cursor: pointer;
}
.af-textarea {
  resize: vertical;
  min-height: 48px;
}
.af-hint {
  font-size: 10px;
  color: #999;
  line-height: 1.3;
}
.af-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
}
.af-toggle input {
  display: none;
}
.af-toggle-track {
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: #d1d5db;
  position: relative;
  transition: background 0.15s;
}
.af-toggle input:checked + .af-toggle-track {
  background: #16a34a;
}
.af-toggle-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.15s;
}
.af-toggle input:checked + .af-toggle-track .af-toggle-thumb {
  left: 16px;
}
.af-toggle-text {
  font-size: 12px;
  color: #666;
}

.act-reason {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #e0e0e0;
  line-height: 1.6;
}
.act-ctrl-z {
  margin-top: 6px;
  font-size: 11px;
  color: #dc2626;
}

.act-btns {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.abtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: #fff;
}
.abtn.ok {
  background: #16a34a;
  flex: 2;
}
.abtn.ok:hover {
  background: #15803d;
}
.abtn.locate {
  background: #2563eb;
}
.abtn.locate:hover {
  background: #1d4ed8;
}
.abtn.skip {
  background: #9ca3af;
}
.abtn.skip:hover {
  background: #6b7280;
}
.abtn.edit {
  background: #f59e0b;
  color: #fff;
}
.abtn.edit:hover {
  background: #d97706;
}
.abtn.retry {
  background: #2563eb;
  flex: 2;
}
.abtn.retry:hover {
  background: #1d4ed8;
}

.act-err {
  margin-top: 6px;
  font-size: 12px;
  color: #dc2626;
  background: #fef2f2;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
