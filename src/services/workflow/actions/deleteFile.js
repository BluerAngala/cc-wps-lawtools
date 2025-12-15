/**
 * 删除文件操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/file.js'

export class DeleteFileAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.DELETE_FILE,
      name: '删除文件',
      description: '删除指定的文件',
      icon: '🗑️'
    })
  }

  async execute(params, _context) {
    try {
      const { filePath } = params
      const result = await wpsFileService.deleteFile(filePath)

      if (result.success) {
        return createSuccessResult(result.message)
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '删除文件失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          title: '文件路径',
          description: '要删除的文件完整路径'
        }
      },
      required: ['filePath']
    }
  }
}

export const deleteFileAction = new DeleteFileAction()
