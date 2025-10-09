/**
 * 应用配置管理器 - 整合所有配置项
 * 使用 WPS FileSystem API 持久化存储
 */

class AppConfigManager {
  constructor() {
    this.configFileName = 'wps_addon_config.json'
    this.defaultConfig = {
      // AI 服务配置
      ai: {
        apiKey: import.meta.env.VITE_AI_API_KEY || '',
        baseUrl: import.meta.env.VITE_AI_API_BASE_URL || 'https://api.siliconflow.cn/v1',
        model: 'Qwen/Qwen2.5-7B-Instruct',
        timeout: 30000
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
          { keyword: '第一条', comment: '提醒确认此部分内容是否准确无误。' },
          { keyword: '付款方式', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误。' },
          { keyword: '费用', comment: '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误。' },
          { keyword: '验收', comment: '提醒经办人员注意加强验收,并注意检查验收材料的真实性、准确性、完整性。' },
          { keyword: '银行账号', comment: '提醒确认支付账号是否准确无误' },
          { keyword: '仲裁', comment: '建议约定统一约定法院管辖' }
        ]
      },
      
      // 合同审查配置
      review: {
        contractReviewRules: [
          {
            reviewRules: '审查争议解决条款',
            reviewRequirements: '审查合同是否存在争议解决条款，约定纠纷处理是仲裁还是法院，争议解决条款是否有效？',
            actionType: '批注'
          },
          {
            reviewRules: '审查违约责任条款',
            reviewRequirements: '审查合同中违约责任条款是否明确，违约金或赔偿标准是否合理，是否存在免责条款？',
            actionType: '批注'
          }
        ]
      },
      
      // 系统配置
      system: {
        firstLoadCompleted: false,
        showWelcome: true,
        autoSave: true,
        theme: 'light'
      }
    }
  }

  /**
   * 检查 WPS 环境是否可用
   */
  isWPSAvailable() {
    return typeof window !== 'undefined' && 
           typeof window.Application !== 'undefined' &&
           window.Application.FileSystem
  }

  /**
   * 获取临时目录路径（多重回退策略）
   */
  getTempPath() {
    if (!this.isWPSAvailable()) {
      return null
    }

    try {
      // 策略 1: 使用 FileSystem.tmpdir() (推荐)
      if (window.Application.FileSystem.tmpdir && 
          typeof window.Application.FileSystem.tmpdir === 'function') {
        const path = window.Application.FileSystem.tmpdir()
        if (path) return path
      }

      // 策略 2: 使用 Env.GetTempPath()
      if (window.Application.Env && 
          window.Application.Env.GetTempPath &&
          typeof window.Application.Env.GetTempPath === 'function') {
        const path = window.Application.Env.GetTempPath()
        if (path) return path
      }

      // 策略 3: 使用 Env.GetUserDataPath()
      if (window.Application.Env && 
          window.Application.Env.GetUserDataPath &&
          typeof window.Application.Env.GetUserDataPath === 'function') {
        const path = window.Application.Env.GetUserDataPath()
        if (path) return path
      }

      return null
    } catch (error) {
      console.error('获取临时路径失败:', error)
      return null
    }
  }

  /**
   * 规范化路径（处理末尾斜杠）
   */
  normalizePath(path) {
    if (!path) return ''
    // 移除末尾的斜杠或反斜杠
    return path.replace(/[/\\]+$/, '')
  }

  /**
   * 获取配置文件路径（用于 API 调用）
   * 注意：WPS FileSystem API 只接受文件名，不能包含路径分隔符
   */
  getConfigPath() {
    if (!this.isWPSAvailable()) {
      return null // 降级到 localStorage
    }
    // 只返回文件名，WPS 会自动保存到临时目录
    return this.configFileName
  }

  /**
   * 获取配置文件完整路径（仅用于显示）
   */
  getConfigFullPath() {
    try {
      const tempPath = this.getTempPath()
      if (!tempPath) {
        return null
      }

      // 规范化路径并拼接文件名
      const normalizedPath = this.normalizePath(tempPath)
      // Windows 使用反斜杠
      return normalizedPath + '\\' + this.configFileName
    } catch (error) {
      console.error('获取完整路径失败:', error)
      return null
    }
  }

  /**
   * 获取完整配置
   */
  getConfig() {
    try {
      const configPath = this.getConfigPath()
      
      // 降级到 localStorage
      if (!configPath) {
        const saved = localStorage.getItem('wps_addon_config')
        return saved ? this.deepMerge(this.defaultConfig, JSON.parse(saved)) : { ...this.defaultConfig }
      }

      // 检查文件是否存在
      if (!window.Application.FileSystem.Exists(configPath)) {
        const fullPath = this.getConfigFullPath()
        console.log('配置文件不存在，使用默认配置:', fullPath || configPath)
        return { ...this.defaultConfig }
      }

      // 使用 readFileString 读取文件内容
      const content = window.Application.FileSystem.readFileString(configPath)
      if (!content || content.trim() === '') {
        console.warn('配置文件为空，使用默认配置')
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
   * 保存完整配置
   */
  saveConfig(config) {
    try {
      const configPath = this.getConfigPath()
      
      // 降级到 localStorage
      if (!configPath) {
        localStorage.setItem('wps_addon_config', JSON.stringify(config))
        console.log('配置已保存到 localStorage')
        return true
      }

      // 使用 writeFileString 写入字符串数据到文件
      // 注意：configPath 只是文件名，WPS 会自动保存到临时目录
      const jsonString = JSON.stringify(config, null, 2)
      window.Application.FileSystem.writeFileString(configPath, jsonString)
      
      const fullPath = this.getConfigFullPath()
      console.log('配置已保存到:', fullPath || configPath)
      
      // 验证保存
      const exists = window.Application.FileSystem.Exists(configPath)
      if (!exists) {
        console.error('保存后文件不存在！')
        return false
      }
      
      return true
    } catch (error) {
      console.error('保存配置失败:', error)
      console.error('错误详情:', error.message)
      return false
    }
  }

  /**
   * 获取指定分类的配置
   */
  get(category) {
    const config = this.getConfig()
    return category ? config[category] : config
  }

  /**
   * 设置指定分类的配置
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
    try {
      const configPath = this.getConfigPath()
      
      if (!configPath) {
        localStorage.removeItem('wps_addon_config')
      } else if (window.Application.FileSystem.Exists(configPath)) {
        window.Application.FileSystem.unlinkSync(configPath)
      }
      
      return { ...this.defaultConfig }
    } catch (error) {
      console.error('重置配置失败:', error)
      return { ...this.defaultConfig }
    }
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
   * 导出配置为 JSON
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
   * 首次加载检查
   */
  isFirstLoad() {
    const config = this.getConfig()
    return !config.system?.firstLoadCompleted
  }

  /**
   * 标记首次加载完成
   */
  markFirstLoadCompleted() {
    const config = this.getConfig()
    config.system.firstLoadCompleted = true
    return this.saveConfig(config)
  }

  /**
   * 重置首次加载状态
   */
  resetFirstLoad() {
    const config = this.getConfig()
    config.system.firstLoadCompleted = false
    return this.saveConfig(config)
  }

  /**
   * 调试信息
   */
  debug() {
    console.log('=== AppConfig 调试信息 ===')
    console.log('1. WPS 可用:', this.isWPSAvailable() ? '是' : '否')
    console.log('2. 临时路径:', this.getTempPath())
    console.log('3. 配置文件名 (API参数):', this.getConfigPath())
    console.log('4. 完整路径 (仅显示):', this.getConfigFullPath())
    
    const configPath = this.getConfigPath()
    if (configPath && this.isWPSAvailable()) {
      console.log('5. 文件存在:', window.Application.FileSystem.Exists(configPath))
      
      if (window.Application.FileSystem.Exists(configPath)) {
        try {
          const content = window.Application.FileSystem.readFileString(configPath)
          console.log('6. 文件内容长度:', content.length, '字符')
          console.log('7. 文件内容预览:', content.substring(0, 200) + '...')
        } catch (error) {
          console.log('6. 读取文件失败:', error.message)
        }
      } else {
        console.log('6. 文件不存在，将使用默认配置')
      }
    } else {
      console.log('5. 使用 localStorage')
      console.log('6. localStorage 内容:', localStorage.getItem('wps_addon_config'))
    }
    
    console.log('8. 当前配置对象:', this.getConfig())
  }
}

// 创建单例
export const appConfig = new AppConfigManager()
