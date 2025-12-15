/**
 * 预设工作流模板
 */

import { ActionTypes } from './types.js'

/**
 * 文档归档工作流
 * 添加编号 → 重命名 → 导出PDF
 */
export const archiveWorkflow = {
  id: 'archive',
  name: '文档归档',
  description: '添加文件编号到页眉，重命名文档并导出PDF',
  steps: [
    {
      actionType: ActionTypes.ADD_HEADER,
      name: '添加文件编号',
      params: {
        text: '文件编号：',
        fontSize: 12,
        alignment: '右对齐'
      }
    },
    {
      actionType: ActionTypes.RENAME_DOCUMENT,
      name: '重命名文档',
      params: {
        prefix: '「已归档」',
        deleteOriginal: false
      }
    },
    {
      actionType: ActionTypes.EXPORT_PDF,
      name: '导出PDF',
      params: {}
    }
  ]
}

/**
 * 快速批注工作流
 * 读取文档 → 添加批注
 */
export const quickCommentWorkflow = {
  id: 'quickComment',
  name: '快速批注',
  description: '在指定关键词位置添加批注',
  steps: [
    {
      actionType: ActionTypes.READ_DOCUMENT,
      name: '读取文档',
      params: {}
    },
    {
      actionType: ActionTypes.ADD_COMMENT,
      name: '添加批注',
      params: {
        keyword: '',
        comment: ''
      }
    }
  ]
}

/**
 * 文档修订工作流
 * 读取文档 → 添加修订 → 保存
 */
export const revisionWorkflow = {
  id: 'revision',
  name: '文档修订',
  description: '修订指定文本并保存文档',
  steps: [
    {
      actionType: ActionTypes.READ_DOCUMENT,
      name: '读取文档',
      params: {}
    },
    {
      actionType: ActionTypes.ADD_REVISION,
      name: '添加修订',
      params: {
        keyword: '',
        newText: '',
        reason: ''
      }
    },
    {
      actionType: ActionTypes.SAVE_DOCUMENT,
      name: '保存文档',
      params: {}
    }
  ]
}

/**
 * 所有预设工作流
 */
export const presetWorkflows = [
  archiveWorkflow,
  quickCommentWorkflow,
  revisionWorkflow
]

/**
 * 根据ID获取预设工作流
 * @param {string} id - 工作流ID
 * @returns {Object|undefined}
 */
export function getPresetWorkflow(id) {
  return presetWorkflows.find(w => w.id === id)
}

/**
 * 克隆工作流（用于编辑）
 * @param {Object} workflow - 工作流定义
 * @returns {Object}
 */
export function cloneWorkflow(workflow) {
  return JSON.parse(JSON.stringify(workflow))
}
