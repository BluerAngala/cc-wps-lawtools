# Implementation Plan

- [x] 1. 创建 WorkflowConfigModal 组件




  - [ ] 1.1 创建组件文件 `src/components/WorkflowConfigModal.vue`
    - 实现弹窗基础结构（n-modal）
    - 实现操作列表显示（AI 操作和文档操作分类）
    - 实现步骤列表管理（添加、删除、编辑、排序）
    - 实现步骤参数编辑表单
    - 实现保存和执行按钮逻辑
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_
  - [x]* 1.2 编写属性测试：步骤添加一致性




    - **Property 3: 步骤添加一致性**
    - **Validates: Requirements 2.2, 5.2**

- [ ] 2. 创建 WorkflowSelector 组件
  - [ ] 2.1 创建组件文件 `src/components/WorkflowSelector.vue`
    - 实现工作流列表显示（预设 + 用户工作流）
    - 实现分类过滤（全部/AI/文档）
    - 实现工作流选择和步骤预览
    - 实现执行逻辑和进度显示
    - 实现结果弹窗
    - 支持 compact 紧凑模式
    - 集成 WorkflowConfigModal（新建/编辑）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_




  - [ ]* 2.2 编写属性测试：工作流列表完整性
    - **Property 1: 工作流列表完整性**
    - **Validates: Requirements 1.1, 5.1**
  - [ ]* 2.3 编写属性测试：分类过滤正确性
    - **Property 2: 分类过滤正确性**
    - **Validates: Requirements 4.2**

- [ ] 3. 扩展 workflowStorage 服务
  - [x] 3.1 添加工作流验证方法

    - 验证工作流名称非空
    - 验证至少有一个步骤




    - 返回验证结果和错误信息
    - _Requirements: 2.3_
  - [ ]* 3.2 编写属性测试：工作流保存持久化
    - **Property 4: 工作流保存持久化**
    - **Validates: Requirements 2.3, 3.2**
  - [ ]* 3.3 编写属性测试：工作流删除一致性
    - **Property 5: 工作流删除一致性**




    - **Validates: Requirements 3.3**

- [ ] 4. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 重构 BatchWorkflow 组件



  - [ ] 5.1 使用 WorkflowSelector 替换硬编码逻辑
    - 移除自定义选项的硬编码
    - 引入 WorkflowSelector 组件
    - 传入 compact 模式
    - 处理执行完成回调
    - _Requirements: 4.1, 4.4_
  - [ ]* 5.2 编写属性测试：执行回调正确性
    - **Property 6: 执行回调正确性**
    - **Validates: Requirements 1.3, 1.4, 4.3**

- [ ] 6. 优化 WorkflowPage 页面
  - [ ] 6.1 复用 WorkflowConfigModal 组件
    - 替换页面内的步骤编辑弹窗
    - 替换保存工作流弹窗
    - 减少重复代码
    - _Requirements: 5.3_
  - [ ]* 6.2 编写属性测试：编辑模式数据加载
    - **Property 7: 编辑模式数据加载**
    - **Validates: Requirements 3.1, 5.3**

- [ ] 7. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
