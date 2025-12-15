# Requirements Document

## Introduction

本功能旨在使用现有的工作流引擎重构「信息脱敏页面」和「合同风险扫描页面」，将原本独立实现的业务逻辑统一为工作流驱动的模式。通过复用已有的工作流 Action（如 `scanSensitive`、`desensitize`、`reviewContract` 等），简化页面代码，提升可维护性和一致性。

## Glossary

- **工作流引擎（Workflow Engine）**: 负责执行工作流、管理步骤间数据传递和进度追踪的核心模块
- **Action**: 工作流中的单个操作单元，如读取文档、扫描敏感信息、执行脱敏等
- **预设工作流（Preset Workflow）**: 预定义的工作流模板，包含一系列有序的 Action
- **上下文（Context）**: 工作流执行过程中传递数据的容器，存储文档内容、中间结果等
- **脱敏页面（DesensitizePage）**: 用于扫描和处理文档中敏感信息的页面
- **风险扫描页面（ContractRiskScan）**: 用于 AI 分析合同风险的页面

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望脱敏页面使用工作流引擎执行扫描和脱敏操作，以便获得一致的操作体验和进度反馈。

#### Acceptance Criteria

1. WHEN 用户点击「扫描文档」按钮 THEN 脱敏页面 SHALL 调用工作流引擎执行 `scanSensitive` Action 并显示扫描进度
2. WHEN 扫描完成 THEN 脱敏页面 SHALL 从工作流上下文中获取敏感信息列表并展示给用户
3. WHEN 用户点击「一键脱敏」按钮 THEN 脱敏页面 SHALL 调用工作流引擎执行 `desensitize` Action
4. WHEN 脱敏操作完成 THEN 脱敏页面 SHALL 显示脱敏结果统计信息

### Requirement 2

**User Story:** 作为用户，我希望风险扫描页面使用工作流引擎执行合同审查，以便获得统一的进度反馈和结果展示。

#### Acceptance Criteria

1. WHEN 用户点击「开始扫描」按钮 THEN 风险扫描页面 SHALL 调用工作流引擎执行包含 `identifyContract` 和 `reviewContract` 的工作流
2. WHEN 工作流执行过程中 THEN 风险扫描页面 SHALL 通过 `onProgress` 回调实时显示当前执行阶段
3. WHEN 审查完成 THEN 风险扫描页面 SHALL 从工作流上下文中获取审查结果（issues、risks、checklist）并展示
4. WHEN 用户选择「分段扫描」策略 THEN 风险扫描页面 SHALL 传递相应参数给 `reviewContract` Action

### Requirement 3

**User Story:** 作为用户，我希望两个页面保留现有的配置选项，以便我可以自定义扫描和审查行为。

#### Acceptance Criteria

1. WHEN 用户在脱敏页面配置白名单或自定义敏感词 THEN 脱敏页面 SHALL 将这些参数传递给工作流 Action
2. WHEN 用户在风险扫描页面选择扫描策略 THEN 风险扫描页面 SHALL 将策略参数传递给工作流 Action
3. WHEN 工作流 Action 需要参数 THEN 页面 SHALL 从用户配置中构建参数对象

### Requirement 4

**User Story:** 作为开发者，我希望重构后的页面代码更简洁，业务逻辑集中在工作流 Action 中。

#### Acceptance Criteria

1. WHEN 重构脱敏页面 THEN 页面组件 SHALL 移除直接调用 `desensitizeText` 的代码，改为调用工作流引擎
2. WHEN 重构风险扫描页面 THEN 页面组件 SHALL 移除直接调用 `ContractReviewEngine` 和 `ReviewAIService` 的代码
3. WHEN 页面需要执行操作 THEN 页面 SHALL 通过 `workflowEngine.execute()` 方法执行预定义或动态构建的工作流

### Requirement 5

**User Story:** 作为用户，我希望在操作过程中看到清晰的进度指示，以便了解当前执行状态。

#### Acceptance Criteria

1. WHEN 工作流开始执行 THEN 页面 SHALL 显示当前步骤名称和总步骤数
2. WHEN 工作流步骤完成 THEN 页面 SHALL 更新进度显示并展示步骤结果
3. WHEN 工作流执行失败 THEN 页面 SHALL 显示错误信息并允许用户重试

### Requirement 6

**User Story:** 作为用户，我希望重构后的页面功能与原有功能保持一致，不丢失任何现有能力。

#### Acceptance Criteria

1. WHEN 使用重构后的脱敏页面 THEN 用户 SHALL 能够执行扫描、选择性脱敏、全选/取消全选、清除结果等所有原有操作
2. WHEN 使用重构后的风险扫描页面 THEN 用户 SHALL 能够执行全文扫描、分段扫描、查看审查清单、导出报告等所有原有操作
3. WHEN 页面展示结果 THEN 结果格式和内容 SHALL 与原有实现保持一致
