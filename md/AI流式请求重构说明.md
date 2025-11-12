# AI流式请求重构说明

## 概述

根据 SiliconFlow API 的特性，重构了 AI 调用服务，实现了流式请求功能，提升了用户体验，支持实时查看 AI 响应内容。

## 核心改进

### 1. siliconflow.js 重构

#### 新增功能
- **streamChatCompletions**: 流式调用函数，支持 SSE (Server-Sent Events)
  - 支持 `onChunk` 回调：实时接收 AI 响应片段
  - 支持 `onProgress` 回调：接收阶段进度信息
  - 自动处理 JSON 模式的降级（JSON 模式不支持流式）

- **nonStreamChatCompletions**: 非流式调用函数
  - 专门用于需要 JSON 格式响应的场景
  - 保持与 response_format 的兼容性

#### 技术实现
```javascript
// 流式请求示例
const response = await streamChatCompletions({
  messages: [
    { role: 'system', content: '你是一个专业助手' },
    { role: 'user', content: '请分析合同' }
  ],
  model: 'moonshotai/Kimi-K2-Instruct-0905',
  onChunk: (chunk) => {
    // 实时接收响应片段
    console.log(chunk)
  },
  onProgress: (info) => {
    // 接收进度信息
    console.log(info.stage, info.content)
  },
  options: {
    temperature: 0.1,
    maxTokens: 2000
  }
})
```

### 2. reviewAIService.js 重构

#### 核心方法更新

##### identifyContractType (识别合同类型)
- 使用非流式请求（因为需要 JSON 格式）
- 支持 `onProgress` 回调，提供进度反馈
- 自动使用用户配置的 AI 模型

##### reviewClause (审查条款)
- **智能切换**：默认使用流式，遇到 JSON 模式自动切换到非流式
- 支持 `options.stream` 控制是否启用流式
- 支持 `options.onChunk` 接收实时响应
- 支持 `options.onProgress` 接收进度信息

##### analyzeGlobal (全局分析)
- 使用非流式请求（因为需要 JSON 格式）
- 支持 `onProgress` 回调

#### 配置管理
```javascript
constructor() {
  this.getAIConfig = () => {
    const config = appConfig.get('ai') || {}
    return {
      model: config.model || 'moonshotai/Kimi-K2-Instruct-0905',
      temperature: 0.1
    }
  }
}
```

### 3. ContractRiskScan.vue 优化

#### 新增功能
- **实时响应显示**：在扫描过程中显示 AI 的实时响应
- **流式进度反馈**：更细粒度的进度提示

#### UI 改进
```vue
<!-- 实时AI响应预览 -->
<div v-if="realtimeResponse" class="mt-3 p-3 bg-gray-50 rounded">
  <div class="text-gray-600 mb-1">AI 实时响应:</div>
  <div class="whitespace-pre-wrap">{{ realtimeResponse }}</div>
</div>
```

#### 使用示例
```javascript
const options = {
  stream: true, // 启用流式输出
  onProgress: (progress) => {
    scanProgress.value = {
      current: progress.current || 0,
      total: progress.total || 0,
      stage: progress.stage || '正在审查...'
    }
  },
  onChunk: (chunk) => {
    // 流式接收AI响应片段
    realtimeResponse.value += chunk
  }
}
```

## 技术优势

### 1. 更好的用户体验
- ✅ 实时查看 AI 响应，不再是"黑盒"等待
- ✅ 更准确的进度反馈
- ✅ 可以提前看到部分结果

### 2. 智能降级
- ✅ 自动检测 JSON 模式，切换到非流式
- ✅ 保持向后兼容性
- ✅ 不影响现有功能

### 3. 性能优化
- ✅ 流式输出减少首字节时间 (TTFB)
- ✅ 用户可以更早看到响应
- ✅ 更好的网络利用率

### 4. 灵活配置
- ✅ 支持按需启用/禁用流式
- ✅ 自动使用用户配置的模型
- ✅ 统一的配置管理

## 兼容性

### 向后兼容
- ✅ 保持所有现有 API 接口
- ✅ 默认行为不变（仅在明确启用时使用流式）
- ✅ 不影响现有代码调用

### 错误处理
- ✅ 统一的错误处理机制
- ✅ 网络错误、超时等情况的友好提示
- ✅ 自动重试逻辑（在 TaskScheduler 中）

## 使用建议

### 适合流式的场景
- ✅ 合同审查（需要查看实时进度）
- ✅ 长文本分析
- ✅ 用户需要实时反馈的场景

### 适合非流式的场景
- ✅ 需要 JSON 格式响应
- ✅ 简短快速的请求
- ✅ 不需要实时反馈的场景

## 测试建议

1. **基本功能测试**
   - 测试流式请求是否正常工作
   - 测试非流式请求是否正常工作
   - 测试 JSON 模式的自动降级

2. **进度显示测试**
   - 验证实时响应是否正确显示
   - 验证进度条是否正常更新
   - 验证完成后响应的清理

3. **错误处理测试**
   - 测试网络错误的处理
   - 测试 API 错误的处理
   - 测试超时的处理

4. **性能测试**
   - 对比流式和非流式的响应时间
   - 测试长文本处理性能
   - 测试 UI 卡顿情况

## 注意事项

1. **JSON 模式限制**
   - SiliconFlow API 的 JSON 模式不支持流式输出
   - 系统会自动检测并切换到非流式

2. **显示长度限制**
   - 实时响应显示限制在 1000 字符内，避免 UI 卡顿
   - 超出部分会截断，保留最新内容

3. **模型配置**
   - 优先使用用户在设置中配置的模型
   - 回退到默认模型 `moonshotai/Kimi-K2-Instruct-0905`

## 后续优化方向

1. **性能优化**
   - 考虑使用 Web Worker 处理流式数据
   - 优化大量数据的渲染性能

2. **功能扩展**
   - 支持流式请求的暂停/继续
   - 支持流式请求的取消
   - 添加更多的进度细节

3. **用户体验**
   - 添加流式输出的动画效果
   - 优化移动端的显示效果
   - 添加响应内容的语法高亮

## 总结

本次重构充分利用了 SiliconFlow API 的流式特性，在保持向后兼容的同时，大幅提升了用户体验。通过智能切换流式和非流式请求，确保了在各种场景下的最佳性能和功能完整性。

