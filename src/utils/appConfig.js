/**
 * 应用配置管理器 - 使用 WPS FileSystem API 持久化存储
 */

import { pathManager } from './pathManager.js'

class AppConfigManager {
  constructor() {
    this.configFileName = 'config.json'
    this.defaultConfig = {
      // AI 服务配置
      ai: {
        apiKey: import.meta.env.VITE_AI_API_KEY || '',
        baseUrl: import.meta.env.VITE_AI_API_BASE_URL || 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Instruct-0905',
        timeout: 120000,
        maxTokens: 8000,
        temperature: 0.1,
        defaultModels: [
          { label: 'Qwen2.5-7B-Instruct (推荐-快速)', value: 'Qwen/Qwen2.5-7B-Instruct', tag: '推荐' },
          { label: 'Qwen2.5-14B-Instruct (推荐-平衡)', value: 'Qwen/Qwen2.5-14B-Instruct', tag: '推荐' },
          { label: 'Qwen2.5-72B-Instruct (强大)', value: 'Qwen/Qwen2.5-72B-Instruct', tag: '高级' },
          { label: 'DeepSeek-V3 (高性能)', value: 'deepseek-ai/DeepSeek-V3', tag: '高级' },
          { label: 'GLM-4-9B (快速)', value: 'Pro/THUDM/glm-4-9b-chat', tag: '推荐' }
        ]
      },
      
      // 金山文档配置
      kdocs: {
        webhookUrl: import.meta.env.VITE_KDOCS_WEBHOOK_URL || '',
        token: import.meta.env.VITE_KDOCS_TOKEN || '',
        sheetId: Number(import.meta.env.VITE_KDOCS_SHEETID) || 5,
        cozeApiKey: import.meta.env.VITE_COZE_API_KEY || '',

        workflowId: import.meta.env.VITE_COZE_KDOCS_WORKFLOW_ID || '',  // 用于金山文档操作的工作流ID

        companyInfoWorkflowId: import.meta.env.VITE_COZE_COMPANY_WORKFLOW_ID || '7550481844523221034'  // 用于获取企业信息的工作流ID
      },
      
      // 合同要素提取配置
      extractor: {
        extractTags: ['合同名称', '对接客户', '甲方', '甲方主体信息', '乙方', '乙方主体信息', '其他方', '合同金额']
      },
      
      // 关键词批注配置（保留兼容性）
      keyword: {
        keywordList: [
          { keyword: '第一条', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注', suggestedText: '' },
          { keyword: '付款方式', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注', suggestedText: '' },
          { keyword: '费用', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注', suggestedText: '' },
          { keyword: '验收', comment: '提醒经办人员注意加强验收，并注意检查验收材料的真实性、准确性、完整性，妥善保管好验收有关资料。', actionType: '批注', suggestedText: '' },
          { keyword: '银行账号', comment: '提醒确认支付账号是否准确无误', actionType: '批注', suggestedText: '' },
          { keyword: '仲裁', comment: '建议约定统一约定法院管辖', actionType: '修订', suggestedText: '' },
          { keyword: '"广东特支计划"', comment: '提醒确认项目名称以及期数是否准确无误', actionType: '批注', suggestedText: '' },
          { keyword: '培养期为', comment: '提醒确认培养期是否准确无误。请注意签约时间是否合理！！！', actionType: '批注', suggestedText: '' },
          { keyword: '资金发放安排', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注', suggestedText: '' },
          { keyword: '榜单项目信息', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注', suggestedText: '' }
        ]
      },
      
      // 关键词方案管理（新增）
      keywordSchemes: {
        schemes: [
          {
            id: 'default_keyword',
            name: '默认方案',
            type: 'keyword',
            rules: [
              { keyword: '第一条', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注', suggestedText: '' },
              { keyword: '付款方式', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注', suggestedText: '' },
              { keyword: '费用', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注', suggestedText: '' },
              { keyword: '验收', comment: '提醒经办人员注意加强验收，并注意检查验收材料的真实性、准确性、完整性，妥善保管好验收有关资料。', actionType: '批注', suggestedText: '' },
              { keyword: '银行账号', comment: '提醒确认支付账号是否准确无误', actionType: '批注', suggestedText: '' },
              { keyword: '仲裁', comment: '建议约定统一约定法院管辖', actionType: '修订', suggestedText: '' },
              { keyword: '"广东特支计划"', comment: '提醒确认项目名称以及期数是否准确无误', actionType: '批注', suggestedText: '' },
              { keyword: '培养期为', comment: '提醒确认培养期是否准确无误。请注意签约时间是否合理！！！', actionType: '批注', suggestedText: '' },
              { keyword: '资金发放安排', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注', suggestedText: '' },
              { keyword: '榜单项目信息', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注', suggestedText: '' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        activeSchemeId: 'default_keyword'
      },
      
      // 合同审查配置（保留兼容性）
      review: {
        contractReviewRules: [
          {
            reviewRules: '争议解决',
            reviewRequirements: '请AI审查合同中的争议解决条款，检查是否约定了明确的纠纷处理方式（仲裁或法院管辖），并评估条款的有效性和合理性',
            actionType: '批注'
          },
          {
            reviewRules: '违约责任',
            reviewRequirements: '请AI分析违约责任条款的完整性，检查违约金标准是否合理，免责条款是否过于宽泛，并提出改进建议',
            actionType: '批注'
          },
          {
            reviewRules: '付款条件',
            reviewRequirements: '请AI审查并优化付款条款，确保付款方式、期限、条件表述清晰，识别潜在的付款风险并提出修订建议',
            actionType: '修订'
          },
          {
            reviewRules: '合同期限',
            reviewRequirements: '请AI检查合同期限条款的明确性，包括起止时间、续约机制、提前终止条件，并评估是否存在歧义',
            actionType: '批注'
          },
          {
            reviewRules: '知识产权',
            reviewRequirements: '请AI全面审查知识产权相关条款，包括权利归属、使用范围、侵权责任分担、保密义务等，确保权责清晰',
            actionType: '批注'
          }
        ]
      },
      
      // 审查方案管理（新增）
      reviewSchemes: {
        schemes: [
          {
            id: 'default_review',
            name: '默认审查方案',
            type: 'review',
            rules: [
              {
                keyword: '合同主体',
                comment: '请核实合同双方主体资格是否合法有效，营业执照、授权委托书等资质文件是否齐全',
                actionType: 'comment'
              },
              {
                keyword: '付款条款',
                comment: '请确认付款方式、期限、条件是否明确，是否存在付款风险',
                actionType: 'comment'
              },
              {
                keyword: '违约责任',
                comment: '请审查违约金标准是否合理（一般不超过合同金额的30%），免责条款是否过于宽泛',
                actionType: 'comment'
              },
              {
                keyword: '争议解决',
                comment: '建议约定明确的管辖法院或仲裁机构，避免约定不明导致的管辖争议',
                actionType: 'comment'
              },
              {
                keyword: '合同期限',
                comment: '请确认合同起止时间、续约机制、提前终止条件是否明确',
                actionType: 'comment'
              },
              {
                keyword: '保密条款',
                comment: '请审查保密范围、保密期限、违约责任是否明确约定',
                actionType: 'comment'
              },
              {
                keyword: '知识产权',
                comment: '请确认知识产权归属、使用范围、侵权责任分担是否清晰',
                actionType: 'comment'
              },
              {
                keyword: '不可抗力',
                comment: '请审查不可抗力条款的范围是否合理，通知义务和后果处理是否明确',
                actionType: 'comment'
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        activeSchemeId: 'default_review'
      },
      
      // 系统配置
      system: {
        autoSave: true,
        theme: 'light'
      }
    }
  }

  /**
   * 检查 WPS 环境
   */
  isWPSAvailable() {
    return typeof window !== 'undefined' && 
           typeof window.Application !== 'undefined' &&
           typeof window.Application.FileSystem !== 'undefined'
  }

  /**
   * 获取配置目录绝对路径
   * 使用统一路径管理器
   */
  getConfigDir() {
    return pathManager.getConfigDir()
  }

  /**
   * 获取配置文件完整绝对路径
   */
  getConfigFullPath() {
    return pathManager.getConfigFilePath()
  }

  /**
   * 确保配置目录存在
   */
  ensureConfigDir() {
    const configDir = this.getConfigDir()
    if (!configDir) return false
    return pathManager.ensureDir(configDir)
  }

  /**
   * 深度合并对象
   */
  deepMerge(target, source) {
    const result = { ...target }
    for (const key in source) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    return result
  }

  /**
   * 读取配置
   */
  getConfig() {
    if (!this.isWPSAvailable()) {
      return { ...this.defaultConfig }
    }

    try {
      const fs = window.Application.FileSystem
      const configFile = this.getConfigFullPath()
      
      if (!configFile) {
        console.error('无法获取配置文件路径')
        return { ...this.defaultConfig }
      }
      
      // 检查文件是否存在
      if (!fs.Exists(configFile)) {
        // 自动初始化配置文件
        this.initializeConfig()
        return { ...this.defaultConfig }
      }

      // 读取配置 - 使用 ReadFile（支持绝对路径）
      const content = fs.ReadFile(configFile)
      if (!content || content.trim() === '') {
        this.initializeConfig()
        return { ...this.defaultConfig }
      }

      const config = JSON.parse(content)
      return this.deepMerge(this.defaultConfig, config)
    } catch (error) {
      console.error('读取配置失败:', error)
      return { ...this.defaultConfig }
    }
  }

  /**
   * 初始化配置文件（首次运行）
   */
  initializeConfig() {
    try {
      const fs = window.Application.FileSystem
      
      // 确保配置目录存在
      if (!this.ensureConfigDir()) {
        console.error('无法创建配置目录')
        return false
      }
      
      const configFile = this.getConfigFullPath()
      if (!configFile) {
        console.error('无法获取配置文件路径')
        return false
      }
      
      // 写入默认配置
      const jsonString = JSON.stringify(this.defaultConfig, null, 2)
      
      // 使用 WriteFile（支持绝对路径）
      const writeResult = fs.WriteFile(configFile, jsonString)
      
      // 验证
      if (writeResult && fs.Exists(configFile)) {
        return true
      } else {
        console.error('配置文件初始化失败')
        return false
      }
    } catch (error) {
      console.error('初始化配置失败:', error.message)
      return false
    }
  }

  /**
   * 保存配置
   */
  saveConfig(config) {
    if (!this.isWPSAvailable()) {
      window.$message?.error('WPS 环境不可用，无法保存配置')
      return false
    }

    try {
      const fs = window.Application.FileSystem
      
      // 确保配置目录存在
      if (!this.ensureConfigDir()) {
        window.$message?.error('无法创建配置目录')
        return false
      }
      
      const configFile = this.getConfigFullPath()
      if (!configFile) {
        window.$message?.error('无法获取配置文件路径')
        return false
      }
      
      // 保存配置 - 使用 WriteFile（支持绝对路径）
      const jsonString = JSON.stringify(config, null, 2)
      const writeResult = fs.WriteFile(configFile, jsonString)
      
      // 验证保存
      if (writeResult && fs.Exists(configFile)) {
        return true
      } else {
        window.$message?.error('配置保存失败')
        return false
      }
    } catch (error) {
      console.error('保存配置失败:', error.message)
      window.$message?.error('保存配置失败: ' + error.message)
      return false
    }
  }

  /**
   * 获取指定分类配置
   */
  get(category) {
    const config = this.getConfig()
    return category ? config[category] : config
  }

  /**
   * 设置指定分类配置
   */
  set(category, value) {
    const config = this.getConfig()
    config[category] = value
    return this.saveConfig(config)
  }

  /**
   * 重置配置
   */
  reset() {
    if (!this.isWPSAvailable()) {
      return { ...this.defaultConfig }
    }

    try {
      const fs = window.Application.FileSystem
      const configFile = this.getConfigFullPath()
      
      if (configFile && fs.Exists(configFile)) {
        // 使用 Remove 删除文件（支持绝对路径）
        fs.Remove(configFile)
      }
      return { ...this.defaultConfig }
    } catch (error) {
      console.error('重置配置失败:', error)
      return { ...this.defaultConfig }
    }
  }

  /**
   * 导出配置
   */
  exportConfig() {
    const config = this.getConfig()
    const dataStr = JSON.stringify(config, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wps-addon-config-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 导入配置
   */
  async importConfig(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result)
          this.saveConfig(config)
          resolve(config)
        } catch (error) {
          reject(new Error('配置文件格式错误'))
        }
      }
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }


  /**
   * 获取配置信息（用于调试）
   */
  getConfigInfo() {
    return pathManager.getPathInfo()
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return { ...this.defaultConfig }
  }

  /**
   * 获取方案列表
   * @param {string} type - 'keyword' | 'review'
   */
  getSchemes(type) {
    const config = this.getConfig()
    const schemeKey = type === 'keyword' ? 'keywordSchemes' : 'reviewSchemes'
    
    // 如果没有方案配置，从旧配置迁移
    if (!config[schemeKey] || !config[schemeKey].schemes) {
      return this.migrateToSchemes(type)
    }
    
    return config[schemeKey]
  }

  /**
   * 保存方案列表
   * @param {string} type - 'keyword' | 'review'
   * @param {Object} schemesData - { schemes: [], activeSchemeId: '' }
   */
  saveSchemes(type, schemesData) {
    const config = this.getConfig()
    const schemeKey = type === 'keyword' ? 'keywordSchemes' : 'reviewSchemes'
    config[schemeKey] = schemesData
    return this.saveConfig(config)
  }

  /**
   * 获取当前激活的方案
   * @param {string} type - 'keyword' | 'review'
   */
  getActiveScheme(type) {
    const schemesData = this.getSchemes(type)
    const activeScheme = schemesData.schemes.find(s => s.id === schemesData.activeSchemeId)
    return activeScheme || schemesData.schemes[0]
  }

  /**
   * 设置激活的方案
   * @param {string} type - 'keyword' | 'review'
   * @param {string} schemeId - 方案ID
   */
  setActiveScheme(type, schemeId) {
    const schemesData = this.getSchemes(type)
    schemesData.activeSchemeId = schemeId
    return this.saveSchemes(type, schemesData)
  }

  /**
   * 创建新方案
   * @param {string} type - 'keyword' | 'review'
   * @param {Object} scheme - 方案对象
   */
  createScheme(type, scheme) {
    const schemesData = this.getSchemes(type)
    schemesData.schemes.push(scheme)
    schemesData.activeSchemeId = scheme.id
    return this.saveSchemes(type, schemesData)
  }

  /**
   * 更新方案
   * @param {string} type - 'keyword' | 'review'
   * @param {string} schemeId - 方案ID
   * @param {Object} updates - 更新内容
   */
  updateScheme(type, schemeId, updates) {
    const schemesData = this.getSchemes(type)
    const scheme = schemesData.schemes.find(s => s.id === schemeId)
    if (scheme) {
      Object.assign(scheme, updates)
      scheme.updatedAt = new Date().toISOString()
      return this.saveSchemes(type, schemesData)
    }
    return false
  }

  /**
   * 删除方案
   * @param {string} type - 'keyword' | 'review'
   * @param {string} schemeId - 方案ID
   */
  deleteScheme(type, schemeId) {
    const schemesData = this.getSchemes(type)
    
    // 不能删除最后一个方案
    if (schemesData.schemes.length <= 1) {
      return false
    }
    
    const index = schemesData.schemes.findIndex(s => s.id === schemeId)
    if (index !== -1) {
      schemesData.schemes.splice(index, 1)
      
      // 如果删除的是当前激活方案，切换到第一个方案
      if (schemesData.activeSchemeId === schemeId) {
        schemesData.activeSchemeId = schemesData.schemes[0].id
      }
      
      return this.saveSchemes(type, schemesData)
    }
    return false
  }

  /**
   * 从旧配置迁移到方案系统
   * @param {string} type - 'keyword' | 'review'
   */
  migrateToSchemes(type) {
    const config = this.getConfig()
    const schemeKey = type === 'keyword' ? 'keywordSchemes' : 'reviewSchemes'
    const oldKey = type === 'keyword' ? 'keyword' : 'review'
    
    // 从旧配置创建默认方案
    const defaultScheme = {
      id: `default_${type}`,
      name: '默认方案',
      type: type,
      rules: type === 'keyword' 
        ? (config[oldKey]?.keywordList || [])
        : (config[oldKey]?.contractReviewRules || []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const schemesData = {
      schemes: [defaultScheme],
      activeSchemeId: defaultScheme.id
    }
    
    // 保存迁移后的配置
    config[schemeKey] = schemesData
    this.saveConfig(config)
    
    return schemesData
  }
}

// 创建单例
export const appConfig = new AppConfigManager()
