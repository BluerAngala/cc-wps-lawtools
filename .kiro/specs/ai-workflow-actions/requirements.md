# Requirements Document

## Introduction

本功能旨在将现有的 AI 操作（合同信息提取、合同类型识别、合同审查、法律风险评估等）原子化为工作流操作（Actions），集成到现有的工作流引擎中。通过这种方式，可以使用工作流来编排复杂的 AI 处理流程，实现合同审查等页面的重构，提高代码复用性和可维护性。

## Glossary

- **工作流引擎（Workflow Engine）**：负责执行工作流，管理步骤间的数据传递和进度追踪的核心组件
- **操作（Action）**：工作流中的原子操作单元，每个操作执行特定的功能
- **操作注册表（Action Registry）**：管理所有可用原子操作的注册中心
- **上下文（Context）**：工作流执行过程中传递的数据容器，包含文档内容、AI 结果等
- **AI 服务（AI Service）**：调用 AI API 进行智能分析的服务层
- **合同审查（Contract Review）**：对合同文档进行法律风险分析和问题识别的过程

## Requirements

### Requirement 1

**User Story:** As a developer, I want to have AI operations as atomic workflow actions, so that I can compose complex AI processing pipelines using the workflow engine.

#### Acceptance Criteria

1. WHEN the workflow engine initializes THEN the system SHALL register all AI actions to the action registry
2. WHEN an AI action is registered THEN the system SHALL provide type, name, description, icon, and parameter schema
3. WHEN listing available actions THEN the system SHALL include all AI actions alongside existing document actions

### Requirement 2

**User Story:** As a user, I want to identify contract type through workflow, so that subsequent AI operations can use the identified type for better analysis.

#### Acceptance Criteria

1. WHEN the contract type identification action executes THEN the system SHALL call the AI service to analyze document content
2. WHEN contract type is identified THEN the system SHALL store the result (type, subtype, confidence) in workflow context
3. IF the document content is empty THEN the system SHALL return an error result with appropriate message
4. WHEN identification completes THEN the system SHALL return success result with contract type data

### Requirement 3

**User Story:** As a user, I want to extract contract elements through workflow, so that I can get structured contract information automatically.

#### Acceptance Criteria

1. WHEN the contract extraction action executes THEN the system SHALL call the AI service with document content and extract tags
2. WHEN extraction completes THEN the system SHALL parse the AI response into structured data
3. WHEN extraction completes THEN the system SHALL store extracted elements in workflow context for subsequent steps
4. IF extract tags parameter is provided THEN the system SHALL use custom tags instead of default ones
5. IF the AI response cannot be parsed THEN the system SHALL return an error result with the raw response

### Requirement 4

**User Story:** As a user, I want to perform contract review through workflow, so that I can identify legal risks and issues in contracts.

#### Acceptance Criteria

1. WHEN the contract review action executes THEN the system SHALL call the AI service with document content and review options
2. WHEN review completes THEN the system SHALL return issues array with keyword, comment, position, and risk level
3. WHEN review completes THEN the system SHALL store review results in workflow context
4. IF contract type is available in context THEN the system SHALL use it for more accurate review
5. IF auto-apply option is enabled THEN the system SHALL add comments to the document for each issue

### Requirement 5

**User Story:** As a user, I want to perform global contract analysis through workflow, so that I can get an overview of contract structure and risk areas.

#### Acceptance Criteria

1. WHEN the global analysis action executes THEN the system SHALL analyze the entire document for structure and risks
2. WHEN analysis completes THEN the system SHALL return contract structure, risk areas with risk levels, and overall assessment
3. WHEN analysis completes THEN the system SHALL store analysis results in workflow context
4. IF analysis fails THEN the system SHALL fallback to basic contract type identification

### Requirement 6

**User Story:** As a user, I want AI actions to support progress callbacks, so that I can show real-time progress in the UI.

#### Acceptance Criteria

1. WHEN an AI action starts execution THEN the system SHALL emit progress event with stage information
2. WHILE an AI action is processing THEN the system SHALL emit progress events with current status
3. WHEN an AI action completes THEN the system SHALL emit final progress event with completion status
4. WHEN progress callback is provided in params THEN the system SHALL invoke it with progress information

### Requirement 7

**User Story:** As a user, I want to chain AI actions in a workflow, so that I can build complex contract processing pipelines.

#### Acceptance Criteria

1. WHEN multiple AI actions are chained THEN the system SHALL pass context data between steps
2. WHEN a previous step produces contract type THEN subsequent steps SHALL access it from context
3. WHEN a previous step produces extracted elements THEN subsequent steps SHALL access them from context
4. IF a step fails THEN the workflow SHALL stop and return error with failed step information

### Requirement 8

**User Story:** As a developer, I want preset workflow templates for common contract processing scenarios, so that users can quickly start with recommended configurations.

#### Acceptance Criteria

1. WHEN the system initializes THEN the system SHALL provide preset workflow for full contract review
2. WHEN the system initializes THEN the system SHALL provide preset workflow for contract element extraction
3. WHEN a preset workflow is selected THEN the system SHALL load the predefined steps and parameters
4. WHEN preset workflows are listed THEN the system SHALL show name, description, and included steps

