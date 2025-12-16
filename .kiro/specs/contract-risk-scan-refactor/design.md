# Design Document

## Overview

本设计重构文档风险扫描页面，基于现有工作流引擎架构实现分步审查流程。核心改进是将"一键扫描"改为"选择视角 → 生成清单 → 确认清单 → 执行审查"的交互模式，让用户对审查过程有更多控制权。

### 核心流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  选择视角   │ → │  生成清单   │ → │  确认清单   │ → │  执行审查   │
│  选择范围   │    │  (工作流1)  │    │  (用户编辑) │    │  (工作流2)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 工作流设计

**工作流1：生成清单**
```
readDocument → identifyDocument → generateChecklist
```

**工作流2：执行审查**
```
reviewDocument (使用确认的清单)
```

## Architecture

### 组件架构

```
ContractRiskScan.vue (页面组件)
├── 视角选择区 (perspective selector)
├── 范围选择区 (scope selector)
├── 清单展示区 (checklist display)
│   └── ChecklistItem (可勾选的清单项)
├── 进度展示区 (progress display)
└── 结果展示区 (result display)
    └── 按清单项分组的问题列表

Services
├── workflow/
│   ├── actions/
│   │   ├── identifyDocument.js (新增：识别文档类型)
│   │   └── generateChecklist.js (新增：生成审查清单)
│   └── presets.js (更新：添加新的预设工作流)
└── contract/
    └── reviewChecklistGenerator.js (更新：支持更多文书类型)
```

### 状态流转

```
IDLE → GENERATING_CHECKLIST → CHECKLIST_READY → REVIEWING → REVIEW_COMPLETE
  ↑                                    │              │
  └────────────────────────────────────┴──────────────┘
                    (重置)
```

## Components and Interfaces

### 1. ContractRiskScan.vue 页面组件

**状态定义：**
```javascript
// 页面状态
const pageState = ref('idle') // idle | generating | ready | reviewing | complete

// 用户选择
const perspective = ref('neutral') // partyA | partyB | neutral
const scanScope = ref('full') // full | selection

// 清单数据
const documentType = ref(null) // { type, subtype, confidence }
const checklist = ref([]) // 审查清单项数组
const selectedItems = ref(new Set()) // 用户勾选的清单项 ID

// 审查结果
const reviewResult = ref(null)
```

**核心方法：**
```javascript
// 生成清单（执行工作流1）
async function generateChecklist()

// 开始审查（执行工作流2）
async function startReview()

// 切换清单项选中状态
function toggleChecklistItem(itemId)

// 重置状态
function reset()
```

### 2. GenerateChecklistAction (新增 Action)

**职责：** 根据文档类型和审查视角生成审查清单

**输入：**
- `documentType`: 文档类型信息
- `perspective`: 审查视角

**输出：**
- `checklist`: 审查清单数组

```javascript
// src/services/workflow/actions/generateChecklist.js
export class GenerateChecklistAction extends BaseAction {
  async execute(params, context) {
    const documentType = context.data.documentType || params.documentType
    const perspective = params.perspective || 'neutral'
    
    const checklist = reviewChecklistGenerator.generateChecklist(
      documentType,
      perspective
    )
    
    context.data.checklist = checklist
    return createSuccessResult('清单生成成功', { checklist })
  }
}
```

### 3. ReviewChecklistGenerator 更新

**新增支持的文书类型：**
- 诉讼文书（起诉状、答辩状、上诉状等）
- 律师函
- 法律意见书
- 协议书

**视角差异化清单：**
```javascript
// 根据视角调整清单优先级
generateChecklist(documentType, perspective) {
  const baseChecklist = this.getBaseChecklist(documentType)
  return this.adjustByPerspective(baseChecklist, perspective)
}
```

## Data Models

### ChecklistItem 清单项

```typescript
interface ChecklistItem {
  id: string              // 唯一标识
  name: string            // 清单项名称
  priority: 'high' | 'medium' | 'low'  // 优先级
  required: boolean       // 是否必需项
  keywords: string[]      // 关联关键词
  reviewRequirements: string  // 审查要求说明
  riskLevel: string       // 风险等级
  reviewBasis: string     // 审查依据（法律条文）
}
```

### ReviewResult 审查结果

```typescript
interface ReviewResult {
  issues: Issue[]         // 检测到的问题
  risks: Risk[]           // 风险提示
  checklist: ChecklistItem[]  // 带状态的清单
  checklistSummary: {     // 清单统计
    [checklistId: string]: {
      passed: boolean
      issueCount: number
      riskLevel: string
    }
  }
  summary: {
    totalIssues: number
    totalRisks: number
    passedCount: number   // 通过的清单项数
    failedCount: number   // 有问题的清单项数
  }
}
```

### Issue 问题

```typescript
interface Issue {
  checklistId: string     // 关联的清单项 ID
  keyword: string         // 问题关键词/条款
  comment: string         // 问题描述
  severity: 'high' | 'medium' | 'low'  // 严重程度
  position: string        // 位置描述
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

经过分析，以下属性可以合并或简化：
- 1.2, 1.3, 1.4 可合并为一个属性：视角参数正确传递
- 6.1, 6.2, 6.3 可合并为一个属性：结果与清单正确关联

### Properties

**Property 1: 视角参数正确传递**
*For any* 用户选择的审查视角（甲方/乙方/中立），当执行审查工作流时，传递给审查引擎的 perspective 参数应与用户选择一致
**Validates: Requirements 1.2, 1.3, 1.4**

**Property 2: 选中内容正确传递**
*For any* 用户选择"选中内容扫描"且文档中有选中文本时，传递给审查引擎的文本应仅包含选中内容
**Validates: Requirements 2.2**

**Property 3: 工作流步骤顺序正确**
*For any* 生成清单的工作流执行，步骤顺序应为：readDocument → identifyDocument → generateChecklist，且每步的输出应正确传递给下一步
**Validates: Requirements 3.1**

**Property 4: 清单与文档类型匹配**
*For any* 已识别的文档类型，生成的审查清单应包含该类型的必需审查项
**Validates: Requirements 3.2**

**Property 5: 取消勾选项被过滤**
*For any* 用户取消勾选的清单项，在执行审查时该项不应出现在审查参数中
**Validates: Requirements 4.2**

**Property 6: 审查仅使用确认的清单**
*For any* 执行审查的工作流，传递给审查引擎的清单应仅包含用户确认（勾选）的项
**Validates: Requirements 5.1**

**Property 7: 结果与清单正确关联**
*For any* 审查结果中的问题，应包含有效的 checklistId，且该 ID 存在于审查清单中
**Validates: Requirements 5.3, 6.1**

**Property 8: 清单状态正确更新**
*For any* 审查完成后的清单项，如果该项关联的问题数为 0 则标记为"已通过"，否则标记为"有问题"并显示问题数量
**Validates: Requirements 6.2, 6.3**

## Error Handling

### 错误场景及处理

| 场景 | 处理方式 |
|------|----------|
| 文档为空或无法读取 | 显示错误提示，禁用"生成清单"按钮 |
| 文档类型无法识别 | 使用通用清单，显示提示信息 |
| 选中内容扫描但无选中文本 | 显示提示，引导用户先选中内容 |
| AI 服务调用失败 | 显示错误信息，允许重试 |
| 工作流执行中断 | 保留已完成的步骤结果，显示中断原因 |

### 错误提示规范

```javascript
// 统一使用 window.$message 显示提示
window.$message?.error('错误信息')
window.$message?.warning('警告信息')
window.$message?.info('提示信息')
```

## Testing Strategy

### 测试框架

- 单元测试：Vitest
- 属性测试：fast-check

### 单元测试

1. **清单生成测试**
   - 测试不同文档类型生成的清单是否正确
   - 测试视角参数对清单的影响

2. **状态管理测试**
   - 测试页面状态流转是否正确
   - 测试清单项勾选/取消勾选逻辑

3. **工作流执行测试**
   - 测试工作流步骤顺序
   - 测试数据在步骤间的传递

### 属性测试

使用 fast-check 库进行属性测试，验证核心正确性属性：

```javascript
// 示例：Property 5 - 取消勾选项被过滤
import fc from 'fast-check'

test('取消勾选的清单项不应出现在审查参数中', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ id: fc.string(), name: fc.string() })),
      fc.set(fc.string()),
      (checklist, uncheckedIds) => {
        const filtered = filterChecklist(checklist, uncheckedIds)
        return filtered.every(item => !uncheckedIds.has(item.id))
      }
    )
  )
})
```

### 测试文件结构

```
test/
├── contract-risk-scan/
│   ├── checklistGenerator.test.js    # 清单生成测试
│   ├── checklistFilter.test.js       # 清单过滤测试
│   ├── workflowExecution.test.js     # 工作流执行测试
│   └── properties.test.js            # 属性测试
```
