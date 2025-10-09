/**
 * AI合同预审处理器 - 负责AI预审的批注和修订功能
 */

import Util from '../wps/wpsUtils.js'

export class ReviewProcessor {
  constructor() {
    this.wpsService = Util.wpsService
  }

  /**
   * 添加预审批注
   * @param {Object} reviewData - AI预审结果数据
   * @returns {Promise<Object>} 处理结果（返回原始数据供后续使用）
   */
  async addReviewComments(reviewData) {
    const doc = this.wpsService.getActiveDoc()
    if (!doc) {
      throw new Error('未找到活动文档')
    }

    if (!reviewData?.issues || !Array.isArray(reviewData.issues)) {
      throw new Error('没有发现需要批注的问题')
    }

    let addedCount = 0
    reviewData.issues.forEach((issue) => {
      const { keyword, comment } = issue
      if (!keyword || !comment) return

      const selection = doc.Range()
      selection.Find?.ClearFormatting()
      selection.Find.Text = keyword

      if (selection.Find?.Execute()) {
        const commentRange = selection.Duplicate
        commentRange?.Collapse(0)
        commentRange?.Comments?.Add(commentRange, comment)
        addedCount++
      }
    })

    if (addedCount === 0) {
      throw new Error('未找到需要批注的内容')
    }

    console.log(`成功添加 ${addedCount} 个预审批注`)
    // 返回原始数据，保持接口一致性
    return reviewData
  }

  /**
   * 添加预审修订
   * @param {Object} reviewData - AI预审结果数据
   * @returns {Promise<Object>} 处理结果（返回原始数据供后续使用）
   */
  async addReviewRevisions(reviewData) {
    const doc = this.wpsService.getActiveDoc()
    if (!doc) {
      throw new Error('未找到活动文档')
    }

    if (!reviewData?.revisions || !Array.isArray(reviewData.revisions)) {
      throw new Error('没有发现需要修订的内容')
    }

    this.wpsService.enableRevisionMode(doc)
    let revisedCount = 0

    reviewData.revisions.forEach((revision) => {
      const { original, suggested, reason } = revision
      if (!original || !suggested) return

      const selection = doc.Range()
      selection.Find?.ClearFormatting()
      selection.Find.Text = original

      if (selection.Find?.Execute()) {
        selection.Text = suggested
        if (reason) {
          const commentRange = selection.Duplicate
          commentRange?.Collapse(0)
          commentRange?.Comments?.Add(commentRange, `修订原因: ${reason}`)
        }
        revisedCount++
      }
    })

    if (revisedCount === 0) {
      throw new Error('未找到需要修订的内容')
    }

    console.log(`成功进行 ${revisedCount} 处预审修订`)
    // 返回原始数据，保持接口一致性
    return reviewData
  }
}

export const reviewProcessor = new ReviewProcessor()

