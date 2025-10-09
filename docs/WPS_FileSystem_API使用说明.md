# WPS FileSystem API 使用说明

## 📚 API 概述

根据 WPS 官方文档，FileSystem 对象包括对文件和文件夹的一些基本和常见的操作接口。

---

## 🔍 配置文件路径获取策略

本项目采用**多重回退策略**来获取配置文件路径，确保在不同 WPS 版本中都能正常工作。

### 策略顺序

```javascript
// 方法 1: 尝试使用 FileSystem.tmpdir() (推荐)
if (window.Application.FileSystem && window.Application.FileSystem.tmpdir) {
  userPath = window.Application.FileSystem.tmpdir()
}

// 方法 2: 尝试使用 Env.GetTempPath()
else if (window.Application.Env && window.Application.Env.GetTempPath) {
  userPath = window.Application.Env.GetTempPath()
}

// 方法 3: 回退到 Env.GetUserDataPath() (如果存在)
else if (window.Application.Env && window.Application.Env.GetUserDataPath) {
  userPath = window.Application.Env.GetUserDataPath()
}

// 方法 4: 最终降级到 localStorage
else {
  // 使用浏览器 localStorage
}
```

### 为什么使用多重策略？

1. **兼容性**：不同 WPS 版本可能支持不同的 API
2. **向后兼容**：旧版本可能没有某些新 API
3. **降级方案**：即使所有 API 都失败，仍可使用 localStorage

---

## 📂 WPS FileSystem API 列表

### 文件读写

| 方法 | 说明 | 示例 |
|------|------|------|
| `ReadFile` | 获取文件的内容 | `Application.FileSystem.ReadFile(path)` |
| `WriteFile` | 创建文件 | `Application.FileSystem.WriteFile(path, content)` |
| `AppendFile` | 往文件末尾添加数据 | `Application.FileSystem.AppendFile(path, data)` |
| `readFileString` | 读取文件，返回字符串 | `Application.FileSystem.readFileString(path)` |
| `writeFileString` | 写字符串到文件 | `Application.FileSystem.writeFileString(path, str)` |
| `readAsBinaryString` | 读取文件，返回二进制字符串 | `Application.FileSystem.readAsBinaryString(path)` |
| `writeAsBinaryString` | 写二进制字符串到文件 | `Application.FileSystem.writeAsBinaryString(path, data)` |

### 文件/目录操作

| 方法 | 说明 | 示例 |
|------|------|------|
| `Exists` | 判断文件或文件夹是否存在 | `Application.FileSystem.Exists(path)` |
| `existsSync` | 判断目录是否存在 | `Application.FileSystem.existsSync(path)` |
| `Remove` | 删除文件或文件夹 | `Application.FileSystem.Remove(path)` |
| `unlinkSync` | 删除文件 | `Application.FileSystem.unlinkSync(path)` |
| `copyFileSync` | 生成文件副本 | `Application.FileSystem.copyFileSync(src, dest)` |

### 目录操作

| 方法 | 说明 | 示例 |
|------|------|------|
| `Mkdir` | 创建文件夹 | `Application.FileSystem.Mkdir(path)` |
| `mkdirSync` | 创建目录 | `Application.FileSystem.mkdirSync(path)` |
| `rmdirSync` | 删除目录 | `Application.FileSystem.rmdirSync(path)` |
| `readdirSync` | 获取目录下的子目录对象数组 | `Application.FileSystem.readdirSync(path)` |
| `mkdtempSync` | 创建临时目录 | `Application.FileSystem.mkdtempSync(prefix)` |

### 路径获取

| 方法 | 说明 | 示例 |
|------|------|------|
| `tmpdir` | 获取系统的临时文件目录 | `Application.FileSystem.tmpdir()` |

---

## 💡 本项目使用的 API

### 当前实现

```javascript
// src/utils/appConfig.js

getConfigPath() {
  try {
    if (typeof window.Application === 'undefined') {
      return null  // 降级到 localStorage
    }
    
    let userPath = null
    
    // 尝试多种方法获取路径
    if (window.Application.FileSystem && window.Application.FileSystem.tmpdir) {
      userPath = window.Application.FileSystem.tmpdir()
    }
    else if (window.Application.Env && window.Application.Env.GetTempPath) {
      userPath = window.Application.Env.GetTempPath()
    }
    else if (window.Application.Env && window.Application.Env.GetUserDataPath) {
      userPath = window.Application.Env.GetUserDataPath()
    }
    
    if (!userPath) {
      return null  // 降级到 localStorage
    }
    
    return userPath + '\\wps_addon_config.json'
  } catch (error) {
    console.error('获取配置路径失败:', error)
    return null
  }
}
```

### 读取配置

```javascript
getConfig() {
  try {
    const configPath = this.getConfigPath()
    
    // 降级到 localStorage
    if (!configPath) {
      const saved = localStorage.getItem('wps_addon_config')
      if (saved) {
        return JSON.parse(saved)
      }
      return { ...this.defaultConfig }
    }

    // 使用 WPS FileSystem API
    if (window.Application.FileSystem.Exists(configPath)) {
      const content = window.Application.FileSystem.readFileString(configPath)
      return JSON.parse(content)
    }
    
    return { ...this.defaultConfig }
  } catch (error) {
    console.error('读取配置失败:', error)
    return { ...this.defaultConfig }
  }
}
```

### 保存配置

```javascript
saveConfig(config) {
  try {
    const configPath = this.getConfigPath()
    
    // 降级到 localStorage
    if (!configPath) {
      localStorage.setItem('wps_addon_config', JSON.stringify(config))
      return true
    }

    // 使用 WPS FileSystem API
    const jsonString = JSON.stringify(config, null, 2)
    window.Application.FileSystem.writeFileString(configPath, jsonString)
    
    return true
  } catch (error) {
    console.error('保存配置失败:', error)
    return false
  }
}
```

---

## 🔧 从 ActiveXObject 迁移到 FileSystem API

### 旧方式（ActiveXObject）

```javascript
// ❌ 旧代码 - 使用 ActiveXObject
const fso = new ActiveXObject('Scripting.FileSystemObject')
const file = fso.OpenTextFile(path, 1)  // 1 = 只读
const content = file.ReadAll()
file.Close()
```

**缺点：**
- 仅在 IE/WPS 特定环境可用
- API 较老旧
- 需要声明 `/* global ActiveXObject */`

### 新方式（FileSystem API）

```javascript
// ✅ 新代码 - 使用 WPS FileSystem API
const content = window.Application.FileSystem.readFileString(path)
```

**优点：**
- 更现代的 API
- 更简洁
- 更好的错误处理
- 推荐使用

---

## 📝 完整示例

### 示例 1：检查文件是否存在

```javascript
let tempPath = Application.FileSystem.tmpdir()
let configPath = tempPath + '\\wps_addon_config.json'

if (Application.FileSystem.Exists(configPath)) {
  console.log('配置文件存在')
} else {
  console.log('配置文件不存在')
}
```

### 示例 2：读取配置文件

```javascript
let configPath = Application.FileSystem.tmpdir() + '\\wps_addon_config.json'

if (Application.FileSystem.Exists(configPath)) {
  try {
    let content = Application.FileSystem.readFileString(configPath)
    let config = JSON.parse(content)
    console.log('配置内容:', config)
  } catch (error) {
    console.error('读取失败:', error)
  }
}
```

### 示例 3：保存配置文件

```javascript
let config = {
  ai: {
    apiKey: 'sk-xxxxx',
    baseUrl: 'https://api.siliconflow.cn/v1'
  }
}

let configPath = Application.FileSystem.tmpdir() + '\\wps_addon_config.json'
let jsonString = JSON.stringify(config, null, 2)

try {
  Application.FileSystem.writeFileString(configPath, jsonString)
  console.log('配置保存成功')
} catch (error) {
  console.error('保存失败:', error)
}
```

### 示例 4：创建备份

```javascript
let configPath = Application.FileSystem.tmpdir() + '\\wps_addon_config.json'
let backupPath = Application.FileSystem.tmpdir() + '\\wps_addon_config.backup.json'

if (Application.FileSystem.Exists(configPath)) {
  try {
    Application.FileSystem.copyFileSync(configPath, backupPath)
    console.log('备份创建成功')
  } catch (error) {
    console.error('备份失败:', error)
  }
}
```

---

## ⚠️ 注意事项

### 1. 路径分隔符

Windows 使用反斜杠 `\`：
```javascript
let path = tmpdir + '\\config.json'  // ✅ 正确
let path = tmpdir + '/config.json'   // ❌ 可能有问题
```

### 2. 路径末尾

有些 API 返回的路径末尾可能带有分隔符，需要注意：
```javascript
let tmpdir = Application.FileSystem.tmpdir()
// 可能返回: C:\Users\xxx\AppData\Local\Temp\
// 或者: C:\Users\xxx\AppData\Local\Temp

// 安全的拼接方式
let configPath = tmpdir.replace(/\\+$/, '') + '\\wps_addon_config.json'
```

### 3. 错误处理

始终使用 try-catch 包裹文件操作：
```javascript
try {
  let content = Application.FileSystem.readFileString(path)
  // 处理内容
} catch (error) {
  console.error('文件操作失败:', error)
  // 降级处理
}
```

### 4. API 可用性检查

在使用前检查 API 是否存在：
```javascript
if (window.Application && 
    window.Application.FileSystem && 
    typeof window.Application.FileSystem.tmpdir === 'function') {
  let path = window.Application.FileSystem.tmpdir()
}
```

---

## 🐛 调试技巧

### 检查可用的 API

```javascript
console.log('WPS 版本:', window.Application?.Version)
console.log('FileSystem API:', window.Application?.FileSystem)
console.log('Env API:', window.Application?.Env)

// 列出所有可用方法
if (window.Application?.FileSystem) {
  console.log('FileSystem 方法:', Object.keys(window.Application.FileSystem))
}

if (window.Application?.Env) {
  console.log('Env 方法:', Object.keys(window.Application.Env))
}
```

### 测试路径获取

```javascript
// 测试所有可能的路径获取方法
let methods = [
  { name: 'FileSystem.tmpdir', fn: () => window.Application.FileSystem.tmpdir() },
  { name: 'Env.GetTempPath', fn: () => window.Application.Env.GetTempPath() },
  { name: 'Env.GetUserDataPath', fn: () => window.Application.Env.GetUserDataPath() }
]

methods.forEach(method => {
  try {
    let path = method.fn()
    console.log(`✅ ${method.name}:`, path)
  } catch (e) {
    console.log(`❌ ${method.name}:`, e.message)
  }
})
```

---

## 📖 相关文档

- [配置文件存储说明.md](./配置文件存储说明.md)
- [配置动态更新说明.md](./配置动态更新说明.md)
- [配置路径故障排查.md](./配置路径故障排查.md)

---

## 更新日期

2025-01-09


