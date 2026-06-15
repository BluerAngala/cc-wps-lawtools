<template>
  <div class="scheme-row">
    <select :value="modelValue" class="select-sm" @change="$emit('update:modelValue', $event.target.value)">
      <option v-for="s in schemes" :key="s.id" :value="s.id">{{ s.name }}</option>
    </select>
    <button class="sm-btn" @click="$emit('new')">新建方案</button>
    <button class="sm-btn" @click="$emit('save')">保存方案</button>
    <button class="sm-btn warn" :disabled="schemes.length <= 1" @click="$emit('delete')">删除</button>
  </div>
  <Teleport to="body">
    <div v-if="showNewModal" class="modal-mask" @click.self="$emit('close-new')">
      <div class="modal-card">
        <h3>新建{{ typeLabel }}</h3>
        <div class="form-group">
          <label>方案名称</label>
          <input
            v-model="newName"
            class="text-input"
            :placeholder="newPlaceholder"
            @keyup.enter="confirmNew"
          />
        </div>
        <div class="modal-actions">
          <button class="sm-btn" @click="$emit('close-new')">取消</button>
          <button class="sm-btn primary" @click="$emit('confirm-new', newName)">创建</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  schemes: { type: Array, required: true },
  showNewModal: { type: Boolean, default: false },
  typeLabel: { type: String, default: '方案' },
  newPlaceholder: { type: String, default: '请输入方案名称' }
})

const emit = defineEmits([
  'update:modelValue',
  'new',
  'save',
  'delete',
  'close-new',
  'confirm-new'
])

const newName = ref('')

watch(
  () => props.showNewModal,
  (v) => {
    if (v) newName.value = ''
  }
)

function confirmNew() {
  if (!newName.value.trim()) return
  emit('confirm-new', newName.value)
}
</script>

<style scoped>
.scheme-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}
</style>
