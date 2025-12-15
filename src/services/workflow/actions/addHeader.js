/**
 * 添加页眉操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/file.js'

export class AddHeaderAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.ADD_HEADER,
      name: '添加页眉',
      description: '在文档页眉中添加文本',
      icon: '📝'
    })
  }

  async execute(params, _context) {
    try {
      const result = await wpsFileService.addHeader({
        text: params.text,
        fontSize: params.fontSize || 12,
        alignment: params.alignment || '右对齐'
      })

      if (result.success) {
        return createSuccessResult(result.message)
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '添加页眉失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          title: '页眉文本',
          description: '要添加到页眉的文本内容'
        },
        fontSize: {
          type: 'number',
          title: '字体大小',
          description: '页眉字体大小',
          default: 12
        },
        alignment: {
          type: 'string',
          title: '对齐方式',
          description: '页眉对齐方式',
          enum: ['左对齐', '居中', '右对齐'],
          default: '右对齐'
        }
      },
      required: ['text']
    }
  }
}

export const addHeaderAction = new AddHeaderAction()
