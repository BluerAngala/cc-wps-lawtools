/**
 * 原子操作索引
 * 导出所有操作并提供默认注册函数
 */

import { actionRegistry } from '../actionRegistry.js'

// 导入文档操作
import { readDocumentAction } from './readDocument.js'
import { saveDocumentAction } from './saveDocument.js'
import { addHeaderAction } from './addHeader.js'
import { addCommentAction } from './addComment.js'
import { addRevisionAction } from './addRevision.js'
import { renameDocumentAction } from './renameDocument.js'
import { exportPDFAction } from './exportPDF.js'
import { deleteFileAction } from './deleteFile.js'

// 导入 AI 操作
import { identifyContractAction } from './identifyContract.js'
import { extractContractAction } from './extractContract.js'
import { reviewContractAction } from './reviewContract.js'
import { globalAnalysisAction } from './globalAnalysis.js'

// 文档操作列表
export const documentActions = [
  readDocumentAction,
  saveDocumentAction,
  addHeaderAction,
  addCommentAction,
  addRevisionAction,
  renameDocumentAction,
  exportPDFAction,
  deleteFileAction
]

// AI 操作列表
export const aiActions = [
  identifyContractAction,
  extractContractAction,
  reviewContractAction,
  globalAnalysisAction
]

// 所有操作列表
export const allActions = [...documentActions, ...aiActions]

/**
 * 注册所有默认操作到注册表
 * @param {Object} [registry] - 操作注册表，默认使用全局注册表
 */
export function registerAllActions(registry = actionRegistry) {
  allActions.forEach(action => {
    registry.register(action)
  })
}

// 导出文档操作
export {
  readDocumentAction,
  saveDocumentAction,
  addHeaderAction,
  addCommentAction,
  addRevisionAction,
  renameDocumentAction,
  exportPDFAction,
  deleteFileAction
}

// 导出 AI 操作
export {
  identifyContractAction,
  extractContractAction,
  reviewContractAction,
  globalAnalysisAction
}

// 导出基类
export { BaseAction } from './baseAction.js'
export { AIBaseAction } from './aiBaseAction.js'
