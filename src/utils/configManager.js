/**
 * 配置管理器 - 统一管理组件配置的保存和加载
 */

export class ConfigManager {
  constructor(storageKey = 'contract_services_config') {
    this.storageKey = storageKey
    this.defaultConfigs = {
      extractor: {
        extractTags: ['合同名称', '甲方', '乙方', '其他方', '合同金额']
      },
      keyword: {
        keywordList: [
          { keyword: '第一条', comment: '提醒确认此部分内容是否准确无误。' },
          {
            keyword: '付款方式',
            comment:
              '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。'
          },
          {
            keyword: '费用',
            comment:
              '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。'
          },
          {
            keyword: '验收',
            comment:
              '提醒经办人员注意加强验收，并注意检查验收材料的真实性、准确性、完整性，妥善保管好验收有关资料。'
          },
          { keyword: '银行账号', comment: '提醒确认支付账号是否准确无误' },
          { keyword: '仲裁', comment: '建议约定统一约定法院管辖' },
          { keyword: '"广东特支计划"', comment: '提醒确认项目名称以及期数是否准确无误' },
          {
            keyword: '培养期为',
            comment: '提醒确认培养期是否准确无误。请注意签约时间是否合理！！！'
          },
          {
            keyword: '资金发放安排',
            comment:
              '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。'
          },
          { keyword: '榜单项目信息', comment: '提醒确认此部分内容是否准确无误。' }
        ]
      },
      review: {
        contractReviewRules: [
          {
            reviewRules: '审查争议解决条款',
            reviewRequirements:
              '审查合同是否存在争议解决条款，约定纠纷处理是仲裁还是法院，争议解决条款是否有效？',
            actionType: '批注'
          },
          {
            reviewRules: '审查违约责任条款',
            reviewRequirements:
              '审查合同中违约责任条款是否明确，违约金或赔偿标准是否合理，是否存在免责条款？',
            actionType: '批注'
          }
        ]
      }
    }
  }

  /**
   * 保存配置到本地存储
   * @param {Object} configs - 配置对象
   * @param {boolean} showMessage - 是否显示消息
   * @returns {boolean} 保存是否成功
   */
  saveConfig(configs, showMessage = false) {
    try {
      const configData = {
        ...configs,
        timestamp: Date.now()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(configData))
      console.log('配置已保存到本地存储')

      if (showMessage) {
        // 这里可以根据需要触发消息通知
        return { success: true, message: '配置已保存到本地存储' }
      }
      return true
    } catch (error) {
      console.error('保存配置失败:', error)
      if (showMessage) {
        return { success: false, message: '保存配置失败' }
      }
      return false
    }
  }

  /**
   * 从本地存储加载配置
   * @returns {Object|null} 配置对象或null
   */
  loadConfig() {
    try {
      const savedData = localStorage.getItem(this.storageKey)
      if (savedData) {
        const configData = JSON.parse(savedData)
        if (configData && configData.timestamp) {
          console.log('已从本地存储加载配置')
          return configData
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
    return null
  }

  /**
   * 重置配置到默认值
   * @returns {Object} 默认配置
   */
  resetConfig() {
    localStorage.removeItem(this.storageKey)
    console.log('配置已重置为默认值')
    return { ...this.defaultConfigs }
  }

  /**
   * 获取默认配置
   * @param {string} type - 配置类型 (extractor, keyword, review)
   * @returns {Object} 默认配置
   */
  getDefaultConfig(type) {
    return type ? this.defaultConfigs[type] : { ...this.defaultConfigs }
  }

  /**
   * 合并配置
   * @param {Object} currentConfig - 当前配置
   * @param {Object} newConfig - 新配置
   * @returns {Object} 合并后的配置
   */
  mergeConfig(currentConfig, newConfig) {
    return {
      ...currentConfig,
      ...newConfig,
      timestamp: Date.now()
    }
  }
}

// 创建默认实例
export const configManager = new ConfigManager()
