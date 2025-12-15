/**
 * 添加修订操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsDocument } from '../../wps/document.js'

export class AddRevisionAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.ADD_REVISION,
      name: '添加修订',
      description: '修订指定文本内容',
      icon: '✏️'
    })
  }

  async execute(params, _context) {
    try {
      const { keyword, newText, reason } = params
      const range = wpsDocument.findRangeByKeyword(keyword)

      if (!range) {
        return createErrorResult(`未找到要修订的文本: ${keyword}`)
      }

      const success = wpsDocument.addRevision(range, newText, reason)

      if (success) {
        return createSuccessResult(`已修订 "${keyword}" 为 "${newText}"`)
      } else {
        return createErrorResult('添加修订失败')
      }
    } catch (error) {
      return createErrorResult(error.message || '添加修订失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          title: '原文本',
          description: '要修订的原始文本'
        },
        newText: {
          type: 'string',
          title: '新文本',
          description: '修订后的文本内容'
        },
        reason: {
          type: 'string',
          title: '修订原因',
          description: '修订的原因说明（可选）'
        }
      },
      required: ['keyword', 'newText']
    }
  }
}

export const addRevisionAction = new AddRevisionAction()
