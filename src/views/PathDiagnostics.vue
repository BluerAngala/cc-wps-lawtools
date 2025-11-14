<template>
  <n-config-provider>
    <div class="p-4">
      <n-card title="📁 路径诊断工具" size="small">
        <n-space vertical :size="16">
          <!-- 环境检查 -->
          <n-alert type="info" :closable="false">
            <template #header>WPS 环境状态</template>
            <div class="text-sm">
              <div>Application: {{ hasApplication ? '✅ 可用' : '❌ 不可用' }}</div>
              <div>FileSystem: {{ hasFileSystem ? '✅ 可用' : '❌ 不可用' }}</div>
              <div>Env: {{ hasEnv ? '✅ 可用' : '❌ 不可用' }}</div>
            </div>
          </n-alert>

          <!-- 路径信息 -->
          <n-card title="路径信息" size="small" :bordered="false">
            <div v-if="pathInfo" class="space-y-2 text-sm font-mono">
              <div><strong>AppDataPath:</strong> {{ pathInfo.appDataPath }}</div>
              <div><strong>项目根目录:</strong> {{ pathInfo.projectRoot }}</div>
              <div><strong>配置目录:</strong> {{ pathInfo.configDir }}</div>
              <div><strong>模板目录:</strong> {{ pathInfo.templatesDir }}</div>
              <div><strong>缓存目录:</strong> {{ pathInfo.cacheDir }}</div>
              <div><strong>日志目录:</strong> {{ pathInfo.logsDir }}</div>
            </div>
          </n-card>

          <!-- 目录状态 -->
          <n-card title="目录状态" size="small" :bordered="false">
            <div v-if="pathInfo && pathInfo.dirExists" class="space-y-2 text-sm">
              <div>
                项目根目录: 
                <n-tag :type="pathInfo.dirExists.projectRoot ? 'success' : 'error'" size="small">
                  {{ pathInfo.dirExists.projectRoot ? '存在' : '不存在' }}
                </n-tag>
              </div>
              <div>
                配置目录: 
                <n-tag :type="pathInfo.dirExists.configDir ? 'success' : 'error'" size="small">
                  {{ pathInfo.dirExists.configDir ? '存在' : '不存在' }}
                </n-tag>
              </div>
              <div>
                模板目录: 
                <n-tag :type="pathInfo.dirExists.templatesDir ? 'success' : 'error'" size="small">
                  {{ pathInfo.dirExists.templatesDir ? '存在' : '不存在' }}
                </n-tag>
              </div>
              <div>
                缓存目录: 
                <n-tag :type="pathInfo.dirExists.cacheDir ? 'success' : 'error'" size="small">
                  {{ pathInfo.dirExists.cacheDir ? '存在' : '不存在' }}
                </n-tag>
              </div>
              <div>
                日志目录: 
                <n-tag :type="pathInfo.dirExists.logsDir ? 'success' : 'error'" size="small">
                  {{ pathInfo.dirExists.logsDir ? '存在' : '不存在' }}
                </n-tag>
              </div>
            </div>
          </n-card>

          <!-- 操作按钮 -->
          <n-space>
            <n-button type="primary" @click="testCreateDirs">测试创建目录</n-button>
            <n-button @click="refreshInfo">刷新信息</n-button>
            <n-button @click="testSaveFile">测试保存文件</n-button>
          </n-space>

          <!-- 测试结果 -->
          <n-card v-if="testResult" title="测试结果" size="small" :bordered="false">
            <n-code :code="testResult" language="json" />
          </n-card>
        </n-space>
      </n-card>
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { NConfigProvider, NCard, NSpace, NButton, NAlert, NTag, NCode } from 'naive-ui'
import { pathManager } from '../utils/pathManager.js'

const pathInfo = ref(null)
const testResult = ref('')

const hasApplication = computed(() => typeof window.Application !== 'undefined')
const hasFileSystem = computed(() => typeof window.Application?.FileSystem !== 'undefined')
const hasEnv = computed(() => typeof window.Application?.Env !== 'undefined')

// 刷新路径信息
const refreshInfo = () => {
  pathInfo.value = pathManager.getPathInfo()
  console.log('路径信息:', pathInfo.value)
}

// 测试创建目录
const testCreateDirs = () => {
  console.log('开始测试创建目录...')
  
  const result = {
    timestamp: new Date().toISOString(),
    operations: []
  }
  
  if (!pathManager.isWPSAvailable()) {
    result.error = 'WPS 环境不可用'
    testResult.value = JSON.stringify(result, null, 2)
    window.$message?.error('WPS 环境不可用')
    return
  }
  
  const fs = window.Application.FileSystem
  const dirs = [
    { name: '配置目录', path: pathManager.getConfigDir() },
    { name: '模板目录', path: pathManager.getTemplatesDir() },
    { name: '缓存目录', path: pathManager.getCacheDir() },
    { name: '日志目录', path: pathManager.getLogsDir() }
  ]
  
  for (const dir of dirs) {
    const op = {
      name: dir.name,
      path: dir.path,
      existsBefore: fs.Exists(dir.path)
    }
    
    if (!op.existsBefore) {
      try {
        console.log(`尝试创建: ${dir.path}`)
        const mkdirResult = fs.Mkdir(dir.path)
        op.mkdirResult = mkdirResult
        op.existsAfter = fs.Exists(dir.path)
        op.success = op.existsAfter
      } catch (error) {
        op.error = error.message
        op.success = false
      }
    } else {
      op.success = true
      op.message = '目录已存在'
    }
    
    result.operations.push(op)
  }
  
  testResult.value = JSON.stringify(result, null, 2)
  
  const allSuccess = result.operations.every(op => op.success)
  if (allSuccess) {
    window.$message?.success('所有目录创建成功')
  } else {
    window.$message?.error('部分目录创建失败，请查看详情')
  }
  
  refreshInfo()
}

// 测试保存文件
const testSaveFile = () => {
  if (!pathManager.isWPSAvailable()) {
    window.$message?.error('WPS 环境不可用')
    return
  }
  
  try {
    const fs = window.Application.FileSystem
    const configDir = pathManager.getConfigDir()
    
    if (!configDir) {
      window.$message?.error('无法获取配置目录')
      return
    }
    
    // 确保目录存在
    pathManager.ensureDir(configDir)
    
    // 测试文件
    const testFilePath = configDir + '/test.txt'
    const testContent = `测试文件\n创建时间: ${new Date().toISOString()}`
    
    console.log('测试保存文件:', testFilePath)
    const writeResult = fs.WriteFile(testFilePath, testContent)
    
    const result = {
      timestamp: new Date().toISOString(),
      filePath: testFilePath,
      writeResult: writeResult,
      fileExists: fs.Exists(testFilePath)
    }
    
    if (result.fileExists) {
      const readContent = fs.ReadFile(testFilePath)
      result.readContent = readContent
      result.success = true
      window.$message?.success('文件保存成功')
      
      // 清理测试文件
      fs.Remove(testFilePath)
    } else {
      result.success = false
      window.$message?.error('文件保存失败')
    }
    
    testResult.value = JSON.stringify(result, null, 2)
  } catch (error) {
    console.error('测试保存文件失败:', error)
    window.$message?.error('测试失败: ' + error.message)
    testResult.value = JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2)
  }
}

onMounted(() => {
  refreshInfo()
})
</script>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
</style>

