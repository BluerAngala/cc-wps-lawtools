/**
 * 搜索企业 Action
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { getActiveProviders } from '../../yuandian/index.js'

export class SearchCompanyAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.SEARCH_COMPANY,
      name: '查询企业',
      description: '按企业名称查询工商登记、股东、知识产权、风险等综合信息',
      icon: '🏢'
    })
  }

  async execute(params, _context) {
    const name = (params.name || params.query || '').trim()
    if (!name) return createErrorResult('查询企业失败：name 不能为空')

    const { company } = getActiveProviders()
    if (!company) {
      return createErrorResult(
        '未配置法律数据 Provider API Key，请到设置 → 法律数据 中配置'
      )
    }

    try {
      const topK = params.topK || params.top_k || 5
      const searchResult = await company.searchCompanies(name, { topK })

      if (!searchResult.items.length) {
        return createSuccessResult(`未找到与"${name}"相关的企业`, {
          query: name,
          provider: 'company',
          items: [],
          total: 0
        })
      }

      // 取第一个候选企业的详情
      const first = searchResult.items[0]
      let detail = null
      let aggregation = null
      try {
        detail = await company.getCompany(first.id)
      } catch (e) {
        console.warn('[searchCompany] 获取详情失败:', e.message)
      }
      try {
        aggregation = await company.getAggregation(first.id)
      } catch (e) {
        console.warn('[searchCompany] 获取聚合统计失败:', e.message)
      }

      return createSuccessResult(
        `已找到企业"${first.name}"${searchResult.items.length > 1 ? ` 等 ${searchResult.items.length} 家` : ''}`,
        {
          query: name,
          provider: 'company',
          items: [
            {
              ...first,
              detail: detail?.base || null,
              extended: detail?.extended || null,
              aggregation: aggregation || null
            },
            ...searchResult.items.slice(1)
          ],
          total: searchResult.total
        }
      )
    } catch (error) {
      return createErrorResult(`查询企业失败：${error.message}`)
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: '企业名称',
          description: '企业全称或关键词'
        },
        topK: {
          type: 'number',
          title: '候选数量',
          default: 5
        }
      },
      required: ['name']
    }
  }
}

export const searchCompanyAction = new SearchCompanyAction()
