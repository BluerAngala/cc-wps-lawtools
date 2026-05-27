/**
 * 统一路径管理器
 * 管理所有文件保存路径，统一使用项目目录
 *
 * 跨平台支持:
 * - Windows: 使用 GetAppDataPath() 获取 WPS 插件目录
 * - Mac: 使用沙箱路径 ~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/
 *         若 FileSystem 不可用，降级为 PluginStorage
 */

import unifiedLogger from './unifiedLogger.js'

const MAC_WPS_CONTAINER = 'Library/Containers/com.kingsoft.wpsoffice.mac/Data'

class PathManager {
  constructor() {
    this.projectName = 'wps_lawtools'
    this.projectVersion = '1.0.0'
    this.projectDirName = `${this.projectName}_${this.projectVersion}`
    this.basePathSegment = '/kingsoft/wps/jsaddons'
    this._platform = null
    this._macBasePath = null
    this._macFsAvailable = null

    unifiedLogger.info('PathManager 已初始化', {
      projectName: this.projectName,
      projectVersion: this.projectVersion,
      projectDirName: this.projectDirName
    })
  }

  isWPSAvailable() {
    return typeof window !== 'undefined' && typeof window.Application !== 'undefined'
  }

  getPlatform() {
    if (this._platform) return this._platform

    if (!this.isWPSAvailable()) {
      return 'unknown'
    }

    try {
      const app = window.Application

      // Windows: GetAppDataPath 能正常调用
      if (app.Env && typeof app.Env.GetAppDataPath === 'function') {
        try {
          const testPath = app.Env.GetAppDataPath()
          if (testPath) {
            this._platform = 'win'
            unifiedLogger.info('检测到 Windows 平台（GetAppDataPath 可用）')
            return 'win'
          }
        } catch (e) {
          unifiedLogger.debug('GetAppDataPath 调用失败')
        }
      }

      // Mac: 有 PluginStorage，且 GetAppDataPath 不可用
      if (app.PluginStorage) {
        this._platform = 'mac'
        unifiedLogger.info('检测到 Mac 平台（PluginStorage 可用）')
        return 'mac'
      }

      this._platform = 'unknown'
      unifiedLogger.warn('无法检测平台类型')
      return 'unknown'
    } catch (error) {
      unifiedLogger.warn('检测平台类型失败', { error: error.message })
      return 'unknown'
    }
  }

  isMac() {
    return this.getPlatform() === 'mac'
  }

  isWindows() {
    return this.getPlatform() === 'win'
  }

  /**
   * 检测 Mac 上 FileSystem 是否可用（在沙箱目录内）
   */
  isMacFileSystemAvailable() {
    if (this._macFsAvailable !== null) return this._macFsAvailable

    if (!this.isMac()) {
      this._macFsAvailable = false
      return false
    }

    try {
      const fs = window.Application.FileSystem
      if (!fs || typeof fs.Exists !== 'function') {
        this._macFsAvailable = false
        return false
      }

      // 测试: 尝试获取沙箱基路径并验证是否存在
      const basePath = this.getMacBasePath()
      if (basePath) {
        this._macFsAvailable = fs.Exists(basePath)
        unifiedLogger.info('Mac FileSystem 可用性检测', {
          basePath,
          available: this._macFsAvailable
        })
      } else {
        this._macFsAvailable = false
      }

      return this._macFsAvailable
    } catch (error) {
      unifiedLogger.debug('Mac FileSystem 检测失败', { error: error.message })
      this._macFsAvailable = false
      return false
    }
  }

  /**
   * 获取 Mac 沙箱基路径
   * 路径: /Users/{username}/Library/Containers/com.kingsoft.wpsoffice.mac/Data
   */
  getMacBasePath() {
    if (this._macBasePath) return this._macBasePath

    try {
      const app = window.Application

      // 方法1: 尝试 GetHomePath
      if (app.Env && typeof app.Env.GetHomePath === 'function') {
        try {
          const homePath = app.Env.GetHomePath()
          if (homePath) {
            const normalized = homePath.replace(/\\/g, '').replace(/\/+$/, '')
            this._macBasePath = normalized + '/' + MAC_WPS_CONTAINER
            unifiedLogger.info('Mac 沙箱路径（GetHomePath）', { basePath: this._macBasePath })
            return this._macBasePath
          }
        } catch (e) {
          unifiedLogger.debug('GetHomePath 调用失败')
        }
      }

      // 方法2: 尝试 GetTempPath 推导
      if (app.Env && typeof app.Env.GetTempPath === 'function') {
        try {
          const tempPath = app.Env.GetTempPath()
          if (tempPath) {
            // Mac 沙箱临时目录格式: /Users/{username}/Library/Containers/com.kingsoft.wpsoffice.mac/Data/tmp/...
            const match = tempPath.match(/^(\/Users\/[^/]+\/Library\/Containers\/com\.kingsoft\.wpsoffice\.mac\/Data)/)
            if (match) {
              this._macBasePath = match[1]
              unifiedLogger.info('Mac 沙箱路径（GetTempPath推导）', { basePath: this._macBasePath })
              return this._macBasePath
            }
          }
        } catch (e) {
          unifiedLogger.debug('GetTempPath 推导失败')
        }
      }

      // 方法3: 从 navigator.userAgent 或其他浏览器 API 获取用户名
      // 在 WPS 加载项环境中，可用 /Users/xxx 推导
      unifiedLogger.warn('无法自动获取 Mac 沙箱路径')
      return null
    } catch (error) {
      unifiedLogger.error('获取 Mac 沙箱路径失败', { error: error.message })
      return null
    }
  }

  /**
   * 获取 WPS 应用数据路径
   * - Windows: 使用 GetAppDataPath()
   * - Mac: 使用沙箱路径
   */
  getAppDataPath() {
    if (!this.isWPSAvailable()) {
      unifiedLogger.warn('WPS 环境不可用，无法获取应用数据路径')
      return null
    }

    // Mac 平台: 使用沙箱路径
    if (this.isMac()) {
      const basePath = this.getMacBasePath()
      if (basePath) {
        unifiedLogger.info('Mac 使用沙箱路径作为 AppDataPath', { basePath })
        return basePath
      }
      unifiedLogger.warn('Mac 无法获取沙箱路径，将使用 PluginStorage 替代')
      return null
    }

    // Windows 平台
    try {
      const appDataPath = window.Application.Env.GetAppDataPath()

      if (!appDataPath) {
        unifiedLogger.error('无法获取应用数据路径', { method: 'GetAppDataPath()' })
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

  getProjectRoot() {
    const appDataPath = this.getAppDataPath()
    if (!appDataPath) return null

    try {
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

  getConfigDir() {
    const appDataPath = this.getAppDataPath()
    if (!appDataPath) return null

    const normalizedPath = appDataPath.replace(/\\/g, '/')
    return normalizedPath.replace(/\/+$/, '') + '/' + this.projectDirName + '_config'
  }

  getTemplatesDir() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/templates' : null
  }

  getCacheDir() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/cache' : null
  }

  getLogsDir() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/logs' : null
  }

  getConfigFilePath() {
    const configDir = this.getConfigDir()
    return configDir ? configDir + '/config.json' : null
  }

  getTemplatesConfigPath() {
    const templatesDir = this.getTemplatesDir()
    return templatesDir ? templatesDir + '/templates.json' : null
  }

  getBuiltInTemplatesPath() {
    return '/templates'
  }

  getBuiltInTemplatesRealPath() {
    const projectRoot = this.getProjectRoot()
    return projectRoot ? projectRoot + '/public/templates' : null
  }

  /**
   * 是否使用 PluginStorage 模式（Mac 无沙箱路径时降级）
   */
  usePluginStorage() {
    return this.isMac() && !this.isMacFileSystemAvailable()
  }

  ensureDir(dirPath) {
    if (!this.isWPSAvailable() || !dirPath) {
      unifiedLogger.warn('无法确保目录存在', {
        isWPSAvailable: this.isWPSAvailable(),
        hasDirPath: !!dirPath
      })
      return false
    }

    // Mac 使用 PluginStorage 时，跳过文件系统操作
    if (this.usePluginStorage()) {
      unifiedLogger.debug('PluginStorage 模式，跳过目录创建', { dirPath })
      return true
    }

    try {
      const fs = window.Application.FileSystem

      if (fs.Exists(dirPath)) {
        return true
      }

      const parentDir = dirPath.substring(0, dirPath.lastIndexOf('/'))
      if (parentDir && !fs.Exists(parentDir)) {
        this.ensureDir(parentDir)
      }

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
   */
  ensureAllDirs() {
    unifiedLogger.info('开始确保所有必需目录存在')

    // Mac 使用 PluginStorage 时，无需创建文件系统目录
    if (this.usePluginStorage()) {
      unifiedLogger.info('Mac PluginStorage 模式，跳过文件系统目录创建')
      return true
    }

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
      platform: this.getPlatform(),
      usePluginStorage: this.usePluginStorage(),
      macFileSystemAvailable: this.isMac() ? this.isMacFileSystemAvailable() : null,
      macBasePath: this.isMac() ? this.getMacBasePath() : null,
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

    if (this.isWPSAvailable() && !this.usePluginStorage()) {
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

export const pathManager = new PathManager()
export default pathManager
