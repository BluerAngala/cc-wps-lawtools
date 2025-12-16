# Implementation Plan

- [x] 1. 创建共享组件
  - [x] 1.1 创建 SuggestionList.vue 组件
    - 显示修改建议列表，支持勾选
    - 区分显示 AI 建议和律师预设意见的来源标识
    - 支持全选/取消全选
    - _Requirements: 3.7, 4.6_
  - [x] 1.2 创建 ConfirmDialog.vue 组件
    - 显示即将执行的操作统计（批注数、修订数）
    - 支持确认/取消按钮
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. 创建 KeywordCommenter.vue 组件
  - [x] 2.1 从 SmartCommenter.vue 提取关键词模式逻辑
    - 包含方案选择器和关键词配置表单
    - 复用现有的 SchemeSelector 和 ConfigForm 组件
    - _Requirements: 2.1, 2.2_

- [x] 3. 创建 AIFullReview.vue 组件
  - [x] 3.1 实现基础 UI 结构
    - 审查视角选择（甲方/乙方/中立/自定义）
    - 页面状态机（idle/generating/ready/reviewing/complete）
    - _Requirements: 3.1_
  - [x] 3.2 实现清单生成功能
    - 调用工作流引擎执行合同类型识别
    - 显示 AI 生成的可编辑审查清单
    - _Requirements: 3.2, 3.3_
  - [x] 3.3 实现审查执行功能
    - 调用工作流引擎执行审查
    - 显示审查进度
    - _Requirements: 3.4, 6.1, 6.2, 6.3, 6.4_
  - [x] 3.4 实现审查结果和修改建议显示
    - 显示审查结果统计和问题列表
    - 显示 AI 生成的修改建议（使用 SuggestionList）
    - _Requirements: 3.5, 3.6_
  - [x] 3.5 实现修改应用功能
    - 二次确认弹窗（使用 ConfirmDialog）
    - 执行批注或修订操作
    - 显示执行结果
    - _Requirements: 3.8, 3.9, 7.5_

- [x] 4. Checkpoint - 代码实现完成

- [x] 5. 创建 AILawyerReview.vue 组件
  - [x] 5.1 基于 AIFullReview 扩展实现
    - 增加方案选择器
    - 增加自定义规则配置区域
    - _Requirements: 4.1, 4.2_
  - [x] 5.2 实现清单合并逻辑
    - AI 生成清单 + 律师配置清单
    - 区分来源标识
    - _Requirements: 4.3_
  - [x] 5.3 实现建议合并逻辑
    - AI 生成建议 + 律师预设意见
    - 区分来源标识
    - _Requirements: 4.4, 4.6_
  - [x] 5.4 实现方案管理功能
    - 方案切换加载对应规则
    - _Requirements: 4.5_

- [x] 6. 重构 ContractServices.vue
  - [x] 6.1 移除 SmartCommenter 组件引用
    - 删除相关导入和模板代码
    - _Requirements: 1.1_
  - [x] 6.2 添加三个新折叠面板
    - 关键词修订批注（KeywordCommenter）
    - AI全流程审查（AIFullReview）
    - AI+律师共同审查（AILawyerReview）
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 6.3 更新页面说明文案
    - 更新顶部 n-alert 中的功能说明
    - _Requirements: 1.1_

- [x] 7. 工作流引擎集成
  - [x] 7.1 复用现有工作流预设
    - generate-review-checklist 生成审查清单
    - execute-risk-review 执行审查
    - _Requirements: 3.6, 5.1_
  - [x] 7.2 实现修改应用逻辑
    - 使用 wpsDocumentService.findRangeByKeyword 查找位置
    - 使用 wpsDocumentService.addComment 添加批注
    - _Requirements: 3.9, 4.8_

- [x] 8. Final Checkpoint - Lint 检查通过
