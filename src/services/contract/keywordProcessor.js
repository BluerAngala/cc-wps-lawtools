/**
 * 关键词处理器 - 负责关键词批注和修订功能
 */

import Util from '../wps/wpsUtils.js'

export class KeywordProcessor {
  constructor() {
    this.wpsService = Util.wpsService
  }

  /**
   * 处理关键词批注和修订
   * @param {Array} keywordList - 关键词列表
   * @returns {Promise<Object>} 处理结果（返回统计数据）
   */
  async processKeywords(keywordList) {
    const doc = this.wpsService.getActiveDoc()
    if (!doc) {
      throw new Error('未找到活动文档')
    }

    if (!keywordList?.length) {
      throw new Error('关键词列表为空')
    }

    this.wpsService.enableRevisionMode(doc)
    let commentCount = 0
    let revisionCount = 0

    keywordList.forEach((item) => {
      const keyword = item?.keyword?.trim()
      if (!keyword) return

      const actionType = item?.actionType || '批注'
      const comment = item?.comment || `关键词"${keyword}"需要重点关注`
      const suggestedText = item?.suggestedText || ''

      // 查找关键词
      const selection = doc.Range()
      selection.Find?.ClearFormatting()
      selection.Find.Text = keyword

      if (selection.Find?.Execute()) {
        if (actionType === '修订' && suggestedText) {
          // 修订模式：替换文本并添加批注
          selection.Text = suggestedText
          const commentRange = selection.Duplicate
          commentRange?.Collapse(0)
          commentRange?.Comments?.Add(commentRange, comment || `已修订为"${suggestedText}"`)
          revisionCount++
        } else {
          // 批注模式：只添加批注
          const commentRange = selection.Duplicate
          commentRange?.Collapse(0)
          commentRange?.Comments?.Add(commentRange, comment)
          commentCount++
        }
      }
    })

    const totalCount = commentCount + revisionCount
    if (totalCount === 0) {
      throw new Error('未找到任何指定的关键词')
    }

    console.log(`成功处理 ${commentCount} 个批注和 ${revisionCount} 个修订`)
    // 返回统计数据（用于日志和消息提示）
    return { commentCount, revisionCount }
  }
}

export const keywordProcessor = new KeywordProcessor()

