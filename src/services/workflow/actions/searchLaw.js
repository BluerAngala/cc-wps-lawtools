/**
 * 搜索法条 Action
 *
 * - 自动执行（无需用户确认）
 * - 不修改文档，只读取外部数据
 * - 通过 yuandian provider（可替换）实现
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { getActiveProviders } from '../../yuandian/index.js'

export class SearchLawAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.SEARCH_LAW,
      name: '查询法条',
      description: '通过语义检索查询相关法律法规和法条',
      icon: '📜'
    })
  }

  async execute(params, _context) {
    const query = (params.query || params.keyword || '').trim()
    if (!query) return createErrorResult('查询法条失败：query 不能为空')

    const { law } = getActiveProviders()
    if (!law) {
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
      const result = await law.searchClauses(query, options)
      return createSuccessResult(
        `已检索到 ${result.items.length} 条相关法条`,
        {
          query,
          provider: 'law',
          items: result.items,
          total: result.total
        }
      )
    } catch (error) {
      return createErrorResult(`查询法条失败：${error.message}`)
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          title: '查询内容',
          description: '用自然语言描述要查询的法律问题或法条关键词'
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

export const searchLawAction = new SearchLawAction()
