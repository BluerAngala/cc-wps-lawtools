# Implementation Plan

- [x] 1. 创建 AI Action 基础设施



  - [x] 1.1 创建 AIBaseAction 基类

    - 在 `src/services/workflow/actions/` 目录下创建 `aiBaseAction.js`
    - 继承 BaseAction，添加 category 属性和 emitProgress 方法
    - _Requirements: 1.2_

  - [x] 1.2 扩展 ActionTypes 常量

    - 在 `src/services/workflow/types.js` 中添加 AI 操作类型常量
    - 添加 IDENTIFY_CONTRACT, EXTRACT_CONTRACT, REVIEW_CONTRACT, GLOBAL_ANALYSIS
    - _Requirements: 1.1_
  - [ ]* 1.3 编写属性测试：AI Actions 注册完整性
    - **Property 1: AI Actions Registration Completeness**
    - **Validates: Requirements 1.1, 1.2**



- [x] 2. 实现合同类型识别操作

  - [x] 2.1 创建 IdentifyContractAction

    - 在 `src/services/workflow/actions/` 目录下创建 `identifyContract.js`
    - 实现 execute 方法，调用 reviewAIService.identifyContractType
    - 将结果存储到 context.data.contractType
    - _Requirements: 2.1, 2.2, 2.4_
  - [ ]* 2.2 编写属性测试：合同类型上下文存储
    - **Property 3: Contract Type Context Storage**
    - **Validates: Requirements 2.2, 2.4**


- [x] 3. 实现合同要素提取操作

  - [x] 3.1 创建 ExtractContractAction


    - 在 `src/services/workflow/actions/` 目录下创建 `extractContract.js`
    - 实现 execute 方法，调用 processContractElements
    - 支持自定义 extractTags 参数
    - 将结果存储到 context.data.extractedElements
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 3.2 编写属性测试：提取结果结构
    - **Property 4: Extraction Result Structure**
    - **Validates: Requirements 3.2, 3.3**

- [x] 4. 实现合同审查操作



  - [x] 4.1 创建 ReviewContractAction

    - 在 `src/services/workflow/actions/` 目录下创建 `reviewContract.js`
    - 实现 execute 方法，调用 contractReviewEngine.review
    - 支持 strategy, useCustomRules, autoApply 参数
    - 从 context.data.contractType 获取合同类型（如果存在）
    - 将结果存储到 context.data.reviewResult
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 4.2 编写属性测试：审查结果结构
    - **Property 6: Review Result Structure**
    - **Validates: Requirements 4.2, 4.3**
  - [ ]* 4.3 编写属性测试：上下文合同类型使用
    - **Property 7: Context Contract Type Usage**
    - **Validates: Requirements 4.4**


- [-] 5. 实现全局分析操作

  - [x] 5.1 创建 GlobalAnalysisAction


    - 在 `src/services/workflow/actions/` 目录下创建 `globalAnalysis.js`
    - 实现 execute 方法，调用 reviewAIService.analyzeGlobal
    - 将结果存储到 context.data.globalAnalysis
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 5.2 编写属性测试：进度事件生命周期
    - **Property 8: Progress Event Lifecycle**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**


- [-] 6. 注册 AI Actions 并更新索引


  - [x] 6.1 更新 actions/index.js

    - 导入所有 AI actions
    - 将 AI actions 添加到 allActions 数组
    - 更新 registerAllActions 函数
    - _Requirements: 1.1, 1.3_
  - [ ]* 6.2 编写属性测试：Action Schema 完整性
    - **Property 2: Action Schema Completeness**
    - **Validates: Requirements 1.2**


- [ ] 7. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.


- [-] 8. 添加预设工作流模板


  - [x] 8.1 扩展 presets.js

    - 添加 aiWorkflowPresets 对象
    - 实现 fullContractReview 预设
    - 实现 contractExtraction 预设
    - 实现 quickRiskScan 预设
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 8.2 编写属性测试：预设工作流结构
    - **Property 10: Preset Workflow Structure**
    - **Validates: Requirements 8.3, 8.4**


- [-] 9. 实现上下文数据传递


  - [x] 9.1 验证并优化上下文传递逻辑

    - 确保 workflowEngine 正确传递 context.data
    - 验证 AI actions 之间的数据共享
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 9.2 编写属性测试：上下文数据传递
    - **Property 9: Context Data Propagation**
    - **Validates: Requirements 7.1, 7.2, 7.3**


- [ ] 10. 更新 WorkflowPage 集成
  - [x] 10.1 在 WorkflowPage 中展示 AI Actions


    - 更新操作选择器，显示 AI 操作分类
    - 为 AI 操作添加参数配置 UI
    - _Requirements: 1.3_

  - [ ] 10.2 添加预设工作流选择功能
    - 在 UI 中添加预设工作流下拉选择
    - 选择预设后自动加载步骤
    - _Requirements: 8.3, 8.4_

- [x] 11. Final Checkpoint - 确保所有测试通过


  - Ensure all tests pass, ask the user if questions arise.

