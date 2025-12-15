# Requirements Document

## Introduction

本功能为 WPS 插件提供一个工作流引擎，将文档操作抽象为可复用的「原子操作」，用户可以通过组合这些操作来构建自定义工作流。这种设计让复杂的文档处理流程变得简单、可视化、可配置。

## Glossary

- **Workflow_Engine（工作流引擎）**: 负责管理和执行工作流的核心模块
- **Atomic_Action（原子操作）**: 最小粒度的文档操作单元，如添加页眉、添加批注等
- **Workflow（工作流）**: 由多个原子操作按顺序组成的操作序列
- **Action_Registry（操作注册表）**: 存储所有可用原子操作的注册中心
- **Workflow_Context（工作流上下文）**: 在工作流执行过程中传递数据的容器
- **Step_Result（步骤结果）**: 单个操作执行后的结果对象

## Requirements

### Requirement 1: 原子操作定义

**User Story:** As a 开发者, I want 定义标准化的原子操作接口, so that 所有文档操作都能以统一的方式被调用和组合。

#### Acceptance Criteria

1. THE Workflow_Engine SHALL 提供统一的原子操作接口，包含 execute、validate、getSchema 方法
2. THE Workflow_Engine SHALL 支持以下原子操作类型：
   - addHeader（添加页眉）
   - addComment（添加批注）
   - addRevision（添加修订）
   - renameDocument（重命名文档）
   - exportPDF（导出PDF）
   - deleteFile（删除文件）
   - readDocument（读取文档内容）
   - saveDocument（保存文档）
3. WHEN 原子操作执行完成 THEN Workflow_Engine SHALL 返回包含 success、message、data 字段的 Step_Result
4. WHEN 原子操作需要参数 THEN Workflow_Engine SHALL 通过 getSchema 方法返回参数的 JSON Schema 定义

### Requirement 2: 操作注册与管理

**User Story:** As a 开发者, I want 通过注册表管理所有原子操作, so that 可以动态添加、查询和使用操作。

#### Acceptance Criteria

1. THE Action_Registry SHALL 提供 register 方法用于注册新的原子操作
2. THE Action_Registry SHALL 提供 get 方法用于获取指定类型的原子操作
3. THE Action_Registry SHALL 提供 list 方法用于列出所有已注册的原子操作
4. WHEN 注册重复的操作类型 THEN Action_Registry SHALL 覆盖已有的操作定义

### Requirement 3: 工作流定义与执行

**User Story:** As a 用户, I want 通过配置定义工作流, so that 可以按顺序执行多个操作。

#### Acceptance Criteria

1. THE Workflow_Engine SHALL 支持通过 JSON 配置定义工作流，包含 id、name、steps 字段
2. WHEN 执行工作流 THEN Workflow_Engine SHALL 按 steps 数组顺序依次执行每个操作
3. WHEN 某个步骤执行失败 THEN Workflow_Engine SHALL 停止执行后续步骤并返回错误信息
4. THE Workflow_Engine SHALL 在步骤间通过 Workflow_Context 传递数据
5. WHEN 工作流执行完成 THEN Workflow_Engine SHALL 返回包含所有步骤结果的汇总报告

### Requirement 4: 工作流执行进度追踪

**User Story:** As a 用户, I want 实时查看工作流执行进度, so that 了解当前执行状态。

#### Acceptance Criteria

1. THE Workflow_Engine SHALL 提供 onProgress 回调函数用于报告执行进度
2. WHEN 每个步骤开始执行 THEN Workflow_Engine SHALL 通过 onProgress 报告当前步骤索引和总步骤数
3. WHEN 每个步骤执行完成 THEN Workflow_Engine SHALL 通过 onProgress 报告该步骤的执行结果

### Requirement 5: 工作流页面展示

**User Story:** As a 用户, I want 在界面上查看和执行工作流, so that 可以直观地操作文档处理流程。

#### Acceptance Criteria

1. THE 工作流页面 SHALL 展示所有可用的原子操作列表
2. THE 工作流页面 SHALL 允许用户选择操作并配置参数
3. THE 工作流页面 SHALL 展示当前工作流的步骤列表
4. WHEN 用户点击执行按钮 THEN 工作流页面 SHALL 按顺序执行所有步骤并显示进度
5. WHEN 工作流执行完成 THEN 工作流页面 SHALL 显示执行结果汇总

### Requirement 6: 预设工作流模板

**User Story:** As a 用户, I want 使用预设的工作流模板, so that 可以快速完成常见的文档处理任务。

#### Acceptance Criteria

1. THE Workflow_Engine SHALL 提供至少 2 个预设工作流模板
2. THE 预设模板 SHALL 包含「文档归档」工作流（添加编号 → 重命名 → 导出PDF）
3. THE 预设模板 SHALL 包含「快速批注」工作流（读取文档 → 添加批注）
4. WHEN 用户选择预设模板 THEN 工作流页面 SHALL 自动填充对应的步骤配置
