/**
 * 合同要素提取操作
 * 使用 AI 提取合同中的关键信息
 */

import { AIBaseAction, createSuccessResult, createErrorResult } from './AiBaseAction.js'
import { ActionTypes } from '../types.js'
import { processContractElements } from '../../ai/siliconflow.js'

export class ExtractContractAction extends AIBaseAction {
  constructor() {
    super({
      type: ActionTypes.EXTRACT_CONTRACT,
      name: '提取合同要素',
      description: '使用 AI 提取合同中的关键信息',
      icon: '📋'
    })
  }

  async execute(params, context) {
    // 检查文档内容
    const check = this.checkDocumentText(context)
    if (!check.valid) {
      return createErrorResult(check.error)
    }

    try {
      this.emitProgress(params, '正在提取合同要素...')

      // 构建增强 prompt
      const enhancedPrompt = this.buildEnhancedPrompt('', {
        extractMode: params.extractMode,
        customPrompt: params.customPrompt
      })

      // 根据提取模式设置提取标签
      const extractTags =
        params.extractMode === 'basic' ? ['甲方', '乙方', '合同金额', '签订日期', '合同期限'] : null // full 模式提取所有

      // 调用 AI 服务提取合同要素
      const rawResponse = await processContractElements({
        content: context.documentText,
        extractTags,
        enhancedPrompt
      })

      // 解析响应
      let elements = {}
      try {
        elements = this.parseExtractResponse(rawResponse)
      } catch (parseError) {
        // 解析失败时返回原始响应
        return createErrorResult(`AI 响应解析失败: ${parseError.message}`, {
          rawResponse
        })
      }

      // 存储到上下文
      context.data.extractedElements = elements

      this.emitProgress(params, '合同要素提取完成')

      return createSuccessResult('合同要素提取成功', {
        elements,
        rawResponse
      })
    } catch (error) {
      return createErrorResult(error.message || '合同要素提取失败')
    }
  }

  /**
   * 解析 AI 提取响应
   * @param {string} response - AI 响应内容
   * @returns {Object} 解析后的要素对象
   */
  parseExtractResponse(response) {
    if (!response) {
      return {}
    }

    // 尝试直接解析 JSON
    try {
      return JSON.parse(response)
    } catch {
      // 尝试提取 JSON 代码块
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      // 尝试提取纯 JSON
      const pureJsonMatch = response.match(/(\{[\s\S]*\})/)
      if (pureJsonMatch) {
        return JSON.parse(pureJsonMatch[1])
      }

      throw new Error('无法解析响应内容')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        extractMode: {
          type: 'string',
          title: '提取模式',
          description: '选择提取的详细程度',
          enum: ['basic', 'full'],
          enumLabels: ['基础要素（甲乙方、金额、日期）', '完整要素（所有可识别信息）'],
          default: 'basic'
        },
        customPrompt: {
          type: 'string',
          title: '自定义指令',
          description: '用自然语言补充说明特殊需求',
          inputType: 'textarea',
          placeholder: '例如：额外提取担保人信息',
          default: ''
        },
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

export const extractContractAction = new ExtractContractAction()
