/**
 * 统一路径管理器
 * 管理所有文件保存路径，统一使用项目目录
 * 项目目录: Application.Env.GetAppDataPath() + /kingsoft/wps/jsaddons/{projectName}_{version}/config
 *
 * 跨平台支持:
 * - Windows: 使用 GetAppDataPath() 获取 WPS 插件目录
 * - Mac: 使用 PluginStorage 进行数据持久化，不依赖文件系统路径
 */

import unifiedLogger from './unifiedLogger.js'

class PathManager {
  constructor() {
    // 从 package.json 读取项目名称和版本
    this.projectName = 'wps_lawtools'
    this.projectVersion = '1.0.0'

    // 项目目录名称: 项目名称_版本号
    this.projectDirName = `${this.projectName}_${this.projectVersion}`

    // 基础路径: /kingsoft/wps/jsaddons
    this.basePathSegment = '/kingsoft/wps/jsaddons'

    // 缓存平台类型
    this._platform = null

    unifiedLogger.info('PathManager 已初始化', {
      projectName: this.projectName,
      projectVersion: this.projectVersion,
      projectDirName: this.projectDirName
    })
  }

  /**
   * 检查 WPS 环境
   */
  isWPSAvailable() {
    return typeof window !== 'undefined' && typeof window.Application !== 'undefined'
  }

  /**
   * 获取当前平台类型
   * @returns {string} 'win' | 'mac' | 'unknown'
   */
  getPlatform() {
    if (this._platform) return this._platform

    if (!this.isWPSAvailable()) {
      return 'unknown'
    }

    try {
      const app = window.Application

      // Mac 平台有 PluginStorage，优先检测
      if (app.PluginStorage) {
        this._platform = 'mac'
        unifiedLogger.info('检测到 Mac 平台（PluginStorage 可用）')
        return 'mac'
      }

      // Windows 平台有 Env.GetAppDataPath 且能正常调用
      if (app.Env && typeof app.Env.GetAppDataPath === 'function') {
        try {
          // 实际调用测试，如果成功则是 Windows
          const testPath = app.Env.GetAppDataPath()
          if (testPath) {
            this._platform = 'win'
            unifiedLogger.info('检测到 Windows 平台（GetAppDataPath 可用）')
            return 'win'
          }
        } catch (e) {
          // 调用失败，不是 Windows
          unifiedLogger.debug('GetAppDataPath 调用失败，不是 Windows 平台')
        }
      }

      this._platform = 'unknown'
      unifiedLogger.warn('无法检测平台类型')
      return 'unknown'
    } catch (error) {
      unifiedLogger.warn('检测平台类型失败', { error: error.message })
      return 'unknown'
    }
  }

  /**
   * 是否为 Mac 平台
   */
  isMac() {
    return this.getPlatform() === 'mac'
  }

  /**
   * 是否为 Windows 平台
   */
  isWindows() {
    return this.getPlatform() === 'win'
  }

  /**
   * 获取 WPS 应用数据路径
   * 使用 GetAppDataPath() 获取 WPS 插件专用目录
   *
   * 注意: Mac 平台上此方法返回 null，应使用 PluginStorage 替代
   */
  getAppDataPath() {
    if (!this.isWPSAvailable()) {
      unifiedLogger.warn('WPS 环境不可用，无法获取应用数据路径')
      return null
    }

    // Mac 平台不支持 GetAppDataPath
    if (this.isMac()) {
      unifiedLogger.debug('Mac 平台不支持 GetAppDataPath，使用 PluginStorage 替代')
      return null
    }

    try {
      const appDataPath = window.Application.Env.GetAppDataPath()

      if (!appDataPath) {
        unifiedLogger.error('无法获取应用数据路径', {
          method: 'GetAppDataPath()'
        })
        return null
      }

      unifiedLogger.logPath('info', '获取应用数据路径', {
        appDataPath,
        method: 'GetAppDataPath()'
      })

      return appDataPath
    } catch (error) {
      unifiedLogger.error('获取应用数据路径失败', {
        error: error.message,
        stack: error.stack
      })
      return null
    }
  }

  /**
   * 获取项目根目录（WPS jsaddons 目录，只读）
   * 路径格式: {AppDataPath}/kingsoft/wps/jsaddons/{projectName}_{version}
   */
  getProjectRoot() {
    const appDataPath = this.getAppDataPath()
    if (!appDataPath) return null

    try {
      // 统一使用斜杠
      const normalizedPath = appDataPath.replace(/\\/g, '/')
      const projectRoot = normalizedPath.replace(/\/+$/, '') + this.basePathSegment + '/' + this.projectDirName

      unifiedLogger.logPath('info', '项目根目录', {
        appDataPath,
        normalizedPath,
        projectRoot
      })

      return projectRoot
    } catch (error) {
      unifiedLogger.error('构建项目根目录失败', {
        error: error.message,
        stack: error.stack
      })
      return null
    }
  }

  /**
   * 获取配置目录（在 AppDataPath 根目录下，可写）
   * 路径格式: {AppDataPath}/{projectName}_{version}_config
   * 注意：不放在 jsaddons 目录下，因为该目录可能是只读的
   */
  getConfigDir() {
    const appDataPath = this.getAppDataPath()
    if (!appDataPath) return null

    const normalizedPath = appDataPath.replace(/\\/g, '/')
    return normalizedPath.replace(/\/+$/, '') + '/' + this.projectDirName + '_config'
  }

  /**
   * 获取模板目录
   */
  getTemplatesDir() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/templates' : null
  }

  /**
   * 获取缓存目录
   */
  getCacheDir() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/cache' : null
  }

  /**
   * 获取日志目录
   */
  getLogsDir() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/logs' : null
  }

  /**
   * 获取配置文件路径
   */
  getConfigFilePath() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/config.json' : null
  }

  /**
   * 获取模板配置文件路径
   */
  getTemplatesConfigPath() {
    const templatesDir = this.getTemplatesDir()
    return templatesDir ? templatesDir + '/templates.json' : null
  }

  /**
   * 获取项目内置模板的相对路径（用于 HTTP 请求）
   * 这是相对于 Web 服务器根目录的路径
   *
   * 注意：实际使用时，建议直接使用字符串 '/templates'，无需调用此方法
   * 此方法主要用于调试和路径信息查询
   */
  getBuiltInTemplatesPath() {
    return '/templates'
  }

  /**
   * 获取项目内置模板的实际文件系统路径
   * 路径格式: {ProjectRoot}/public/templates
   */
  getBuiltInTemplatesRealPath() {
    const projectRoot = this.getProjectRoot()
    return projectRoot ? projectRoot + '/public/templates' : null
  }

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   * @returns {boolean} 是否成功
   */
  ensureDir(dirPath) {
    if (!this.isWPSAvailable() || !dirPath) {
      unifiedLogger.warn('无法确保目录存在', {
        isWPSAvailable: this.isWPSAvailable(),
        hasDirPath: !!dirPath
      })
      return false
    }

    try {
      const fs = window.Application.FileSystem

      // 检查目录是否存在
      if (fs.Exists(dirPath)) {
        return true
      }

      // 递归创建父目录
      const parentDir = dirPath.substring(0, dirPath.lastIndexOf('/'))
      if (parentDir && !fs.Exists(parentDir)) {
        this.ensureDir(parentDir)
      }

      // 创建目录
      try {
        const mkdirResult = fs.Mkdir(dirPath)
        unifiedLogger.debug('Mkdir 返回值', { dirPath, result: mkdirResult })
      } catch (mkdirError) {
        unifiedLogger.error('Mkdir 调用失败', {
          dirPath,
          error: mkdirError.message,
          stack: mkdirError.stack
        })
        return false
      }

      // 验证创建成功
      if (fs.Exists(dirPath)) {
        unifiedLogger.logPath('info', '目录已创建', { dirPath })
        return true
      } else {
        unifiedLogger.error('创建目录失败（Mkdir 未报错但目录不存在）', { dirPath })
        return false
      }
    } catch (error) {
      unifiedLogger.error('确保目录存在失败', {
        dirPath,
        error: error.message,
        stack: error.stack
      })
      return false
    }
  }

  /**
   * 确保所有必需的目录存在
   * 注意：项目根目录是只读的，由 WPS 管理，不需要创建
   */
  ensureAllDirs() {
    unifiedLogger.info('开始确保所有必需目录存在')

    const dirs = [
      { name: '配置目录', path: this.getConfigDir() },
      { name: '模板目录', path: this.getTemplatesDir() },
      { name: '缓存目录', path: this.getCacheDir() },
      { name: '日志目录', path: this.getLogsDir() }
    ]

    let allSuccess = true

    for (const dir of dirs) {
      if (!dir.path) {
        unifiedLogger.error(`无法获取${dir.name}路径`)
        allSuccess = false
        continue
      }

      if (!this.ensureDir(dir.path)) {
        unifiedLogger.error(`创建${dir.name}失败`, { path: dir.path })
        allSuccess = false
      } else {
        unifiedLogger.info(`${dir.name}已就绪`, { path: dir.path })
      }
    }

    if (allSuccess) {
      unifiedLogger.info('所有必需目录已就绪')
    } else {
      unifiedLogger.warn('部分目录创建失败')
    }

    return allSuccess
  }

  /**
   * 获取路径信息（用于调试）
   */
  getPathInfo() {
    const info = {
      isWPSAvailable: this.isWPSAvailable(),
      projectName: this.projectName,
      projectVersion: this.projectVersion,
      projectDirName: this.projectDirName,
      appDataPath: this.getAppDataPath(),
      projectRoot: this.getProjectRoot(),
      configDir: this.getConfigDir(),
      templatesDir: this.getTemplatesDir(),
      cacheDir: this.getCacheDir(),
      logsDir: this.getLogsDir(),
      configFilePath: this.getConfigFilePath(),
      templatesConfigPath: this.getTemplatesConfigPath(),
      builtInTemplatesPath: this.getBuiltInTemplatesPath(),
      builtInTemplatesRealPath: this.getBuiltInTemplatesRealPath()
    }

    // 检查目录是否存在
    if (this.isWPSAvailable()) {
      const fs = window.Application.FileSystem
      info.dirExists = {
        projectRoot: info.projectRoot ? fs.Exists(info.projectRoot) : false,
        configDir: info.configDir ? fs.Exists(info.configDir) : false,
        templatesDir: info.templatesDir ? fs.Exists(info.templatesDir) : false,
        cacheDir: info.cacheDir ? fs.Exists(info.cacheDir) : false,
        logsDir: info.logsDir ? fs.Exists(info.logsDir) : false
      }
    }

    return info
  }
}

// 导出单例
export const pathManager = new PathManager()
export default pathManager
