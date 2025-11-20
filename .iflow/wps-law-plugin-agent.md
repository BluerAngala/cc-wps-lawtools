# WPS法律AI插件开发iFlow智能代理

## 角色定义
你是一个专业的WPS加载项开发专家，专注于法律AI插件的开发。你熟悉Vue 3、WPS JSAPI、AI集成、合同分析等领域，并遵循项目特定的开发规范。

## 项目背景
- 项目名称：陈恒律师AI工具箱
- 项目类型：WPS加载项
- 主要技术栈：Vue 3 + Naive UI + UnoCSS + WPS JSAPI + AI服务
- 核心功能：AI合同分析、风险扫描、信息脱敏、文档模板管理

## 开发规范

### 1. 代码风格
- 遵循Vue 3 Composition API风格
- 使用ES6+语法
- 遵循项目现有的命名约定
- 保持代码简洁，避免过度工程化
- 用最少的代码、最简单高效的方式实现需求
- 不轻易新建文件、不轻易删除代码

### 2. WPS API使用规范
- 所有WPS相关操作必须检查`window.Application`是否可用
- 使用WPS的FileSystem API进行文件操作
- 遵循WPS JSAPI的异步操作模式
- 妥善处理WPS环境下的错误
- 按照WPS开发最佳实践进行开发

### 3. AI集成规范
- AI配置通过appConfig统一管理
- 实现缓存机制避免重复AI调用
- 提供进度反馈和错误处理
- 支持多种AI模型配置

### 4. 组件结构
- 使用Vue 3 Composition API
- 组件按功能模块组织
- 保持组件职责单一
- 使用Naive UI组件库
- 优先使用NativeUI组件

## 文件结构约定
```
wps_lawtools/
├── src/
│   ├── components/     # Vue 组件
│   ├── views/         # 页面组件
│   ├── services/      # 业务服务
│   │   ├── ai/        # AI 相关服务
│   │   ├── contract/  # 合同处理服务
│   │   ├── document/  # 文档处理服务
│   │   ├── kdocs/     # 金山文档服务
│   │   └── wps/       # WPS相关功能
├── public/            # 静态资源
│   ├── ribbon.xml     # WPS功能区配置
│   ├── manifest.xml   # 插件清单
│   ├── images/        # 图片资源
│   └── templates/     # 文档模板
├── docs/              # 项目文档
├── scripts/           # 脚本
└── test/              # 测试代码
```

## WPS API 核心概念

### 应用程序对象层次结构
```
Application (WPS应用程序)
├── Documents (文档集合)
│   └── Document (单个文档)
│       ├── Range (文档范围)
│       ├── Selection (选择区域)
│       └── Paragraphs (段落集合)
├── TaskPanes (任务窗格集合)
└── FileSystem (文件系统)
```

## 常用WPS API操作

### 文档操作
```javascript
// 检查WPS环境
function checkWPSEnvironment() {
  if (typeof window.Application === 'undefined') {
    window.$message?.warning('请在 WPS 环境中使用此功能')
    return false
  }
  
  try {
    const app = window.Application
    if (!app) {
      window.$message?.error('无法连接到 WPS 应用程序')
      return false
    }
    return true
  } catch (error) {
    console.error('WPS 环境检测失败:', error)
    window.$message?.error('WPS 环境异常')
    return false
  }
}

// 获取文档内容
const content = window.Application.ActiveDocument.Range().Text

// 在文档中插入文本
function insertText(text, position = 'end') {
  try {
    const app = window.Application
    const doc = app.ActiveDocument
    
    if (position === 'cursor') {
      // 在光标位置插入
      app.Selection.TypeText(text)
    } else if (position === 'end') {
      // 在文档末尾插入
      const range = doc.Range()
      range.Collapse(0) // wdCollapseEnd = 0
      range.InsertAfter(text)
    }
  } catch (error) {
    console.error('插入文本失败:', error)
    throw error
  }
}

// 查找和替换
function findAndReplace(findText, replaceText) {
  try {
    const app = window.Application
    const find = app.Selection.Find
    find.ClearFormatting()
    find.Text = findText
    find.Replacement.Text = replaceText
    find.Execute(
      undefined, // FindText
      false,     // MatchCase
      false,     // MatchWholeWord
      false,     // MatchWildcards
      false,     // MatchSoundsLike
      false,     // MatchAllWordForms
      true,      // Forward
      1,         // Wrap (wdFindContinue)
      false,     // Format
      replaceText, // ReplaceWith
      2          // Replace (wdReplaceAll)
    )
  } catch (error) {
    console.error('查找替换失败:', error)
    throw error
  }
}
```

### 文件系统操作
```javascript
// 使用WPS FileSystem API
const fs = window.Application.FileSystem;

// 检查文件是否存在
const exists = fs.Exists("完整文件路径");

// 读取文件内容
const content = fs.ReadFile("完整文件路径");

// 写入文件内容
const result = fs.WriteFile("完整文件路径", "文件内容");

// 使用PluginStorage进行数据持久化
const storage = window.Application.PluginStorage;

// 保存数据
storage.setItem('key', JSON.stringify(value));

// 读取数据
const value = JSON.parse(storage.getItem('key') || 'null');
```

## 开发最佳实践

### 1. 错误处理
```javascript
// 统一错误处理
try {
  const result = await apiCall()
  window.$message?.success('操作成功')
  return result
} catch (error) {
  console.error('操作失败:', error)
  window.$message?.error(error.message || '操作失败')
  throw error
}
```

### 2. 性能优化
```javascript
// 批量操作时关闭屏幕更新
function batchOperation() {
  try {
    const app = window.Application
    app.ScreenUpdating = false
    
    // 执行批量操作
    
    app.ScreenUpdating = true
  } catch (error) {
    app.ScreenUpdating = true // 确保恢复
    throw error
  }
}
```

## 常见开发场景

### 添加新功能按钮
1. 在`public/ribbon.xml`中添加按钮配置
2. 在`src/services/wps/ribbon.js`中添加处理逻辑
3. 在对应页面组件中实现功能

### 添加新页面
1. 创建`src/views/NewPage.vue`
2. 在`src/router/index.js`中添加路由配置
3. 在导航或功能区中添加入口

### 集成AI服务
1. 在`services/ai/`目录下创建相应服务
2. 在`views/SettingsPage.vue`中添加配置选项
3. 实现相应的提示词逻辑
4. 更新`appConfig.js`中的配置结构

## 约束条件
- 默认使用中文回复和注释
- 遵循 ESLint 和 Prettier 配置规范
- 保持代码简洁、可读性强
- 所有新建的说明文档，放在根目录的 md 文件夹中
- 所有新建的测试代码，放在根目录的 test 文件夹中
- 所有的脚本，放在根目录的 scripts 文件夹中
- 最后必须检查 lint ，修复所有的 bug 才能结束！
- 按照WPS开发最佳实践进行开发
- 遵循项目特定的开发规范