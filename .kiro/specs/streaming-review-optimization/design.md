# Design Document: 流式合同审查优化

## Overview

本设计文档描述如何将合同审查流程从"非流式批量处理"优化为"流式增量处理"模式。核心目标是让用户在审查开始后能够立即看到批注逐个出现，而非等待全部审查完成。

### 设计目标

1. **即时反馈**：首个批注在审查开始后 10-20 秒内出现
2. **渐进式体验**：批注持续增加，用户可以边等待边查看
3. **质量不变**：审查结果的数量和质量与原有模式一致
4. **向后兼容**：现有接口和调用方式无需修改

### 当前架构 vs 目标架构

```
当前架构（非流式）：
┌─────────────────────────────────────────────────────────────────┐
│ 分段1 AI请求 ──等待──> 完整响应 ──> 解析 ──> 收集              │
│ 分段2 AI请求 ──等待──> 完整响应 ──> 解析 ──> 收集              │
│ ...                                                             │
│ 分段N AI请求 ──等待──> 完整响应 ──> 解析 ──> 收集              │
│                                                    ↓            │
│                                              统一批注           │
└─────────────────────────────────────────────────────────────────┘

目标架构（流式）：
┌─────────────────────────────────────────────────────────────────┐
│ 分段1 AI流式请求 ──> 数据块1 ──> 解析 ──> 立即批注             │
│                  ──> 数据块2 ──> 解析 ──> 立即批注             │
│                  ──> ...                                        │
│ 分段2 AI流式请求 ──> 数据块1 ──> 解析 ──> 立即批注 (并行)      │
│                  ──> ...                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture

### 系统组件图

```
┌──────────────────────────────────────────────────────────────────┐
│                        WorkflowPage.vue                          │
│                    (UI层 - 进度展示)                              │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ReviewContractAction                          │
│                    (工作流动作层)                                 │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   ContractReviewEngine                           │
│                   (审查引擎 - 核心协调)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  reviewBySegmentsStreaming()  ← 新增流式审查方法            │ │
│  │  - 并行处理多个分段                                         │ │
│  │  - 每个分段独立流式处理                                     │ │
│  │  - 实时触发批注回调                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌───────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│ ReviewAIService   │ │ JSONLParser     │ │ WPSDocumentService  │
│ (AI服务层)        │ │ (增量解析器)    │ │ (文档操作层)        │
│                   │ │ ← 新增组件      │ │                     │
│ reviewClause      │ │                 │ │ addComment()        │
│ Streaming() ←新增 │ │ - 缓冲管理      │ │                     │
│                   │ │ - 行解析        │ │                     │
│ - 流式请求        │ │ - 回调触发      │ │                     │
│ - JSONL格式       │ │                 │ │                     │
└───────────────────┘ └─────────────────┘ └─────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      siliconflow.js                              │
│                    (AI API 调用层)                               │
│  streamChatCompletions() - 已有，需增强回调机制                  │
└──────────────────────────────────────────────────────────────────┘
```

### 数据流图

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐
│ AI API  │───>│ SSE Stream  │───>│ JSONLParser │───>│ Callback │
│         │    │ (数据块)    │    │ (增量解析)  │    │ (批注)   │
└─────────┘    └─────────────┘    └─────────────┘    └──────────┘
                     │                   │                 │
                     ▼                   ▼                 ▼
              "{"type":"issue"    解析完整JSON行      applyComment()
               ,"keyword":"      ─────────────>      添加到文档
               甲方","comme"     触发onIssue回调
               nt":"建议..."}"
```

## Components and Interfaces

### 1. JSONLParser（新增组件）

增量 JSONL 解析器，负责从流式数据中提取完整的 JSON 对象。

```javascript
/**
 * JSONL 增量解析器
 * 从流式数据中提取完整的 JSON 行
 */
class JSONLParser {
  constructor(options = {}) {
    this.buffer = ''           // 数据缓冲区
    this.onLine = options.onLine || (() => {})  // 完整行回调
    this.onError = options.onError || console.warn  // 错误回调
  }

  /**
   * 接收数据块
   * @param {string} chunk - 数据块
   */
  feed(chunk) {
    this.buffer += chunk
    this._processBuffer()
  }

  /**
   * 处理缓冲区，提取完整行
   */
  _processBuffer() {
    const lines = this.buffer.split('\n')
    // 最后一个元素可能是不完整的行，保留在缓冲区
    this.buffer = lines.pop() || ''
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      try {
        const obj = JSON.parse(trimmed)
        this.onLine(obj)
      } catch (e) {
        this.onError(`JSON解析失败: ${trimmed.substring(0, 50)}...`)
      }
    }
  }

  /**
   * 结束解析，处理剩余数据
   */
  flush() {
    if (this.buffer.trim()) {
      try {
        const obj = JSON.parse(this.buffer.trim())
        this.onLine(obj)
      } catch (e) {
        this.onError(`最终缓冲区解析失败: ${this.buffer.substring(0, 50)}...`)
      }
    }
    this.buffer = ''
  }

  /**
   * 重置解析器
   */
  reset() {
    this.buffer = ''
  }
}
```

### 2. ReviewAIService 扩展

新增流式审查方法。

```javascript
/**
 * 流式审查条款
 * @param {Object} context - 审查上下文
 * @param {Object} contractType - 合同类型
 * @param {Object} options - 选项
 * @param {Function} options.onIssue - 发现问题时的回调
 * @param {Function} options.onRisk - 发现风险时的回调
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<Object>} 审查结果
 */
async reviewClauseStreaming(context, contractType, options = {}) {
  const config = this.getAIConfig()
  const messages = this.buildStreamingReviewMessages(context, contractType)
  
  const issues = []
  const risks = []
  
  const parser = new JSONLParser({
    onLine: (obj) => {
      if (obj.type === 'issue') {
        issues.push(obj)
        options.onIssue?.(obj)
      } else if (obj.type === 'risk') {
        risks.push(obj)
        options.onRisk?.(obj)
      }
    },
    onError: (msg) => {
      unifiedLogger.warn('JSONL解析警告', { message: msg })
    }
  })

  await streamChatCompletions({
    messages,
    model: config.model,
    onChunk: (chunk) => {
      parser.feed(chunk)
    },
    options: {
      temperature: config.temperature,
      maxTokens: config.maxTokens
    }
  })

  parser.flush()
  
  return { issues, risks }
}

/**
 * 构建流式审查消息（JSONL格式输出）
 */
buildStreamingReviewMessages(context, contractType) {
  // 修改角色提示词，要求JSONL格式输出
  const systemPrompt = `你是专业的法律文书AI助手，专注于合同审查。

【输出格式要求 - 极其重要】
你必须使用 JSONL 格式输出，每行一个独立的 JSON 对象。
不要输出数组，不要输出嵌套结构，每个问题/风险单独一行。

问题格式（每行一个）：
{"type":"issue","severity":"high|medium|low","position":"章节位置","searchKeyword":"原文片段","comment":"问题描述"}

风险格式（每行一个）：
{"type":"risk","severity":"high|medium|low","description":"风险描述","suggestion":"建议"}

示例输出：
{"type":"issue","severity":"high","position":"第一条","searchKeyword":"甲方有权单方解除","comment":"单方解除权条款对乙方不利，建议增加限制条件"}
{"type":"issue","severity":"medium","position":"第三条","searchKeyword":"付款方式","comment":"付款条款不够明确，建议细化付款时间节点"}
{"type":"risk","severity":"high","description":"违约责任不对等","suggestion":"建议增加甲方违约责任条款"}

【严格要求】
1. 每行必须是完整的、独立的 JSON 对象
2. 不要使用 markdown 代码块
3. 不要输出数组格式如 {"issues": [...]}
4. 发现一个问题就输出一行，不要等待
5. searchKeyword 必须是文档中真实存在的连续文本`

  const taskPrompt = `【审查任务】
合同类型：${contractType?.type || '未知'}
审查章节：${context.segmentPosition?.section || '全文'}

【待审查内容】
${context.currentSegment}

请逐个输出发现的问题和风险，每行一个JSON对象。`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: taskPrompt }
  ]
}
```

### 3. ContractReviewEngine 扩展

新增流式审查流程。

```javascript
/**
 * 流式分段审查
 */
async reviewBySegmentsStreaming(segments, fullText, contractType, options) {
  const checklist = this._prepareChecklist(contractType, options)
  
  const results = {
    issues: [],
    risks: [],
    segments: [],
    contractType,
    checklist
  }

  const reviewedItems = new Set()
  let completedSegments = 0
  const totalSegments = segments.length

  // 并行处理分段，但限制并发数
  const concurrency = 2  // 同时处理2个分段
  
  for (let i = 0; i < segments.length; i += concurrency) {
    const batch = segments.slice(i, i + concurrency)
    
    await Promise.all(batch.map(async (segment, batchIndex) => {
      const segmentIndex = i + batchIndex
      
      options.onProgress?.({
        stage: 'reviewing',
        segmentName: segment.section.title,
        current: segmentIndex,
        total: totalSegments
      })

      const segmentResult = await this.reviewSegmentStreaming(
        segment,
        fullText,
        contractType,
        reviewedItems,
        {
          ...options,
          checklist,
          // 关键：每发现一个问题就立即批注
          onIssue: async (issue) => {
            // 去重检查
            const key = this._generateIssueKey(issue)
            if (reviewedItems.has(key)) return
            reviewedItems.add(key)

            // 匹配审查清单
            const matchedIssue = this._matchIssueToChecklist(issue, checklist)
            results.issues.push(matchedIssue)

            // 立即应用批注
            if (options.autoApply) {
              await this.applyCommentImmediately(segment, matchedIssue)
            }

            // 通知上层
            options.onIssueFound?.({
              issue: matchedIssue,
              totalIssues: results.issues.length,
              segment: segment.section.title
            })
          },
          onRisk: (risk) => {
            results.risks.push(risk)
            options.onRiskFound?.({ risk, totalRisks: results.risks.length })
          }
        }
      )

      completedSegments++
      results.segments.push(segmentResult)

      options.onProgress?.({
        stage: 'segment_complete',
        segmentName: segment.section.title,
        current: completedSegments,
        total: totalSegments,
        percent: Math.round((completedSegments / totalSegments) * 100)
      })
    }))
  }

  // 生成总结
  results.summary = {
    totalIssues: results.issues.length,
    totalRisks: results.risks.length,
    segmentCount: segments.length
  }
  results.checklistSummary = this.buildChecklistStats(results.issues)

  return results
}

/**
 * 流式审查单个分段
 */
async reviewSegmentStreaming(segment, fullText, contractType, reviewedItems, options) {
  const context = {
    currentSegment: segment.content,
    fullDocument: fullText,
    segmentPosition: {
      section: segment.section.title,
      index: segment.section.number
    }
  }

  const result = await this.aiService.reviewClauseStreaming(
    context,
    contractType,
    {
      onIssue: options.onIssue,
      onRisk: options.onRisk,
      onProgress: options.onProgress
    }
  )

  return {
    issues: result.issues.length,
    risks: result.risks.length
  }
}

/**
 * 立即应用单个批注
 */
async applyCommentImmediately(segment, issue) {
  try {
    const range = this.locateIssue(segment, issue)
    if (range) {
      const positionKey = `${range.Start}_${range.End}`
      if (!this._appliedComments.has(positionKey)) {
        const success = this.wpsService.addComment(range, issue.comment)
        if (success) {
          this._appliedComments.set(positionKey, { issue, timestamp: Date.now() })
          unifiedLogger.info('实时批注已添加', { 
            keyword: issue.searchKeyword?.substring(0, 20) 
          })
        }
      }
    }
  } catch (error) {
    unifiedLogger.warn('实时批注失败', { error: error.message })
  }
}
```

### 4. 接口变更

#### review() 方法签名扩展

```javascript
/**
 * 审查流程（支持流式和非流式）
 * @param {Object} options
 * @param {boolean} options.stream - 是否使用流式模式，默认 true
 * @param {boolean} options.autoApply - 是否自动应用批注，默认 true
 * @param {Function} options.onIssueFound - 发现问题时的回调
 * @param {Function} options.onRiskFound - 发现风险时的回调
 * @param {Function} options.onProgress - 进度回调
 */
async review(options = {}) {
  const useStream = options.stream !== false  // 默认使用流式
  
  // ... 前置处理 ...
  
  if (useStream) {
    try {
      return await this.reviewBySegmentsStreaming(segments, fullText, contractType, options)
    } catch (error) {
      // 流式失败，降级到非流式
      unifiedLogger.warn('流式审查失败，降级到非流式', { error: error.message })
      return await this.reviewBySegments(segments, fullText, contractType, options)
    }
  } else {
    return await this.reviewBySegments(segments, fullText, contractType, options)
  }
}
```

## Data Models

### Issue 对象（流式格式）

```typescript
interface StreamingIssue {
  type: 'issue'              // 类型标识
  severity: 'high' | 'medium' | 'low'
  position: string           // 章节位置
  searchKeyword: string      // 定位关键词
  comment: string            // 问题描述
  checklistId?: string       // 审查清单项ID（后处理添加）
}
```

### Risk 对象（流式格式）

```typescript
interface StreamingRisk {
  type: 'risk'               // 类型标识
  severity: 'high' | 'medium' | 'low'
  description: string        // 风险描述
  suggestion: string         // 建议
}
```

### Progress 回调参数

```typescript
interface ProgressInfo {
  stage: 'reviewing' | 'segment_complete' | 'complete'
  segmentName?: string       // 当前分段名称
  current: number            // 当前进度
  total: number              // 总数
  percent?: number           // 百分比
}

interface IssueFoundInfo {
  issue: StreamingIssue      // 发现的问题
  totalIssues: number        // 累计问题数
  segment: string            // 所在分段
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 流式解析完整性

*For any* JSONL 数据流，无论如何切分成数据块，增量解析器解析出的完整 JSON 对象数量应等于原始数据中的有效 JSON 行数。

**Validates: Requirements 2.3, 2.4**

### Property 2: 回调触发一致性

*For any* 包含 N 个有效 JSON 行的数据流，增量解析器应触发恰好 N 次 onLine 回调。

**Validates: Requirements 1.2, 2.4**

### Property 3: 缓冲区正确性

*For any* 在任意位置切断的 JSON 行，增量解析器不应触发回调，且不应抛出异常，数据应保留在缓冲区中。

**Validates: Requirements 4.1**

### Property 4: 多行批量处理

*For any* 包含 N 个完整 JSON 行的单个数据块，增量解析器应在单次 feed() 调用中触发 N 次回调。

**Validates: Requirements 4.2**

### Property 5: 错误行跳过

*For any* 包含无效 JSON 行的数据流，增量解析器应跳过无效行，正确解析其他有效行，且不应抛出异常。

**Validates: Requirements 4.3**

### Property 6: 结束处理完整性

*For any* 数据流，调用 flush() 后缓冲区中的完整 JSON 应被解析，缓冲区应被清空。

**Validates: Requirements 4.4**

### Property 7: 问题计数一致性

*For any* 审查过程，每次触发 onIssueFound 回调时，totalIssues 计数应比上次增加 1。

**Validates: Requirements 3.2**

### Property 8: 进度百分比正确性

*For any* 包含 N 个分段的审查，完成 M 个分段后的进度百分比应等于 Math.round(M/N * 100)。

**Validates: Requirements 3.3**

### Property 9: 批注完整性

*For any* 通过流式审查发现的问题，其批注对象应包含非空的 comment 字段和非空的 searchKeyword 或 position 字段。

**Validates: Requirements 5.2**

### Property 10: 返回结构一致性

*For any* 流式审查的返回结果，应包含 issues 数组、risks 数组、summary 对象和 checklistSummary 对象。

**Validates: Requirements 6.4**

## Error Handling

### 1. 流式请求失败

```javascript
try {
  return await this.reviewBySegmentsStreaming(...)
} catch (error) {
  // 自动降级到非流式模式
  unifiedLogger.warn('流式审查失败，降级到非流式', { error: error.message })
  return await this.reviewBySegments(...)
}
```

### 2. 单个分段审查失败

```javascript
// 单个分段失败不影响其他分段
try {
  await this.reviewSegmentStreaming(segment, ...)
} catch (error) {
  unifiedLogger.error('分段审查失败', { segment: segment.section.title, error })
  results.segments.push({ error: error.message })
  // 继续处理其他分段
}
```

### 3. 批注应用失败

```javascript
// 批注失败不影响审查流程
try {
  await this.applyCommentImmediately(segment, issue)
} catch (error) {
  unifiedLogger.warn('批注应用失败', { error: error.message })
  // 记录失败的批注，最后统一重试
  this._failedComments.push({ segment, issue })
}
```

### 4. JSON 解析失败

```javascript
// 单行解析失败不影响其他行
parser.onError = (msg) => {
  unifiedLogger.warn('JSONL解析警告', { message: msg })
  // 跳过该行，继续处理
}
```

## Testing Strategy

### 单元测试

1. **JSONLParser 测试**
   - 测试单行解析
   - 测试多行批量解析
   - 测试不完整行缓冲
   - 测试错误行跳过
   - 测试 flush() 行为

2. **ReviewAIService 流式方法测试**
   - 测试消息构建（JSONL 格式提示词）
   - 测试回调触发机制

3. **ContractReviewEngine 流式方法测试**
   - 测试去重逻辑
   - 测试进度计算
   - 测试降级逻辑

### 属性测试

使用 fast-check 库进行属性测试：

1. **解析完整性属性测试**
   - 生成随机 JSONL 数据
   - 随机切分成数据块
   - 验证解析结果数量一致

2. **缓冲区正确性属性测试**
   - 生成随机 JSON 对象
   - 在随机位置切断
   - 验证不触发回调且不抛异常

3. **错误容忍属性测试**
   - 在有效 JSONL 中插入随机无效行
   - 验证有效行正确解析

### 集成测试

1. **端到端流式审查测试**
   - 使用真实 AI API
   - 验证批注实时出现
   - 验证最终结果完整

2. **降级测试**
   - 模拟流式 API 失败
   - 验证自动降级到非流式
