# Implementation Plan

- [x] 1. 扩展 AIBaseAction 基类




  - [ ] 1.1 添加 buildEnhancedPrompt 方法
    - 实现 perspective、depth、focusAreas、customPrompt 参数到 prompt 的转换
    - 处理空值和默认值情况
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.3, 5.3_
  - [ ]* 1.2 编写 buildEnhancedPrompt 属性测试
    - **Property 1: 视角参数融入 prompt**
    - **Property 2: 深度参数融入 prompt**
    - **Property 3: 关注领域融入 prompt**




    - **Property 5: customPrompt 融入 prompt**
    - **Validates: Requirements 1.2-1.4, 2.2-2.4, 3.3, 5.3**

- [x] 2. 扩展审查合同操作 Schema


  - [ ] 2.1 更新 reviewContract.js 的 getSchema 方法
    - 添加 perspective 枚举参数（partyA/partyB/neutral）




    - 添加 depth 枚举参数（quick/standard/deep）
    - 添加 focusAreas 数组参数


    - 添加 customPrompt 文本参数
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 5.1, 5.2_
  - [ ] 2.2 更新 reviewContract.js 的 execute 方法
    - 调用 buildEnhancedPrompt 构建增强 prompt
    - 将增强 prompt 传递给合同审查引擎

    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.3, 5.3_






- [x] 3. 扩展提取合同要素操作 Schema




  - [x] 3.1 更新 extractContract.js 的 getSchema 方法


    - 添加 extractMode 枚举参数（basic/full）




    - 添加 customPrompt 文本参数
    - _Requirements: 6.1, 6.2, 5.1, 5.2_
  - [ ] 3.2 更新 extractContract.js 的 execute 方法
    - 根据 extractMode 调整提取逻辑
    - 调用 buildEnhancedPrompt 构建增强 prompt




    - _Requirements: 6.3, 6.4, 5.3_
  - [ ]* 3.3 编写提取模式属性测试
    - **Property 6: 提取模式融入 prompt**
    - **Validates: Requirements 6.3, 6.4**


- [ ] 4. 扩展全局分析操作 Schema
  - [x] 4.1 更新 globalAnalysis.js 的 getSchema 方法



    - 添加 depth 枚举参数


    - 添加 customPrompt 文本参数
    - _Requirements: 2.1, 5.1, 5.2_
  - [ ] 4.2 更新 globalAnalysis.js 的 execute 方法
    - 调用 buildEnhancedPrompt 构建增强 prompt
    - _Requirements: 2.2, 2.3, 2.4, 5.3_

- [ ] 5. 扩展识别合同类型操作 Schema
  - [ ] 5.1 更新 identifyContract.js 的 getSchema 方法
    - 添加 customPrompt 文本参数
    - _Requirements: 5.1, 5.2_
  - [ ] 5.2 更新 identifyContract.js 的 execute 方法
    - 调用 buildEnhancedPrompt 构建增强 prompt
    - _Requirements: 5.3_

- [ ] 6. 添加场景化预设工作流
  - [ ] 6.1 在 presets.js 中添加 6 个新预设
    - 甲方快速审查、乙方深度审查、签约前风险扫描
    - 续签合同审查、劳动合同审查、采购合同审查
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 6.2 编写预设工作流完整性测试
    - **Property 4: 预设工作流完整性**
    - **Validates: Requirements 4.3**

- [ ] 7. 增强编辑弹窗 UI
  - [ ] 7.1 更新 WorkflowPage.vue 编辑弹窗
    - 支持 enumLabels 显示友好标签
    - 支持 inputType: 'textarea' 多行输入
    - 支持 type: 'array' + options 多选框组
    - 显示 placeholder 提示文本
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 5.1, 5.2, 6.1, 6.2_

- [ ] 8. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. 更新 getEnumLabel 函数
  - [ ] 9.1 扩展枚举标签映射
    - 添加 perspective、depth、extractMode 的中文标签
    - _Requirements: 1.1, 2.1, 6.1_

- [ ] 10. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
