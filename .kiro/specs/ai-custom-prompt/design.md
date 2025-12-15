# Design Document

## Overview

本设计为 AI 工作流操作添加场景化参数配置，包括审查视角、审查深度、关注领域等，并创建多个预设工作流模板。同时提供自定义指令作为补充。核心目标是「用户简单配置，结果高度准确」。

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      WorkflowPage.vue                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  预设工作流选择                                             │  │
│  │  [甲方快速审查] [乙方深度审查] [签约前风险扫描] ...         │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  编辑弹窗（参数配置）                                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  审查视角: [甲方▼]  审查深度: [标准▼]                │  │  │
│  │  │  关注领域: ☑违约责任 ☑付款条款 ☐保密条款 ...        │  │  │
│  │  │  自定义指令: [________________________]              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Action (execute)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  buildEnhancedPrompt(basePrompt, params)                   │  │
│  │  → 根据 perspective, depth, focusAreas, customPrompt       │  │
│  │  → 构建增强的 AI prompt                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 审查合同操作 Schema 扩展

```javascript
// reviewContract.js
getSchema() {
  return {
    type: 'object',
    properties: {
      perspective: {
        type: 'string',
        title: '审查视角',
        enum: ['partyA', 'partyB', 'neutral'],
        enumLabels: ['甲方视角', '乙方视角', '中立视角'],
        default: 'neutral'
      },
      depth: {
        type: 'string',
        title: '审查深度',
        enum: ['quick', 'standard', 'deep'],
        enumLabels: ['快速（识别重大风险）', '标准（全面审查）', '深度（逐条分析）'],
        default: 'standard'
      },
      focusAreas: {
        type: 'array',
        title: '关注领域',
        items: { type: 'string' },
        options: [
          { value: 'liability', label: '违约责任' },
          { value: 'payment', label: '付款条款' },
          { value: 'confidential', label: '保密条款' },
          { value: 'ip', label: '知识产权' },
          { value: 'dispute', label: '争议解决' },
          { value: 'forceMajeure', label: '不可抗力' }
        ],
        default: []
      },
      customPrompt: {
        type: 'string',
        title: '自定义指令',
        inputType: 'textarea',
        placeholder: '例如：特别关注合同期限是否合理',
        default: ''
      },
      autoApply: {
        type: 'boolean',
        title: '自动添加批注',
        default: true
      }
    }
  }
}
```

### 2. 提取合同要素操作 Schema 扩展

```javascript
// extractContract.js
getSchema() {
  return {
    type: 'object',
    properties: {
      extractMode: {
        type: 'string',
        title: '提取模式',
        enum: ['basic', 'full'],
        enumLabels: ['基础要素（甲乙方、金额、日期）', '完整要素（所有可识别信息）'],
        default: 'basic'
      },
      customPrompt: {
        type: 'string',
        title: '自定义指令',
        inputType: 'textarea',
        placeholder: '例如：额外提取担保人信息',
        default: ''
      }
    }
  }
}
```

### 3. 全局分析操作 Schema 扩展

```javascript
// globalAnalysis.js
getSchema() {
  return {
    type: 'object',
    properties: {
      depth: {
        type: 'string',
        title: '分析深度',
        enum: ['quick', 'standard', 'deep'],
        enumLabels: ['快速', '标准', '深度'],
        default: 'standard'
      },
      customPrompt: {
        type: 'string',
        title: '自定义指令',
        inputType: 'textarea',
        placeholder: '例如：重点分析合同的合规性',
        default: ''
      }
    }
  }
}
```

### 4. 识别合同类型操作 Schema 扩展

```javascript
// identifyContract.js
getSchema() {
  return {
    type: 'object',
    properties: {
      customPrompt: {
        type: 'string',
        title: '自定义指令',
        inputType: 'textarea',
        placeholder: '例如：这是一份建设工程类合同',
        default: ''
      }
    }
  }
}
```

### 5. Prompt 构建增强

在 AIBaseAction 中添加：

```javascript
buildEnhancedPrompt(basePrompt, params) {
  const parts = [basePrompt]
  
  // 审查视角
  if (params.perspective) {
    const perspectiveMap = {
      partyA: '请从甲方（委托方/采购方）的视角进行分析，重点识别对甲方不利的条款和风险。',
      partyB: '请从乙方（服务方/供应方）的视角进行分析，重点识别对乙方不利的条款和风险。',
      neutral: '请从中立视角进行分析，平衡评估双方的权利义务。'
    }
    parts.push(perspectiveMap[params.perspective])
  }
  
  // 审查深度
  if (params.depth) {
    const depthMap = {
      quick: '请进行快速审查，只识别重大风险点和明显问题。',
      standard: '请进行标准审查，全面分析合同条款。',
      deep: '请进行深度审查，逐条详细分析每个条款的法律风险。'
    }
    parts.push(depthMap[params.depth])
  }
  
  // 关注领域
  if (params.focusAreas?.length > 0) {
    const areaLabels = {
      liability: '违约责任',
      payment: '付款条款',
      confidential: '保密条款',
      ip: '知识产权',
      dispute: '争议解决',
      forceMajeure: '不可抗力'
    }
    const areas = params.focusAreas.map(a => areaLabels[a]).join('、')
    parts.push(`请重点关注以下领域：${areas}。`)
  }
  
  // 自定义指令
  if (params.customPrompt?.trim()) {
    parts.push(`用户特别要求：${params.customPrompt.trim()}`)
  }
  
  return parts.join('\n\n')
}
```

### 6. 预设工作流模板

```javascript
// presets.js 新增预设
export const enhancedAiPresets = {
  // 甲方快速审查
  partyAQuickReview: {
    id: 'party-a-quick-review',
    name: '甲方快速审查',
    description: '从甲方视角快速识别重大风险',
    category: 'ai',
    steps: [
      { actionType: 'READ_DOCUMENT', name: '读取文档' },
      { actionType: 'IDENTIFY_CONTRACT', name: '识别合同类型' },
      { actionType: 'REVIEW_CONTRACT', name: '审查合同', params: {
        perspective: 'partyA',
        depth: 'quick',
        focusAreas: ['liability', 'payment'],
        autoApply: true
      }},
      { actionType: 'SAVE_DOCUMENT', name: '保存文档' }
    ]
  },
  
  // 乙方深度审查
  partyBDeepReview: {
    id: 'party-b-deep-review',
    name: '乙方深度审查',
    description: '从乙方视角逐条详细分析',
    category: 'ai',
    steps: [
      { actionType: 'READ_DOCUMENT', name: '读取文档' },
      { actionType: 'IDENTIFY_CONTRACT', name: '识别合同类型' },
      { actionType: 'EXTRACT_CONTRACT', name: '提取要素', params: { extractMode: 'full' }},
      { actionType: 'GLOBAL_ANALYSIS', name: '全局分析', params: { depth: 'deep' }},
      { actionType: 'REVIEW_CONTRACT', name: '深度审查', params: {
        perspective: 'partyB',
        depth: 'deep',
        focusAreas: ['liability', 'payment', 'ip'],
        autoApply: true
      }},
      { actionType: 'SAVE_DOCUMENT', name: '保存文档' }
    ]
  },
  
  // 签约前风险扫描
  preSignRiskScan: {
    id: 'pre-sign-risk-scan',
    name: '签约前风险扫描',
    description: '签约前快速识别潜在风险',
    category: 'ai',
    steps: [
      { actionType: 'READ_DOCUMENT', name: '读取文档' },
      { actionType: 'IDENTIFY_CONTRACT', name: '识别合同类型' },
      { actionType: 'GLOBAL_ANALYSIS', name: '风险扫描', params: { depth: 'quick' }},
      { actionType: 'REVIEW_CONTRACT', name: '风险审查', params: {
        perspective: 'neutral',
        depth: 'quick',
        focusAreas: ['liability', 'dispute'],
        autoApply: false
      }}
    ]
  },
  
  // 续签合同审查
  renewalReview: {
    id: 'renewal-review',
    name: '续签合同审查',
    description: '续签时重点关注变更条款',
    category: 'ai',
    steps: [
      { actionType: 'READ_DOCUMENT', name: '读取文档' },
      { actionType: 'IDENTIFY_CONTRACT', name: '识别合同类型' },
      { actionType: 'EXTRACT_CONTRACT', name: '提取要素', params: { extractMode: 'basic' }},
      { actionType: 'REVIEW_CONTRACT', name: '审查合同', params: {
        perspective: 'neutral',
        depth: 'standard',
        focusAreas: ['payment', 'liability'],
        customPrompt: '重点关注与原合同相比的变更条款',
        autoApply: true
      }},
      { actionType: 'SAVE_DOCUMENT', name: '保存文档' }
    ]
  },
  
  // 劳动合同审查
  laborContractReview: {
    id: 'labor-contract-review',
    name: '劳动合同审查',
    description: '专门针对劳动合同的审查',
    category: 'ai',
    steps: [
      { actionType: 'READ_DOCUMENT', name: '读取文档' },
      { actionType: 'IDENTIFY_CONTRACT', name: '识别合同类型', params: {
        customPrompt: '这是一份劳动合同'
      }},
      { actionType: 'EXTRACT_CONTRACT', name: '提取要素', params: { extractMode: 'full' }},
      { actionType: 'REVIEW_CONTRACT', name: '审查合同', params: {
        perspective: 'partyB',
        depth: 'standard',
        focusAreas: ['liability', 'confidential'],
        customPrompt: '重点关注试用期、竞业限制、加班规定等劳动法相关条款',
        autoApply: true
      }},
      { actionType: 'SAVE_DOCUMENT', name: '保存文档' }
    ]
  },
  
  // 采购合同审查
  purchaseContractReview: {
    id: 'purchase-contract-review',
    name: '采购合同审查',
    description: '专门针对采购合同的审查',
    category: 'ai',
    steps: [
      { actionType: 'READ_DOCUMENT', name: '读取文档' },
      { actionType: 'IDENTIFY_CONTRACT', name: '识别合同类型', params: {
        customPrompt: '这是一份采购合同'
      }},
      { actionType: 'EXTRACT_CONTRACT', name: '提取要素', params: { extractMode: 'full' }},
      { actionType: 'REVIEW_CONTRACT', name: '审查合同', params: {
        perspective: 'partyA',
        depth: 'standard',
        focusAreas: ['payment', 'liability', 'ip'],
        customPrompt: '重点关注交付条款、质量标准、验收流程',
        autoApply: true
      }},
      { actionType: 'SAVE_DOCUMENT', name: '保存文档' }
    ]
  }
}
```

### 7. 编辑弹窗 UI 增强

WorkflowPage.vue 需要支持：
- `enumLabels`: 显示友好的选项标签
- `inputType: 'textarea'`: 使用多行文本框
- `type: 'array'` + `options`: 显示多选框组

## Data Models

### Step 参数结构示例

```javascript
{
  actionType: 'REVIEW_CONTRACT',
  name: '审查合同',
  params: {
    perspective: 'partyA',
    depth: 'standard',
    focusAreas: ['liability', 'payment'],
    customPrompt: '特别关注合同期限',
    autoApply: true
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 视角参数融入 prompt
*For any* perspective 值（partyA/partyB/neutral），构建的 prompt 应包含对应视角的指令文本。
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: 深度参数融入 prompt
*For any* depth 值（quick/standard/deep），构建的 prompt 应包含对应深度的指令文本。
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: 关注领域融入 prompt
*For any* 非空的 focusAreas 数组，构建的 prompt 应包含所有选中领域的名称。
**Validates: Requirements 3.3**

### Property 4: 预设工作流完整性
*For any* 预设工作流，其 steps 数组应非空，且每个 step 的 actionType 应为有效的操作类型。
**Validates: Requirements 4.3**

### Property 5: customPrompt 融入 prompt
*For any* 非空的 customPrompt，构建的 prompt 应包含该 customPrompt 的内容。
**Validates: Requirements 5.3**

### Property 6: 提取模式融入 prompt
*For any* extractMode 值（basic/full），构建的 prompt 应包含对应模式的指令文本。
**Validates: Requirements 6.3, 6.4**

## Error Handling

1. **参数缺失**: 所有参数都有默认值，缺失时使用默认值
2. **无效枚举值**: 使用默认值替代
3. **空数组**: focusAreas 为空时不添加关注领域指令
4. **空字符串**: customPrompt 为空或纯空白时忽略

## Testing Strategy

### 单元测试

1. 测试 `buildEnhancedPrompt` 函数各参数组合
2. 测试各 AI 操作的 schema 定义完整性
3. 测试预设工作流的结构有效性

### 属性测试

使用 fast-check：

1. **Property 1-3**: 生成随机参数组合，验证 prompt 包含对应指令
2. **Property 4**: 验证所有预设工作流结构有效
3. **Property 5-6**: 生成随机 customPrompt/extractMode，验证 prompt 包含对应内容
