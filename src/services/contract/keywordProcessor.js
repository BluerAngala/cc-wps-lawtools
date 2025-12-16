/**
 * 关键词处理器 - 负责关键词批注和修订功能
 * 基于工作流动作实现
 */

import { batchKeywordAction } from '../workflow/actions/batchKeyword.js'

export class KeywordProcessor {
  /**
   * 处理关键词批注和修订
   * @param {Array} keywordList - 关键词列表
   * @returns {Promise<Object>} 处理结果（返回统计数据）
   */
  async processKeywords(keywordList) {
    const result = await batchKeywordAction.execute({ keywordList })

    if (!result.success) {
      throw new Error(result.message)
    }

    console.log(result.message)
    return result.data
  }
}

export const keywordProcessor = new KeywordProcessor()

