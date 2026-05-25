# 陈恒律师AI工具箱 - Agent 指南

## 包管理器

**本项目使用 npm 管理依赖，禁止使用 pnpm 或 yarn。**

```bash
# 安装依赖
npm install

# 新增依赖
npm install <package>

# 新增开发依赖
npm install -D <package>
```

## 开发命令

```bash
# ========== 环境准备（首次） ==========
# 1. 安装 WPS（个人版或企业版）
# 2. 安装 Node.js
# 3. 全局安装 wpsjs 工具包（管理员权限，个人版不需要）
npm install -g wpsjs              # 安装
npm update -g wpsjs               # 更新版本

# ========== 新建加载项（仅首次创建项目） ==========
wpsjs create <项目名>             # 新建加载项，选择类型（文字/表格/演示）和代码风格（无/Vue）

# ========== 开发调试 ==========
wpsjs debug                       # 启动 WPS 并加载插件，开启热更新
wpsjs debug -p <port>             # 指定加载项服务端口
wpsjs debug -r <port>             # 指定远程调试端口
wpsjs debug -s                    # 只启动服务，不启动 WPS 进程
wpsjs debug -d                    # 配置远程调试
wpsjs debug -c                    # 还原测试环境
wpsjs stop                        # 停止调试

# ========== 打包发布 ==========
wpsjs build                       # 打包 WPS 加载项
wpsjs build --exe                 # 打包成 exe（仅 Windows）
wpsjs publish -s <serverUrl>      # 发布到指定服务器
wpsjs unpublish                   # 取消发布

# ========== 项目依赖 ==========
npm install                       # 安装项目依赖
npm update --save-dev wps-jsapi   # 更新 WPS API TypeScript 类型定义

# ========== 构建（Vite） ==========
npm run build                     # 构建到 wps-addon-build 目录
npm run preview                   # 预览构建结果

# ========== 代码质量 ==========
npm run lint                      # ESLint 检查并修复
npm run format                    # Prettier 格式化 src/

# ========== 工具脚本 ==========
npm run create-templates          # 生成模板文档
```

## wpsjs 命令详解

| 命令 | 说明 |
|------|------|
| `wpsjs create <app-name>` | 创建一个 WPS 加载项 |
| `wpsjs join` | 接入 WPS 加载项，将已有前端工程提升为 WPS 加载项 |
| `wpsjs debug` | 调试 WPS 加载项 |
| `wpsjs build` | 打包 WPS 加载项 |
| `wpsjs publish` | 发布 WPS 加载项 |
| `wpsjs unpublish` | 取消发布 WPS 加载项 |

### debug 选项

| 选项 | 说明 |
|------|------|
| `-c, --clean` | 还原测试环境 |
| `-p, --port <port>` | 指定 WPS 加载项服务端口 |
| `-r, --remotePort <port>` | 指定 WPS 加载项远程调试端口 |
| `-s, --server` | 只启动服务，不启动 WPS 进程 |
| `-d, --debug` | 配置远程调试 |

### build 选项

| 选项 | 说明 |
|------|------|
| `--exe` | 打包成 exe（仅 Windows 平台） |

### publish 选项

| 选项 | 说明 |
|------|------|
| `-s, --serverUrl <url>` | 服务器地址 |

## wpsjs 调试流程

1. **启动调试**: `wpsjs debug` — 自动启动 WPS 并加载插件，同时启动 http 服务提供热更新
2. **修改代码**: 保存后自动刷新页面
3. **查看控制台**: 在 WPS 中按 `F12` 打开开发者工具
4. **停止调试**: `wpsjs stop` — 停止调试会话

> **注意**: wpsjs 工具包启动的 http 服务提供：
> - 前端页面热更新（检测到变化自动刷新）
> - 加载项在线服务（WPS 通过 http 请求加载项代码和资源）
>
> **交流群**: QQ群 185170323

## 架构入口

- **WPS 功能区入口**: `src/ribbon.js` — 必须挂载到 `window.ribbon`，导出 `OnAction`/`GetImage`/`OnAddinLoad`
- **Vue 入口**: `src/main.js`
- **路由**: `src/router/index.js` — 使用 hash history
- **WPS 服务**: `src/services/wps/index.js` — 文档操作、任务窗格、对话框
- **AI 服务**: `src/services/ai/TaskScheduler.js` — 统一 AI 调用入口
- **AI 对话服务**: `src/services/ai/chatService.js` — 对话式文档操作（读取上下文、流式输出、操作解析与执行）
- **工作流引擎**: `src/services/workflow/index.js` — 可扩展的 Action 系统

## WPS 加载机制

### 加载流程

1. WPS 读取 `manifest.xml` 获取加载项基本信息（名称、描述、API版本）
2. WPS 读取 `public/ribbon.xml` 创建功能区按钮和菜单
3. 按钮点击触发 `ribbon.OnAction(control)` (control.Id 对应 ribbon.xml 中的 button id)
4. 通过 `Util.wpsService.createTaskPane(routeName)` 打开任务窗格，routeName 对应路由路径

### 核心文件说明

#### manifest.xml — 加载项清单
```xml
<?xml version="1.0" encoding="UTF-8"?>
<JsPlugin>
  <ApiVersion>1.0.0</ApiVersion>
  <Name>陈恒律师AI工具箱</Name>
  <Description>陈恒律师AI工具箱</Description>
</JsPlugin>
```

#### ribbon.xml — 功能区配置
- 定义 Tab、Group、Button 层级结构
- `onAction` 指定点击回调函数
- `getImage` 指定图标获取函数
- `size` 可选 `large` 或 `normal`

#### ribbon.js — 功能区逻辑
- 必须挂载到 `window.ribbon`
- 导出 `OnAction`（按钮点击）、`GetImage`（图标路径）、`OnAddinLoad`（加载完成回调）

## 添加新功能区按钮

1. 在 `public/ribbon.xml` 添加 `<button id="btnXxx" onAction="ribbon.OnAction" getImage="ribbon.GetImage"/>`
2. 在 `src/ribbon.js` 的 `OnAction` switch 中添加 case
3. 在 `src/ribbon.js` 的 `GetImage` 中添加图标路径
4. 在 `src/router/index.js` 添加对应路由

## AI 对话功能

### 核心流程

```
用户输入 → chatService 读取文档上下文 → 构建带工具的系统提示词
→ AI 流式回复（含 action 代码块） → 解析操作指令 → 用户确认 → 执行 WPS 文档操作
```

### 文件结构

- `src/views/AIChatPage.vue` — 对话界面（消息列表、操作卡片、流式渲染）
- `src/services/ai/chatService.js` — 对话服务核心
  - 文档上下文注入（每次对话自动读取当前文档前 8000 字符）
  - 流式 SSE 输出（优先 fetch + ReadableStream，降级 axios）
  - AI 响应中的 ` ```action ``` ` 代码块解析
  - 操作执行：复用 `workflow/actions` 的 `addCommentAction` 和 `addRevisionAction`
  - 对话历史管理（最近 20 条）

### AI 操作指令格式

AI 在回复中嵌入操作指令，格式如下：

````
```action
{"type":"comment","keyword":"违约金","comment":"建议审查违约金比例"}
```
````

或

````
```action
{"type":"revision","keyword":"按日千分之五","newText":"按日千分之一","reason":"违约金过高"}
```
````

### 支持的操作类型

| type | 说明 | 必填参数 |
|------|------|---------|
| `comment` | 添加批注 | `keyword`, `comment` |
| `revision` | 添加修订 | `keyword`, `newText`, `reason`(可选) |

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
└── PluginStorage (持久化存储)
```

### 常用 API 模式

#### 获取应用程序实例
```javascript
const app = window.Application
if (!app) {
  console.error('无法获取 WPS 应用程序实例')
  return
}
```

#### 文档操作
```javascript
const doc = app.ActiveDocument
if (!doc) {
  console.warn('请先打开一个文档')
  return
}
const content = doc.Content.Text
const selection = app.Selection
```

#### 任务窗格管理
```javascript
const taskPane = app.CreateTaskPane(url)
taskPane.Visible = true
taskPane.Width = 300
```

#### 持久化存储
```javascript
const storage = app.PluginStorage
storage.setItem('key', JSON.stringify(value))
const data = JSON.parse(storage.getItem('key') || 'null')
```

## 代码风格

- Prettier: 无分号、单引号、2空格、无尾逗号
- 路径别名: `@/*` → `./src/*`
- 使用 UnoCSS，配置文件在根目录 `uno.config.js`
- 未使用变量可用 `_` 前缀忽略

## 关键约束

- 生产构建会移除 `console` 和 `debugger`
- 开发环境代理 `/api/kdocs` 到金山文档 API
- 构建输出目录: `wps-addon-build/`
- 必须在 WPS 环境中运行，`window.Application` 才可用

## 官方文档链接

### 基础入门
- [加载项概述](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/%E5%8A%A0%E8%BD%BD%E9%A1%B9%E6%A6%82%E8%BF%B0.html)
- [生成首个 WPS 加载项](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/%E7%94%9F%E6%88%90%E9%A6%96%E4%B8%AA%20WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9.html)
- [WPS 加载项开发说明](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91%E8%AF%B4%E6%98%8E.html)

### OA 助手场景
- [新建文档](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/OA%20%E5%8A%A9%E6%89%8B/OA%E5%8A%A9%E6%89%8B%E5%9C%BA%E6%99%AF%E5%AF%B9%E6%8E%A5%E5%9C%BA%E6%99%AF/%E6%96%B0%E5%BB%BA%E6%96%87%E6%A1%A3.html)
- [打开文档](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/OA%20%E5%8A%A9%E6%89%8B/OA%E5%8A%A9%E6%89%8B%E5%9C%BA%E6%99%AF%E5%AF%B9%E6%8E%A5%E5%9C%BA%E6%99%AF/%E6%89%93%E5%BC%80%E6%96%87%E6%A1%A3.html)
- [文档上传](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/OA%20%E5%8A%A9%E6%89%8B/OA%E5%8A%A9%E6%89%8B%E5%9C%BA%E6%99%AF%E5%AF%B9%E6%8E%A5%E5%9C%BA%E6%99%AF/%E6%96%87%E6%A1%A3%E4%B8%8A%E4%BC%A0.html)
- [显示修订](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/OA%20%E5%8A%A9%E6%89%8B/OA%E5%8A%A9%E6%89%8B%E5%9C%BA%E6%99%AF%E5%AF%B9%E6%8E%A5%E5%9C%BA%E6%99%AF/%E6%98%BE%E7%A4%BA%E4%BF%AE%E8%AE%A2.html)
- [文档格式转换](https://qn.cache.wpscdn.cn/encs/doc/office_v19/topics/WPS%20%E9%9B%86%E6%88%90%E6%A8%A1%E5%BC%8F/WPS%20%E5%8A%A0%E8%BD%BD%E9%A1%B9%E5%BC%80%E5%8F%91/OA%20%E5%8A%A9%E6%89%8B/OA%E5%8A%A9%E6%89%8B%E5%9C%BA%E6%99%AF%E5%AF%B9%E6%8E%A5%E5%9C%BA%E6%99%AF/%E6%96%87%E6%A1%A3%E6%A0%BC%E5%BC%8F%E8%BD%AC%E6%8D%A2.html)

### 官方文档主页
- [WPS 官方文档主页](https://qn.cache.wpscdn.cn/encs/doc/office_v19/webhelpcontents.htm)


---


你需要结合这个项目的开发情况，判断是否需要更新这个文档。