<template>
  <RouterView />
</template>

<style scoped></style>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

// 引入文档监听器
import DocumentWatcher from './wps/DocumentWatcher.js'
// 引入缓存管理器
import { CacheManager } from './services/ai/CacheManager.js'

export default {
  setup() {
    const message = ref('你好，wps加载项')
    let documentWatcher = null

    console.log(message.value)
    console.log('window', window)

    onMounted(() => {
      // 初始化缓存管理器
      const cacheManager = new CacheManager({
        maxCacheSize: 500,
        maxCacheAge: 30 * 60 * 1000, // 30分钟过期（比之前的24小时短）
        storagePrefix: 'contract_ai_cache_'
      })

      // 初始化文档监听器
      documentWatcher = new DocumentWatcher(cacheManager)

      // 延迟启动监听，确保WPS完全加载
      setTimeout(() => {
        if (window.Application) {
          documentWatcher.startWatching()
          console.log('文档监听器已启动，每次打开新文档将自动清除缓存')
        } else {
          console.warn('WPS Application对象未找到，文档监听器未启动')
        }
      }, 2000)

      // 将缓存管理器和文档监听器暴露到全局，供其他组件使用
      window.cacheManager = cacheManager
      window.documentWatcher = documentWatcher
    })

    onUnmounted(() => {
      // 清理资源
      if (documentWatcher) {
        documentWatcher.stopWatching()
      }
    })

    console.log('App组件已加载')

    return {
      message
    }
  }
}
</script>
