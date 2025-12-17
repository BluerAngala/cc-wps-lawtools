# Design Document: AI 工作流生成器

## Overview

AI 工作流生成器是一个智能服务模块，允许用户通过自然语言描述文档处理需求，系统自动解析并生成可执行的工作流配置。该功能基于现有的操作注册表（actionRegistry）和 AI 服务（siliconflow），通过构建专门的提示词，让 AI 理解可用操作及其参数，从而生成符合系统规范的工作流步骤。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkflowPage.vue                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI 输入区域 (AIWorkflowInput 组件)                  │   │
│  │  - 自然语言输入框                                    │   │
│  │  - 生成按钮                                          │   │
│  │  - 预览确认弹窗                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              AIWorkflowGenerator Service                    │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ buildPrompt()   │  │ parseResponse() │                  │
│  │ 构建AI提示词     │  │ 解析AI响应      │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              validateWorkflow()                      │   │
│  │              验证生成的工作流配置                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ actionRegistry  │ │ siliconflow AI  │ │ workflowEngine  │
│ 获取可用操作     │ │ 调用AI生成      │ │ 执行工作流      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Components and Interfaces

### 1. AIWorkflowGenerator 服务

位置：`src/services/workflow/aiWorkflowGenerator.js`

```javascript
/**
 * AI 工作流生成器
 */
class AIWorkflowGenerator {
  /**
   * 根据自然语言生成工作流
   * @param {string} userInput - 用户输入的自然语言描述
   * @param {Object} options - 选项
   * @param {Function} options.onProgress - 进度回调
   * @returns {Promise<GeneratedWorkflow>} 生成的工作流
   */
  async generate(userInput, options = {})

  /**
   * 构建 AI 提示词
   * @param {string} userInput - 用户输入
   * @returns {string} 完整的提示词
   */
  buildPrompt(userInput)

  /**
   * 解析 AI 响应
   * @param {string} response - AI 返回的 JSON 字符串
   * @returns {WorkflowStep[]} 解析后的步骤数组
   */
  parseResponse(response)

  /**
   * 验证生成的工作流
   * @param {WorkflowStep[]} steps - 步骤数组
   * @returns {ValidationResult} 验证结果
   */
  validateWorkflow(steps)
}
```

### 2. AIWorkflowInput 组件

位置：`src/components/AIWorkflowInput.vue`

```vue
<template>
  <!-- 输入区域 -->
  <div class="ai-workflow-input">
    <n-input-group>
      <n-input
        v-model:value="userInput"
        placeholder="描述你想要的工作流，如：给文档添加机密水印，然后导出PDF"
        :disabled="isGenerating"
      />
      <n-button type="primary" :loading="isGenerating" @click="handleGenerate">
        AI 生成
      </n-button>
    </n-input-group>
  </div>

  <!-- 预览确认弹窗 -->
  <n-modal v-model:show="showPreview" preset="card" title="确认生成的工作流">
    <!-- 步骤预览列表 -->
    <!-- 确认/取消按钮 -->
  </n-modal>
</template>
```

Props:
- `@confirm`: 用户确认后触发，传递生成的步骤数组

## Data Models

### GeneratedWorkflow

```typescript
interface GeneratedWorkflow {
  steps: WorkflowStep[]      // 生成的步骤数组
  explanation: string        // AI 对生成结果的解释
  confidence: number         // 置信度 0-1
}
```

### WorkflowStep（复用现有类型）

```typescript
interface WorkflowStep {
  actionType: string         // 操作类型，必须在 actionRegistry 中存在
  name: string               // 步骤名称
  params: Record<string, any> // 参数配置
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]           // 错误信息
  warnings: string[]         // 警告信息
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 生成的操作类型必须存在于注册表

*For any* AI 生成的工作流步骤，其 actionType 必须是 actionRegistry 中已注册的操作类型

**Validates: Requirements 2.1**

### Property 2: 生成的参数必须符合 Schema 定义

*For any* AI 生成的工作流步骤，其 params 中的每个参数值必须符合对应操作的 Schema 定义（类型匹配、枚举值有效）

**Validates: Requirements 2.2**

### Property 3: 必填参数必须有值

*For any* AI 生成的工作流步骤，如果操作的 Schema 定义了 required 字段，则这些字段必须在 params 中存在且非空

**Validates: Requirements 2.3**

## Error Handling

### 错误类型

1. **AI 服务错误**
   - 网络超时：提示用户检查网络，支持重试
   - API 限流：提示稍后重试
   - 余额不足：提示充值或更换模型

2. **解析错误**
   - JSON 格式错误：尝试修复或提示用户重新描述
   - 无法识别的操作：提示可用操作列表

3. **验证错误**
   - 操作类型不存在：过滤无效步骤，提示用户
   - 参数不合法：使用默认值或提示用户

### 错误处理策略

```javascript
try {
  const result = await aiWorkflowGenerator.generate(userInput)
  // 处理成功
} catch (error) {
  if (error.code === 'PARSE_ERROR') {
    window.$message?.warning('AI 返回格式异常，请尝试更清晰地描述需求')
  } else if (error.code === 'VALIDATION_ERROR') {
    window.$message?.warning(`部分操作无法识别：${error.invalidActions.join(', ')}`)
  } else {
    window.$message?.error(error.message || '生成失败，请重试')
  }
}
```

## Testing Strategy

### 单元测试

1. **AIWorkflowGenerator.buildPrompt()**
   - 验证提示词包含所有可用操作信息
   - 验证提示词包含用户输入

2. **AIWorkflowGenerator.parseResponse()**
   - 验证能正确解析有效 JSON
   - 验证能处理格式错误的响应

3. **AIWorkflowGenerator.validateWorkflow()**
   - 验证能检测无效的 actionType
   - 验证能检测不符合 Schema 的参数

### 属性测试

使用 fast-check 库进行属性测试：

1. **Property 1 测试**：生成随机的步骤数组，验证 validateWorkflow 能正确检测无效的 actionType

2. **Property 2 测试**：生成随机的参数配置，验证 validateWorkflow 能正确检测不符合 Schema 的参数

3. **Property 3 测试**：生成缺少必填参数的步骤，验证 validateWorkflow 能正确检测

### 集成测试

1. 模拟 AI 响应，验证完整的生成流程
2. 验证 UI 组件正确显示预览和处理用户确认

