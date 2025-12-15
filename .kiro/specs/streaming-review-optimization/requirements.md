# Requirements Document

## Introduction

本功能旨在优化合同审查流程的用户体验。当前系统采用非流式请求方式，必须等待所有分段审查完成后才能统一添加批注，导致用户需要长时间等待（2-5分钟）才能看到任何结果。

优化目标是实现"边审查边批注"的流式处理模式，让用户在审查开始后的10-20秒内就能看到第一个批注出现，并持续看到新批注的添加，从而显著提升用户体验。

## Glossary

- **流式请求（Streaming Request）**：AI API 的一种调用方式，服务器逐步返回响应内容，客户端可以边接收边处理
- **非流式请求（Non-Streaming Request）**：AI API 的传统调用方式，必须等待完整响应后才能处理
- **增量解析（Incremental Parsing）**：在数据流式到达时，逐步解析已接收的部分数据
- **JSONL（JSON Lines）**：一种文本格式，每行包含一个独立的 JSON 对象，便于流式解析
- **批注（Comment）**：WPS 文档中的注释，用于标记审查发现的问题
- **分段（Segment）**：将合同文档按章节或长度切分的独立审查单元
- **审查引擎（Review Engine）**：负责协调合同审查流程的核心模块

## Requirements

### Requirement 1

**User Story:** As a 律师用户, I want to 在合同审查过程中实时看到批注出现, so that 我不需要长时间等待就能开始查看审查结果。

#### Acceptance Criteria

1. WHEN 合同审查开始执行 THEN 审查引擎 SHALL 在首个问题被 AI 识别后的 5 秒内将其作为批注添加到文档
2. WHEN AI 流式返回审查结果 THEN 审查引擎 SHALL 逐个解析问题并立即应用批注，而非等待完整响应
3. WHEN 用户查看文档 THEN 用户 SHALL 能够看到批注持续增加，而非一次性全部出现
4. WHEN 审查过程中出现网络中断 THEN 审查引擎 SHALL 保留已添加的批注并提示用户审查未完成

### Requirement 2

**User Story:** As a 系统开发者, I want to AI 服务支持流式输出并采用易于增量解析的格式, so that 前端可以边接收边处理审查结果。

#### Acceptance Criteria

1. WHEN 调用 AI 审查接口 THEN AI 服务 SHALL 使用流式（SSE）方式返回响应
2. WHEN AI 生成审查结果 THEN AI 服务 SHALL 采用 JSONL 格式输出，每个问题作为独立的一行 JSON
3. WHEN 流式数据到达 THEN 增量解析器 SHALL 能够从不完整的数据流中提取已完成的 JSON 对象
4. WHEN 解析到完整的问题对象 THEN 增量解析器 SHALL 立即触发回调通知上层处理

### Requirement 3

**User Story:** As a 律师用户, I want to 在审查过程中看到实时进度反馈, so that 我知道审查正在进行且能预估剩余时间。

#### Acceptance Criteria

1. WHEN 审查开始 THEN 审查引擎 SHALL 显示当前正在审查的分段名称
2. WHEN 发现新问题 THEN 审查引擎 SHALL 更新已发现问题的计数
3. WHEN 完成一个分段的审查 THEN 审查引擎 SHALL 更新整体进度百分比
4. WHEN 所有分段审查完成 THEN 审查引擎 SHALL 显示审查完成状态和总结信息

### Requirement 4

**User Story:** As a 系统开发者, I want to 增量解析器能够正确处理各种边界情况, so that 流式解析过程稳定可靠。

#### Acceptance Criteria

1. WHEN 接收到不完整的 JSON 行 THEN 增量解析器 SHALL 缓存数据并等待后续内容
2. WHEN 接收到包含多个完整 JSON 行的数据块 THEN 增量解析器 SHALL 依次解析并触发多次回调
3. WHEN 接收到格式错误的 JSON 行 THEN 增量解析器 SHALL 跳过该行并记录警告日志
4. WHEN 流式传输结束 THEN 增量解析器 SHALL 处理缓冲区中剩余的数据

### Requirement 5

**User Story:** As a 律师用户, I want to 流式审查的结果质量与原有非流式审查保持一致, so that 我可以信任新的审查方式。

#### Acceptance Criteria

1. WHEN 使用流式审查模式 THEN 审查引擎 SHALL 产生与非流式模式相同数量和质量的审查问题
2. WHEN 批注被添加到文档 THEN 批注内容 SHALL 包含完整的问题描述和定位关键词
3. WHEN 审查完成 THEN 审查引擎 SHALL 生成与非流式模式格式一致的审查报告
4. WHEN 用户选择审查深度 THEN 流式审查 SHALL 支持快速、标准、深度三种模式

### Requirement 6

**User Story:** As a 系统开发者, I want to 流式审查功能向后兼容现有接口, so that 现有的工作流和调用方式无需修改。

#### Acceptance Criteria

1. WHEN 调用审查引擎的 review 方法 THEN 审查引擎 SHALL 默认使用流式模式
2. WHEN 传入 stream: false 选项 THEN 审查引擎 SHALL 回退到非流式模式
3. WHEN 流式模式不可用（如 API 不支持）THEN 审查引擎 SHALL 自动降级到非流式模式
4. WHEN 审查完成 THEN 返回结果的数据结构 SHALL 与现有接口保持一致
