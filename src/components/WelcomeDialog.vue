<template>
  <n-modal v-model:show="showModal" :mask-closable="false" preset="dialog">
    <n-card
      class="welcome-dialog"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <n-avatar size="medium" src="/images/logo.png" />
          <span class="text-xl font-bold">AI律师工具箱</span>
        </div>
      </template>
      
      <n-space vertical size="large" class="text-center py-4">
        <div class="welcome-content">
          <h2 class="text-2xl font-bold text-primary mb-4">🎉 欢迎使用！</h2>
          <n-text class="text-lg">
            专为律师打造的智能文档处理工具
          </n-text>
          <n-text depth="3" class="block mt-2">
            让您的工作更高效，文档处理更智能
          </n-text>
        </div>
        
        <div class="features-grid">
          <div class="feature-item">
            <n-icon size="24" color="#18a058">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </n-icon>
            <span>合同审查</span>
          </div>
          <div class="feature-item">
            <n-icon size="24" color="#2080f0">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </n-icon>
            <span>智能批注</span>
          </div>
          <div class="feature-item">
            <n-icon size="24" color="#f0a020">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </n-icon>
            <span>AI助理</span>
          </div>
        </div>
      </n-space>

      <template #footer>
        <div class="flex justify-center gap-3">
          <n-button type="primary" size="large" @click="handleStart">
            开始使用
          </n-button>
          <n-button size="large" @click="handleClose">
            稍后再说
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NModal, NCard, NSpace, NText, NButton, NAvatar, NIcon } from 'naive-ui'

const showModal = ref(false)

// 显示弹窗
const show = () => {
  showModal.value = true
}

// 开始使用
const handleStart = () => {
  showModal.value = false
  window.$message?.success('欢迎使用AI律师工具箱！')
}

// 关闭弹窗
const handleClose = () => {
  showModal.value = false
}

// 暴露方法给父组件调用
defineExpose({
  show
})

onMounted(() => {
  console.log('WelcomeDialog 组件已加载')
})
</script>

<style scoped>
.welcome-dialog {
  max-width: 500px;
  margin: 0 auto;
}

.welcome-content {
  padding: 1rem 0;
}

.text-primary {
  color: #18a058;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 1rem;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(24, 160, 88, 0.05);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(24, 160, 88, 0.1);
  transform: translateY(-2px);
}

.feature-item span {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
}
</style>
