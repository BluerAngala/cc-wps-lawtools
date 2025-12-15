# Implementation Plan

## 1. 创建 JSONL 增量解析器

- [x] 1.1 创建 JSONLParser 类
  - 在 `src/services/contract/` 目录下创建 `jsonlParser.js`
  - 实现 `feed(chunk)` 方法接收数据块
  - 实现 `_processBuffer()` 方法处理缓冲区
  - 实现 `flush()` 方法处理剩余数据
  - 实现 `reset()` 方法重置状态
  - 支持 `onLine` 和 `onError` 回调
  - _Requirements: 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.2 编写 JSONLParser 属性测试
  - **Property 1: 解析完整性** - 随机切分数据块，验证解析数量一致
  - **Property 3: 缓冲区正确性** - 随机位置切断，验证不触发回调
  - **Property 4: 多行批量处理** - 单块多行，验证多次回调
  - **Property 5: 错误行跳过** - 插入无效行，验证正确跳过
  - **Property 6: 结束处理完整性** - flush 后缓冲区清空
  - **Validates: Requirements 2.3, 2.4, 4.1, 4.2, 4.3, 4.4**

## 2. 扩展 AI 服务支持流式审查

- [x] 2.1 新增流式审查提示词
  - 在 `src/config/prompts.js` 中添加 `contractReviewStreaming` 系统提示词
  - 添加 `contractReviewerStreaming` 角色提示词
  - 要求 AI 使用 JSONL 格式输出
  - _Requirements: 2.2_

- [x] 2.2 实现 reviewClauseStreaming 方法
  - 在 `src/services/contract/reviewAIService.js` 中添加方法
  - 使用 `streamChatCompletions` 进行流式请求
  - 集成 JSONLParser 进行增量解析
  - 实现 `onIssue` 和 `onRisk` 回调触发
  - _Requirements: 2.1, 2.3, 2.4_

- [ ]* 2.3 编写 reviewClauseStreaming 属性测试
  - **Property 2: 回调触发一致性** - 验证回调次数等于问题数
  - **Validates: Requirements 1.2, 2.4**

## 3. 扩展审查引擎支持流式处理

- [x] 3.1 实现 reviewBySegmentsStreaming 方法
  - 在 `src/services/contract/contractReviewEngine.js` 中添加方法
  - 实现并行分段处理（限制并发数为 2）
  - 实现实时进度回调
  - 实现问题去重逻辑
  - _Requirements: 1.2, 3.1, 3.2, 3.3_

- [x] 3.2 实现 reviewSegmentStreaming 方法
  - 调用 `reviewClauseStreaming` 进行流式审查
  - 传递 `onIssue` 和 `onRisk` 回调
  - _Requirements: 1.2_

- [x] 3.3 实现 applyCommentImmediately 方法
  - 立即定位并添加单个批注
  - 检查重复避免重复批注
  - 记录失败的批注供后续重试
  - _Requirements: 1.1, 1.2_

- [ ]* 3.4 编写审查引擎流式方法属性测试
  - **Property 7: 问题计数一致性** - 验证 totalIssues 递增
  - **Property 8: 进度百分比正确性** - 验证进度计算
  - **Validates: Requirements 3.2, 3.3**

## 4. 修改 review 入口方法支持流式模式

- [x] 4.1 修改 review 方法
  - 添加 `stream` 选项，默认为 `true`
  - 根据选项选择流式或非流式审查
  - 实现流式失败自动降级逻辑
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 4.2 编写 review 方法属性测试
  - **Property 10: 返回结构一致性** - 验证返回结构完整
  - **Validates: Requirements 6.4**

## 5. Checkpoint - 确保核心功能测试通过

- [x] 5. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## 6. 更新工作流动作层

- [x] 6.1 更新 ReviewContractAction
  - 在 `src/services/workflow/actions/reviewContract.js` 中更新
  - 传递流式相关回调给审查引擎
  - 更新进度显示逻辑
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

## 7. 错误处理和降级逻辑

- [x] 7.1 实现完整的错误处理
  - 流式请求失败降级到非流式
  - 单个分段失败不影响其他分段
  - 批注失败记录并继续
  - JSON 解析失败跳过并记录
  - _Requirements: 1.4, 6.3_

- [ ]* 7.2 编写错误处理测试
  - **Property 9: 批注完整性** - 验证批注对象字段完整
  - **Validates: Requirements 5.2**

## 8. Final Checkpoint - 确保所有测试通过

- [x] 8. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
