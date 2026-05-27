/**
 * 添加页脚操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/file.js'

export class AddFooterAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.ADD_FOOTER,
      name: '添加页脚',
      description: '在文档页脚中添加文本',
      icon: '📄'
    })
  }

  async execute(params, _context) {
    try {
      const result = await wpsFileService.addFooter({
        text: params.text,
        fontSize: params.fontSize || 14,
        alignment: params.alignment || '居中'
      })

      if (result.success) {
        return createSuccessResult(result.message)
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '添加页脚失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          title: '页脚文本',
          description: '要添加到页脚的文本内容'
        },
        fontSize: {
          type: 'number',
          title: '字体大小',
          description: '页脚字体大小',
          default: 14
        },
        alignment: {
          type: 'string',
          title: '对齐方式',
          description: '页脚对齐方式',
          enum: ['左对齐', '居中', '右对齐'],
          default: '居中'
        }
      },
      required: ['text']
    }
  }
}

export const addFooterAction = new AddFooterAction()
