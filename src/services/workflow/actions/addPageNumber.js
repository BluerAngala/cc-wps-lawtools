/**
 * 添加页码操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './BaseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/WpsFile.js'

export class AddPageNumberAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.ADD_PAGE_NUMBER,
      name: '添加页码',
      description: '在文档页脚或页眉添加页码',
      icon: '🔢'
    })
  }

  async execute(params, _context) {
    try {
      const result = await wpsFileService.addPageNumber({
        format: params.format || 'pageOfTotal',
        position: params.position || 'bottom',
        alignment: params.alignment || '居中',
        fontSize: params.fontSize || 10
      })

      if (result.success) {
        return createSuccessResult(result.message)
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '添加页码失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          title: '页码格式',
          description: '页码显示格式',
          enum: ['page', 'pageOfTotal'],
          enumNames: ['简单页码', '第X页/共Y页'],
          default: 'pageOfTotal'
        },
        position: {
          type: 'string',
          title: '位置',
          description: '页码显示位置',
          enum: ['bottom', 'top'],
          enumNames: ['页脚', '页眉'],
          default: 'bottom'
        },
        alignment: {
          type: 'string',
          title: '对齐方式',
          description: '页码对齐方式',
          enum: ['左对齐', '居中', '右对齐'],
          default: '居中'
        },
        fontSize: {
          type: 'number',
          title: '字体大小',
          description: '页码字体大小',
          default: 10
        }
      },
      required: []
    }
  }
}

export const addPageNumberAction = new AddPageNumberAction()
