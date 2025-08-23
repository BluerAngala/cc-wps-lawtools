/**
 * 智能缓存管理器 - 避免重复AI调用
 * 基于内容哈希和分析类型进行智能缓存
 */

export class CacheManager {
  constructor(options = {}) {
    this.maxCacheSize = options.maxCacheSize || 1000 // 最大缓存条目数
    this.maxCacheAge = options.maxCacheAge || 24 * 60 * 60 * 1000 // 24小时过期
    this.storagePrefix = options.storagePrefix || 'contract_ai_cache_'
    
    // 内存缓存
    this.memoryCache = new Map()
    
    // 缓存统计
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0,
      evictions: 0
    }
    
    // 初始化时清理过期缓存
    this.cleanupExpiredCache()
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
      hash = ((hash << 5) - hash) + char
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
        this.stats.hits++
        console.log(`缓存命中: ${analysisType} (内存)`)
        return cached.result
      } else {
        this.memoryCache.delete(cacheKey)
      }
    }
    
    // 检查本地存储缓存
    try {
      const storageKey = this.storagePrefix + cacheKey
      const cachedData = localStorage.getItem(storageKey)
      
      if (cachedData) {
        const cached = JSON.parse(cachedData)
        if (this.isValidCache(cached)) {
          // 将有效缓存加载到内存
          this.memoryCache.set(cacheKey, cached)
          this.stats.hits++
          console.log(`缓存命中: ${analysisType} (本地存储)`)
          return cached.result
        } else {
          // 删除过期缓存
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.warn('读取本地缓存失败:', error)
    }
    
    this.stats.misses++
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
    
    // 保存到本地存储
    try {
      const storageKey = this.storagePrefix + cacheKey
      localStorage.setItem(storageKey, JSON.stringify(cacheData))
      this.stats.saves++
      console.log(`缓存已保存: ${analysisType}`)
    } catch (error) {
      console.warn('保存本地缓存失败:', error)
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
      this.stats.evictions++
    })
    
    console.log(`内存缓存清理: 删除了 ${toDelete.length} 个过期条目`)
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache() {
    try {
      const keysToDelete = []
      
      // 检查本地存储中的所有缓存键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.storagePrefix)) {
          try {
            const cachedData = JSON.parse(localStorage.getItem(key))
            if (!this.isValidCache(cachedData)) {
              keysToDelete.push(key)
            }
          } catch (error) {
            // 无效的缓存数据，标记删除
            keysToDelete.push(key)
          }
        }
      }
      
      // 删除过期缓存
      keysToDelete.forEach(key => {
        localStorage.removeItem(key)
      })
      
      if (keysToDelete.length > 0) {
        console.log(`清理了 ${keysToDelete.length} 个过期缓存条目`)
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
    
    // 清空本地存储缓存
    try {
      const keysToDelete = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.storagePrefix)) {
          keysToDelete.push(key)
        }
      }
      
      keysToDelete.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log(`清空了所有缓存 (${keysToDelete.length} 个条目)`)
    } catch (error) {
      console.warn('清空本地缓存失败:', error)
    }
    
    // 重置统计
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0,
      evictions: 0
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      localStorageCacheSize: this.getLocalStorageCacheSize()
    }
  }

  /**
   * 获取本地存储缓存大小
   * @returns {number} 缓存条目数
   */
  getLocalStorageCacheSize() {
    let count = 0
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.storagePrefix)) {
          count++
        }
      }
    } catch (error) {
      console.warn('获取本地存储缓存大小失败:', error)
    }
    return count
  }

  /**
   * 预热缓存 - 为常用分析类型预加载缓存
   * @param {Array} commonAnalysisTypes - 常用分析类型列表
   */
  warmupCache(commonAnalysisTypes = []) {
    console.log('开始缓存预热...')
    
    commonAnalysisTypes.forEach(analysisType => {
      // 这里可以预加载一些常用的分析结果
      console.log(`预热缓存: ${analysisType}`)
    })
  }

  /**
   * 缓存性能监控
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      const stats = this.getStats()
      console.log('缓存性能统计:', stats)
      
      // 如果命中率过低，可以触发缓存优化
      if (parseFloat(stats.hitRate) < 30 && stats.hits + stats.misses > 10) {
        console.warn('缓存命中率较低，建议检查缓存策略')
      }
    }, 5 * 60 * 1000) // 每5分钟检查一次
  }

  /**
   * 导出缓存数据（用于备份）
   * @returns {Object} 缓存数据
   */
  exportCache() {
    const cacheData = {
      memory: Array.from(this.memoryCache.entries()),
      localStorage: {},
      stats: this.stats,
      exportTime: new Date().toISOString()
    }
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.storagePrefix)) {
          cacheData.localStorage[key] = localStorage.getItem(key)
        }
      }
    } catch (error) {
      console.warn('导出本地存储缓存失败:', error)
    }
    
    return cacheData
  }

  /**
   * 导入缓存数据（用于恢复）
   * @param {Object} cacheData - 缓存数据
   */
  importCache(cacheData) {
    if (!cacheData) return
    
    try {
      // 导入内存缓存
      if (cacheData.memory) {
        this.memoryCache.clear()
        cacheData.memory.forEach(([key, value]) => {
          if (this.isValidCache(value)) {
            this.memoryCache.set(key, value)
          }
        })
      }
      
      // 导入本地存储缓存
      if (cacheData.localStorage) {
        Object.entries(cacheData.localStorage).forEach(([key, value]) => {
          try {
            const parsed = JSON.parse(value)
            if (this.isValidCache(parsed)) {
              localStorage.setItem(key, value)
            }
          } catch (error) {
            console.warn(`导入缓存项失败: ${key}`, error)
          }
        })
      }
      
      console.log('缓存数据导入完成')
    } catch (error) {
      console.error('导入缓存数据失败:', error)
    }
  }
}

export default CacheManager