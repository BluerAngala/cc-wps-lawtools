/**
 * 模板管理器 - 使用 WPS FileSystem API 管理模板文件
 */

import logger from './logger.js'
import { pathManager } from './pathManager.js'

class TemplateManager {
  constructor() {
    logger.info('TemplateManager 已初始化')
  }

  /**
   * 初始化模板 - 直接使用内置模板，无需复制
   */
  async initializeTemplates() {
    logger.info('开始初始化模板')

    try {
      // 检查是否已初始化
      const storage = window.Application?.PluginStorage
      const initialized = storage?.getItem('templates_initialized')

      logger.debug('检查模板初始化状态', {
        initialized,
        hasStorage: !!storage
      })

      if (initialized === 'true') {
        logger.info('模板已初始化，跳过')
        return true
      }

      // 加载内置模板配置
      const configUrl = pathManager.getBuiltInTemplatesPath() + '/templates.json'
      logger.logRequest('GET', configUrl)

      const response = await fetch(configUrl)

      logger.logRequest(
        'GET',
        configUrl,
        response.status,
        response.ok ? null : new Error(`HTTP ${response.status}`)
      )

      if (!response.ok) {
        logger.error('无法加载内置模板配置', {
          url: configUrl,
          status: response.status,
          statusText: response.statusText,
          method: 'initializeTemplates'
        })
        return false
      }

      const data = await response.json()
      const builtInTemplates = data.templates || []

      logger.info(`已加载 ${builtInTemplates.length} 个内置模板`, {
        templateCount: builtInTemplates.length,
        templateNames: builtInTemplates.map((t) => t.name)
      })

      // 标记为已初始化
      if (storage) {
        storage.setItem('templates_initialized', 'true')
        logger.debug('已标记模板为已初始化')
      }

      logger.info('模板初始化完成（直接使用内置模板）')
      return true
    } catch (error) {
      logger.error('初始化模板失败', {
        method: 'initializeTemplates',
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }

  /**
   * 加载所有模板配置 - 合并内置模板和用户模板
   */
  async loadTemplates() {
    logger.info('开始加载所有模板配置')

    try {
      // 1. 加载内置模板
      const builtInTemplates = await this.loadBuiltInTemplates()
      logger.info(`内置模板加载完成: ${builtInTemplates.length} 个`, {
        count: builtInTemplates.length
      })

      // 2. 加载用户保存的模板
      const userTemplates = this.loadUserTemplates()
      logger.info(`用户模板加载完成: ${userTemplates.length} 个`, {
        count: userTemplates.length
      })

      // 3. 合并模板（用户模板在前，内置模板在后）
      const allTemplates = [...userTemplates, ...builtInTemplates]
      
      logger.info(`所有模板加载完成: ${allTemplates.length} 个`, {
        total: allTemplates.length,
        builtIn: builtInTemplates.length,
        user: userTemplates.length
      })

      return allTemplates
    } catch (error) {
      logger.error('加载模板配置失败', {
        method: 'loadTemplates',
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  /**
   * 加载内置模板
   */
  async loadBuiltInTemplates() {
    try {
      const configUrl = pathManager.getBuiltInTemplatesPath() + '/templates.json'
      logger.logRequest('GET', configUrl)

      const response = await fetch(configUrl)

      logger.logRequest(
        'GET',
        configUrl,
        response.status,
        response.ok ? null : new Error(`HTTP ${response.status}`)
      )

      if (!response.ok) {
        logger.error('无法加载内置模板配置', {
          url: configUrl,
          status: response.status
        })
        return []
      }

      const data = await response.json()
      const templates = data.templates || []

      // 处理内置模板路径
      return templates.map((template) => ({
        ...template,
        filePath: pathManager.getBuiltInTemplatesPath() + '/' + template.fileName,
        isBuiltIn: true
      }))
    } catch (error) {
      logger.error('加载内置模板失败', {
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  /**
   * 加载用户保存的模板
   */
  loadUserTemplates() {
    if (!pathManager.isWPSAvailable()) {
      logger.debug('WPS 环境不可用，跳过用户模板加载')
      return []
    }

    try {
      const fs = window.Application.FileSystem
      const configPath = pathManager.getTemplatesConfigPath()

      if (!configPath) {
        logger.warn('无法获取用户模板配置路径')
        return []
      }

      // 检查配置文件是否存在
      if (!fs.Exists(configPath)) {
        logger.debug('用户模板配置文件不存在', { configPath })
        return []
      }

      // 读取配置文件
      const content = fs.ReadFile(configPath)
      if (!content || content.trim() === '') {
        logger.warn('用户模板配置文件为空', { configPath })
        return []
      }

      const data = JSON.parse(content)
      const userTemplates = data.templates || []

      logger.info(`用户模板配置已加载: ${userTemplates.length} 个`, {
        configPath,
        count: userTemplates.length
      })

      return userTemplates
    } catch (error) {
      logger.error('加载用户模板失败', {
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  /**
   * 保存模板配置（只保存用户自定义模板）
   */
  saveTemplates(templates) {
    logger.info(`开始保存模板配置: ${templates.length} 个模板`)

    if (!pathManager.isWPSAvailable()) {
      logger.warn('WPS 环境不可用，无法保存模板配置')
      return false
    }

    try {
      const fs = window.Application.FileSystem
      const configPath = pathManager.getTemplatesConfigPath()

      if (!configPath) {
        logger.error('无法获取配置文件路径')
        return false
      }

      // 确保模板目录存在
      const templatesDir = pathManager.getTemplatesDir()
      if (templatesDir) {
        pathManager.ensureDir(templatesDir)
      }

      // 只保存用户自定义模板（过滤掉内置模板）
      const userTemplates = templates.filter(t => !t.isBuiltIn)

      const configData = {
        templates: userTemplates,
        lastUpdated: new Date().toISOString()
      }

      const configJson = JSON.stringify(configData, null, 2)

      logger.logFileOperation('write', configPath, null, null)

      const writeResult = fs.WriteFile(configPath, configJson)

      if (writeResult) {
        logger.logFileOperation('write', configPath, 'success', null)
        logger.info(`用户模板配置已保存: ${userTemplates.length} 个模板`, {
          configPath,
          total: templates.length,
          userTemplates: userTemplates.length,
          builtInTemplates: templates.length - userTemplates.length
        })
        return true
      } else {
        logger.logFileOperation('write', configPath, 'failed', new Error('WriteFile 返回 false'))
        logger.error('保存配置文件失败', {
          configPath,
          method: 'saveTemplates'
        })
        return false
      }
    } catch (error) {
      logger.error('保存模板配置失败', {
        method: 'saveTemplates',
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }

  /**
   * 重置初始化状态（用于调试）
   */
  resetInitialization() {
    logger.info('重置模板初始化状态')

    if (!pathManager.isWPSAvailable()) {
      logger.warn('WPS 环境不可用，无法重置初始化状态')
      return false
    }

    try {
      const storage = window.Application.PluginStorage
      storage.removeItem('templates_initialized')
      logger.info('模板初始化状态已重置')
      return true
    } catch (error) {
      logger.error('重置初始化状态失败', {
        method: 'resetInitialization',
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }
}

// 创建单例
export const templateManager = new TemplateManager()
