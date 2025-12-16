# Requirements Document

## Introduction

本功能重构文档风险扫描页面，基于现有工作流引擎架构，采用"选择视角 → 生成清单 → 确认清单 → 执行审查"的分步模式。支持多种法律文书类型、多种审查视角、多种扫描范围，通过工作流 action 组合实现灵活的审查流程。

## Glossary

- **审查视角（Review Perspective）**: 审查的立场角度，包括甲方视角、乙方视角、中立视角、自定义视角
- **审查清单（Review Checklist）**: 根据文档类型和审查视角生成的审查项目列表
- **文档类型（Document Type）**: 法律文书的类别，如合同、诉讼文书、律师函、协议书等
- **扫描范围（Scan Scope）**: 用户选择的扫描内容范围，包括全文、选中内容
- **工作流（Workflow）**: 由多个 action 步骤组成的执行流程，支持数据传递
- **Action**: 工作流中的单个操作步骤，如读取文档、识别类型、生成清单、执行审查等

## Requirements

### Requirement 1

**User Story:** 作为律师用户，我希望能选择审查视角，以便从特定立场分析文档风险。

#### Acceptance Criteria

1. WHEN 用户打开风险扫描页面 THEN 系统 SHALL 显示审查视角选项：甲方视角、乙方视角、中立视角
2. WHEN 用户选择甲方视角 THEN 系统 SHALL 重点关注对甲方不利的条款和风险
3. WHEN 用户选择乙方视角 THEN 系统 SHALL 重点关注对乙方不利的条款和风险
4. WHEN 用户选择中立视角 THEN 系统 SHALL 平衡分析双方的权利义务和潜在风险

### Requirement 2

**User Story:** 作为律师用户，我希望能选择扫描范围，以便只审查我关心的内容。

#### Acceptance Criteria

1. WHEN 用户打开风险扫描页面 THEN 系统 SHALL 提供两种扫描范围选项：全文扫描、选中内容扫描
2. WHEN 用户选择"选中内容扫描"且文档中有选中文本 THEN 系统 SHALL 仅对选中内容进行审查
3. WHEN 用户选择"选中内容扫描"但文档中无选中文本 THEN 系统 SHALL 提示用户先选中要扫描的内容

### Requirement 3

**User Story:** 作为律师用户，我希望在扫描前先看到审查清单，以便了解系统将检查哪些内容。

#### Acceptance Criteria

1. WHEN 用户点击"生成清单"按钮 THEN 系统 SHALL 执行工作流：读取文档 → 识别文档类型 → 生成审查清单
2. WHEN 文档类型识别完成 THEN 系统 SHALL 根据文档类型和审查视角生成对应的审查清单
3. WHEN 文档类型无法识别 THEN 系统 SHALL 使用通用审查清单并提示用户

### Requirement 4

**User Story:** 作为律师用户，我希望能够修改审查清单，以便根据具体案件需求调整审查重点。

#### Acceptance Criteria

1. WHEN 审查清单展示后 THEN 系统 SHALL 允许用户勾选或取消勾选每个审查项
2. WHEN 用户取消勾选某个审查项 THEN 系统 SHALL 在后续审查中跳过该项
3. WHEN 清单中有必需项 THEN 系统 SHALL 用特殊标记区分必需项和可选项

### Requirement 5

**User Story:** 作为律师用户，我希望确认清单后才开始审查，以便确保审查范围符合我的预期。

#### Acceptance Criteria

1. WHEN 用户点击"开始审查"按钮 THEN 系统 SHALL 执行工作流：按确认的清单项执行审查
2. WHEN 审查进行中 THEN 系统 SHALL 显示当前审查进度和正在检查的清单项
3. WHEN 审查完成 THEN 系统 SHALL 展示审查结果，并标注每个问题对应的清单项

### Requirement 6

**User Story:** 作为律师用户，我希望审查结果能够清晰展示每个问题与清单项的关联，以便快速定位问题类型。

#### Acceptance Criteria

1. WHEN 审查结果展示时 THEN 系统 SHALL 按清单项分组显示检测到的问题
2. WHEN 某个清单项未检测到问题 THEN 系统 SHALL 在清单中标记该项为"已通过"
3. WHEN 某个清单项检测到问题 THEN 系统 SHALL 显示问题数量和风险等级

### Requirement 7

**User Story:** 作为律师用户，我希望能够重置状态重新开始，以便在需要时调整审查参数。

#### Acceptance Criteria

1. WHEN 用户点击"重新生成"按钮 THEN 系统 SHALL 清除当前清单并重新执行文档类型识别
2. WHEN 用户点击"清除结果"按钮 THEN 系统 SHALL 清除审查结果但保留清单设置
