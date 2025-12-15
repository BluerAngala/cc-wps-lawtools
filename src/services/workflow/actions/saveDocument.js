/**
 * 保存文档操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/file.js'

export class SaveDocumentAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.SAVE_DOCUMENT,
      name: '保存文档',
      description: '保存当前文档',
      icon: '💾'
    })
  }

  async execute(_params, _context) {
    try {
      const result = wpsFileService.saveDocument()

      if (result.success) {
        return createSuccessResult(result.message)
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '保存文档失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {},
      required: []
    }
  }
}

export const saveDocumentAction = new SaveDocumentAction()
