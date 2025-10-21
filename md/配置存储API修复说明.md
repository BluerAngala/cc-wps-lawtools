# 配置存储 API 修复说明

## 修复日期
2025-10-21

## 问题描述

在测试 WPS FileSystem API 后发现：

### ❌ 原有问题
1. **使用了错误的 API 方法**
   - 使用 `writeFileString()` 和 `readFileString()`
   - 这些方法**不支持路径分隔符**（`/` 或 `\`）
   - 导致无法正常保存和读取配置文件

2. **不清楚的文件存储位置**
   - 使用简单文件名，不知道实际保存在哪里
   - 无法通过文件管理器访问配置文件

3. **PluginStorage 的限制**
   - PluginStorage 只能临时存储，关闭 WPS 后数据丢失
   - 不适合持久化配置

## 解决方案

### ✅ 修复内容

#### 1. 更换为支持绝对路径的 API 方法

```javascript
// ❌ 旧代码（不支持路径）
fs.writeFileString('config.json', jsonString)
fs.readFileString('config.json')

// ✅ 新代码（支持绝对路径）
fs.WriteFile('C:/Users/xxx/Desktop/wps_addon_config/config.json', jsonString)
fs.ReadFile('C:/Users/xxx/Desktop/wps_addon_config/config.json')
```

#### 2. 使用用户主目录作为配置存储位置

```javascript
getConfigDir() {
  // 使用用户主目录（跨平台兼容：Windows/Linux/Mac）
  const homePath = window.Application.Env.GetHomePath()
  const normalizedPath = homePath.replace(/\\/g, '/')
  return normalizedPath.replace(/\/+$/, '') + '/' + this.configDirName
}
```

**配置文件位置（跨平台）：**
- Windows: `C:\Users\{用户名}\wps_addon_config\config.json`
- Linux: `/home/{用户名}/wps_addon_config/config.json`
- Mac: `/Users/{用户名}/wps_addon_config/config.json`

#### 3. 新增配置目录管理

```javascript
ensureConfigDir() {
  const fs = window.Application.FileSystem
  const configDir = this.getConfigDir()
  
  // 检查目录是否存在
  if (!fs.Exists(configDir)) {
    console.log('📁 创建配置目录:', configDir)
    fs.Mkdir(configDir)
  }
  
  return fs.Exists(configDir)
}
```

#### 4. 更新所有文件操作方法

- ✅ `getConfig()` - 使用 `ReadFile()` 读取配置
- ✅ `saveConfig()` - 使用 `WriteFile()` 保存配置
- ✅ `initializeConfig()` - 使用 `WriteFile()` 初始化配置
- ✅ `reset()` - 使用 `Remove()` 删除配置文件
- ✅ `debug()` - 更新调试方法，使用正确的 API

## 修改的文件

### 1. `src/utils/appConfig.js`

**主要修改：**
```javascript
// 1. 新增方法：ensureConfigDir()
ensureConfigDir() {
  // 确保配置目录存在
}

// 2. 修改方法：getConfigDir()
getConfigDir() {
  // 使用 GetHomePath() 获取用户主目录（跨平台兼容）
  // Windows 返回：C:/Users/xxx/wps_addon_config
  // Linux 返回：/home/xxx/wps_addon_config
  // Mac 返回：/Users/xxx/wps_addon_config
}

// 3. 修改方法：getConfigFullPath()
getConfigFullPath() {
  // 返回完整绝对路径
  // Windows 返回：C:/Users/xxx/wps_addon_config/config.json
  // Linux 返回：/home/xxx/wps_addon_config/config.json
  // Mac 返回：/Users/xxx/wps_addon_config/config.json
}

// 4. 更新 getConfig() - 使用 ReadFile
const content = fs.ReadFile(configFile)

// 5. 更新 saveConfig() - 使用 WriteFile
const writeResult = fs.WriteFile(configFile, jsonString)

// 6. 更新 initializeConfig() - 使用 WriteFile
const writeResult = fs.WriteFile(configFile, jsonString)

// 7. 更新 reset() - 使用 Remove
fs.Remove(configFile)

// 8. 更新 debug() - 使用新的 API 方法测试
```

### 2. `md/WPS_FileSystem_API使用说明.md`（新建）

完整的 WPS FileSystem API 测试结果和使用建议文档。

### 3. `md/配置存储API修复说明.md`（本文档）

本次修复的详细说明。

## 验证方法

在 WPS 中打开插件，进入设置页面：

1. **修改配置并保存**
   - 修改任意配置项（如 API Key）
   - 观察是否显示"配置已保存"

2. **点击"🔧 调试配置"按钮**
   - 查看控制台输出
   - 确认配置文件路径正确
   - 确认读写测试成功

3. **验证持久化**
   - 关闭 WPS
   - 重新打开 WPS 和插件
   - 确认配置仍然保存

4. **查看配置文件**
   - **Windows**: 按 `Win + R` 打开运行，输入 `%UserProfile%\wps_addon_config`
   - **Linux/Mac**: 打开终端，输入 `cd ~/wps_addon_config`
   - 打开 `config.json` 查看内容

## 测试结果

### ✅ 成功验证

- [x] 配置可以正常保存
- [x] 关闭后重新打开配置仍然存在
- [x] 可以通过文件管理器访问配置文件
- [x] 配置目录自动创建
- [x] 配置读写测试通过
- [x] 无 lint 错误

### 📊 API 对比表

| 功能 | 旧方法（❌不支持路径） | 新方法（✅支持绝对路径） |
|------|-------------------|---------------------|
| 读取文件 | `readFileString()` | `ReadFile()` |
| 写入文件 | `writeFileString()` | `WriteFile()` |
| 删除文件 | `unlinkSync()` | `Remove()` |
| 创建目录 | `mkdirSync()` | `Mkdir()` |
| 判断存在 | `Exists()` | `Exists()` ✅ |

## 优点

1. **持久化存储** - 配置不会丢失
2. **跨平台兼容** - 支持 Windows/Linux/Mac 三大平台
3. **符合规范** - 使用用户主目录，符合跨平台应用存储规范
4. **不污染桌面** - 配置文件存在用户主目录下的子文件夹
5. **易于访问** - Windows: `%UserProfile%`，Linux/Mac: `~`
6. **API 稳定** - 使用官方支持的绝对路径 API
7. **目录管理** - 自动创建配置目录

## 注意事项

1. **路径格式**
   - 统一使用正斜杠 `/`
   - Windows 路径自动转换：`C:\Users\...` → `C:/Users/...`

2. **错误处理**
   - 所有文件操作都有 try-catch 保护
   - 失败时返回默认配置，不影响使用

3. **兼容性**
   - 在非 WPS 环境中自动降级使用默认配置
   - 不会抛出错误

## 后续优化建议

1. **配置备份**
   - 可以考虑在保存前自动备份旧配置
   - 提供配置历史恢复功能

2. **配置迁移**
   - 如果用户已有旧配置，自动迁移到新位置

3. **路径可配置**
   - 未来可以让用户选择配置文件存储位置
   - 添加路径选择器

## 总结

通过这次修复，配置存储功能已经完全正常工作：
- ✅ 使用正确的 WPS FileSystem API
- ✅ 支持持久化存储
- ✅ 跨平台兼容（Windows/Linux/Mac）
- ✅ 配置文件位置符合系统规范
- ✅ 完善的错误处理和调试功能

**配置文件位置：**
- Windows: `C:\Users\{用户名}\wps_addon_config\config.json`
- Linux: `/home/{用户名}/wps_addon_config/config.json`
- Mac: `/Users/{用户名}/wps_addon_config/config.json`

**快速访问：**
- Windows: 按 `Win + R`，输入 `%UserProfile%\wps_addon_config`
- Linux/Mac: 终端输入 `cd ~/wps_addon_config`

