# Requirements Document

## Introduction

本功能为工作流页面新增 AI 智能生成能力，允许用户通过自然语言描述需求，由 AI 自动解析并生成对应的工作流配置。系统将基于现有的操作注册表（actionRegistry）中的操作类型和参数 Schema，智能匹配用户意图，生成可执行的工作流步骤，并在执行前让用户确认。

## Glossary

- **AI_Workflow_Generator**: AI 工作流生成器，负责将用户自然语言转换为工作流配置的服务模块
- **Action_Registry**: 操作注册表，存储所有可用操作的类型、名称、描述和参数 Schema
- **Workflow_Step**: 工作流步骤，包含 actionType（操作类型）和 params（参数配置）
- **Natural_Language_Input**: 用户输入的自然语言描述，描述期望的文档处理流程
- **Generated_Workflow**: AI 生成的工作流配置，包含一个或多个步骤

## Requirements

### Requirement 1

**User Story:** As a user, I want to describe my document processing needs in natural language, so that I can quickly create workflows without manually selecting and configuring each action.

#### Acceptance Criteria

1. WHEN a user enters a natural language description in the AI input field THEN the AI_Workflow_Generator SHALL parse the description and generate a corresponding workflow configuration
2. WHEN the AI_Workflow_Generator generates a workflow THEN the system SHALL display a preview of the generated steps with their configured parameters for user confirmation
3. WHEN a user confirms the generated workflow THEN the system SHALL add all steps to the current workflow step list
4. WHEN a user rejects or wants to modify the generated workflow THEN the system SHALL allow the user to edit the input and regenerate
5. IF the AI_Workflow_Generator cannot understand the user input THEN the system SHALL display a friendly error message with suggestions

### Requirement 2

**User Story:** As a user, I want the AI to understand the available actions and their parameters, so that the generated workflow is valid and executable.

#### Acceptance Criteria

1. WHEN generating a workflow THEN the AI_Workflow_Generator SHALL only use action types that exist in the Action_Registry
2. WHEN configuring action parameters THEN the AI_Workflow_Generator SHALL respect the parameter Schema defined by each action (types, enums, defaults)
3. WHEN an action has required parameters THEN the AI_Workflow_Generator SHALL provide appropriate values based on user intent or use sensible defaults
4. WHEN the user mentions specific values (e.g., "水印文字为机密") THEN the AI_Workflow_Generator SHALL use those exact values in the configuration

### Requirement 3

**User Story:** As a user, I want to see clear feedback during the AI generation process, so that I know the system is working and can understand the results.

#### Acceptance Criteria

1. WHEN the AI is processing the user input THEN the system SHALL display a loading indicator
2. WHEN the workflow is generated THEN the system SHALL display each step with its action name, icon, and key parameters
3. WHEN displaying the preview THEN the system SHALL highlight any parameters that were inferred by AI versus explicitly specified by user
4. WHEN the generation fails THEN the system SHALL display the error reason and suggest how to improve the input

