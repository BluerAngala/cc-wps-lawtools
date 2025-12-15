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
        strategy: params.depth === 'deep' ? 'segment' : 'full',
        useCustomRules: params.useCustomRules || false,
        autoApply: params.autoApply !== false,
        stream: true, // 默认启用流式审查
        perspective: params.perspective, // 传递审查视角
        customPrompt: params.customPrompt, // 传递自定义指令
        // 进度回调
        onProgress: (progress) => {
          if (typeof progress === 'object') {
            const stageText = progress.stage === 'reviewing' 
              ? `正在审查: ${progress.segmentName || ''}` 
              : progress.stage === 'segment_complete'
                ? `已完成: ${progress.segmentName || ''} (${progress.percent || 0}%)`
                : progress.stage
            this.emitProgress(params, stageText, progress.content)
          }
        },
        // 发现问题时的回调（流式模式）
        onIssueFound: (info) => {
          this.emitProgress(params, `发现问题 #${info.totalIssues}: ${info.segment}`, info.issue?.comment?.substring(0, 50))
        },
        // 发现风险时的回调（流式模式）
        onRiskFound: (info) => {
          this.emitProgress(params, `发现风险 #${info.totalRisks}`, info.risk?.description?.substring(0, 50))
        }
      }

      // 合同类型：优先使用参数中指定的，其次使用上下文中的
      if (params.contractType && params.contractType.type) {
        reviewOptions.contractType = params.contractType
      } else if (context.data.contractType) {
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
        perspective: {
          type: 'string',
          title: '审查视角',
          description: '选择从哪方视角进行审查',
          enum: ['partyA', 'partyB', 'neutral'],
          enumLabels: ['甲方视角', '乙方视角', '中立视角'],
          default: 'neutral'
        },
        depth: {
          type: 'string',
          title: '审查深度',
          description: '选择审查的详细程度',
          enum: ['quick', 'standard', 'deep'],
          enumLabels: ['快速（识别重大风险）', '标准（全面审查）', '深度（逐条分析）'],
          default: 'standard'
        },
        focusAreas: {
          type: 'array',
          title: '关注领域',
          description: '选择重点关注的条款类型',
          items: { type: 'string' },
          options: [
            { value: 'liability', label: '违约责任' },
            { value: 'payment', label: '付款条款' },
            { value: 'confidential', label: '保密条款' },
            { value: 'ip', label: '知识产权' },
            { value: 'dispute', label: '争议解决' },
            { value: 'forceMajeure', label: '不可抗力' }
          ],
          default: []
        },
        autoApply: {
          type: 'boolean',
          title: '自动应用批注',
          description: '是否自动将审查结果作为批注添加到文档',
          default: true
        },
        customPrompt: {
          type: 'string',
          title: '自定义指令',
          description: '用自然语言补充说明特殊需求',
          inputType: 'textarea',
          placeholder: '例如：特别关注合同期限是否合理',
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

export const reviewContractAction = new ReviewContractAction()
