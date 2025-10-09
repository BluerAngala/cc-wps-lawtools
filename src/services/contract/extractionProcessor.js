/**
 * 合同信息抽取处理器 - 负责合同信息抽取的业务逻辑
 */

export class ExtractionProcessor {
  /**
   * 处理抽取结果（给文档添加标记等后续操作）
   * @param {Object} extractedData - 抽取的数据
   * @returns {Object} 处理后的数据（直接返回合同数据对象）
   */
  processExtractionResult(extractedData) {
    // 这里可以添加对抽取结果的进一步处理
    // 例如：验证数据完整性、格式化、添加默认值等
    
    console.log('处理抽取结果:', extractedData)
    
    if (!extractedData || Object.keys(extractedData).length === 0) {
      throw new Error('抽取数据为空')
    }

    // 直接返回合同数据对象，前端期望这个格式
    return extractedData
  }

  /**
   * 验证抽取数据的完整性
   * @param {Object} extractedData - 抽取的数据
   * @returns {Object} 验证结果
   */
  validateExtractedData(extractedData) {
    const missingFields = []
    const requiredFields = ['合同名称', '甲方', '乙方']

    requiredFields.forEach((field) => {
      if (!extractedData[field] || extractedData[field] === null) {
        missingFields.push(field)
      }
    })

    return {
      isValid: missingFields.length === 0,
      missingFields,
      message: missingFields.length > 0 ? `缺少必填字段: ${missingFields.join('、')}` : '数据完整'
    }
  }
}

export const extractionProcessor = new ExtractionProcessor()

