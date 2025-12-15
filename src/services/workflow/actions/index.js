/**
 * 原子操作索引
 * 导出所有操作并提供默认注册函数
 */

import { actionRegistry } from '../actionRegistry.js'

// 导入所有操作
import { readDocumentAction } from './readDocument.js'
import { saveDocumentAction } from './saveDocument.js'
import { addHeaderAction } from './addHeader.js'
import { addCommentAction } from './addComment.js'
import { addRevisionAction } from './addRevision.js'
import { renameDocumentAction } from './renameDocument.js'
import { exportPDFAction } from './exportPDF.js'
import { deleteFileAction } from './deleteFile.js'

// 所有操作列表
export const allActions = [
  readDocumentAction,
  saveDocumentAction,
  addHeaderAction,
  addCommentAction,
  addRevisionAction,
  renameDocumentAction,
  exportPDFAction,
  deleteFileAction
]

/**
 * 注册所有默认操作到注册表
 * @param {Object} [registry] - 操作注册表，默认使用全局注册表
 */
export function registerAllActions(registry = actionRegistry) {
  allActions.forEach(action => {
    registry.register(action)
  })
}

// 导出所有操作
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

// 导出基类
export { BaseAction } from './baseAction.js'
