/**
 * 批量关键词处理操作
 * 支持批量添加批注或修订
 */

import { BaseAction, createSuccessResult, createErrorResult } from './BaseAction.js'
import { ActionTypes } from '../types.js'
import { wpsDocument } from '../../wps/WpsDocument.js'
import { wpsCore } from '../../wps/WpsCore.js'

export class BatchKeywordAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.BATCH_KEYWORD,
      name: '批量关键词处理',
      description: '批量处理关键词，支持添加批注或修订',
      icon: '🔍'
    })
  }

  async execute(params, _context) {
    try {
      const { keywordList } = params

      if (!keywordList?.length) {
        return createErrorResult('关键词列表为空')
      }

      // 开启修订模式
      wpsCore.enableRevisionMode()

      let commentCount = 0
      let revisionCount = 0
      let notFoundCount = 0

      for (const item of keywordList) {
        const keyword = item?.keyword?.trim()
        if (!keyword) continue

        const actionType = item?.actionType || '批注'
        const comment = item?.comment || `关键词"${keyword}"需要重点关注`
        const suggestedText = item?.suggestedText || ''

        // 查找关键词
        const range = wpsDocument.findRangeByKeyword(keyword)

        if (!range) {
          notFoundCount++
          continue
        }

        if (actionType === '修订' && suggestedText) {
          // 修订模式：只替换文本
          range.Text = suggestedText
          revisionCount++
        } else {
          // 批注模式：只添加批注
          const success = wpsDocument.addComment(range, comment)
          if (success) commentCount++
        }
      }

      const totalCount = commentCount + revisionCount
      if (totalCount === 0) {
        return createErrorResult('未找到任何指定的关键词')
      }

      const message = `处理完成：${commentCount} 个批注，${revisionCount} 个修订${notFoundCount > 0 ? `，${notFoundCount} 个未找到` : ''}`
      return createSuccessResult(message, { commentCount, revisionCount, notFoundCount })
    } catch (error) {
      return createErrorResult(error.message || '批量关键词处理失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        keywordList: {
          type: 'array',
          title: '关键词列表',
          description: '要处理的关键词配置列表',
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string', title: '关键词' },
              actionType: { type: 'string', title: '操作类型', enum: ['批注', '修订'] },
              comment: { type: 'string', title: '批注内容' },
              suggestedText: { type: 'string', title: '修订文本' }
            }
          }
        }
      },
      required: ['keywordList']
    }
  }
}

export const batchKeywordAction = new BatchKeywordAction()
