/**
 * 智能缓存管理器 - 避免重复AI调用
 * 基于内容哈希和分析类型进行智能缓存
 * 使用 WPS FileSystem API 持久化存储
 */

export class CacheManager {
  constructor(options = {}) {
    this.maxCacheSize = options.maxCacheSize || 1000 // 最大缓存条目数
    this.maxCacheAge = options.maxCacheAge || 24 * 60 * 60 * 1000 // 24小时过期
    this.storagePrefix = options.storagePrefix || 'contract_ai_cache_'
    
    // 缓存目录配置
    this.cacheDir = null
    this.cacheIndexFile = null
    this.initializeCacheDir()

    // 内存缓存
    this.memoryCache = new Map()

    // 初始化时清理过期缓存
    this.cleanupExpiredCache()
  }

  /**
   * 检查 WPS 环境
   */
  isWPSAvailable() {
    return typeof window !== 'undefined' && 
           typeof window.Application !== 'undefined' &&
           typeof window.Application.FileSystem !== 'undefined'
  }

  /**
   * 初始化缓存目录
   */
  initializeCacheDir() {
    if (!this.isWPSAvailable()) return

    try {
      const homePath = window.Application.Env.GetHomePath()
      if (!homePath) return

      const normalizedPath = homePath.replace(/\\/g, '/')
      const baseDir = normalizedPath.replace(/\/+$/, '') + '/wps_addon_config'
      this.cacheDir = baseDir + '/cache'
      this.cacheIndexFile = this.cacheDir + '/index.json'

      // 确保缓存目录存在
      this.ensureCacheDir()
    } catch (error) {
      console.warn('初始化缓存目录失败:', error)
    }
  }

  /**
   * 确保缓存目录存在
   */
  ensureCacheDir() {
    if (!this.isWPSAvailable() || !this.cacheDir) return false

    try {
      const fs = window.Application.FileSystem
      
      // 确保基础配置目录存在
      const baseDir = this.cacheDir.substring(0, this.cacheDir.lastIndexOf('/'))
      if (!fs.Exists(baseDir)) {
        fs.Mkdir(baseDir)
      }

      // 确保缓存目录存在
      if (!fs.Exists(this.cacheDir)) {
        fs.Mkdir(this.cacheDir)
      }

      return true
    } catch (error) {
      console.warn('创建缓存目录失败:', error)
      return false
    }
  }

  /**
   * 获取缓存文件路径
   */
  getCacheFilePath(cacheKey) {
    if (!this.cacheDir) return null
    // 使用安全的文件名（替换特殊字符）
    const safeKey = cacheKey.replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${this.cacheDir}/${safeKey}.json`
  }

  /**
   * 从 WPS FileSystem 读取缓存
   */
  readCacheFromFS(cacheFilePath) {
    if (!this.isWPSAvailable() || !cacheFilePath) return null

    try {
      const fs = window.Application.FileSystem
      if (!fs.Exists(cacheFilePath)) return null

      const content = fs.ReadFile(cacheFilePath)
      if (!content || content.trim() === '') return null

      return JSON.parse(content)
    } catch (error) {
      console.warn('读取缓存文件失败:', error)
      return null
    }
  }

  /**
   * 写入缓存到 WPS FileSystem
   */
  writeCacheToFS(cacheFilePath, cacheData) {
    if (!this.isWPSAvailable() || !cacheFilePath) return false

    try {
      const fs = window.Application.FileSystem
      const jsonString = JSON.stringify(cacheData, null, 2)
      const writeResult = fs.WriteFile(cacheFilePath, jsonString)
      return writeResult && fs.Exists(cacheFilePath)
    } catch (error) {
      console.warn('写入缓存文件失败:', error)
      return false
    }
  }

  /**
   * 删除缓存文件
   */
  deleteCacheFile(cacheFilePath) {
    if (!this.isWPSAvailable() || !cacheFilePath) return false

    try {
      const fs = window.Application.FileSystem
      if (fs.Exists(cacheFilePath)) {
        fs.Remove(cacheFilePath)
        return true
      }
      return false
    } catch (error) {
      console.warn('删除缓存文件失败:', error)
      return false
    }
  }

  /**
   * 生成缓存键
   * @param {string} contentHash - 内容哈希
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 额外选项
   * @returns {string} 缓存键
   */
  generateCacheKey(contentHash, analysisType, options = {}) {
    const optionsHash = this.hashObject(options)
    return `${contentHash}_${analysisType}_${optionsHash}`
  }

  /**
   * 对象哈希化
   * @param {Object} obj - 要哈希的对象
   * @returns {string} 哈希值
   */
  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 获取缓存
   * @param {string} contentHash - 内容哈希
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 额外选项
   * @returns {Object|null} 缓存的结果
   */
  get(contentHash, analysisType, options = {}) {
    const cacheKey = this.generateCacheKey(contentHash, analysisType, options)

    // 先检查内存缓存
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)
      if (this.isValidCache(cached)) {
        console.log(`缓存命中: ${analysisType} (内存)`)
        return cached.result
      } else {
        this.memoryCache.delete(cacheKey)
      }
    }

    // 检查 WPS FileSystem 缓存
    try {
      const cacheFilePath = this.getCacheFilePath(cacheKey)
      const cached = this.readCacheFromFS(cacheFilePath)

      if (cached && this.isValidCache(cached)) {
        // 将有效缓存加载到内存
        this.memoryCache.set(cacheKey, cached)
        console.log(`缓存命中: ${analysisType} (文件系统)`)
        return cached.result
      } else if (cached) {
        // 删除过期缓存
        this.deleteCacheFile(cacheFilePath)
      }
    } catch (error) {
      console.warn('读取文件系统缓存失败:', error)
    }

    console.log(`缓存未命中: ${analysisType}`)
    return null
  }

  /**
   * 设置缓存
   * @param {string} contentHash - 内容哈希
   * @param {string} analysisType - 分析类型
   * @param {any} result - 分析结果
   * @param {Object} options - 额外选项
   */
  set(contentHash, analysisType, result, options = {}) {
    const cacheKey = this.generateCacheKey(contentHash, analysisType, options)
    const cacheData = {
      result,
      timestamp: Date.now(),
      analysisType,
      contentHash,
      options
    }

    // 保存到内存缓存
    this.memoryCache.set(cacheKey, cacheData)

    // 保存到 WPS FileSystem
    try {
      const cacheFilePath = this.getCacheFilePath(cacheKey)
      this.writeCacheToFS(cacheFilePath, cacheData)
      console.log(`缓存已保存: ${analysisType}`)
    } catch (error) {
      console.warn('保存文件系统缓存失败:', error)
    }

    // 检查缓存大小限制
    this.enforceMemoryCacheLimit()
  }

  /**
   * 检查缓存是否有效
   * @param {Object} cached - 缓存对象
   * @returns {boolean} 是否有效
   */
  isValidCache(cached) {
    if (!cached || !cached.timestamp) {
      return false
    }

    const age = Date.now() - cached.timestamp
    return age < this.maxCacheAge
  }

  /**
   * 强制执行内存缓存大小限制
   */
  enforceMemoryCacheLimit() {
    if (this.memoryCache.size <= this.maxCacheSize) {
      return
    }

    // 按时间戳排序，删除最旧的缓存
    const entries = Array.from(this.memoryCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toDelete = entries.slice(0, entries.length - this.maxCacheSize)
    toDelete.forEach(([key]) => {
      this.memoryCache.delete(key)
    })

    console.log(`内存缓存清理: 删除了 ${toDelete.length} 个过期条目`)
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache() {
    if (!this.isWPSAvailable() || !this.cacheDir) return

    try {
      const fs = window.Application.FileSystem
      if (!fs.Exists(this.cacheDir)) return

      const filesToDelete = []

      // 遍历缓存目录中的所有文件
      try {
        const files = fs.GetFileList(this.cacheDir)
        if (files && files.length > 0) {
          files.forEach((file) => {
            if (file.endsWith('.json')) {
              const filePath = `${this.cacheDir}/${file}`
              try {
                const content = fs.ReadFile(filePath)
                if (content) {
                  const cachedData = JSON.parse(content)
                  if (!this.isValidCache(cachedData)) {
                    filesToDelete.push(filePath)
                  }
                }
              } catch (error) {
                // 无效的缓存数据，标记删除
                filesToDelete.push(filePath)
              }
            }
          })
        }
      } catch (error) {
        // GetFileList 可能不支持，使用备用方法
        console.warn('无法列出缓存文件:', error)
        return
      }

      // 删除过期缓存
      filesToDelete.forEach((filePath) => {
        try {
          fs.Remove(filePath)
        } catch (error) {
          console.warn(`删除缓存文件失败: ${filePath}`, error)
        }
      })

      if (filesToDelete.length > 0) {
        console.log(`清理了 ${filesToDelete.length} 个过期缓存条目`)
      }
    } catch (error) {
      console.warn('清理过期缓存失败:', error)
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    // 清空内存缓存
    this.memoryCache.clear()

    // 清空文件系统缓存
    if (!this.isWPSAvailable() || !this.cacheDir) return

    try {
      const fs = window.Application.FileSystem
      if (!fs.Exists(this.cacheDir)) return

      let deletedCount = 0

      try {
        const files = fs.GetFileList(this.cacheDir)
        if (files && files.length > 0) {
          files.forEach((file) => {
            if (file.endsWith('.json')) {
              const filePath = `${this.cacheDir}/${file}`
              try {
                fs.Remove(filePath)
                deletedCount++
              } catch (error) {
                console.warn(`删除缓存文件失败: ${filePath}`, error)
              }
            }
          })
        }
      } catch (error) {
        console.warn('无法列出缓存文件:', error)
      }

      console.log(`清空了所有缓存 (${deletedCount} 个条目)`)
    } catch (error) {
      console.warn('清空文件系统缓存失败:', error)
    }
  }
}

export default CacheManager
