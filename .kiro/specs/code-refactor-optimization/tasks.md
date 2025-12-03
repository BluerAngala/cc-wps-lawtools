# Implementation Plan

- [x] 1. 创建 useWpsEnvironment composable




  - [ ] 1.1 创建 `src/composables/useWpsEnvironment.js` 文件
    - 实现 isAvailable、application、activeDocument、error 响应式状态
    - 实现 checkEnvironment、getDocument、getFullText 方法
    - 统一错误提示逻辑
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 1.2 编写 useWpsEnvironment 属性测试
    - **Property 1: WPS 环境检查一致性**




    - **Property 2: 文档对象正确性**

    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 2. 创建公共组件目录和基础组件

  - [ ] 2.1 创建 `src/components/common/` 目录结构
    - 创建 index.js 统一导出文件
    - _Requirements: 5.1_
  - [ ] 2.2 创建 PageLayout 组件
    - 实现统一的页面容器结构
    - 包含 NConfigProvider 和滚动容器
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.3 创建 PageHeader 组件

    - 实现 title、icon、loading、loadingText props
    - 实现 tag、actions、description slots
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 2.4 编写 PageHeader 属性测试
    - **Property 3: PageHeader 属性渲染**
    - **Property 4: PageHeader 加载状态**
    - **Validates: Requirements 2.1, 2.4**


- [ ] 3. 创建 EmptyState 和 ProcessingStatus 组件
  - [ ] 3.1 创建 EmptyState 组件
    - 实现 description、icon props
    - 实现 action slot
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x]* 3.2 编写 EmptyState 属性测试

    - **Property 5: EmptyState 图标渲染**
    - **Property 6: EmptyState 描述渲染**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 3.3 创建 ProcessingStatus 组件

    - 实现 stage、current、total props
    - 实现进度条和进度数值显示
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x]* 3.4 编写 ProcessingStatus 属性测试

    - **Property 7: ProcessingStatus 进度显示**


    - **Property 8: ProcessingStatus 错误显示**

    - **Validates: Requirements 4.1, 4.2, 4.4**


- [ ] 4. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.



- [x] 5. 创建 NaiveUI 组件统一导出文件

  - [x] 5.1 创建 `src/components/naive-components.js`

    - 按功能分组导出常用组件（布局、表单、反馈、数据展示、配置）


    - _Requirements: 5.1, 5.2_

  - [x]* 5.2 编写组件导出有效性测试

    - **Property 9: NaiveUI 组件导出有效性**



    - **Validates: Requirements 5.1**


- [ ] 6. 重构 ContractRiskScan 页面
  - [x] 6.1 使用 PageLayout 替换页面容器




    - 移除重复的 NConfigProvider 和滚动容器代码
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 使用 PageHeader 替换标题区域


    - 使用 props 和 slots 配置标题、按钮、说明
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ] 6.3 使用 useWpsEnvironment 替换环境检查代码
    - 移除重复的 WPS 环境检查逻辑
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 6.4 使用 ProcessingStatus 替换进度显示
    - _Requirements: 4.1, 4.2_
  - [ ] 6.5 使用 EmptyState 替换空状态显示
    - _Requirements: 3.1_
  - [ ] 6.6 使用统一导出替换组件导入
    - _Requirements: 5.1_

- [ ] 7. 重构 DesensitizePage 页面
  - [ ] 7.1 使用公共组件重构页面结构
    - 应用 PageLayout、PageHeader、EmptyState
    - _Requirements: 2.1, 3.1, 6.1_
  - [ ] 7.2 使用 useWpsEnvironment 替换环境检查代码
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 7.3 使用统一导出替换组件导入
    - _Requirements: 5.1_

- [ ] 8. 重构 TemplateManager 页面
  - [ ] 8.1 使用公共组件重构页面结构
    - 应用 PageLayout、PageHeader
    - _Requirements: 2.1, 6.1_
  - [ ] 8.2 使用 useWpsEnvironment 替换环境检查代码
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 8.3 使用统一导出替换组件导入
    - _Requirements: 5.1_

- [ ] 9. 重构 ContractServices 页面
  - [ ] 9.1 使用公共组件重构页面结构
    - 应用 PageLayout
    - _Requirements: 6.1_
  - [ ] 9.2 使用统一导出替换组件导入
    - _Requirements: 5.1_

- [ ] 10. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
