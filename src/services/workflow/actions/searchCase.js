/**
 * 搜索案例 Action
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { getActiveProviders } from '../../yuandian/index.js'

export class SearchCaseAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.SEARCH_CASE,
      name: '查询案例',
      description: '通过语义检索查询相关裁判案例（普通案例+权威案例）',
      icon: '⚖️'
    })
  }

  async execute(params, _context) {
    const query = (params.query || params.keyword || '').trim()
    if (!query) return createErrorResult('查询案例失败：query 不能为空')

    const { case: caseProvider } = getActiveProviders()
    if (!caseProvider) {
      return createErrorResult(
        '未配置法律数据 Provider API Key，请到设置 → 法律数据 中配置'
      )
    }

    try {
      const options = {
        topK: params.topK || params.top_k || 5,
        rewrite: params.rewrite !== false,
        filter: params.filter || undefined
      }
      const result = await caseProvider.searchCases(query, options)
      return createSuccessResult(
        `已检索到 ${result.items.length} 个相关案例`,
        {
          query,
          provider: 'case',
          items: result.items,
          total: result.total
        }
      )
    } catch (error) {
      return createErrorResult(`查询案例失败：${error.message}`)
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          title: '查询内容',
          description: '用自然语言描述案情、争议焦点或想要查找的案例类型'
        },
        topK: {
          type: 'number',
          title: '返回条数',
          default: 5
        }
      },
      required: ['query']
    }
  }
}

export const searchCaseAction = new SearchCaseAction()
