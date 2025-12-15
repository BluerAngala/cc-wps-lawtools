/**
 * 工作流引擎模块入口
 */

// 导出类型和工具函数
export {
  ActionTypes,
  createSuccessResult,
  createErrorResult,
  createInitialContext
} from './types.js'

// 导出注册表
export { ActionRegistry, actionRegistry } from './actionRegistry.js'

// 导出引擎
export { WorkflowEngine, workflowEngine } from './workflowEngine.js'

// 导出预设工作流
export {
  presetWorkflows,
  archiveWorkflow,
  quickCommentWorkflow,
  revisionWorkflow,
  getPresetWorkflow,
  cloneWorkflow
} from './presets.js'

// 导出存储服务
export { workflowStorage } from './workflowStorage.js'

// 导出操作
export {
  allActions,
  registerAllActions,
  BaseAction,
  readDocumentAction,
  saveDocumentAction,
  addHeaderAction,
  addCommentAction,
  addRevisionAction,
  renameDocumentAction,
  exportPDFAction,
  deleteFileAction
} from './actions/index.js'
