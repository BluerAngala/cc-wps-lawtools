# Implementation Plan

- [x] 1. 创建 useWorkflowExecution composable


  - [x] 1.1 创建 `src/composables/useWorkflowExecution.js` 文件


    - 封装工作流执行状态管理（isExecuting, progress, result, error）
    - 提供 execute 方法调用 workflowEngine
    - 提供 reset 方法重置状态
    - _Requirements: 1.1, 2.2, 5.1, 5.2, 5.3_
  - [ ]* 1.2 编写 useWorkflowExecution 属性测试
    - **Property 4: 进度回调处理正确性**
    - **Property 5: 错误处理正确性**
    - **Validates: Requirements 2.2, 5.1, 5.2, 5.3**

- [x] 2. 新增风险扫描专用预设工作流



  - [x] 2.1 在 `presets.js` 中添加 `contractRiskScan` 预设

    - 步骤: READ_DOCUMENT → IDENTIFY_CONTRACT → REVIEW_CONTRACT
    - 默认参数: perspective='neutral', autoApply=false
    - _Requirements: 2.1_

- [x] 3. 重构脱敏页面 DesensitizePage.vue
  - [x] 3.1 引入 useWorkflowExecution composable 和工作流相关模块
    - 移除直接调用 desensitizeText 的代码
    - _Requirements: 4.1_
  - [x] 3.2 重构扫描功能
    - 使用 createWorkflowFromPreset('scan-sensitive') 执行扫描
    - 将白名单、自定义敏感词配置传入 stepParams
    - _Requirements: 1.1, 1.2, 3.1_
  - [x] 3.3 重构脱敏功能
    - 使用 createWorkflowFromPreset('desensitize-document') 执行脱敏
    - 从工作流结果中获取脱敏统计信息
    - _Requirements: 1.3, 1.4_
  - [x] 3.4 保留现有 UI 交互逻辑
    - 保持全选/取消全选、清除结果等功能
    - 保持结果列表展示格式不变
    - _Requirements: 6.1, 6.3_
  - [ ]* 3.5 编写脱敏页面属性测试
    - **Property 1: 工作流执行触发正确性**
    - **Property 3: 参数传递正确性**
    - **Validates: Requirements 1.1, 1.3, 3.1, 4.3**

- [x] 4. Checkpoint - 确保脱敏页面测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 重构风险扫描页面 ContractRiskScan.vue

  - [x] 5.1 引入 useWorkflowExecution composable 和工作流相关模块
    - 移除直接调用 ContractReviewEngine 和 ReviewAIService 的代码
    - _Requirements: 4.2_
  - [x] 5.2 重构扫描功能
    - 使用 createWorkflowFromPreset('contract-risk-scan') 执行扫描
    - 根据扫描策略传入 depth 参数
    - _Requirements: 2.1, 2.4, 3.2_
  - [x] 5.3 重构进度显示
    - 使用 composable 提供的 progress 状态
    - 保持现有进度 UI 组件不变
    - _Requirements: 2.2, 5.1, 5.2_
  - [x] 5.4 重构结果展示
    - 从工作流结果中获取 issues, risks, checklist
    - 保持现有结果展示格式不变
    - _Requirements: 2.3, 6.2, 6.3_
  - [x] 5.5 保留导出报告功能
    - 导出报告逻辑保持不变
    - _Requirements: 6.2_
  - [ ]* 5.6 编写风险扫描页面属性测试
    - **Property 2: 结果数据映射正确性**
    - **Property 3: 参数传递正确性**
    - **Validates: Requirements 2.3, 2.4, 3.2**

- [x] 6. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
