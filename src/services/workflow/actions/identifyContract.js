/**
 * 合同类型识别操作
 * 使用 AI 识别合同的类型和子类型
 */

import { AIBaseAction, createSuccessResult, createErrorResult } from './aiBaseAction.js'
import { ActionTypes } from '../types.js'
import { reviewAIService } from '../../contract/reviewAIService.js'

export class IdentifyContractAction extends AIBaseAction {
  constructor() {
    super({
      type: ActionTypes.IDENTIFY_CONTRACT,
      name: '识别合同类型',
      description: '使用 AI 识别合同的类型和子类型',
      icon: '🔍'
    })
  }

  async execute(params, context) {
    // 检查文档内容
    const check = this.checkDocumentText(context)
    if (!check.valid) {
      return createErrorResult(check.error)
    }

    try {
      this.emitProgress(params, '正在识别合同类型...')

      // 调用 AI 服务识别合同类型
      const result = await reviewAIService.identifyContractType(
        context.documentText,
        (progress) => this.emitProgress(params, progress.stage, progress.content)
      )

      // 存储到上下文
      context.data.contractType = {
        type: result.type || '未知',
        subtype: result.subtype || '',
        confidence: result.confidence || 'medium'
      }

      this.emitProgress(params, '合同类型识别完成')

      return createSuccessResult('合同类型识别成功', {
        contractType: context.data.contractType
      })
    } catch (error) {
      return createErrorResult(error.message || '合同类型识别失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        onProgress: {
          type: 'function',
          title: '进度回调',
          description: '接收进度信息的回调函数'
        }
      },
      required: []
    }
  }
}

export const identifyContractAction = new IdentifyContractAction()
