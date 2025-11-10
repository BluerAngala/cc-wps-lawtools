/**
 * 数据提交管理器 - 处理合同数据的提交和保存
 */

import { kdocsHandler } from '../kdocs/kdocs.js'
import taskPane from '../wps/wpsTestHelper.js'
import { fetchCompanyInfo } from '../ai/coze.js'

// 特定主体信息映射
const specialSubjects = {
  '中共广东省委宣传部': {
    info: '广东省委宣传部是广东省委主管意识形态的综合职能部门，位于广东省广州市越秀区合群三马路26号省委大院。统一社会信用代码为11440000006939561H。'
  },
  '中共广东省委宣传部机关工会委员会': {
    info: '广东省委宣传部是依法设立的工会，位于广东省广州市越秀区合群三马路26号省委大院。统一社会信用代码为81440000742971228Y。'
  }
  // 可以继续添加更多特定主体
}

export class DataSubmitter {
  constructor() {
    this.storageKey = 'contract_extracted_data'
  }

  /**
   * 处理提取的合同数据
   * @param {Object} rawResult - AI提取的原始结果
   * @returns {Promise<Object>} 处理后的数据
   */
  async processExtractedData(rawResult) {
    console.log('processExtractedData:', rawResult)

    if (!rawResult || typeof rawResult !== 'object' || rawResult.error) {
      console.warn('未找到有效的提取数据或存在错误:', rawResult)
      return null
    }

    // 过滤非数据字段
    const filteredData = this.filterDataFields(rawResult)
    let finalData = Object.keys(filteredData).length > 0 ? filteredData : rawResult

    // 标准化字段
    finalData = this.normalizeFields(finalData)

    // 处理特殊合同类型
    finalData = this.handleSpecialContractTypes(finalData)

    // 自动获取主体信息（静默处理，不显示中间提示）
    try {
      console.log('开始获取主体信息...')
      
      // 获取甲方信息
      const 甲方 = finalData['甲方'] || finalData['甲方名称']
      if (甲方 && 甲方.trim()) {
        finalData['甲方主体信息'] = await this.fetchSubjectInfo(甲方.trim(), '甲方')
      }

      // 获取乙方信息
      const 乙方 = finalData['乙方'] || finalData['乙方名称']
      if (乙方 && 乙方.trim()) {
        finalData['乙方主体信息'] = await this.fetchSubjectInfo(乙方.trim(), '乙方')
      }
      
      // 只在成功时静默处理，不显示提示（最终会在 contractService 中统一显示完成提示）
      console.log('主体信息获取成功')
    } catch (error) {
      console.error('获取主体信息失败:', error)
      // 失败时静默处理，不显示警告（避免过多提示）
      // 失败时添加空字段，允许用户手动填写
      finalData['甲方主体信息'] = finalData['甲方主体信息'] || ''
      finalData['乙方主体信息'] = finalData['乙方主体信息'] || ''
    }

    return finalData
  }

  /**
   * 获取单个主体信息
   * @param {string} subjectName - 主体名称
   * @param {string} subjectType - 主体类型（甲方/乙方）
   * @returns {Promise<string>} - 主体信息字符串
   */
  async fetchSubjectInfo(subjectName, subjectType) {
    console.log(`开始获取${subjectType}信息:`, subjectName)

    try {
      // 检查是否是特定主体
      if (specialSubjects[subjectName]) {
        console.log(`使用${subjectType}特定主体映射`)
        return specialSubjects[subjectName].info
      }

      // 调用 coze API 获取企业信息
      const companyInfo = await fetchCompanyInfo(subjectName)
      
      if (companyInfo.code) {
        console.log(`${subjectType}信息获取成功`)
        return this.formatCompanyInfo(companyInfo)
      } else {
        console.warn(`${subjectType}信息查询失败:`, companyInfo.msg)
        return `${subjectName}（${companyInfo.msg}）`
      }
    } catch (error) {
      console.error(`获取${subjectType}信息失败:`, error)
      return `${subjectName}（查询失败：${error.message}）`
    }
  }

  /**
   * 格式化企业信息为字符串
   * @param {Object} companyInfo - 企业信息对象
   * @returns {string} - 格式化后的字符串
   * @example "广东汉剧传承研究院是依法设立的事业单位，统一社会信用代码是 12441400091783572D ，业务范围是开展广东汉剧的传承研究、培训展演和剧种推介工作等"
   */
  formatCompanyInfo(companyInfo) {
    const name = companyInfo.name || '企业'
    const type = companyInfo.companyOrgType || '组织'
    const creditCode = companyInfo.creditCode || '未知'
    let businessScope = companyInfo.businessScope || '未知'
    
    // 检查是否是非正常数据（包含【】标记）
    const hasAbnormalData = 
      name.includes('【未查询到') || 
      type.includes('【未查询到') || 
      creditCode.includes('【未查询到') || 
      businessScope.includes('【未查询到')
    
    // 如果是非正常数据，直接返回原始信息，不进行格式化
    if (hasAbnormalData) {
      return `名称：${name}，企业类型：${type}，统一社会信用代码：${creditCode}，业务范围：${businessScope}`
    }
    
    // 正常数据：截取业务范围前4个分号的内容
    if (businessScope !== '未知') {
      // 匹配中文分号和英文分号
      const parts = businessScope.split(/[;；]/)
      if (parts.length > 4) {
        // 取前4项
        businessScope = parts.slice(0, 4).join('；')
      } else if (parts.length > 1) {
        // 有分号但不足4项
        businessScope = parts.join('；')
      }
      
      // 去除末尾的标点符号（包括：。，；;、等）
      businessScope = businessScope.replace(/[。，；;、：:！!？?【】[\]《》<>""'']+$/, '')
      
      // 在末尾加"等"
      businessScope = businessScope + '等'
    }
    
    // 正常数据：按照指定格式
    return `${name}是依法设立的${type}，统一社会信用代码是 ${creditCode} ，业务范围是${businessScope}`
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
    const requiredFields = ['合同名称', '甲方', '乙方', '其他方', '合同金额', '对接客户', '甲方主体信息', '乙方主体信息']
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
   * 创建金山文档记录
   * @param {Object} fields - 字段数据
   * @returns {Promise<Object>} 创建结果
   */
  async createKdocsRecord(fields) {
    console.log('创建金山文档行记录 fields', fields)

    try {
      const res = await kdocsHandler({
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
   * 提交提取的数据（完整流程）
   * @param {Object} extractedData - 提取的数据
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
      const fields = this.normalizeFields(extractedData)

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
