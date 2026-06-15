/**
 * 模板管理器 - 使用 WPS FileSystem API 管理模板文件
 *
 * 跨平台支持:
 * - Windows/可用FileSystem: 使用文件系统持久化模板配置
 * - Mac(PluginStorage模式): 使用 PluginStorage 持久化模板配置
 */

import unifiedLogger from './UnifiedLogger.js'
import { pathManager } from './PathManager.js'

const TEMPLATES_STORAGE_KEY = 'wps_lawtools_templates'

let builtInTemplatesConfig = null

class TemplateManager {
  constructor() {
    unifiedLogger.info('TemplateManager 已初始化')
  }

  async loadBuiltInTemplatesConfig() {
    if (builtInTemplatesConfig) {
      return builtInTemplatesConfig
    }

    try {
      const basePath = this.getBasePath()
      const configUrl = `${basePath}templates/templates.json`

      unifiedLogger.info('加载内置模板配置', { configUrl })

      const response = await fetch(configUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      builtInTemplatesConfig = await response.json()
      return builtInTemplatesConfig
    } catch (error) {
      unifiedLogger.error('加载内置模板配置失败', {
        error: error.message
      })
      return { templates: [] }
    }
  }

  async initializeTemplates() {
    unifiedLogger.info('开始初始化模板')

    try {
      const storage = window.Application?.PluginStorage
      const initialized = storage?.getItem('templates_initialized')

      unifiedLogger.debug('检查模板初始化状态', {
        initialized,
        hasStorage: !!storage
      })

      if (initialized === 'true') {
        unifiedLogger.info('模板已初始化，跳过')
        return true
      }

      const config = await this.loadBuiltInTemplatesConfig()
      const templates = config.templates || []

      unifiedLogger.info(`已加载 ${templates.length} 个内置模板`, {
        templateCount: templates.length,
        templateNames: templates.map((t) => t.name)
      })

      if (storage) {
        storage.setItem('templates_initialized', 'true')
        unifiedLogger.debug('已标记模板为已初始化')
      }

      unifiedLogger.info('模板初始化完成')
      return true
    } catch (error) {
      unifiedLogger.error('初始化模板失败', {
        method: 'initializeTemplates',
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }

  async loadTemplates() {
    unifiedLogger.info('开始加载所有模板配置')

    try {
      const builtInTemplates = await this.loadBuiltInTemplates()
      unifiedLogger.info(`内置模板加载完成: ${builtInTemplates.length} 个`, {
        count: builtInTemplates.length
      })

      const userTemplates = this.loadUserTemplates()
      unifiedLogger.info(`用户模板加载完成: ${userTemplates.length} 个`, {
        count: userTemplates.length
      })

      const allTemplates = [...userTemplates, ...builtInTemplates]

      unifiedLogger.info(`所有模板加载完成: ${allTemplates.length} 个`, {
        total: allTemplates.length,
        builtIn: builtInTemplates.length,
        user: userTemplates.length
      })

      return allTemplates
    } catch (error) {
      unifiedLogger.error('加载模板配置失败', {
        method: 'loadTemplates',
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  getBasePath() {
    try {
      const url = new URL(window.location.href)
      const pathname = url.pathname.replace(/\/[^/]+$/, '') || '/'

      if (url.protocol === 'file:') {
        return `${url.protocol}//${pathname}/`
      }

      return `${url.protocol}//${url.host}${pathname}/`
    } catch (error) {
      const href = window.location.href
      const base = href.replace(/\/[^/]+$/, '/').replace(/#.*$/, '')
      unifiedLogger.warn('URL 解析失败，使用备用方法', { href, base })
      return base
    }
  }

  async loadBuiltInTemplates() {
    try {
      const config = await this.loadBuiltInTemplatesConfig()
      const templates = config.templates || []
      const basePath = this.getBasePath()

      unifiedLogger.info(`加载内置模板配置: ${templates.length} 个`, {
        count: templates.length,
        basePath
      })

      return templates.map((template) => ({
        ...template,
        filePath: `${basePath}templates/${template.fileName}`,
        isBuiltIn: true
      }))
    } catch (error) {
      unifiedLogger.error('加载内置模板失败', {
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  loadUserTemplates() {
    if (!pathManager.isWPSAvailable()) {
      unifiedLogger.debug('WPS 环境不可用，跳过用户模板加载')
      return []
    }

    // Mac PluginStorage 模式
    if (pathManager.usePluginStorage()) {
      return this.loadUserTemplatesMac()
    }

    // Windows / FileSystem 可用模式
    return this.loadUserTemplatesFS()
  }

  /**
   * Mac 平台加载用户模板（使用 PluginStorage）
   */
  loadUserTemplatesMac() {
    try {
      const storage = window.Application.PluginStorage
      if (!storage) {
        unifiedLogger.warn('PluginStorage 不可用')
        return []
      }

      const content = storage.getItem(TEMPLATES_STORAGE_KEY)
      if (!content) {
        unifiedLogger.debug('Mac 平台无用户模板配置')
        return []
      }

      const data = JSON.parse(content)
      const userTemplates = data.templates || []

      unifiedLogger.info(`Mac 平台用户模板已加载: ${userTemplates.length} 个`, {
        count: userTemplates.length
      })

      return userTemplates
    } catch (error) {
      unifiedLogger.error('Mac 平台加载用户模板失败', {
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  /**
   * Windows 平台加载用户模板（使用 FileSystem）
   */
  loadUserTemplatesFS() {
    try {
      const fs = window.Application.FileSystem
      const configPath = pathManager.getTemplatesConfigPath()

      if (!configPath) {
        unifiedLogger.warn('无法获取用户模板配置路径')
        return []
      }

      if (!fs.Exists(configPath)) {
        unifiedLogger.debug('用户模板配置文件不存在', { configPath })
        return []
      }

      const content = fs.ReadFile(configPath)
      if (!content || content.trim() === '') {
        unifiedLogger.warn('用户模板配置文件为空', { configPath })
        return []
      }

      const data = JSON.parse(content)
      const userTemplates = data.templates || []

      unifiedLogger.info(`用户模板配置已加载: ${userTemplates.length} 个`, {
        configPath,
        count: userTemplates.length
      })

      return userTemplates
    } catch (error) {
      unifiedLogger.error('加载用户模板失败', {
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  saveTemplates(templates) {
    unifiedLogger.info(`开始保存模板配置: ${templates.length} 个模板`)

    if (!pathManager.isWPSAvailable()) {
      unifiedLogger.warn('WPS 环境不可用，无法保存模板配置')
      return false
    }

    // Mac PluginStorage 模式
    if (pathManager.usePluginStorage()) {
      return this.saveTemplatesMac(templates)
    }

    // Windows / FileSystem 可用模式
    return this.saveTemplatesFS(templates)
  }

  /**
   * Mac 平台保存模板配置（使用 PluginStorage）
   */
  saveTemplatesMac(templates) {
    try {
      const storage = window.Application.PluginStorage
      if (!storage) {
        unifiedLogger.error('PluginStorage 不可用')
        return false
      }

      const userTemplates = templates.filter((t) => !t.isBuiltIn)

      const configData = {
        templates: userTemplates,
        lastUpdated: new Date().toISOString()
      }

      const configJson = JSON.stringify(configData, null, 2)
      storage.setItem(TEMPLATES_STORAGE_KEY, configJson)

      unifiedLogger.info(`Mac 平台模板配置已保存: ${userTemplates.length} 个模板`, {
        total: templates.length,
        userTemplates: userTemplates.length,
        builtInTemplates: templates.length - userTemplates.length
      })

      return true
    } catch (error) {
      unifiedLogger.error('Mac 平台保存模板配置失败', {
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }

  /**
   * Windows 平台保存模板配置（使用 FileSystem）
   */
  saveTemplatesFS(templates) {
    try {
      const fs = window.Application.FileSystem
      const configPath = pathManager.getTemplatesConfigPath()

      if (!configPath) {
        unifiedLogger.error('无法获取配置文件路径')
        return false
      }

      const templatesDir = pathManager.getTemplatesDir()
      if (templatesDir) {
        pathManager.ensureDir(templatesDir)
      }

      const userTemplates = templates.filter((t) => !t.isBuiltIn)

      const configData = {
        templates: userTemplates,
        lastUpdated: new Date().toISOString()
      }

      const configJson = JSON.stringify(configData, null, 2)

      unifiedLogger.logFileOperation('write', configPath, null, null)

      const writeResult = fs.WriteFile(configPath, configJson)

      if (writeResult) {
        unifiedLogger.logFileOperation('write', configPath, 'success', null)
        unifiedLogger.info(`用户模板配置已保存: ${userTemplates.length} 个模板`, {
          configPath,
          total: templates.length,
          userTemplates: userTemplates.length,
          builtInTemplates: templates.length - userTemplates.length
        })
        return true
      } else {
        unifiedLogger.logFileOperation(
          'write',
          configPath,
          'failed',
          new Error('WriteFile 返回 false')
        )
        unifiedLogger.error('保存配置文件失败', {
          configPath,
          method: 'saveTemplates'
        })
        return false
      }
    } catch (error) {
      unifiedLogger.error('保存模板配置失败', {
        method: 'saveTemplates',
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }

  resetInitialization() {
    unifiedLogger.info('重置模板初始化状态')

    if (!pathManager.isWPSAvailable()) {
      unifiedLogger.warn('WPS 环境不可用，无法重置初始化状态')
      return false
    }

    try {
      const storage = window.Application.PluginStorage
      storage.removeItem('templates_initialized')

      // Mac PluginStorage 模式也清除模板数据
      if (pathManager.usePluginStorage()) {
        storage.removeItem(TEMPLATES_STORAGE_KEY)
      }

      unifiedLogger.info('模板初始化状态已重置')
      return true
    } catch (error) {
      unifiedLogger.error('重置初始化状态失败', {
        method: 'resetInitialization',
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }
}

export const templateManager = new TemplateManager()
