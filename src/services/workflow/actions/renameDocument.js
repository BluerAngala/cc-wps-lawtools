/**
 * 重命名文档操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/file.js'

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
        prefix: {
          type: 'string',
          title: '文件名前缀',
          description: '添加到文件名前的前缀',
          default: '「已修订」'
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
