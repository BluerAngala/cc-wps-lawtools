# Requirements Document

## Introduction

本需求文档描述合同审查页面（ContractServices.vue）的重构计划。当前页面将"关键词批注"、"AI预审"和"AI+律师"三种模式放在同一个折叠面板的子按钮中，导致入口层级过深，用户体验不佳。

重构目标是将这三种模式拆分为三个独立的折叠面板，并复用现有的风险扫描（ContractRiskScan.vue）和工作流引擎（workflowEngine.js）来重构 AI 审查功能，实现更清晰的用户界面和更统一的代码架构。

## Glossary

- **ContractServices**：合同服务页面，提供合同信息提取、智能文档处理、工作流执行等功能
- **SmartCommenter**：智能批注组件，当前包含关键词批注、AI预审、AI+律师三种模式（将被拆分）
- **关键词批注**：基于预设关键词列表，匹配文档内容并添加固定批注
- **AI全流程审查（原AI预审）**：AI 根据合同类型自动生成审查清单，执行审查后由 AI 生成修改建议（批注或修订）
- **AI+律师共同审查**：审查清单 = AI 生成清单 + 律师配置清单；修改建议 = AI 生成建议 + 律师预设意见
- **工作流引擎（WorkflowEngine）**：负责执行工作流，管理步骤间的数据传递和进度追踪
- **风险扫描（ContractRiskScan）**：使用 AI 智能分析文档内容，识别潜在风险点
- **审查清单（Checklist）**：根据合同类型生成的审查项目列表
- **方案（Scheme）**：用户保存的关键词或审查规则配置
- **修改建议（Suggestion）**：针对审查发现的问题，提出的具体修改方案，包含操作类型（批注/修订）和内容
- **批注（Comment）**：在文档中添加注释说明，不修改原文
- **修订（Revision）**：直接修改文档原文内容
- **二次确认**：在执行修改操作前，向用户展示即将执行的操作列表并请求确认

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望在合同服务页面看到三个独立的折叠面板，分别对应关键词批注、AI全流程审查、AI+律师共同审查，以便快速找到并使用所需功能。

#### Acceptance Criteria

1. WHEN 用户打开合同服务页面 THEN ContractServices 页面 SHALL 显示三个独立的折叠面板：关键词修订批注、AI全流程审查、AI+律师共同审查
2. WHEN 用户点击任一折叠面板 THEN ContractServices 页面 SHALL 展开该面板并折叠其他面板（手风琴模式）
3. WHEN 用户查看折叠面板标题 THEN ContractServices 页面 SHALL 在标题区域显示功能图标、名称和处理状态标签

### Requirement 2

**User Story:** 作为用户，我希望关键词修订批注功能保持独立，以便快速使用关键词匹配和批注功能。

#### Acceptance Criteria

1. WHEN 用户展开关键词修订批注面板 THEN 系统 SHALL 显示方案选择器和关键词配置表单
2. WHEN 用户点击开始处理按钮 THEN 系统 SHALL 执行关键词匹配并添加批注
3. WHEN 用户切换方案 THEN 系统 SHALL 加载对应方案的关键词列表

### Requirement 3

**User Story:** 作为用户，我希望 AI 全流程审查功能复用风险扫描的交互模式，并在审查结果基础上获得 AI 生成的修改建议，以便快速完成合同审查和修订。

#### Acceptance Criteria

1. WHEN 用户展开 AI 全流程审查面板 THEN 系统 SHALL 显示审查视角选择（甲方/乙方/中立/自定义）
2. WHEN 用户点击开始任务按钮 THEN 系统 SHALL 调用工作流引擎执行合同类型识别和 AI 生成审查清单
3. WHEN 清单生成完成 THEN 系统 SHALL 显示 AI 生成的可编辑审查清单列表
4. WHEN 用户点击开始审查按钮 THEN 系统 SHALL 调用工作流引擎执行审查并显示进度
5. WHEN 审查完成 THEN 系统 SHALL 显示审查结果统计、问题列表和 AI 生成的修改建议
6. WHEN AI 生成修改建议 THEN 系统 SHALL 为每个问题提供建议的操作类型（批注或修订）和具体内容
7. WHEN 用户查看修改建议列表 THEN 系统 SHALL 允许用户勾选要执行的建议项
8. WHEN 用户点击应用修改按钮 THEN 系统 SHALL 显示二次确认弹窗，列出即将执行的操作
9. WHEN 用户确认执行 THEN 系统 SHALL 按照建议执行批注或修订操作

### Requirement 4

**User Story:** 作为用户，我希望 AI+律师共同审查功能在 AI 全流程审查基础上支持自定义审查清单和修改意见，以便结合律师专业经验进行审查。

#### Acceptance Criteria

1. WHEN 用户展开 AI+律师共同审查面板 THEN 系统 SHALL 显示审查视角选择、方案选择器和自定义规则配置区域
2. WHEN 用户配置自定义审查规则 THEN 系统 SHALL 允许用户设置审查要点和对应的修改意见（批注或修订内容）
3. WHEN 用户点击开始任务按钮 THEN 系统 SHALL 将 AI 生成的审查清单与律师配置的审查清单合并
4. WHEN 审查完成 THEN 系统 SHALL 显示 AI 生成的修改建议与律师预设的修改意见的合并结果
5. WHEN 用户切换方案 THEN 系统 SHALL 加载对应方案的自定义审查规则和修改意见
6. WHEN 用户查看修改建议列表 THEN 系统 SHALL 区分显示 AI 建议和律师预设意见的来源
7. WHEN 用户点击应用修改按钮 THEN 系统 SHALL 显示二次确认弹窗，列出即将执行的操作
8. WHEN 用户确认执行 THEN 系统 SHALL 按照建议执行批注或修订操作

### Requirement 5

**User Story:** 作为开发者，我希望 AI 审查功能复用工作流引擎，以便统一代码架构和简化维护。

#### Acceptance Criteria

1. WHEN AI 审查功能执行时 THEN 系统 SHALL 通过 useWorkflowExecution composable 调用工作流引擎
2. WHEN 工作流执行过程中 THEN 系统 SHALL 通过 onProgress 回调更新界面进度显示
3. WHEN 工作流执行完成 THEN 系统 SHALL 通过 getResultData 获取审查结果数据

### Requirement 6

**User Story:** 作为用户，我希望在审查过程中看到清晰的进度反馈，以便了解当前处理状态。

#### Acceptance Criteria

1. WHEN 系统正在识别合同类型 THEN 系统 SHALL 显示"正在识别合同类型"进度提示
2. WHEN 系统正在生成审查清单 THEN 系统 SHALL 显示"正在生成审查清单"进度提示
3. WHEN 系统正在执行审查 THEN 系统 SHALL 显示当前审查进度（如"正在审查第 X/Y 段"）
4. WHEN 审查完成 THEN 系统 SHALL 显示审查结果统计信息

### Requirement 7

**User Story:** 作为用户，我希望在执行修改操作前进行二次确认，以便避免误操作导致文档被错误修改。

#### Acceptance Criteria

1. WHEN 用户点击应用修改按钮 THEN 系统 SHALL 弹出确认对话框
2. WHEN 确认对话框显示时 THEN 系统 SHALL 列出所有即将执行的操作（批注数量、修订数量）
3. WHEN 用户点击确认按钮 THEN 系统 SHALL 执行选中的修改操作
4. WHEN 用户点击取消按钮 THEN 系统 SHALL 关闭对话框且不执行任何操作
5. WHEN 修改操作执行完成 THEN 系统 SHALL 显示执行结果统计（成功数、失败数）

