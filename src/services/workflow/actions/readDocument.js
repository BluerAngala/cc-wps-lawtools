/**
 * 读取文档操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsDocument } from '../../wps/document.js'

export class ReadDocumentAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.READ_DOCUMENT,
      name: '读取文档',
      description: '读取当前文档的完整内容',
      icon: '📖'
    })
  }

  async execute(params, context) {
    try {
      const text = wpsDocument.getFullText()
      const doc = wpsDocument.getDocument()
      
      // 更新上下文
      context.documentText = text
      context.documentInfo = {
        name: doc?.Name || '',
        path: doc?.Path || ''
      }

      return createSuccessResult('文档读取成功', {
        text,
        wordCount: text.length,
        documentInfo: context.documentInfo
      })
    } catch (error) {
      return createErrorResult(error.message || '读取文档失败')
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

export const readDocumentAction = new ReadDocumentAction()
