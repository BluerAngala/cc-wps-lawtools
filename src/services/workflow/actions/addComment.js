/**
 * 添加批注操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsDocument } from '../../wps/document.js'

export class AddCommentAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.ADD_COMMENT,
      name: '添加批注',
      description: '在指定关键词位置添加批注',
      icon: '💬'
    })
  }

  async execute(params, _context) {
    try {
      const { keyword, comment } = params
      const range = wpsDocument.findRangeByKeyword(keyword)

      if (!range) {
        return createErrorResult(`未找到关键词: ${keyword}`)
      }

      const success = wpsDocument.addComment(range, comment)

      if (success) {
        return createSuccessResult(`批注已添加到 "${keyword}"`)
      } else {
        return createErrorResult('添加批注失败')
      }
    } catch (error) {
      return createErrorResult(error.message || '添加批注失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          title: '关键词',
          description: '要添加批注的文本关键词'
        },
        comment: {
          type: 'string',
          title: '批注内容',
          description: '批注的文本内容'
        }
      },
      required: ['keyword', 'comment']
    }
  }
}

export const addCommentAction = new AddCommentAction()
