<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

// 引入文档监听器
import DocumentWatcher from './services/wps/DocumentWatcher.js'
// 引入缓存管理器
import { CacheManager } from './services/ai/CacheManager.js'
// 引入模板管理器
import { templateManager } from './utils/templateManager.js'

let documentWatcher = null

onMounted(() => {
  // 初始化缓存管理器
  const cacheManager = new CacheManager({
    maxCacheSize: 500,
    maxCacheAge: 30 * 60 * 1000,
    storagePrefix: 'contract_ai_cache_'
  })

  // 初始化文档监听器
  documentWatcher = new DocumentWatcher(cacheManager)

  // 延迟启动监听，确保WPS完全加载
  setTimeout(() => {
    if (window.Application) {
      documentWatcher.startWatching()
      console.log('文档监听器已启动')
      
      // 初始化模板
      templateManager.initializeTemplates().then(() => {
        console.log('模板初始化完成')
      }).catch(error => {
        console.error('模板初始化失败:', error)
      })
    }
  }, 2000)

  // 将全局对象暴露到 window
  window.cacheManager = cacheManager
  window.documentWatcher = documentWatcher
  window.templateManager = templateManager
})

onUnmounted(() => {
  if (documentWatcher) {
    documentWatcher.stopWatching()
  }
})
</script>
