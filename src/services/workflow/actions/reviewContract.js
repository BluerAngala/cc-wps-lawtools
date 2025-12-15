/**
 * 合同审查操作
 * 使用 AI 审查合同并识别法律风险
 */

import { AIBaseAction, createSuccessResult, createErrorResult } from './aiBaseAction.js'
import { ActionTypes } from '../types.js'
import { contractReviewEngine } from '../../contract/contractReviewEngine.js'

export class ReviewContractAction extends AIBaseAction {
  constructor() {
    super({
      type: ActionTypes.REVIEW_CONTRACT,
      name: '审查合同',
      description: '使用 AI 审查合同并识别法律风险',
      icon: '⚖️'
    })
  }

  async execute(params, context) {
    // 检查文档内容
    const check = this.checkDocumentText(context)
    if (!check.valid) {
      return createErrorResult(check.error)
    }

    try {
      this.emitProgress(params, '正在审查合同...')

      // 构建审查选项
      const reviewOptions = {
        strategy: params.strategy || 'full',
        useCustomRules: params.useCustomRules || false,
        autoApply: params.autoApply || false,
        onProgress: (progress) => {
          if (typeof progress === 'object') {
            this.emitProgress(params, progress.stage, progress.content)
          }
        }
      }

      // 如果上下文中有合同类型，传递给审查引擎
      if (context.data.contractType) {
        reviewOptions.contractType = context.data.contractType
      }

      // 调用合同审查引擎
      const result = await contractReviewEngine.review(reviewOptions)

      // 存储到上下文
      context.data.reviewResult = {
        issues: result.issues || [],
        risks: result.risks || [],
        checklist: result.checklist || [],
        checklistSummary: result.checklistSummary || {},
        summary: result.summary || {
          totalIssues: (result.issues || []).length,
          totalRisks: (result.risks || []).length
        }
      }

      this.emitProgress(params, '合同审查完成')

      return createSuccessResult('合同审查完成', {
        reviewResult: context.data.reviewResult,
        contractType: result.contractType
      })
    } catch (error) {
      return createErrorResult(error.message || '合同审查失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        strategy: {
          type: 'string',
          title: '审查策略',
          description: '审查策略：full（全文审查）或 segment（分段审查）',
          enum: ['full', 'segment'],
          default: 'full'
        },
        useCustomRules: {
          type: 'boolean',
          title: '使用自定义规则',
          description: '是否使用用户自定义的审查规则',
          default: false
        },
        autoApply: {
          type: 'boolean',
          title: '自动应用批注',
          description: '是否自动将审查结果作为批注添加到文档',
          default: false
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

export const reviewContractAction = new ReviewContractAction()
