/**
 * 模板管理器 - 使用 WPS FileSystem API 管理模板文件
 */

class TemplateManager {
  constructor() {
    this.configDirName = 'wps_addon_config'
    this.templatesDirName = 'templates'
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
   * 获取模板目录路径
   */
  getTemplatesDir() {
    if (!this.isWPSAvailable()) return null
    
    try {
      const homePath = window.Application.Env.GetHomePath()
      if (!homePath) {
        console.error('无法获取用户主目录路径')
        return null
      }
      const normalizedPath = homePath.replace(/\\/g, '/')
      const configDir = normalizedPath.replace(/\/+$/, '') + '/' + this.configDirName
      return configDir + '/' + this.templatesDirName
    } catch (error) {
      console.error('获取模板目录失败:', error)
      return null
    }
  }

  /**
   * 获取配置文件路径
   */
  getConfigFilePath() {
    const templatesDir = this.getTemplatesDir()
    if (!templatesDir) return null
    return templatesDir + '/templates.json'
  }

  /**
   * 确保模板目录存在
   */
  ensureTemplatesDir() {
    if (!this.isWPSAvailable()) return false
    
    try {
      const fs = window.Application.FileSystem
      const homePath = window.Application.Env.GetHomePath()
      if (!homePath) return false
      
      const normalizedPath = homePath.replace(/\\/g, '/')
      const configDir = normalizedPath.replace(/\/+$/, '') + '/' + this.configDirName
      const templatesDir = configDir + '/' + this.templatesDirName
      
      // 创建配置目录
      if (!fs.Exists(configDir)) {
        fs.Mkdir(configDir)
        console.log('已创建配置目录:', configDir)
      }
      
      // 创建模板目录
      if (!fs.Exists(templatesDir)) {
        fs.Mkdir(templatesDir)
        console.log('已创建模板目录:', templatesDir)
      }
      
      return true
    } catch (error) {
      console.error('创建模板目录失败:', error)
      return false
    }
  }

  /**
   * 初始化模板 - 直接使用内置模板，无需复制
   */
  async initializeTemplates() {
    try {
      // 检查是否已初始化
      const storage = window.Application?.PluginStorage
      const initialized = storage?.getItem('templates_initialized')
      
      if (initialized === 'true') {
        console.log('模板已初始化，跳过')
        return true
      }

      console.log('开始初始化模板（直接使用内置模板）...')
      
      // 加载内置模板配置
      const response = await fetch('/templates/templates.json')
      if (!response.ok) {
        console.error('无法加载内置模板配置')
        return false
      }
      
      const data = await response.json()
      const builtInTemplates = data.templates || []
      
      console.log(`已加载 ${builtInTemplates.length} 个内置模板`)
      
      // 标记为已初始化
      if (storage) {
        storage.setItem('templates_initialized', 'true')
      }
      
      console.log('模板初始化完成（直接使用内置模板）')
      return true
    } catch (error) {
      console.error('初始化模板失败:', error)
      return false
    }
  }

  /**
   * 加载所有模板配置 - 直接从内置模板加载
   */
  async loadTemplates() {
    try {
      // 直接从内置模板配置加载
      const response = await fetch('/templates/templates.json')
      if (!response.ok) {
        console.warn('无法加载内置模板配置，尝试初始化...')
        await this.initializeTemplates()
        
        // 重新尝试加载
        const retryResponse = await fetch('/templates/templates.json')
        if (!retryResponse.ok) {
          console.error('加载模板配置失败')
          return []
        }
        const retryData = await retryResponse.json()
        return this.processTemplates(retryData.templates || [])
      }
      
      const data = await response.json()
      return this.processTemplates(data.templates || [])
    } catch (error) {
      console.error('加载模板配置失败:', error)
      return []
    }
  }

  /**
   * 处理模板数据，添加 URL 路径
   */
  processTemplates(templates) {
    return templates.map(template => ({
      ...template,
      // 使用内置模板的 URL 路径
      filePath: `/templates/${template.fileName}`,
      // 兼容旧代码，保留 fileUrl 字段
      fileUrl: window.location.origin + `/templates/${template.fileName}`
    }))
  }

  /**
   * 保存模板配置（用于保存自定义模板，内置模板无需保存）
   */
  saveTemplates(templates) {
    if (!this.isWPSAvailable()) return false
    
    try {
      const fs = window.Application.FileSystem
      const configPath = this.getConfigFilePath()
      
      if (!configPath) {
        console.error('无法获取配置文件路径')
        return false
      }
      
      const configData = {
        templates: templates,
        lastUpdated: new Date().toISOString()
      }
      
      const writeResult = fs.WriteFile(configPath, JSON.stringify(configData, null, 2))
      
      if (writeResult) {
        console.log('模板配置已保存:', templates.length, '个模板')
        return true
      } else {
        console.error('保存配置文件失败')
        return false
      }
    } catch (error) {
      console.error('保存模板配置失败:', error)
      return false
    }
  }

  /**
   * 重置初始化状态（用于调试）
   */
  resetInitialization() {
    if (!this.isWPSAvailable()) return false
    
    try {
      const storage = window.Application.PluginStorage
      storage.removeItem('templates_initialized')
      console.log('模板初始化状态已重置')
      return true
    } catch (error) {
      console.error('重置初始化状态失败:', error)
      return false
    }
  }
}

// 创建单例
export const templateManager = new TemplateManager()

