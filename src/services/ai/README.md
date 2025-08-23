# AI辅助合同审查框架

## 概述

这是一个为WPS插件设计的智能合同审查框架，采用"分层处理 + 智能缓存 + 增量分析"的核心理念，提供高效、智能的文档处理能力。

## 核心特性

### 🚀 智能分层架构
- **文档解析层**: 按逻辑结构智能分块
- **缓存管理层**: 避免重复AI调用
- **任务调度层**: 并行处理和优先级管理
- **AI服务层**: 统一AI接口和智能分块

### 📊 增量分析
- 智能检测文档变更
- 只处理修改部分
- 大幅提升处理效率

### ⚡ 性能优化
- 自动性能监控
- 智能配置调优
- 多种性能配置预设

## 架构组件

### 1. DocumentParser (文档解析器)
```javascript
import { DocumentParser } from './DocumentParser.js'

const parser = new DocumentParser()
const result = parser.parseDocument(documentContent)
```

**功能**:
- 智能章节分割
- 当事人信息提取
- 关键条款识别
- 文档结构分析

### 2. CacheManager (缓存管理器)
```javascript
import { CacheManager } from './CacheManager.js'

const cache = new CacheManager({
  maxSize: 200,
  defaultTTL: 3600000
})
```

**功能**:
- 基于内容哈希的智能缓存
- 内存 + 本地存储双重缓存
- 自动清理过期缓存
- 缓存统计和监控

### 3. AIServiceManager (AI服务管理器)
```javascript
import { AIServiceManager } from './AIServiceManager.js'

const aiService = new AIServiceManager({
  maxConcurrentRequests: 3,
  retryAttempts: 2,
  timeout: 15000
})
```

**功能**:
- 统一AI调用接口
- 智能分块处理
- 重试机制和错误处理
- 结果智能合并

### 4. TaskScheduler (任务调度器)
```javascript
import { TaskScheduler } from './TaskScheduler.js'

const scheduler = new TaskScheduler({
  maxConcurrentTasks: 3,
  taskTimeout: 30000
})
```

**功能**:
- 智能任务分发
- 优先级队列管理
- 并行处理控制
- 任务状态监控

### 5. IncrementalAnalyzer (增量分析器)
```javascript
import { IncrementalAnalyzer } from './IncrementalAnalyzer.js'

const analyzer = new IncrementalAnalyzer({
  changeThreshold: 0.25,
  cacheExpiry: 7200000
})
```

**功能**:
- 智能变更检测
- 增量内容分析
- 结果智能合并
- 性能统计

## 使用方法

### 基础使用
```javascript
import { TaskScheduler } from './TaskScheduler.js'
import { getOptimalConfig } from './config/performance-config.js'

// 获取最佳配置
const config = getOptimalConfig('production', 'normal')

// 初始化调度器
const scheduler = new TaskScheduler(config)

// 添加任务
const taskId = scheduler.addTask({
  type: 'contractReview',
  content: documentContent,
  priority: 'high',
  options: {
    enableIncremental: true,
    documentId: 'contract-001'
  }
})

// 监听任务完成
scheduler.on('taskComplete', (taskId, result) => {
  console.log('任务完成:', result)
})
```

### 高级配置
```javascript
// 自定义配置
const customConfig = getOptimalConfig('production', 'high', {
  taskScheduler: {
    maxConcurrentTasks: 5
  },
  cache: {
    maxSize: 500
  }
})

const scheduler = new TaskScheduler(customConfig)
```

## 性能配置

### 预设配置

1. **BASE_CONFIG**: 基础配置，适用于大多数场景
2. **HIGH_PERFORMANCE_CONFIG**: 高性能配置，适用于性能要求高的场景
3. **LOW_RESOURCE_CONFIG**: 低资源配置，适用于资源受限的环境
4. **DEVELOPMENT_CONFIG**: 开发环境配置，包含调试信息

### 自动性能优化
```javascript
import { getPerformanceRecommendations, autoTuneConfig } from './config/performance-config.js'

// 获取性能建议
const recommendations = getPerformanceRecommendations(currentStats)

// 自动调优配置
const optimizedConfig = autoTuneConfig(currentConfig, stats)
```

## 支持的任务类型

| 任务类型 | 描述 | 示例用途 |
|---------|------|----------|
| `extractText` | AI文本抽取 | 提取关键信息 |
| `contractReview` | AI合同预审 | 风险点识别 |
| `analyzeStructure` | 文档结构分析 | 章节分析 |
| `keywordComment` | 关键词批注 | 添加说明 |
| `parseDocument` | 文档解析 | 结构化处理 |
| `detectChanges` | 变更检测 | 增量分析 |

## 性能监控

### 监控指标
- 任务执行时间
- 缓存命中率
- 错误率
- 吞吐量
- 队列长度

### 性能阈值
```javascript
const thresholds = {
  maxTaskExecutionTime: 30000, // 30秒
  minCacheHitRate: 0.6, // 60%
  maxErrorRate: 0.05, // 5%
  minThroughput: 10 // 每分钟10个任务
}
```

## 最佳实践

### 1. 合理配置并发数
```javascript
// 根据系统资源调整
const config = {
  taskScheduler: {
    maxConcurrentTasks: navigator.hardwareConcurrency || 2
  }
}
```

### 2. 启用增量分析
```javascript
// 对于频繁修改的文档
const task = {
  type: 'contractReview',
  content: documentContent,
  options: {
    enableIncremental: true,
    documentId: 'unique-doc-id'
  }
}
```

### 3. 合理设置缓存
```javascript
// 根据内存情况调整缓存大小
const cacheConfig = {
  maxSize: Math.min(500, Math.floor(navigator.deviceMemory * 50))
}
```

### 4. 监控性能指标
```javascript
// 定期检查性能
setInterval(() => {
  const stats = scheduler.getStats()
  const recommendations = getPerformanceRecommendations(stats)
  
  if (recommendations.length > 0) {
    console.log('性能建议:', recommendations)
  }
}, 60000) // 每分钟检查一次
```

## 错误处理

### 常见错误类型
1. **网络错误**: AI服务连接失败
2. **超时错误**: 任务执行超时
3. **解析错误**: 文档格式不支持
4. **缓存错误**: 缓存操作失败

### 错误处理策略
```javascript
scheduler.on('taskError', (taskId, error) => {
  console.error('任务失败:', taskId, error)
  
  // 根据错误类型进行处理
  switch (error.type) {
    case 'NETWORK_ERROR':
      // 重试或降级处理
      break
    case 'TIMEOUT_ERROR':
      // 调整超时设置
      break
    case 'PARSE_ERROR':
      // 使用备用解析方法
      break
  }
})
```

## 测试

### 运行框架测试
```javascript
import { FrameworkTester } from './test/framework-test.js'

const tester = new FrameworkTester()
tester.runAllTests().then(results => {
  console.log('测试结果:', results)
})
```

### 测试覆盖
- 文档解析功能
- 缓存管理功能
- AI服务调用
- 任务调度逻辑
- 增量分析算法
- 组件集成测试

## 版本历史

### v1.0.0
- 初始版本发布
- 基础框架架构
- 核心组件实现

### v1.1.0
- 增加增量分析功能
- 性能优化配置
- 自动性能监控

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。