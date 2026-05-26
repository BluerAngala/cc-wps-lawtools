/**
 * 添加页眉操作
 * 支持添加文本和图片
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/file.js'

export class AddHeaderAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.ADD_HEADER,
      name: '添加页眉',
      description: '在文档页眉中添加文本或图片',
      icon: '📝'
    })
  }

  async execute(params, _context) {
    try {
      const result = await wpsFileService.addHeader({
        text: params.text,
        fontSize: params.fontSize || 14,
        alignment: params.alignment || '右对齐',
        imagePath: params.imagePath,
        imageOptions: params.imagePath ? {
          width: params.imageWidth || 50,
          left: params.imageLeft || 490,
          top: params.imageTop || 20
        } : undefined
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
          default: 14
        },
        alignment: {
          type: 'string',
          title: '对齐方式',
          description: '页眉对齐方式',
          enum: ['左对齐', '居中', '右对齐'],
          default: '右对齐'
        },
        imagePath: {
          type: 'string',
          title: '图片路径',
          description: '要添加到页眉的图片文件路径（可选，填写后显示图片参数）',
          placeholder: '留空表示不添加图片'
        },
        imageWidth: {
          type: 'number',
          title: '图片宽度',
          description: '图片宽度（磅值）',
          default: 50,
          showIf: 'imagePath'
        },
        imageLeft: {
          type: 'number',
          title: '图片左边距',
          description: '图片距页面左边的距离（磅值）',
          default: 490,
          showIf: 'imagePath'
        },
        imageTop: {
          type: 'number',
          title: '图片上边距',
          description: '图片距页面顶部的距离（磅值）',
          default: 20,
          showIf: 'imagePath'
        }
      },
      required: []
    }
  }
}

export const addHeaderAction = new AddHeaderAction()
