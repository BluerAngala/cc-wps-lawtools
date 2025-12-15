# Design Document

## Overview

工作流引擎采用「原子操作 + 组合」的设计模式，将 WPS 文档操作抽象为可复用的最小单元，通过工作流配置将这些操作串联起来执行。

核心设计原则：
- **单一职责**：每个原子操作只做一件事
- **可组合性**：操作之间通过上下文传递数据
- **可扩展性**：新操作只需实现统一接口并注册即可

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   WorkflowPage.vue                      │
│              （工作流页面 - 用户交互层）                  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 WorkflowEngine                          │
│              （工作流引擎 - 执行层）                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  execute()  │  │ validate()  │  │ getResult() │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 ActionRegistry                          │
│              （操作注册表 - 管理层）                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ register │ │   get    │ │   list   │ │  has     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Atomic Actions（原子操作）                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ addHeader │ │addComment │ │addRevision│             │
│  └───────────┘ └───────────┘ └───────────┘             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │  rename   │ │ exportPDF │ │deleteFile │             │
│  └───────────┘ └───────────┘ └───────────┘             │
│  ┌───────────┐ ┌───────────┐                           │
│  │  readDoc  │ │  saveDoc  │                           │
│  └───────────┘ └───────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 原子操作接口 (ActionInterface)

```typescript
interface ActionInterface {
  // 操作类型标识
  type: string
  // 操作名称（显示用）
  name: string
  // 操作描述
  description: string
  // 操作图标
  icon: string
  
  // 执行操作
  execute(params: object, context: WorkflowContext): Promise<StepResult>
  
  // 验证参数
  validate(params: object): { valid: boolean, errors: string[] }
  
  // 获取参数 Schema（用于动态生成表单）
  getSchema(): ParamSchema
}
```

### 2. 步骤结果 (StepResult)

```typescript
interface StepResult {
  success: boolean
  message: string
  data?: any  // 可传递给下一步的数据
}
```

### 3. 工作流上下文 (WorkflowContext)

```typescript
interface WorkflowContext {
  // 文档内容（由 readDocument 操作填充）
  documentText?: string
  // 文档信息
  documentInfo?: { name: string, path: string }
  // 上一步的结果
  previousResult?: StepResult
  // 自定义数据存储
  data: Record<string, any>
}
```

### 4. 工作流定义 (WorkflowDefinition)

```typescript
interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
}

interface WorkflowStep {
  actionType: string  // 对应 ActionInterface.type
  params: object      // 操作参数
  name?: string       // 步骤自定义名称
}
```

### 5. 操作注册表 (ActionRegistry)

```javascript
class ActionRegistry {
  actions = new Map()
  
  register(action: ActionInterface): void
  get(type: string): ActionInterface | undefined
  has(type: string): boolean
  list(): ActionInterface[]
}
```

### 6. 工作流引擎 (WorkflowEngine)

```javascript
class WorkflowEngine {
  constructor(registry: ActionRegistry)
  
  // 执行工作流
  async execute(
    workflow: WorkflowDefinition,
    options?: {
      onProgress?: (progress: ProgressInfo) => void
    }
  ): Promise<WorkflowResult>
  
  // 验证工作流定义
  validate(workflow: WorkflowDefinition): ValidationResult
}
```

## Data Models

### 原子操作参数 Schema

| 操作类型 | 参数 | 类型 | 必填 | 说明 |
|---------|------|------|------|------|
| addHeader | text | string | 是 | 页眉文本 |
| addHeader | fontSize | number | 否 | 字体大小，默认12 |
| addHeader | alignment | string | 否 | 对齐方式：左对齐/居中/右对齐 |
| addComment | keyword | string | 是 | 要批注的关键词 |
| addComment | comment | string | 是 | 批注内容 |
| addRevision | keyword | string | 是 | 要修订的文本 |
| addRevision | newText | string | 是 | 修订后的文本 |
| addRevision | reason | string | 否 | 修订原因 |
| renameDocument | prefix | string | 否 | 文件名前缀，默认「已修订」 |
| renameDocument | deleteOriginal | boolean | 否 | 是否删除原文件 |
| exportPDF | outputPath | string | 否 | 输出路径，默认同目录 |
| deleteFile | filePath | string | 是 | 要删除的文件路径 |
| readDocument | - | - | - | 无参数 |
| saveDocument | - | - | - | 无参数 |

### 预设工作流模板

```javascript
// 文档归档工作流
const archiveWorkflow = {
  id: 'archive',
  name: '文档归档',
  description: '添加编号、重命名并导出PDF',
  steps: [
    { actionType: 'addHeader', params: { text: '文件编号：', alignment: '右对齐' } },
    { actionType: 'renameDocument', params: { prefix: '「已归档」' } },
    { actionType: 'exportPDF', params: {} }
  ]
}

// 快速批注工作流
const quickCommentWorkflow = {
  id: 'quickComment',
  name: '快速批注',
  description: '读取文档并添加批注',
  steps: [
    { actionType: 'readDocument', params: {} },
    { actionType: 'addComment', params: { keyword: '', comment: '' } }
  ]
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 操作接口完整性

*For any* 已注册的原子操作，该操作对象必须包含 execute、validate、getSchema 方法，且 execute 返回的结果必须包含 success、message 字段

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: 注册表操作一致性

*For any* 原子操作，注册后通过 get 方法能获取到相同的操作，且该操作出现在 list 返回的列表中

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: 重复注册覆盖

*For any* 操作类型，重复注册后 get 方法返回的是最后注册的操作实例

**Validates: Requirements 2.4**

### Property 4: 工作流顺序执行

*For any* 包含多个步骤的工作流，执行时步骤的实际执行顺序与 steps 数组定义顺序一致

**Validates: Requirements 3.2**

### Property 5: 失败中断执行

*For any* 工作流，当某个步骤执行失败时，后续步骤不会被执行，且返回结果中包含失败信息

**Validates: Requirements 3.3**

### Property 6: 上下文数据传递

*For any* 工作流中相邻的两个步骤，前一步骤的输出数据可以在后一步骤的上下文中访问

**Validates: Requirements 3.4**

### Property 7: 结果汇总完整性

*For any* 执行完成的工作流，返回的结果中包含每个已执行步骤的结果，且步骤数量与实际执行数量一致

**Validates: Requirements 3.5**

### Property 8: 进度回调完整性

*For any* 工作流执行过程，onProgress 回调被调用的次数等于步骤数量的两倍（每步开始和完成各一次），且每次调用包含正确的步骤索引和总数

**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

### 操作执行错误

- 每个原子操作内部捕获异常，返回 `{ success: false, message: '错误信息' }`
- 不抛出异常到工作流引擎层

### 工作流执行错误

- 步骤失败时立即停止执行
- 返回已执行步骤的结果和失败步骤的错误信息
- 通过 onProgress 回调通知失败状态

### 参数验证错误

- 执行前调用 validate 方法验证参数
- 验证失败时不执行操作，直接返回错误

### WPS 环境错误

- 检测 WPS 环境不可用时，返回友好的错误提示
- 不影响其他非 WPS 依赖的操作

## Testing Strategy

### 单元测试

使用 Vitest 进行单元测试：

1. **ActionRegistry 测试**
   - 测试 register、get、has、list 方法
   - 测试重复注册覆盖行为

2. **WorkflowEngine 测试**
   - 测试工作流顺序执行
   - 测试失败中断行为
   - 测试上下文数据传递
   - 测试进度回调

3. **原子操作测试**
   - 每个操作的 validate 方法测试
   - 每个操作的 getSchema 方法测试

### 属性测试

使用 fast-check 进行属性测试：

1. **注册表一致性属性测试**
   - 生成随机操作，验证注册-获取-列表的一致性

2. **工作流执行属性测试**
   - 生成随机步骤序列，验证执行顺序
   - 生成包含失败步骤的工作流，验证中断行为

3. **进度回调属性测试**
   - 验证回调次数和参数正确性

### 测试标注格式

每个属性测试必须使用以下格式标注：
```javascript
// **Feature: workflow-engine, Property 1: 操作接口完整性**
```
