# Requirements Document

## Introduction

本功能为 AI 工作流操作添加实用参数配置，包括审查视角、审查深度、关注领域等场景化参数，并创建多个预设工作流模板。用户可以通过选择预设快速开始，高级用户可以微调参数。同时提供自定义指令（customPrompt）作为补充，满足个性化需求。

## Glossary

- **审查视角（perspective）**: 指定 AI 从甲方、乙方或中立视角进行合同分析
- **审查深度（depth）**: 控制 AI 分析的详细程度，分为快速、标准、深度三档
- **关注领域（focusAreas）**: 指定 AI 重点关注的合同条款类型
- **customPrompt**: 用户自定义指令，用自然语言补充说明特殊需求
- **预设工作流**: 针对特定场景预配置好参数的工作流模板

## Requirements

### Requirement 1

**User Story:** As a 律师用户, I want to 选择审查视角, so that AI 能从我方立场分析合同风险。

#### Acceptance Criteria

1. WHEN 用户编辑「审查合同」操作 THEN THE 系统 SHALL 显示视角选择器，包含「甲方视角」「乙方视角」「中立视角」三个选项
2. WHEN 用户选择「甲方视角」THEN THE 系统 SHALL 让 AI 重点识别对甲方不利的条款
3. WHEN 用户选择「乙方视角」THEN THE 系统 SHALL 让 AI 重点识别对乙方不利的条款
4. WHEN 用户选择「中立视角」THEN THE 系统 SHALL 让 AI 平衡分析双方权利义务

### Requirement 2

**User Story:** As a 律师用户, I want to 选择审查深度, so that I can 根据时间预算选择合适的分析详细程度。

#### Acceptance Criteria

1. WHEN 用户编辑「审查合同」或「全局分析」操作 THEN THE 系统 SHALL 显示深度选择器，包含「快速」「标准」「深度」三个选项
2. WHEN 用户选择「快速」THEN THE 系统 SHALL 让 AI 只识别重大风险点
3. WHEN 用户选择「标准」THEN THE 系统 SHALL 让 AI 进行全面审查
4. WHEN 用户选择「深度」THEN THE 系统 SHALL 让 AI 逐条详细分析

### Requirement 3

**User Story:** As a 律师用户, I want to 指定关注领域, so that AI 能优先分析我关心的条款。

#### Acceptance Criteria

1. WHEN 用户编辑「审查合同」操作 THEN THE 系统 SHALL 显示关注领域多选框
2. WHEN 关注领域选项 THEN THE 系统 SHALL 包含：违约责任、付款条款、保密条款、知识产权、争议解决、不可抗力
3. WHEN 用户选择特定领域 THEN THE 系统 SHALL 让 AI 优先分析这些领域的条款

### Requirement 4

**User Story:** As a 律师用户, I want to 使用预设工作流, so that I can 一键开始常见场景的合同审查。

#### Acceptance Criteria

1. WHEN 用户查看预设工作流 THEN THE 系统 SHALL 显示至少 6 个场景化预设
2. WHEN 预设工作流列表 THEN THE 系统 SHALL 包含：甲方快速审查、乙方深度审查、签约前风险扫描、续签合同审查、劳动合同审查、采购合同审查
3. WHEN 用户选择预设 THEN THE 系统 SHALL 自动填充所有步骤及其参数配置

### Requirement 5

**User Story:** As a 高级用户, I want to 添加自定义指令, so that I can 补充说明预设参数无法覆盖的特殊需求。

#### Acceptance Criteria

1. WHEN 用户编辑任意 AI 操作 THEN THE 系统 SHALL 显示「自定义指令」文本输入框
2. WHEN 自定义指令输入框 THEN THE 系统 SHALL 显示占位提示示例
3. WHEN AI 操作执行时存在 customPrompt THEN THE 系统 SHALL 将其融入 AI 的 prompt 中
4. WHEN 自定义指令为空 THEN THE 系统 SHALL 正常执行，不影响其他参数

### Requirement 6

**User Story:** As a 律师用户, I want to 提取合同要素时选择提取模式, so that I can 控制提取的详细程度。

#### Acceptance Criteria

1. WHEN 用户编辑「提取合同要素」操作 THEN THE 系统 SHALL 显示提取模式选择器
2. WHEN 提取模式选项 THEN THE 系统 SHALL 包含：「基础要素」「完整要素」两个选项
3. WHEN 用户选择「基础要素」THEN THE 系统 SHALL 只提取甲乙方、金额、日期等核心信息
4. WHEN 用户选择「完整要素」THEN THE 系统 SHALL 提取所有可识别的合同要素
