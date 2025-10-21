# WPS FileSystem API 使用说明

## 测试日期
2025-10-21

## API 测试结果总结

### ✅ 可用的 API 方法

#### 1. **绝对路径操作方法**（推荐使用）

这些方法**支持绝对路径**，可以正常使用：

```javascript
const fs = window.Application.FileSystem

// 创建目录
fs.Mkdir('C:/Users/11071/Desktop/测试文件夹')

// 写入文件（会覆盖原有文件）
fs.WriteFile('C:/Users/11071/Desktop/测试.txt', '文件内容')

// 追加内容到文件
fs.AppendFile('C:/Users/11071/Desktop/测试.txt', '追加内容')

// 读取文件
const content = fs.ReadFile('C:/Users/11071/Desktop/测试.txt')

// 删除文件或目录
fs.Remove('C:/Users/11071/Desktop/测试.txt')

// 删除目录
fs.rmdirSync('C:/Users/11071/Desktop/测试文件夹')

// 判断文件或目录是否存在
const exists = fs.Exists('C:/Users/11071/Desktop/测试.txt')
```

#### 2. **路径要求**
- ✅ **必须使用绝对路径**
- ✅ 支持正斜杠 `/`（推荐）
- ✅ 支持反斜杠 `\`（Windows 风格）

### ❌ 不可用的 API 方法

这些方法**不支持路径分隔符**，实际使用中会报错：

```javascript
const fs = window.Application.FileSystem

// ❌ 报错：path cannot contains "/" or "\"
fs.readFileString('C:/Users/11071/Desktop/test.txt')

// ❌ 报错：path cannot contains "/" or "\"
fs.writeFileString('C:/Users/11071/Desktop/test.txt', 'content')

// ❌ 报错：path cannot contains "/" or "\"
fs.writeAsBinaryString('C:/Users/11071/Desktop/test.txt', '0101')

// ❌ 报错：path cannot contains "/" or "\"
fs.readAsBinaryString('C:/Users/11071/Desktop/test.txt')
```

### ⚠️ PluginStorage 限制

```javascript
// 临时数据存储，下次打开 WPS 会丢失
let ps = Application.PluginStorage
ps.setItem("count", 5)
console.log('获取：', ps.getItem("count"))

// ⚠️ 不适合持久化存储配置
```

## 实际应用建议

### 1. 配置文件存储策略

```javascript
/**
 * 推荐的配置存储方案
 */
class AppConfigManager {
  constructor() {
    this.configDirName = 'wps_addon_config'
    this.configFileName = 'config.json'
  }

  // 获取配置目录（桌面目录）
  getConfigDir() {
    const desktopPath = window.Application.Env.GetDesktopPath()
    const normalizedPath = desktopPath.replace(/\\/g, '/')
    return normalizedPath.replace(/\/+$/, '') + '/' + this.configDirName
  }

  // 获取配置文件完整路径
  getConfigFullPath() {
    return this.getConfigDir() + '/' + this.configFileName
  }

  // 确保配置目录存在
  ensureConfigDir() {
    const fs = window.Application.FileSystem
    const configDir = this.getConfigDir()
    
    if (!fs.Exists(configDir)) {
      fs.Mkdir(configDir)
    }
    
    return fs.Exists(configDir)
  }

  // 保存配置
  saveConfig(config) {
    const fs = window.Application.FileSystem
    this.ensureConfigDir()
    
    const configFile = this.getConfigFullPath()
    const jsonString = JSON.stringify(config, null, 2)
    
    return fs.WriteFile(configFile, jsonString)
  }

  // 读取配置
  getConfig() {
    const fs = window.Application.FileSystem
    const configFile = this.getConfigFullPath()
    
    if (!fs.Exists(configFile)) {
      return null
    }
    
    const content = fs.ReadFile(configFile)
    return JSON.parse(content)
  }
}
```

### 2. 环境路径 API

```javascript
const env = window.Application.Env

// 获取用户主目录（推荐用于配置存储，跨平台兼容）✅
const homePath = env.GetHomePath()
// Windows: C:\Users\11071
// Linux: /home/username
// Mac: /Users/username

// 获取应用数据目录（仅 Windows）
const appDataPath = env.GetAppDataPath()
// 示例：C:\Users\11071\AppData\Roaming

// 获取临时目录
const tempPath = env.GetTempPath()
// 示例：C:\Users\11071\AppData\Local\Temp

// 获取桌面路径
const desktopPath = env.GetDesktopPath()
// 示例：C:\Users\11071\Desktop

// 获取系统根目录
const rootPath = env.GetRootPath()
// Windows: C:\
// Linux/Mac: /

// 获取 ProgramData 目录（仅 Windows）
const programDataPath = env.GetProgramDataPath()

// 获取 ProgramFiles 目录（仅 Windows）
const programFilesPath = env.GetProgramFilesPath()

// 获取系统 DPI
const dpi = env.GetDesktopDpi()
```

### 3. 最佳实践

#### ✅ 推荐做法

```javascript
// 1. 使用绝对路径
const configPath = 'C:/Users/11071/Desktop/config/app.json'

// 2. 统一使用正斜杠
const normalizedPath = path.replace(/\\/g, '/')

// 3. 使用 WriteFile/ReadFile 而不是 writeFileString/readFileString
fs.WriteFile(configPath, content)
const content = fs.ReadFile(configPath)

// 4. 操作前检查目录是否存在
if (!fs.Exists(dirPath)) {
  fs.Mkdir(dirPath)
}

// 5. 操作后验证结果
const writeResult = fs.WriteFile(filePath, content)
if (writeResult && fs.Exists(filePath)) {
  console.log('文件写入成功')
}
```

#### ❌ 避免的做法

```javascript
// 1. 避免使用相对路径
fs.WriteFile('config.json', content) // ❌ 不确定存储位置

// 2. 避免使用 writeFileString/readFileString
fs.writeFileString(path, content) // ❌ 不支持路径分隔符

// 3. 避免使用 PluginStorage 存储重要配置
Application.PluginStorage.setItem('config', data) // ❌ 重启后丢失
```

## 配置文件存储位置

基于测试结果和跨平台兼容性考虑，我们选择的存储位置：

```
用户主目录/wps_addon_config/config.json
```

**不同平台路径示例：**
- Windows: `C:\Users\{用户名}\wps_addon_config\config.json`
- Linux: `/home/{用户名}/wps_addon_config/config.json`
- Mac: `/Users/{用户名}/wps_addon_config/config.json`

**优点：**
1. ✅ 跨平台兼容（Windows/Linux/Mac）
2. ✅ 用户主目录，便于管理和访问
3. ✅ 不会污染桌面
4. ✅ 支持绝对路径操作
5. ✅ 读写权限无问题
6. ✅ 持久化存储
7. ✅ 符合跨平台应用存储规范

## 更新记录

- **2025-10-21**：
  - 完成 WPS FileSystem API 测试，更新 appConfig.js 使用正确的 API 方法
  - 更改配置存储位置：桌面 → AppData → 用户主目录（跨平台兼容）
  - 最终方案：使用 `GetHomePath()` 获取用户主目录，适配 Windows/Linux/Mac

