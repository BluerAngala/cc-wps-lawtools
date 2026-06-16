/**
 * 重命名文档操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './BaseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/WpsFile.js'

export class RenameDocumentAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.RENAME_DOCUMENT,
      name: '重命名文档',
      description: '为文档添加前缀并另存为新文件',
      icon: '📄'
    })
  }

  async execute(params, _context) {
    try {
      const result = await wpsFileService.renameDocument({
        prefix: params.prefix || '「已修订」',
        deleteOriginal: params.deleteOriginal || false
      })

      if (result.success) {
        return createSuccessResult(result.message, {
          newFileName: result.newFileName,
          newFullPath: result.newFullPath
        })
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '重命名文档失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        newName: {
          type: 'string',
          title: '新文件名',
          description: '重命名后的完整文件名（不含扩展名会自动补齐）',
          placeholder: '如：合同终稿'
        },
        prefix: {
          type: 'string',
          title: '文件名前缀',
          description: '仅在未指定新文件名时生效，添加到原文件名前',
          default: '',
          placeholder: '留空则不添加前缀',
          showIf: null
        },
        deleteOriginal: {
          type: 'boolean',
          title: '删除原文件',
          description: '重命名后是否删除原文件',
          default: false
        }
      },
      required: []
    }
  }
}

export const renameDocumentAction = new RenameDocumentAction()
