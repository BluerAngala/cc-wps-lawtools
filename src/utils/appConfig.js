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
        timeout: 120000
      },
      
      // 金山文档配置
      kdocs: {
        webhookUrl: import.meta.env.VITE_KDOCS_WEBHOOK_URL || '',
        token: import.meta.env.VITE_KDOCS_TOKEN || '',
        sheetId: Number(import.meta.env.VITE_KDOCS_SHEETID) || 5,
        apiUrl: import.meta.env.VITE_KDOCS_API_URL || ''
      },
      
      // 合同要素提取配置
      extractor: {
        extractTags: ['合同名称', '甲方', '乙方', '其他方', '合同金额']
      },
      
      // 关键词批注配置
      keyword: {
        keywordList: [
          { keyword: '第一条', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注' },
          { keyword: '付款方式', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注' },
          { keyword: '费用', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注' },
          { keyword: '验收', comment: '提醒经办人员注意加强验收，并注意检查验收材料的真实性、准确性、完整性，妥善保管好验收有关资料。', actionType: '批注' },
          { keyword: '银行账号', comment: '提醒确认支付账号是否准确无误', actionType: '批注' },
          { keyword: '仲裁', comment: '建议约定统一约定法院管辖', actionType: '修订' },
          { keyword: '"广东特支计划"', comment: '提醒确认项目名称以及期数是否准确无误', actionType: '批注' },
          { keyword: '培养期为', comment: '提醒确认培养期是否准确无误。请注意签约时间是否合理！！！', actionType: '批注' },
          { keyword: '资金发放安排', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。', actionType: '批注' },
          { keyword: '榜单项目信息', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注' }
        ]
      },
      
      // 合同审查配置
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
}

// 创建单例
export const appConfig = new AppConfigManager()
