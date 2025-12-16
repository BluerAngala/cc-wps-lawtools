# Requirements Document

## Introduction

本功能旨在将工作流配置和执行能力统一化，创建一个可复用的工作流选择器组件。该组件支持选择预设工作流、用户保存的工作流，以及通过弹窗方式快速配置新工作流。合同审查页面和其他页面可以通过该组件灵活调用工作流，而不是硬编码固定的流程。

## Glossary

- **WorkflowSelector（工作流选择器）**: 可复用的工作流选择和配置组件
- **WorkflowConfigModal（工作流配置弹窗）**: 用于配置工作流步骤的弹窗组件
- **预设工作流**: 系统内置的工作流模板，存储在 presets.js 中
- **用户工作流**: 用户自定义并保存的工作流，存储在 workflowStorage 中
- **工作流步骤**: 工作流中的单个操作，包含 actionType、name 和 params

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望在合同审查页面能够选择并执行任意工作流，以便灵活处理不同的合同审查场景。

#### Acceptance Criteria

1. WHEN 用户点击工作流选择器 THEN WorkflowSelector 组件 SHALL 显示所有可用的预设工作流和用户保存的工作流列表
2. WHEN 用户选择一个工作流 THEN WorkflowSelector 组件 SHALL 显示该工作流的步骤预览
3. WHEN 用户点击执行按钮 THEN WorkflowSelector 组件 SHALL 执行选中的工作流并显示进度
4. WHEN 工作流执行完成 THEN WorkflowSelector 组件 SHALL 显示执行结果摘要

### Requirement 2

**User Story:** 作为用户，我希望能够通过弹窗快速配置新的工作流，以便在不离开当前页面的情况下创建自定义工作流。

#### Acceptance Criteria

1. WHEN 用户点击"新建工作流"按钮 THEN WorkflowConfigModal 组件 SHALL 打开工作流配置弹窗
2. WHEN 用户在配置弹窗中添加操作步骤 THEN WorkflowConfigModal 组件 SHALL 将步骤添加到当前工作流定义中
3. WHEN 用户点击保存按钮 THEN WorkflowConfigModal 组件 SHALL 将工作流保存到 workflowStorage 并关闭弹窗
4. WHEN 用户点击"仅执行"按钮 THEN WorkflowConfigModal 组件 SHALL 执行当前配置的工作流但不保存

### Requirement 3

**User Story:** 作为用户，我希望能够编辑已保存的工作流，以便根据需要调整工作流配置。

#### Acceptance Criteria

1. WHEN 用户点击工作流的编辑按钮 THEN WorkflowConfigModal 组件 SHALL 打开弹窗并加载该工作流的配置
2. WHEN 用户修改工作流步骤后点击保存 THEN WorkflowConfigModal 组件 SHALL 更新 workflowStorage 中的工作流定义
3. WHEN 用户点击删除按钮 THEN WorkflowSelector 组件 SHALL 从 workflowStorage 中删除该工作流

### Requirement 4

**User Story:** 作为开发者，我希望 WorkflowSelector 组件能够被多个页面复用，以便统一工作流的调用方式。

#### Acceptance Criteria

1. WHEN WorkflowSelector 组件被引入到任意页面 THEN WorkflowSelector 组件 SHALL 独立管理自身状态和工作流执行
2. WHEN 父组件传入 category 属性 THEN WorkflowSelector 组件 SHALL 仅显示指定分类的工作流
3. WHEN 父组件传入 onComplete 回调 THEN WorkflowSelector 组件 SHALL 在工作流执行完成后调用该回调并传递结果
4. WHEN 父组件传入 compact 属性 THEN WorkflowSelector 组件 SHALL 以紧凑模式显示，适合嵌入折叠面板

### Requirement 5

**User Story:** 作为用户，我希望工作流配置弹窗提供与 WorkflowPage 相同的配置能力，以便完整地自定义工作流。

#### Acceptance Criteria

1. WHEN 配置弹窗打开 THEN WorkflowConfigModal 组件 SHALL 显示所有可用的 AI 操作和文档操作
2. WHEN 用户点击操作项 THEN WorkflowConfigModal 组件 SHALL 将该操作添加到工作流步骤列表
3. WHEN 用户点击步骤的编辑按钮 THEN WorkflowConfigModal 组件 SHALL 显示该步骤的参数编辑表单
4. WHEN 用户拖拽步骤 THEN WorkflowConfigModal 组件 SHALL 调整步骤的执行顺序
