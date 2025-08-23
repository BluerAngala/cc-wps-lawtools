/**
 * AI框架性能优化配置
 * 提供针对不同场景的最佳配置参数
 */

// 基础性能配置
export const BASE_CONFIG = {
  // 任务调度器配置
  taskScheduler: {
    maxConcurrentTasks: 3,
    taskTimeout: 30000,
    retryAttempts: 2,
    retryDelay: 1000
  },
  
  // AI服务配置
  aiService: {
    maxConcurrentRequests: 2,
    retryAttempts: 3,
    timeout: 15000,
    chunkSize: 2000,
    overlapSize: 200
  },
  
  // 缓存配置
  cache: {
    maxSize: 200,
    defaultTTL: 3600000, // 1小时
    cleanupInterval: 300000, // 5分钟
    enableLocalStorage: true
  },
  
  // 增量分析配置
  incremental: {
    changeThreshold: 0.25,
    cacheExpiry: 7200000, // 2小时
    enableSmartMerge: true
  }
}

// 高性能配置（适用于性能要求高的场景）
export const HIGH_PERFORMANCE_CONFIG = {
  taskScheduler: {
    maxConcurrentTasks: 5,
    taskTimeout: 20000,
    retryAttempts: 1,
    retryDelay: 500
  },
  
  aiService: {
    maxConcurrentRequests: 4,
    retryAttempts: 2,
    timeout: 10000,
    chunkSize: 1500,
    overlapSize: 150
  },
  
  cache: {
    maxSize: 500,
    defaultTTL: 1800000, // 30分钟
    cleanupInterval: 180000, // 3分钟
    enableLocalStorage: true
  },
  
  incremental: {
    changeThreshold: 0.2,
    cacheExpiry: 3600000, // 1小时
    enableSmartMerge: true
  }
}

// 低资源配置（适用于资源受限的环境）
export const LOW_RESOURCE_CONFIG = {
  taskScheduler: {
    maxConcurrentTasks: 1,
    taskTimeout: 60000,
    retryAttempts: 3,
    retryDelay: 2000
  },
  
  aiService: {
    maxConcurrentRequests: 1,
    retryAttempts: 2,
    timeout: 30000,
    chunkSize: 3000,
    overlapSize: 300
  },
  
  cache: {
    maxSize: 50,
    defaultTTL: 7200000, // 2小时
    cleanupInterval: 600000, // 10分钟
    enableLocalStorage: false
  },
  
  incremental: {
    changeThreshold: 0.4,
    cacheExpiry: 14400000, // 4小时
    enableSmartMerge: false
  }
}

// 开发环境配置
export const DEVELOPMENT_CONFIG = {
  taskScheduler: {
    maxConcurrentTasks: 2,
    taskTimeout: 45000,
    retryAttempts: 1,
    retryDelay: 1000,
    enableDebugLogs: true
  },
  
  aiService: {
    maxConcurrentRequests: 1,
    retryAttempts: 1,
    timeout: 20000,
    chunkSize: 2500,
    overlapSize: 250,
    enableDebugLogs: true
  },
  
  cache: {
    maxSize: 100,
    defaultTTL: 1800000, // 30分钟
    cleanupInterval: 300000, // 5分钟
    enableLocalStorage: true,
    enableDebugLogs: true
  },
  
  incremental: {
    changeThreshold: 0.3,
    cacheExpiry: 3600000, // 1小时
    enableSmartMerge: true,
    enableDebugLogs: true
  }
}

/**
 * 根据环境和需求获取最佳配置
 * @param {string} environment - 环境类型 ('development', 'production', 'testing')
 * @param {string} performance - 性能要求 ('high', 'normal', 'low')
 * @param {Object} customConfig - 自定义配置覆盖
 * @returns {Object} 最终配置
 */
export function getOptimalConfig(environment = 'production', performance = 'normal', customConfig = {}) {
  let baseConfig
  
  // 根据环境选择基础配置
  if (environment === 'development') {
    baseConfig = DEVELOPMENT_CONFIG
  } else {
    // 根据性能要求选择配置
    switch (performance) {
      case 'high':
        baseConfig = HIGH_PERFORMANCE_CONFIG
        break
      case 'low':
        baseConfig = LOW_RESOURCE_CONFIG
        break
      default:
        baseConfig = BASE_CONFIG
    }
  }
  
  // 深度合并自定义配置
  return deepMerge(baseConfig, customConfig)
}

/**
 * 深度合并配置对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

/**
 * 性能监控配置
 */
export const PERFORMANCE_MONITORING = {
  // 启用性能监控
  enabled: true,
  
  // 监控指标
  metrics: {
    taskExecutionTime: true,
    cacheHitRate: true,
    memoryUsage: true,
    errorRate: true,
    throughput: true
  },
  
  // 性能阈值
  thresholds: {
    maxTaskExecutionTime: 30000, // 30秒
    minCacheHitRate: 0.6, // 60%
    maxErrorRate: 0.05, // 5%
    minThroughput: 10 // 每分钟10个任务
  },
  
  // 报告配置
  reporting: {
    interval: 300000, // 5分钟
    enableConsoleLog: true,
    enableLocalStorage: true
  }
}

/**
 * 获取性能建议
 * @param {Object} currentStats - 当前统计信息
 * @returns {Array} 性能建议列表
 */
export function getPerformanceRecommendations(currentStats) {
  const recommendations = []
  
  // 检查缓存命中率
  if (currentStats.cacheHitRate < PERFORMANCE_MONITORING.thresholds.minCacheHitRate) {
    recommendations.push({
      type: 'cache',
      priority: 'high',
      message: '缓存命中率较低，建议增加缓存大小或调整TTL设置',
      suggestion: '将cache.maxSize增加到当前值的1.5倍'
    })
  }
  
  // 检查任务执行时间
  if (currentStats.averageProcessingTime > PERFORMANCE_MONITORING.thresholds.maxTaskExecutionTime) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: '任务执行时间过长，建议优化AI请求或增加并发数',
      suggestion: '增加maxConcurrentTasks或减少chunkSize'
    })
  }
  
  // 检查错误率
  if (currentStats.errorRate > PERFORMANCE_MONITORING.thresholds.maxErrorRate) {
    recommendations.push({
      type: 'reliability',
      priority: 'medium',
      message: '错误率较高，建议增加重试次数或调整超时设置',
      suggestion: '增加retryAttempts或调整timeout设置'
    })
  }
  
  // 检查队列长度
  if (currentStats.queueLength > 10) {
    recommendations.push({
      type: 'throughput',
      priority: 'medium',
      message: '任务队列积压，建议增加并发处理能力',
      suggestion: '增加maxConcurrentTasks或maxConcurrentRequests'
    })
  }
  
  return recommendations
}

/**
 * 自动调优配置
 * @param {Object} currentConfig - 当前配置
 * @param {Object} stats - 性能统计
 * @returns {Object} 优化后的配置
 */
export function autoTuneConfig(currentConfig, stats) {
  const optimizedConfig = { ...currentConfig }
  
  // 根据缓存命中率调整缓存大小
  if (stats.cacheHitRate < 0.5 && optimizedConfig.cache.maxSize < 1000) {
    optimizedConfig.cache.maxSize = Math.min(optimizedConfig.cache.maxSize * 1.5, 1000)
  }
  
  // 根据队列长度调整并发数
  if (stats.queueLength > 5 && optimizedConfig.taskScheduler.maxConcurrentTasks < 10) {
    optimizedConfig.taskScheduler.maxConcurrentTasks += 1
  }
  
  // 根据错误率调整重试设置
  if (stats.errorRate > 0.1 && optimizedConfig.aiService.retryAttempts < 5) {
    optimizedConfig.aiService.retryAttempts += 1
    optimizedConfig.aiService.retryDelay *= 1.2
  }
  
  return optimizedConfig
}