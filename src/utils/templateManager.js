/**
 * 模板管理器 - 使用 WPS FileSystem API 管理模板文件
 */

import logger from './logger.js'
import { pathManager } from './pathManager.js'
// 直接导入内置模板配置（Vite 会自动处理 JSON 导入）
import builtInTemplatesConfig from '@/data/templates.json'

class TemplateManager {
  constructor() {
    logger.info('TemplateManager 已初始化')
  }

  /**
   * 初始化模板 - 直接使用导入的配置，无需 HTTP 请求
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

      // 直接使用导入的配置，无需 HTTP 请求
      const templates = builtInTemplatesConfig.templates || []

      logger.info(`已加载 ${templates.length} 个内置模板`, {
        templateCount: templates.length,
        templateNames: templates.map((t) => t.name)
      })

      // 标记为已初始化
      if (storage) {
        storage.setItem('templates_initialized', 'true')
        logger.debug('已标记模板为已初始化')
      }

      logger.info('模板初始化完成（直接使用内置模板配置）')
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
   * 获取当前页面的基础路径（兼容调试和生产环境）
   * 打包后插件在 %ProgramData%\...\jsaddons\插件名\，需要基于 location.href 构建绝对路径
   */
  getBasePath() {
    // 从 location.href 提取基础路径，去掉文件名和 hash
    // 例如: http://127.0.0.1:3889/index.html#/template -> http://127.0.0.1:3889/
    // 例如: file:///C:/ProgramData/.../index.html -> file:///C:/ProgramData/.../
    try {
      const url = new URL(window.location.href)
      // 去掉路径中的文件名和 hash
      const pathname = url.pathname.replace(/\/[^/]+$/, '') || '/'
      
      // 处理 file:// 协议（host 为空）
      if (url.protocol === 'file:') {
        return `${url.protocol}//${pathname}/`
      }
      
      // 处理 http/https 协议
      return `${url.protocol}//${url.host}${pathname}/`
    } catch (error) {
      // 如果 URL 解析失败，使用简单方法
      const href = window.location.href
      const base = href.replace(/\/[^/]+$/, '/').replace(/#.*$/, '')
      logger.warn('URL 解析失败，使用备用方法', { href, base })
      return base
    }
  }

  /**
   * 加载内置模板 - 直接使用导入的配置，无需 HTTP 请求
   */
  async loadBuiltInTemplates() {
    try {
      const templates = builtInTemplatesConfig.templates || []
      const basePath = this.getBasePath()

      logger.info(`加载内置模板配置: ${templates.length} 个`, {
        count: templates.length,
        basePath
      })

      // 使用绝对路径构建模板文件路径（确保打包后也能读取）
      // 模板文件（.docx）仍然在 public/templates 目录，需要通过 HTTP 访问
      return templates.map((template) => ({
        ...template,
        filePath: `${basePath}templates/${template.fileName}`,  // 基于 location.href 的绝对路径
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
