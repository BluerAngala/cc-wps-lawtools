# Design Document

## Overview

本设计文档描述合同审查页面（ContractServices.vue）的重构方案。核心目标是将现有的"智能文档处理"折叠面板拆分为三个独立面板，并复用风险扫描和工作流引擎来统一代码架构。

### 重构前后对比

**重构前：**
```
ContractServices.vue
├── AI提取合同信息
├── 智能文档处理 (SmartCommenter.vue)
│   ├── [按钮切换] 关键词
│   ├── [按钮切换] AI预审
│   └── [按钮切换] AI+律师
└── 执行工作流
```

**重构后：**
```
ContractServices.vue
├── AI提取合同信息
├── 关键词修订批注 (KeywordCommenter.vue)
├── AI全流程审查 (AIFullReview.vue)
├── AI+律师共同审查 (AILawyerReview.vue)
└── 执行工作流
```

## Architecture

### 组件架构

```
┌─────────────────────────────────────────────────────────────┐
│                    ContractServices.vue                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ n-collapse (accordion)                                  ││
│  │  ├── AI提取合同信息                                      ││
│  │  ├── 关键词修订批注 → KeywordCommenter.vue              ││
│  │  ├── AI全流程审查 → AIFullReview.vue                    ││
│  │  ├── AI+律师共同审查 → AILawyerReview.vue               ││
│  │  └── 执行工作流                                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 数据流架构

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  AIFullReview    │     │  AILawyerReview  │     │ KeywordCommenter │
│                  │     │                  │     │                  │
│  - AI生成清单    │     │  - AI清单+律师清单│     │  - 关键词列表    │
│  - AI生成建议    │     │  - AI建议+律师意见│     │  - 固定批注      │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    useWorkflowExecution (composable)                 │
│  - executePreset()  - getResultData()  - onProgress()               │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    workflowEngine.js                                 │
│  - validate()  - execute()  - context management                    │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    WPS Document Service                              │
│  - addComment()  - addRevision()  - getFullText()                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. KeywordCommenter.vue（关键词修订批注）

复用现有 SmartCommenter 的关键词模式逻辑，独立为单独组件。

```typescript
interface KeywordCommenterProps {
  processing: boolean
  keywordConfig: {
    keywordList: KeywordItem[]
  }
}

interface KeywordItem {
  keyword: string      // 关键词
  comment: string      // 批注内容
  actionType: 'comment' | 'revision'  // 操作类型
}

interface KeywordCommenterEmits {
  execute: (config: { mode: 'keyword', keywordList: KeywordItem[] }) => void
  updateConfig: (config: object) => void
}
```

### 2. AIFullReview.vue（AI全流程审查）

复用风险扫描的交互模式，新增修改建议和二次确认功能。

```typescript
interface AIFullReviewProps {
  processing: boolean
}

// 页面状态机
type PageState = 'idle' | 'generating' | 'ready' | 'reviewing' | 'complete'

// 修改建议
interface Suggestion {
  id: string
  issueId: string           // 关联的问题ID
  position: string          // 文档位置
  keyword: string           // 相关条款
  actionType: 'comment' | 'revision'  // AI决定的操作类型
  content: string           // 批注或修订内容
  severity: 'high' | 'medium' | 'low'
  selected: boolean         // 用户是否选中
  source: 'ai'              // 来源标识
}
```

### 3. AILawyerReview.vue（AI+律师共同审查）

在 AIFullReview 基础上，增加律师自定义规则和意见。

```typescript
interface AILawyerReviewProps {
  processing: boolean
  reviewConfig: {
    contractReviewRules: LawyerRule[]
  }
}

interface LawyerRule {
  reviewRules: string       // 审查要点
  reviewRequirements: string // 审查要求
  actionType: 'comment' | 'revision'
  suggestionContent: string  // 律师预设的修改意见
}

// 修改建议（扩展）
interface Suggestion {
  // ... 继承 AIFullReview 的字段
  source: 'ai' | 'lawyer'   // 来源标识
}
```

### 4. 共享组件

#### SuggestionList.vue（修改建议列表）

```typescript
interface SuggestionListProps {
  suggestions: Suggestion[]
  showSource: boolean       // 是否显示来源标识
}

interface SuggestionListEmits {
  toggleSelect: (id: string, selected: boolean) => void
  selectAll: () => void
  deselectAll: () => void
}
```

#### ConfirmDialog.vue（二次确认弹窗）

```typescript
interface ConfirmDialogProps {
  show: boolean
  suggestions: Suggestion[]  // 选中的建议
}

interface ConfirmDialogEmits {
  confirm: () => void
  cancel: () => void
}

// 统计信息
interface OperationStats {
  commentCount: number
  revisionCount: number
  totalCount: number
}
```

## Data Models

### 审查清单项

```typescript
interface ChecklistItem {
  id: string
  name: string
  selected: boolean
  required: boolean
  perspectiveFocus: boolean
  reviewRequirements: string
  reviewBasis: string
  riskLevel: 'high' | 'medium' | 'low'
  source: 'ai' | 'lawyer'   // 来源（仅AI+律师模式）
}
```

### 审查结果

```typescript
interface ReviewResult {
  issues: Issue[]
  risks: Risk[]
  suggestions: Suggestion[]  // 新增：修改建议
  summary: {
    totalIssues: number
    totalRisks: number
    totalSuggestions: number
  }
}

interface Issue {
  id: string
  checklistId: string
  severity: 'high' | 'medium' | 'low'
  position: string
  keyword: string
  comment: string
}
```

### 方案配置

```typescript
interface Scheme {
  id: string
  name: string
  rules: LawyerRule[]
  createdAt: string
  updatedAt: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 方案切换数据一致性
*For any* 方案切换操作，切换后加载的配置数据应与该方案保存的数据完全一致
**Validates: Requirements 2.3, 4.5**

### Property 2: 修改建议数据完整性
*For any* AI 生成的修改建议，每个建议应包含必要字段：id、issueId、position、actionType、content、severity、source
**Validates: Requirements 3.6**

### Property 3: 清单合并正确性
*For any* AI+律师审查模式，合并后的清单应包含所有 AI 生成的清单项和所有律师配置的清单项，且无重复
**Validates: Requirements 4.3**

### Property 4: 建议合并正确性
*For any* AI+律师审查模式，合并后的建议列表应正确标识每个建议的来源（ai 或 lawyer）
**Validates: Requirements 4.4**

### Property 5: 进度回调触发
*For any* 工作流执行过程，onProgress 回调应在每个步骤开始和完成时被调用
**Validates: Requirements 5.2**

### Property 6: 操作统计准确性
*For any* 选中的建议列表，确认对话框显示的批注数量和修订数量应与实际选中项的统计一致
**Validates: Requirements 7.2**

## Error Handling

### 错误类型

1. **文档读取错误**：无法获取文档内容
2. **AI 服务错误**：合同类型识别或审查失败
3. **工作流执行错误**：步骤执行失败
4. **WPS API 错误**：批注或修订操作失败

### 错误处理策略

```javascript
// 统一错误处理
try {
  const result = await executePreset('workflow-id', options)
  if (!result.success) {
    window.$message?.error(result.message || '操作失败')
    return
  }
  // 处理成功结果
} catch (error) {
  console.error('操作失败:', error)
  window.$message?.error(error.message || '操作失败，请重试')
  // 重置状态
  pageState.value = 'idle'
}
```

### 部分失败处理

当批量执行修改操作时，部分操作可能失败：

```javascript
const results = await applyModifications(selectedSuggestions)
const successCount = results.filter(r => r.success).length
const failCount = results.filter(r => !r.success).length

if (failCount > 0) {
  window.$message?.warning(`执行完成：成功 ${successCount} 个，失败 ${failCount} 个`)
} else {
  window.$message?.success(`执行完成：成功 ${successCount} 个`)
}
```

## Testing Strategy

### 单元测试

使用 Vitest 进行单元测试：

1. **清单合并逻辑测试**：验证 AI 清单与律师清单的合并结果
2. **建议合并逻辑测试**：验证建议来源标识的正确性
3. **统计计算测试**：验证批注/修订数量统计的准确性
4. **方案加载测试**：验证方案切换后数据的一致性

### 属性测试

使用 fast-check 进行属性测试：

1. **Property 1**：生成随机方案数据，验证切换后加载的数据一致性
2. **Property 2**：生成随机建议数据，验证必要字段的存在性
3. **Property 3**：生成随机清单数据，验证合并后无重复且包含所有项
4. **Property 4**：生成随机建议数据，验证来源标识的正确性
5. **Property 5**：模拟工作流执行，验证进度回调的触发
6. **Property 6**：生成随机选中状态，验证统计计算的准确性

### 测试文件结构

```
test/
├── keywordCommenter.test.js
├── aiFullReview.test.js
├── aiLawyerReview.test.js
├── suggestionList.test.js
├── checklistMerge.test.js
└── suggestionMerge.test.js
```

