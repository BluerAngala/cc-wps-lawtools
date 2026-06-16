/**
 * 添加水印操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './BaseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/WpsFile.js'

export class AddWatermarkAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.ADD_WATERMARK,
      name: '添加水印',
      description: '在文档中添加文字水印',
      icon: '💧'
    })
  }

  async execute(params, _context) {
    try {
      const result = await wpsFileService.addWatermark({
        text: params.text || '草稿',
        fontName: params.fontName || '宋体',
        fontSize: params.fontSize || 48,
        color: params.color || 'light',
        diagonal: params.diagonal !== false
      })

      if (result.success) {
        return createSuccessResult(result.message)
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '添加水印失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          title: '水印文本',
          description: '水印显示的文字内容',
          default: '草稿'
        },
        color: {
          type: 'string',
          title: '颜色深度',
          description: '水印颜色深浅',
          enum: ['light', 'medium', 'dark'],
          enumNames: ['浅灰', '中灰', '深灰'],
          default: 'light'
        },
        fontSize: {
          type: 'number',
          title: '字体大小',
          description: '水印字体大小',
          default: 48
        },
        diagonal: {
          type: 'boolean',
          title: '斜向显示',
          description: '是否斜向显示水印',
          default: true
        }
      },
      required: []
    }
  }
}

export const addWatermarkAction = new AddWatermarkAction()
