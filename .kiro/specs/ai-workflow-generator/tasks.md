# Implementation Plan

- [x] 1. 创建 AI 工作流生成器服务
  - [x] 1.1 创建 `src/services/workflow/aiWorkflowGenerator.js` 文件
    - 实现 `buildPrompt()` 方法，构建包含所有可用操作信息的提示词
    - 实现 `parseResponse()` 方法，解析 AI 返回的 JSON
    - 实现 `validateWorkflow()` 方法，验证生成的步骤
    - 实现 `generate()` 主方法，整合调用流程
    - _Requirements: 1.1, 2.1, 2.2, 2.3_
  - [ ]* 1.2 编写属性测试：操作类型验证
    - **Property 1: 生成的操作类型必须存在于注册表**
    - **Validates: Requirements 2.1**
  - [ ]* 1.3 编写属性测试：参数 Schema 验证
    - **Property 2: 生成的参数必须符合 Schema 定义**
    - **Validates: Requirements 2.2**
  - [ ]* 1.4 编写属性测试：必填参数验证
    - **Property 3: 必填参数必须有值**
    - **Validates: Requirements 2.3**

- [x] 2. 创建 AI 工作流输入组件
  - [x] 2.1 创建 `src/components/AIWorkflowInput.vue` 组件
    - 实现自然语言输入框
    - 实现生成按钮和加载状态
    - 实现预览确认弹窗，显示生成的步骤列表
    - 实现确认/取消/重新生成交互
    - _Requirements: 1.2, 1.3, 1.4, 3.1, 3.2_

- [x] 3. 集成到工作流页面
  - [x] 3.1 修改 `src/views/WorkflowPage.vue`
    - 在页面顶部添加 AI 输入区域
    - 处理确认事件，将生成的步骤添加到当前工作流
    - _Requirements: 1.3_

- [x] 4. 错误处理和用户提示
  - [x] 4.1 完善错误处理逻辑
    - 处理 AI 服务错误（网络、限流、余额）
    - 处理解析错误（JSON 格式异常）
    - 处理验证错误（无效操作类型）
    - 显示友好的错误提示和建议
    - _Requirements: 1.5, 3.4_

- [x] 5. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

