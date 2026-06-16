<template>
  <div :class="['pb-section', accentClass]">
    <div class="pb-label" @click="toggle">
      <span class="pb-label-left">
        <slot name="icon">{{ icon || '📋' }}</slot>
        <span>{{ title }}<span v-if="count !== undefined">（{{ count }}）</span></span>
      </span>
      <span class="pb-label-right">
        <slot name="actions" />
        <span class="toggle-icon">{{ open ? '▾' : '▸' }}</span>
      </span>
    </div>
    <Transition name="collapse">
      <div v-if="open" class="section-body">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  count: { type: [Number, String], default: undefined },
  // 颜色主题: danger(红) / primary(蓝) / accent(紫) / 无
  accent: { type: String, default: 'danger', validator: (v) => ['danger', 'primary', 'accent', 'none'].includes(v) }
})

const emit = defineEmits(['update:modelValue', 'toggle'])

const open = computed({
  get() {
    if (props.modelValue !== undefined) return props.modelValue
    return true
  },
  set(v) {
    emit('update:modelValue', v)
  }
})

const accentClass = computed(() => (props.accent === 'none' ? '' : `sec-${props.accent}`))

function toggle() {
  open.value = !open.value
  emit('toggle', open.value)
}
</script>
