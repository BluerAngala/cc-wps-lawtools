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
   * 初始化模板 - 复制内置模板到配置目录
   */
  async initializeTemplates() {
    if (!this.isWPSAvailable()) {
      console.warn('WPS 环境不可用，跳过模板初始化')
      return false
    }

    try {
      // 检查是否已初始化
      const storage = window.Application.PluginStorage
      const initialized = storage.getItem('templates_initialized')
      
      if (initialized === 'true') {
        console.log('模板已初始化，跳过')
        return true
      }

      console.log('开始初始化模板...')
      
      // 确保目录存在
      if (!this.ensureTemplatesDir()) {
        console.error('无法创建模板目录')
        return false
      }

      const fs = window.Application.FileSystem
      const templatesDir = this.getTemplatesDir()
      
      // 加载内置模板配置
      const response = await fetch('/templates/templates.json')
      const data = await response.json()
      const builtInTemplates = data.templates || []
      
      console.log(`开始复制 ${builtInTemplates.length} 个内置模板...`)
      
      let successCount = 0
      let failCount = 0
      
      // 复制每个模板文件
      for (const template of builtInTemplates) {
        try {
          const sourceUrl = `/templates/${template.fileName}`
          const targetPath = templatesDir + '/' + template.fileName
          
          // 检查文件是否已存在
          if (fs.Exists(targetPath)) {
            console.log('模板文件已存在，跳过:', template.fileName)
            successCount++
            continue
          }
          
          // 从 URL 下载文件并保存
          // 注意：这里需要通过打开文件再另存的方式复制
          const tempDoc = window.Application.Documents.Open(window.location.origin + sourceUrl, false, true)
          tempDoc.SaveAs2(targetPath, 16)
          tempDoc.Close(false)
          
          console.log('已复制模板:', template.fileName)
          successCount++
        } catch (error) {
          console.error('复制模板失败:', template.fileName, error)
          failCount++
        }
      }
      
      // 保存配置文件
      const configData = {
        templates: builtInTemplates.map(t => ({
          ...t,
          filePath: templatesDir + '/' + t.fileName
        })),
        lastUpdated: new Date().toISOString()
      }
      
      const configPath = this.getConfigFilePath()
      fs.WriteFile(configPath, JSON.stringify(configData, null, 2))
      console.log('配置文件已保存:', configPath)
      
      // 标记为已初始化
      storage.setItem('templates_initialized', 'true')
      
      console.log(`模板初始化完成！成功：${successCount} 个，失败：${failCount} 个`)
      return true
    } catch (error) {
      console.error('初始化模板失败:', error)
      return false
    }
  }

  /**
   * 加载所有模板配置
   */
  async loadTemplates() {
    if (!this.isWPSAvailable()) {
      console.warn('WPS 环境不可用')
      return []
    }

    try {
      const fs = window.Application.FileSystem
      const configPath = this.getConfigFilePath()
      
      if (!configPath || !fs.Exists(configPath)) {
        console.warn('模板配置文件不存在，尝试初始化...')
        await this.initializeTemplates()
        
        // 重新检查
        if (!configPath || !fs.Exists(configPath)) {
          console.error('初始化失败')
          return []
        }
      }
      
      // 读取配置文件
      const configContent = fs.ReadFile(configPath)
      const configData = JSON.parse(configContent)
      
      return configData.templates || []
    } catch (error) {
      console.error('加载模板配置失败:', error)
      return []
    }
  }

  /**
   * 保存模板配置
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

