/**
 * 生成审查清单操作
 * 根据文档类型和审查视角生成审查清单
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { reviewChecklistGenerator } from '../../contract/reviewChecklistGenerator.js'

export class GenerateChecklistAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.GENERATE_CHECKLIST,
      name: '生成审查清单',
      description: '根据文档类型和审查视角生成审查清单',
      icon: '📋'
    })
  }

  async execute(params, context) {
    try {
      // 获取文档类型：优先使用参数，其次使用上下文
      const documentType = params.documentType || context.data.contractType || { type: 'default' }
      const perspective = params.perspective || 'neutral'

      // 生成审查清单
      const checklist = reviewChecklistGenerator.generateChecklist(documentType, perspective)

      if (!checklist || checklist.length === 0) {
        return createErrorResult('无法生成审查清单')
      }

      // 存储到上下文
      context.data.checklist = checklist
      context.data.perspective = perspective

      return createSuccessResult('审查清单生成成功', {
        checklist,
        documentType,
        perspective,
        perspectiveDescription: reviewChecklistGenerator.getPerspectiveDescription(perspective)
      })
    } catch (error) {
      return createErrorResult(error.message || '生成审查清单失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        documentType: {
          type: 'object',
          title: '文档类型',
          description: '文档类型信息，包含 type 和 subtype',
          default: null
        },
        perspective: {
          type: 'string',
          title: '审查视角',
          description: '选择从哪方视角进行审查',
          enum: ['partyA', 'partyB', 'neutral'],
          enumLabels: ['甲方视角', '乙方视角', '中立视角'],
          default: 'neutral'
        }
      },
      required: []
    }
  }
}

export const generateChecklistAction = new GenerateChecklistAction()
