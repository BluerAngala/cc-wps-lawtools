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
  cloneWorkflow,
  // 新增导出
  aiWorkflowPresets,
  documentWorkflowPresets,
  allPresets,
  getPresetList,
  getPresetById,
  createWorkflowFromPreset
} from './presets.js'

// 导出存储服务
export { workflowStorage } from './workflowStorage.js'

// 导出操作
export {
  allActions,
  documentActions,
  aiActions,
  registerAllActions,
  BaseAction,
  AIBaseAction,
  // 文档操作
  readDocumentAction,
  saveDocumentAction,
  addHeaderAction,
  addCommentAction,
  addRevisionAction,
  renameDocumentAction,
  exportPDFAction,
  deleteFileAction,
  // AI 操作
  identifyContractAction,
  extractContractAction,
  reviewContractAction,
  globalAnalysisAction,
  generateChecklistAction
} from './actions/index.js'

// 自动注册所有 Action（模块加载时执行）
import { registerAllActions as _registerAllActions } from './actions/index.js'
import { actionRegistry as _actionRegistry } from './actionRegistry.js'
if (_actionRegistry.size === 0) {
  _registerAllActions()
}
