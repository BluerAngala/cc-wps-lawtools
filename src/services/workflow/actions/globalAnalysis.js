/**
 * 全局分析操作
 * 分析合同整体结构和风险区域
 */

import { AIBaseAction, createSuccessResult, createErrorResult } from './AiBaseAction.js'
import { ActionTypes } from '../types.js'
import { reviewAIService } from '../../contract/ReviewAiService.js'

export class GlobalAnalysisAction extends AIBaseAction {
  constructor() {
    super({
      type: ActionTypes.GLOBAL_ANALYSIS,
      name: '全局分析',
      description: '分析合同整体结构和风险区域',
      icon: '🌐'
    })
  }

  async execute(params, context) {
    // 检查文档内容
    const check = this.checkDocumentText(context)
    if (!check.valid) {
      return createErrorResult(check.error)
    }

    try {
      this.emitProgress(params, '正在进行全局分析...')

      // 构建增强 prompt
      const enhancedPrompt = this.buildEnhancedPrompt('', {
        depth: params.depth,
        customPrompt: params.customPrompt
      })

      // 调用 AI 服务进行全局分析
      const result = await reviewAIService.analyzeGlobal(
        context.documentText,
        (progress) => this.emitProgress(params, progress.stage, progress.content),
        { enhancedPrompt, depth: params.depth }
      )

      // 存储到上下文
      context.data.globalAnalysis = {
        type: result.type || '未知',
        subtype: result.subtype || '',
        structure: result.structure || [],
        riskAreas: result.riskAreas || []
      }

      // 同时更新合同类型（如果全局分析返回了类型信息）
      if (result.type && result.type !== '未知') {
        context.data.contractType = {
          type: result.type,
          subtype: result.subtype || '',
          confidence: 'high'
        }
      }

      this.emitProgress(params, '全局分析完成')

      return createSuccessResult('全局分析完成', {
        globalAnalysis: context.data.globalAnalysis
      })
    } catch (error) {
      // 降级处理：尝试基本的合同类型识别
      try {
        this.emitProgress(params, '全局分析失败，尝试基本识别...')
        const typeResult = await reviewAIService.identifyContractType(context.documentText)

        context.data.globalAnalysis = {
          type: typeResult.type || '未知',
          subtype: typeResult.subtype || '',
          structure: [],
          riskAreas: []
        }

        context.data.contractType = {
          type: typeResult.type || '未知',
          subtype: typeResult.subtype || '',
          confidence: typeResult.confidence || 'low'
        }

        return createSuccessResult('全局分析降级完成（仅识别类型）', {
          globalAnalysis: context.data.globalAnalysis,
          degraded: true
        })
      } catch (fallbackError) {
        return createErrorResult(error.message || '全局分析失败')
      }
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        depth: {
          type: 'string',
          title: '分析深度',
          description: '选择分析的详细程度',
          enum: ['quick', 'standard', 'deep'],
          enumLabels: ['快速', '标准', '深度'],
          default: 'standard'
        },
        customPrompt: {
          type: 'string',
          title: '自定义指令',
          description: '用自然语言补充说明特殊需求',
          inputType: 'textarea',
          placeholder: '例如：重点分析合同的合规性',
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

export const globalAnalysisAction = new GlobalAnalysisAction()
