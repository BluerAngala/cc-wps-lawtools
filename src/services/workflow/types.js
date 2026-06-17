/**
 * 工作流引擎类型定义
 */

/**
 * 步骤执行结果
 * @typedef {Object} StepResult
 * @property {boolean} success - 是否成功
 * @property {string} message - 结果消息
 * @property {*} [data] - 可传递给下一步的数据
 */

/**
 * 工作流上下文
 * @typedef {Object} WorkflowContext
 * @property {string} [documentText] - 文档内容
 * @property {Object} [documentInfo] - 文档信息
 * @property {string} [documentInfo.name] - 文档名称
 * @property {string} [documentInfo.path] - 文档路径
 * @property {StepResult} [previousResult] - 上一步结果
 * @property {Object} data - 自定义数据存储
 */

/**
 * 工作流步骤定义
 * @typedef {Object} WorkflowStep
 * @property {string} actionType - 操作类型
 * @property {Object} params - 操作参数
 * @property {string} [name] - 步骤自定义名称
 */

/**
 * 工作流定义
 * @typedef {Object} WorkflowDefinition
 * @property {string} id - 工作流ID
 * @property {string} name - 工作流名称
 * @property {string} [description] - 工作流描述
 * @property {WorkflowStep[]} steps - 步骤列表
 */

/**
 * 进度信息
 * @typedef {Object} ProgressInfo
 * @property {number} current - 当前步骤索引（从0开始）
 * @property {number} total - 总步骤数
 * @property {string} stage - 阶段：'start' | 'complete'
 * @property {string} stepName - 步骤名称
 * @property {StepResult} [result] - 步骤结果（仅在 complete 阶段）
 */

/**
 * 工作流执行结果
 * @typedef {Object} WorkflowResult
 * @property {boolean} success - 是否全部成功
 * @property {string} message - 结果消息
 * @property {Array<{step: WorkflowStep, result: StepResult}>} steps - 各步骤结果
 * @property {number} executedCount - 已执行步骤数
 * @property {number} totalCount - 总步骤数
 */

/**
 * 参数 Schema 定义
 * @typedef {Object} ParamSchema
 * @property {string} type - 参数类型
 * @property {Object} [properties] - 属性定义
 * @property {string[]} [required] - 必填字段
 */

/**
 * 操作类型枚举
 */
export const ActionTypes = {
  // 文档操作
  READ_DOCUMENT: 'readDocument',
  SAVE_DOCUMENT: 'saveDocument',
  ADD_HEADER: 'addHeader',
  ADD_FOOTER: 'addFooter',
  ADD_PAGE_NUMBER: 'addPageNumber',
  ADD_WATERMARK: 'addWatermark',
  ADD_COMMENT: 'addComment',
  ADD_REVISION: 'addRevision',
  RENAME_DOCUMENT: 'renameDocument',
  EXPORT_PDF: 'exportPDF',
  DELETE_FILE: 'deleteFile',

  // AI 操作
  IDENTIFY_CONTRACT: 'identifyContract',
  EXTRACT_CONTRACT: 'extractContract',
  REVIEW_CONTRACT: 'reviewContract',
  GLOBAL_ANALYSIS: 'globalAnalysis',
  GENERATE_CHECKLIST: 'generateChecklist',

  // 脱敏操作
  SCAN_SENSITIVE: 'scanSensitive',
  DESENSITIZE: 'desensitize',

  // 批量操作
  BATCH_KEYWORD: 'batchKeyword',

  // 金山文档操作
  SUBMIT_KDOCS: 'submitKdocs',

  // 法律数据查询（自动执行，不操作文档）
  SEARCH_LAW: 'searchLaw',
  SEARCH_CASE: 'searchCase',
  SEARCH_COMPANY: 'searchCompany'
}

/**
 * 创建成功结果
 * @param {string} message - 消息
 * @param {*} [data] - 数据
 * @returns {StepResult}
 */
export function createSuccessResult(message, data = null) {
  return { success: true, message, data }
}

/**
 * 创建失败结果
 * @param {string} message - 错误消息
 * @returns {StepResult}
 */
export function createErrorResult(message) {
  return { success: false, message, data: null }
}

/**
 * 创建初始上下文
 * @returns {WorkflowContext}
 */
export function createInitialContext() {
  return {
    documentText: null,
    documentInfo: null,
    previousResult: null,
    data: {}
  }
}
