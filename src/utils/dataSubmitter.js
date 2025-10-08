/**
 * 数据提交管理器 - 处理合同数据的提交和保存
 */

import { kdocsHandler } from './kdocs.js'
import taskPane from '../wps/wpsTestHelper.js'

export class DataSubmitter {
  constructor() {
    this.storageKey = 'contract_extracted_data'
  }

  /**
   * 处理抽取的合同数据
   * @param {Object} rawResult - AI抽取的原始结果
   * @returns {Object} 处理后的数据
   */
  processExtractedData(rawResult) {
    console.log('processExtractedData:', rawResult)

    if (!rawResult || typeof rawResult !== 'object' || rawResult.error) {
      console.warn('未找到有效的抽取数据或存在错误:', rawResult)
      return null
    }

    // 过滤非数据字段
    const filteredData = this.filterDataFields(rawResult)
    let finalData = Object.keys(filteredData).length > 0 ? filteredData : rawResult

    // 标准化字段
    finalData = this.normalizeFields(finalData)

    // 处理特殊合同类型
    finalData = this.handleSpecialContractTypes(finalData)

    return finalData
  }

  /**
   * 过滤非数据字段
   */
  filterDataFields(data) {
    const filteredData = {}
    const excludeFields = ['content', 'type', 'error']

    Object.keys(data).forEach((key) => {
      if (!excludeFields.includes(key)) {
        filteredData[key] = data[key]
      }
    })

    return filteredData
  }

  /**
   * 标准化字段
   */
  normalizeFields(data) {
    const requiredFields = ['合同名称', '甲方', '乙方', '其他方', '合同金额', '对接客户']
    const normalizedData = { ...data }

    requiredFields.forEach((field) => {
      normalizedData[field] = normalizedData[field] || ''
    })

    // 对接客户字段强制为空
    normalizedData['对接客户'] = ''

    return normalizedData
  }

  /**
   * 处理特殊合同类型（人才培养协议、揭榜挂帅）
   */
  handleSpecialContractTypes(data) {
    const contractName = data['合同名称'] || ''
    if (contractName.includes('人才培养协议') || contractName.includes('揭榜挂帅')) {
      console.log('检测到特殊合同类型，交换乙方和丙方:', contractName)

      // 交换乙方和其他方
      const tempPartyB = data['乙方']
      data['乙方'] = data['其他方'] || data['丙方'] || ''
      data['其他方'] = tempPartyB

      if (data['丙方']) {
        data['丙方'] = tempPartyB
      }
    }

    return data
  }

  /**
   * 保存数据到本地存储
   * @param {Object} data - 要保存的数据
   * @returns {Object} 保存结果
   */
  saveToLocal(data) {
    try {
      const dataToSave = {
        data,
        timestamp: Date.now(),
        id: Date.now().toString()
      }

      // 获取现有数据
      const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      existingData.push(dataToSave)
      localStorage.setItem(this.storageKey, JSON.stringify(existingData))

      console.log('数据已保存到本地存储')
      return { success: true, data: dataToSave }
    } catch (error) {
      console.error('保存到本地存储失败:', error)
      return { success: false, error }
    }
  }

  /**
   * 验证和处理字段数据（复用标准化逻辑）
   * @param {Object} extractedData - 抽取的数据
   * @returns {Object} 处理后的字段数据
   */
  validateAndProcessFields(extractedData) {
    // 直接复用normalizeFields方法，避免重复逻辑
    const fields = this.normalizeFields(extractedData)
    console.log('处理后的字段数据:', fields)
    return fields
  }

  /**
   * 创建金山文档记录
   * @param {Object} fields - 字段数据
   * @returns {Promise<Object>} 创建结果
   */
  async createKdocsRecord(fields) {
    console.log('创建金山文档行记录 fields', fields)

    try {
      const res = await kdocsHandler({
        webhookUrl: import.meta.env.VITE_KDOCS_WEBHOOK_URL,
        token: import.meta.env.VITE_KDOCS_TOKEN,
        type: 'createRecords',
        sheetID: Number(import.meta.env.VITE_KDOCS_SHEETID),
        inputData: [{ fields }]
      })

      console.log('金山文档创建响应:', res)

      let 审查编号 = res?.data?.[0]?.fields?.审查编号
      console.log('审查编号:', 审查编号)

      if (!审查编号) {
        const 编号 = res?.data?.[0]?.fields?.编号
        // 是否存在编号
        if (编号) {
          // 自定义构建审查编号 SWXCBHT-年份-编号
          审查编号 = `SWXCBHT-${new Date().getFullYear()}-${编号}`
          console.log('构建的审查编号:', 审查编号)
        } else {
          throw new Error('创建金山文档行记录失败或者没有返回id')
        }
      }

      return { success: true, 审查编号, data: res?.data?.[0] }
    } catch (error) {
      console.error('创建金山文档记录失败:', error)
      throw error
    }
  }

  /**
   * 添加页眉
   * @param {string} 审查编号 - 审查编号
   * @returns {Promise<Object>} 添加结果
   */
  async addDocumentHeader(审查编号) {
    try {
      const headerRes = await taskPane.onbuttonclick('addHeader', {
        headerText: `文件编号：${审查编号}`,
        fontSize: '12', // 小四号字体
        alignment: '右对齐'
      })
      console.log('页眉添加结果', headerRes)

      if (headerRes?.success) {
        return { success: true, message: headerRes.message || '页眉添加成功' }
      } else {
        return { success: false, message: headerRes?.message || '页眉添加失败' }
      }
    } catch (error) {
      console.error('添加页眉失败:', error)
      return { success: false, message: '添加页眉时发生错误', error }
    }
  }

  /**
   * 提交抽取的数据（完整流程）
   * @param {Object} extractedData - 抽取的数据
   * @returns {Promise<Object>} 提交结果
   */
  async submitExtractedData(extractedData) {
    if (!extractedData) {
      throw new Error('没有可提交的数据')
    }

    try {
      // 1. 保存到本地存储
      const localSaveResult = this.saveToLocal(extractedData)
      if (!localSaveResult.success) {
        console.warn('本地保存失败，但继续执行后续步骤')
      }

      // 2. 数据验证和处理
      const fields = this.validateAndProcessFields(extractedData)

      // 3. 调用金山文档接口创建记录
      const kdocsResult = await this.createKdocsRecord(fields)
      if (!kdocsResult.success) {
        throw new Error(kdocsResult.message || '创建金山文档记录失败')
      }

      // 4. 添加页眉 - 将审查编号添加到页眉
      const headerResult = await this.addDocumentHeader(kdocsResult.审查编号)
      if (!headerResult.success) {
        console.warn('页眉添加失败:', headerResult.message)
        // 页眉添加失败不影响整体流程，只记录警告
      }

      return {
        success: true,
        message: '数据提交成功！',
        审查编号: kdocsResult.审查编号,
        data: kdocsResult.data,
        headerAdded: headerResult.success
      }
    } catch (error) {
      console.error('提交数据失败:', error)
      throw new Error(`提交失败: ${error.message}`)
    }
  }

  /**
   * 从本地存储获取历史数据
   * @returns {Array} 历史数据列表
   */
  getLocalHistory() {
    try {
      const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      return existingData
    } catch (error) {
      console.error('获取本地历史数据失败:', error)
      return []
    }
  }

  /**
   * 清除本地历史数据
   * @returns {boolean} 清除是否成功
   */
  clearLocalHistory() {
    try {
      localStorage.removeItem(this.storageKey)
      console.log('本地历史数据已清除')
      return true
    } catch (error) {
      console.error('清除本地历史数据失败:', error)
      return false
    }
  }
}

// 创建默认实例
export const dataSubmitter = new DataSubmitter()
