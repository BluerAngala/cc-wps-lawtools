// WPS加载项配置管理器 - 使用文件系统持久化保存配置

class WpsConfigManager {
  constructor() {
    this.configFile = 'wps_addon_config.json'
    this.defaultConfig = {
      firstLoadCompleted: false,
      lastLoadTime: null,
      userPreferences: {
        showWelcome: true,
        autoSave: true
      }
    }
  }

  // 获取配置文件路径
  getConfigPath() {
    if (typeof window.Application === 'undefined') {
      throw new Error('WPS Application对象不可用')
    }
    const userPath = window.Application.Env.GetUserDataPath()
    return userPath + '\\' + this.configFile
  }

  // 读取配置
  getConfig() {
    try {
      console.log('开始读取配置...')
      const configPath = this.getConfigPath()
      console.log('配置文件路径:', configPath)
      
      const fso = new ActiveXObject('Scripting.FileSystemObject')
      
      if (!fso.FileExists(configPath)) {
        console.log('配置文件不存在，返回默认配置')
        return { ...this.defaultConfig }
      }

      const file = fso.OpenTextFile(configPath, 1) // 1 = 只读
      const content = file.ReadAll()
      file.Close()
      
      console.log('配置文件内容:', content)
      const config = JSON.parse(content)
      console.log('解析后的配置:', config)
      return config
    } catch (error) {
      console.error('读取配置失败:', error)
      return { ...this.defaultConfig }
    }
  }

  // 保存配置
  saveConfig(config) {
    try {
      console.log('开始保存配置:', config)
      const configPath = this.getConfigPath()
      console.log('保存到路径:', configPath)
      
      const fso = new ActiveXObject('Scripting.FileSystemObject')
      const file = fso.CreateTextFile(configPath, true) // true = 覆盖
      const jsonString = JSON.stringify(config, null, 2)
      console.log('保存的JSON字符串:', jsonString)
      
      file.Write(jsonString)
      file.Close()
      
      console.log('配置已保存:', configPath)
      return true
    } catch (error) {
      console.error('保存配置失败:', error)
      return false
    }
  }

  // 获取单个配置项
  get(key, defaultValue = null) {
    const config = this.getConfig()
    return this.getNestedValue(config, key) ?? defaultValue
  }

  // 设置单个配置项
  set(key, value) {
    const config = this.getConfig()
    this.setNestedValue(config, key, value)
    return this.saveConfig(config)
  }

  // 获取嵌套属性值
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // 设置嵌套属性值
  setNestedValue(obj, path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  // 首次加载相关方法
  isFirstLoad() {
    console.log('检查是否为首次加载...')
    const result = !this.get('firstLoadCompleted', false)
    console.log('首次加载检查结果:', result)
    return result
  }

  markFirstLoadCompleted() {
    console.log('标记首次加载完成...')
    const result1 = this.set('firstLoadCompleted', true)
    const result2 = this.set('lastLoadTime', new Date().toISOString())
    console.log('标记完成结果:', result1, result2)
    return result1 && result2
  }

  // 重置首次加载状态（用于测试）
  resetFirstLoad() {
    console.log('重置首次加载状态...')
    const result = this.set('firstLoadCompleted', false)
    console.log('重置结果:', result)
    return result
  }
}

// 创建单例实例
const wpsConfigManager = new WpsConfigManager()

// 添加初始化检查
console.log('wpsConfigManager 已创建')
try {
  // 测试基本功能
  if (typeof window !== 'undefined' && window.Application) {
    console.log('WPS Application 可用，配置管理器可以正常工作')
  } else {
    console.log('WPS Application 暂时不可用，配置管理器将在WPS加载后工作')
  }
} catch (error) {
  console.log('配置管理器初始化检查:', error)
}

export { wpsConfigManager }
