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
npm run pack                      # 跨平台打包（一键：Vite 构建 + Windows NSIS + macOS/Linux 安装脚本）
wpsjs build                       # 打包 WPS 加载项（散装文件）
wpsjs build --exe                 # 打包成 7z 自解压 exe（仅 Windows）
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
- **路由**: `src/router/index.js` — 使用 hash history（9 个生产路由，2 个开发路由），默认 `/` 跳转 `/aichat`
- **WPS 服务**: `src/services/wps/index.js` — 核心 API（任务窗格、对话框）、文档操作（document.js）、文件操作（file.js）、按钮调度（taskHandler.js）、文档变化监听（watcher.js）
- **AI 对话服务**: `src/services/ai/chatService.js` — 对话式文档操作（读取上下文、流式输出、操作解析与执行），支持 5 种对话模式
- **AI 异步任务**: `src/services/ai/TaskScheduler.js` — 带优先级/重试/超时的 AI 任务队列调度器
- **AI API 客户端**: `src/services/ai/siliconflow.js` — SiliconFlow 兼容 API 的流式/非流式调用
- **AI 企业查询**: `src/services/ai/coze.js` — Coze API 企业信息查询
- **AI Prompt 系统**: `src/services/ai/promptTemplates.js` — 5 种对话模式的系统提示词模板；`src/services/ai/promptGenerator.js` — 动态合同提取/审查/清单 prompt 生成
- **审查策略服务**: `src/services/ai/playbookService.js` — 审查策略 CRUD 和序列化为 prompt 文本
- **工作流引擎**: `src/services/workflow/index.js` — 可扩展的 Action 系统
- **Action 注册表**: `src/services/workflow/actionRegistry.js` — 所有操作的统一注册中心（现已注册 22 个 action）
- **合同审查引擎**: `src/services/contract/` — 合同分段、AI 审查编排、审查清单生成、结果提交
- **RAG 服务**: `src/services/rag/` — Qdrant 向量数据库检索增强生成，支持 4 种集合类型
- **文档处理**: `src/services/document/` — 文档解析（DocumentParser.js）、高级脱敏（desensitizeAdvanced.js）
- **金山文档集成**: `src/services/kdocs/kdocs.js` — 提取的合同数据写入金山文档表格

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

## 功能区按钮（Ribbon）

当前 Ribbon 保留 3 个核心按钮，其余功能统一通过 AI 对话面板访问：

| 按钮 | 功能 | 类型 |
|------|------|------|
| `btnAIChat` | AI 对话（主入口） | 任务窗格（850px） |
| `btnSettings` | 设置 | 对话框（800×600） |
| `btnAboutME` | 关于我 | 外部链接（飞书，隐藏窗格） |

> 移除的按钮（合同审查/风险扫描/信息脱敏/工作流/文书模板/AI助理/常用导航）均通过 AI 对话面板的快捷操作栏或 slash 指令访问。

### 添加新功能区按钮

1. 在 `public/ribbon.xml` 添加 `<button id="btnXxx" onAction="ribbon.OnAction" getImage="ribbon.GetImage"/>`
2. 在 `src/ribbon.js` 的 `OnAction` switch 中添加 case
3. 在 `src/ribbon.js` 的 `GetImage` 中添加图标路径
4. 在 `src/router/index.js` 添加对应路由

## AI 对话功能

### 核心流程

```
用户输入 → chatService 读取文档上下文 → 构建带工具的系统提示词
→ AI 流式回复（含 action 代码块） → 解析操作指令
→ ActionCard 渲染参数表单（默认展开，用户可编辑参数）
→ 用户确认执行 → executeAction 按 schema 分发参数
→ actionRegistry.get(type).execute(params) → 具体操作执行 WPS 文档操作
→ 结果回写（✅已应用 / ❌失败可重试）
```

### 文件结构

- `src/views/AIChatPage.vue` — 对话界面（消息列表、操作卡片、流式渲染、Slash指令等）
- `src/services/ai/chatService.js` — 对话服务核心
  - 文档上下文注入（每次对话自动读取当前文档前 8000 字符）
  - 流式 SSE 输出（优先 fetch + ReadableStream，降级 axios）
  - 渐进式状态回调（`onStatus`: thinking → reading → generating）
  - AI 响应中的 ` ```action ``` ` 代码块解析
  - 操作执行：通过 `actionRegistry` 统一分发，按 `getSchema().properties` 自动提取参数
  - 旧类型映射：`comment` → `addComment`，`revision` → `addRevision`（`_LEGACY_TYPE_MAP`）
  - 对话历史管理（最近 20 条）
- `src/components/chat/ActionCard.vue` — 操作卡片组件
  - 从 `actionRegistry.get(type).getSchema()` 动态生成参数表单
  - `isEditing` 默认 `true`（表单默认展开）
  - `showIf` 机制：字段支持 `showIf: 'fieldName'`，仅当指定字段有值时显示
  - 按钮区：修改参数 / 定位（仅 keyword） / 确认执行 / 跳过
  - 失败后显示「重试」按钮
- `src/components/chat/ChatSettings.vue` — 设置面板
  - 「审查策略」Tab：审查要点（手风琴折叠）、保密协议偏好、常用回复
  - 「向量检索」Tab：RAG 配置
- `src/components/chat/ChatHeader.vue` — 对话头部（包含导出对话记录按钮）
- `src/components/chat/EmptyState.vue` — 空状态引导（快速入口卡片）

### 附加卡片组件

| 组件 | 说明 |
|------|------|
| `src/components/chat/TriageCard.vue` | NDA 分类卡片 — 显示 GREEN/YELLOW/RED 分类结果、风险点列表和建议 |
| `src/components/chat/RiskMatrix.vue` | 风险矩阵 — 3×3 Severity × Likelihood 网格，含风险项列表和筛选 |
| `src/components/chat/CompareView.vue` | 条款对比 — 逐条款展示合同版本差异（新增/修改/删除），带风险标签 |
| `src/components/chat/ExportReport.vue` | 导出报告 — 从对话消息生成 Markdown 报告，支持复制到剪贴板和另存为文档 |

### 5 种对话模式

`promptTemplates.js` 定义了 5 种系统提示词，通过 `chatService` 的 `mode` 参数切换：

| 模式 | 函数 | 用途 |
|------|------|------|
| `standard` | `buildStandardPrompt()` | 通用文档操作（添加批注、修订、水印、页眉页脚等） |
| `triage-nda` | `buildTriageNdaprompt()` | NDA 分类 — 输出 GREEN/YELLOW/RED 及具体风险点 |
| `risk-assessment` | `buildRiskAssessmentPrompt()` | 风险评估 — Severity × Likelihood 矩阵 |
| `compare` | `buildComparePrompt()` | 条款对比 — 逐条款分析新旧版本的差异 |
| `respond` | `buildResponsePrompt()` | 法律函件生成 — 基于模板生成法律回复 |

所有模式均注入：审查策略（playbook）立场、RAG 上下文（如开启）、文档上下文（前 8000 字符）。

### 快捷操作栏

AI 对话面板输入框上方有一个固定快捷操作栏，覆盖原来分散页面的功能：

| 按钮 | 触发内容 | 说明 |
|------|----------|------|
| 🔍 审查合同 | `/审查` | 全面审查合同风险 |
| ⚡ 风险扫描 | `请扫描当前文档中的敏感信息` | 扫描敏感信息位置和类型 |
| 🔒 信息脱敏 | `/脱敏` | 识别并脱敏敏感信息 |
| 📋 合同模板 | `请帮我生成一份法律合同模板` | 生成模板文档 |
| 🔄 批量处理 | `请批量处理文档中的关键词` | 批量关键词批注/修订 |
| 🚀 一键审查 | `_fullReview` | 四步串联：识别类型→全局分析→要素提取→逐条审查 |

### UI 特性

| 特性 | 说明 |
|------|------|
| 消息入场动画 | `TransitionGroup` + cubic-bezier 弹性动画 |
| 渐进式状态 | 思考中 → 阅读文档 → 生成回复（`onStatus` 回调） |
| 流式光标 | 流式输出时末尾闪烁光标（`.blink-cursor`） |
| 滚动到底部 | 智能检测滚动位置，浮动按钮平滑回底 |
| Diff 预览 | 修订操作以红/绿色 diff 样式展示原文→新文 |
| 文档定位 | 点击"定位"按钮，WPS 选中并滚动到对应文本 |
| Slash 指令 | 输入 `/` 弹出快捷指令菜单（审查/批注/修改/总结/脱敏/续写） |
| 操作确认 | 所有操作均需用户确认，参数表单可编辑 |
| 失败重试 | 操作执行失败后显示重试按钮，可修改参数后重新执行 |
| 操作卡片徽标 | 自动从 `actionRegistry` 获取 `icon + name`，无需硬编码 |
| 导出对话 | 多选消息导出到剪贴板，包含 action JSON 完整数据 |
| 历史持久化 | 对话记录保存到 `PluginStorage`，重开自动恢复 |
| 宽度模式 | 紧凑/标准/宽屏 三档切换 (`mode-compact`/`mode-normal`/`mode-wide`) |

### 品牌配色

```css
--c-brand: #0A0A0A       /* 纯黑（主色） */
--c-brand-light: #2D2D2D /* 深灰（渐变辅色） */
--c-accent: #E63946      /* 科技红（强调色） */
--c-accent-light: #FEE2E2 /* 浅红背景 */
--c-highlight: #F5C518   /* 明黄（高亮色） */
--c-highlight-light: #FFF9C4 /* 浅黄背景 */
```

### AI 操作指令格式

AI 在回复中嵌入操作指令，使用 ` ```action ``` ` 代码块：

````
```action
{"type":"addComment","keyword":"违约金","comment":"建议审查违约金比例"}
```
````

````
```action
{"type":"addRevision","keyword":"按日千分之五","newText":"按日千分之一","reason":"违约金过高"}
```
````

````
```action
{"type":"addWatermark","text":"草稿","fontSize":72,"color":"#C0C0C0","orientation":"diagonal"}
```
````

> **兼容**: 旧格式 `type: "comment"` / `type: "revision"` 会被 `_LEGACY_TYPE_MAP` 自动映射为 `addComment`/`addRevision`

### 已注册的操作类型

所有已注册 action 从 `actionRegistry.list()` 获取，每个 action 包含 `type`、`name`、`icon`、`description`、`getSchema()`。

| type | name | icon | 必填参数 |
|------|------|------|---------|
| `addComment` | 添加批注 | 💬 | `keyword`, `comment` |
| `addRevision` | 添加修订 | ✏️ | `keyword`, `newText` |
| `addHeader` | 添加页眉 | 📝 | `text` |
| `addFooter` | 添加页脚 | 📄 | `text` |
| `addPageNumber` | 添加页码 | 🔢 | — |
| `addWatermark` | 添加水印 | 💧 | `text`（默认"草稿"） |
| `renameDocument` | 重命名文档 | 📄 | `newName`（或 `prefix`） |
| `exportPDF` | 导出PDF | 📑 | — |
| `scanSensitive` | 扫描敏感信息 | 🔍 | — |
| `desensitize` | 信息脱敏 | 🔒 | — |
| `batchKeyword` | 批量关键词处理 | 🔍 | `keywordList` |
| `readDocument` | 读取文档 | 📖 | — |
| `saveDocument` | 保存文档 | 💾 | — |
| `deleteFile` | 删除文件 | 🗑️ | `filePath` |
| `submitKdocs` | 提交金山文档 | 📤 | — |
| `identifyContract` | 识别合同类型 | 🔍 | — |
| `extractContract` | 提取合同要素 | 📋 | — |
| `reviewContract` | 审查合同 | ⚖️ | — |
| `globalAnalysis` | 全局分析 | 🌐 | — |
| `generateChecklist` | 生成审查清单 | 📋 | — |

> **新增 action 流程**: 只需在 `src/services/workflow/actions/` 创建 Action 类 → 在 `index.js` 注册到 `allActions` 数组 → 系统自动识别（无需修改其他文件）

## Action 注册表架构

### 核心设计

`actionRegistry` 是所有操作的统一注册中心，UI 和执行层均从中获取信息，**禁止硬编码操作列表**。

```
actionRegistry (Map<type, BaseAction>)
    │
    ├── AIChatPage:  actionRegistry.has(type) → 判断是否可执行
    ├── ActionCard:  actionRegistry.get(type).getSchema() → 生成表单
    │                actionRegistry.get(type).icon + name → 显示徽标
    ├── chatService: actionRegistry.get(type).getSchema().properties → 提取执行参数
    └── 导出/复制:   actionRegistry.get(type).icon + name → 生成标签
```

### 参数分发机制

`chatService.executeAction` 从 action 对象中按 `getSchema().properties` 提取参数，传给 `execute(params, context)`：

```javascript
async function executeAction(action) {
  const { type } = action
  const registryAction = actionRegistry.get(type)
  const schema = registryAction.getSchema()
  const propsDef = schema.properties || {}
  const params = {}
  for (const key of Object.keys(propsDef)) {
    if (action[key] !== undefined) params[key] = action[key]
  }
  return registryAction.execute(params, context)
}
```

### Schema 的 showIf 机制

Schema 字段支持 `showIf: 'fieldName'`，当指定字段的值存在时才显示/传递该参数：

```javascript
getSchema() {
  return {
    properties: {
      imagePath: { type: 'string', title: '图片路径', placeholder: '留空表示不添加图片' },
      imageWidth: { type: 'number', title: '图片宽度', default: 50, showIf: 'imagePath' },
      imageLeft: { type: 'number', title: '图片左边距', default: 490, showIf: 'imagePath' },
    }
  }
}
```

## 关键词搜索策略

`wpsDocument.findRangeByKeyword(keyword)` 采用6层搜索策略，应对 WPS 文档中隐藏控制字符、修订标记等干扰：

| 层级 | 方法 | 说明 |
|------|------|------|
| 1 | `_findTextInDoc` | WPS `Range.Find.Execute` 精确搜索 |
| 2 | `_findTextInDoc(normalize=true)` | 规范化后搜索（全角→半角、多余空格等） |
| 3 | `_findPartialInDoc` | 截取关键词 60% 长度的子串部分匹配 |
| 4 | `_findByTextScan` | 全文扫描，逐字符跳过控制字符定位 Range |
| 5 | `_findByParagraphScan` | 逐段落取文本 → 规范化搜索 → 段落内定位 |
| 6 | — | 所有策略失败，返回 null |

### 控制字符处理

WPS 文档 `.Range().Text` 常夹杂不可见控制字符，`_normalizeForSearch` 和 `_stripControlChars` 负责清理：

- `\u0001\u0005\u0007` — 修订/书签/表格标记
- `\u000B\u000C\u000E-\u001F` — 格式控制字符
- `\u200B-\u200F` — 零宽字符、方向标记
- `\u2028\u2029\uFEFF` — 行分隔符、BOM
- `\r\n` — 换行符

## 文档操作备注

- 所有操作执行后提示用户可通过 **Ctrl+Z** 撤销（红色文字，不用斜体）
- 回撤/撤销功能已禁用（WPS API 不稳定），代码中 `revertAction` 保留但未对接 UI
- `renameDocument` 支持两种模式：指定 `newName` 直接重命名，或指定 `prefix` 加前缀

## 审查策略（Playbook）

### 配置界面

设置面板 → 「审查策略」Tab，采用手风琴折叠布局：

| 分区 | 默认状态 | 说明 |
|------|---------|------|
| 🔍 审查要点 | 折叠 | 每个要点卡片显示类别+重要度圆点，点击展开编辑 |
| 🔒 保密协议偏好 | 折叠 | 互负保密义务、保密期限、例外条款范围 |
| 💬 常用回复 | 折叠 | 每个回复卡片显示名称，点击展开编辑 |

### 审查要点字段通俗化

| 原术语 | 现表述 | placeholder |
|--------|--------|-------------|
| 类别名称 | 条款类别 | 如：违约金条款 |
| 标准立场 | 我方底线 | 我方对该条款的基本立场 |
| 可接受范围 | 可接受范围 | 可以接受的妥协范围 |
| 升级触发 | 必须预警的情况 | 遇到这些情况必须提醒我 |
| 重要度：高/中/低 | 🔴 高 — 必须关注 / 🟡 中 — 建议关注 / 🟢 低 — 可忽略 | — |

## 合同审查引擎

`src/services/contract/` 包含完整的 AI 合同审查管道：

| 文件 | 说明 |
|------|------|
| `documentSegmenter.js` | 将长合同分段，分批提交 AI 审查 |
| `contractReviewEngine.js` | AI 审查编排：类型识别 → 全局分析 → 要素提取 → 逐条审查 |
| `reviewChecklistGenerator.js` | 根据合同类型和视角生成审查清单 |
| `reviewAIService.js` | 合同相关的 AI 调用（类型识别、全局分析） |
| `reviewProcessor.js` | 将审查结果解析为可执行操作 |
| `dataSubmitter.js` | 向金山文档提交提取的合同数据 |
| `contractService.js` | 合同服务统一入口 |
| `jsonlParser.js` | JSONL 格式 AI 响应解析 |

### 审查流程

1. **识别合同类型** — AI 判断合同类型（买卖合同、保密协议等）
2. **全局分析** — 分析整体结构和风险区域
3. **提取合同要素** — 提取甲方/乙方、金额、期限等关键信息
4. **逐条审查** — 按审查清单逐条款排查风险
5. **提交数据** — 将审查结果写入金山文档表格

## RAG 检索增强生成

`src/services/rag/` 提供基于 Qdrant 向量数据库的语义检索：

| 文件 | 说明 |
|------|------|
| `qdrantClient.js` | Qdrant 向量数据库客户端操作 |
| `ragService.js` | RAG 编排（索引、搜索、统计） |
| `embeddingService.js` | 文本向量化（Qwen3-Embedding-8B / BGE-large-zh） |

### 4 种集合类型

| 集合 | 用途 |
|------|------|
| `DOCUMENT_CHUNKS` | 当前文档分段向量化，支持语义问答 |
| `CONVERSATION_MEMORY` | 对话历史向量化，跨会话知识复用 |
| `REVIEW_HISTORY` | 历史审查记录索引 |
| `LAW_KNOWLEDGE` | 法律法规知识库 |

RAG 配置在 ChatSettings 的「向量检索」Tab 中，支持开关、连接配置、模型选择。

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
- **禁止硬编码操作列表/标签**：所有操作信息从 `actionRegistry` 统一获取
- 新增 action 只需在 `actions/` 目录创建类并在 `index.js` 注册，无需修改其他文件

## 跨平台打包与安装

`npm run pack` 一键生成全部平台的安装文件到 `wps-addon-build/`：

| 产物 | 平台 | 安装方式 |
|------|------|---------|
| `wps_lawtools_setup.exe` | Windows | 双击运行 NSIS 安装程序 |
| `wps_lawtools_mac.zip` | macOS | 双击解压 → 右键打开 `.app` → 点击"安装" |

### macOS 安装包原理

macOS `.app` 本质是一个特殊目录结构，双击即可执行：

```
Install WPS LawTools.app/
  Contents/
    Info.plist          ← 应用元数据（CFBundleExecutable 指向 install 脚本）
    MacOS/
      install           ← 安装脚本（0755 权限，使用 osascript 弹出原生 GUI 对话框）
    Resources/
      dist/             ← Vite 构建产物（HTML/JS/CSS/manifest.xml/ribbon.xml）
      安装说明.txt      ← 用户安装引导
```

安装流程：用户双击 `.app` → macOS 执行 `MacOS/install` → 检测 WPS → `osascript` 弹出确认对话框 → 复制文件到 jsaddons → 生成/更新 `publish.xml` → 弹出成功提示

> **注意**：因为 `.app` 未签名，首次打开需右键 → 选择"打开"。zip 中附带 `安装说明.txt` 引导用户。

### 各平台加载项安装路径

| 平台 | 路径 |
|------|------|
| Windows | `%APPDATA%\kingsoft\wps\jsaddons\` |
| macOS | `~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/` |
| Linux | `~/.local/share/Kingsoft/wps/jsaddons/` |

### macOS 限制

- macOS 不支持 58890 端口在线安装（`wpsjs debug` 不可用）
- 需通过 `.app` 安装程序或手动将文件复制到沙盒目录
- 安装后需重启 WPS Office 方可加载插件

### macOS 本地开发加载项不显示的修复

`wpsjs debug` 仅启动 Vite 开发服务器，不会自动注册加载项到 WPS。如果修改 ribbon 或代码后 WPS 菜单不更新，按以下步骤清理：

```bash
# 1. 完全退出 WPS（Cmd+Q）
# 2. 确认进程已杀死
pgrep -f WPS && kill -9 $(pgrep -f WPS)

# 3. 清理 jsaddons 缓存
rm -rf ~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/publish.xml
rm -rf ~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/authaddin.json
rm -rf ~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/wps_lawtools

# 4. 重新构建并安装
npm run build
mkdir -p ~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/wps_lawtools
cp -r dist/* ~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/wps_lawtools/

# 5. 重启 WPS
open -a "WPS Office"
```

> **注意**：目录名必须与 `publish.xml` 中的 `url` 属性一致，`authaddin.json` 中的 `path` 也必须同步更新。

### 打包依赖

| 平台 | 依赖 | 安装方式 |
|------|------|---------|
| Windows | NSIS (makensis) | `scoop install nsis` |
| macOS | archiver (npm) | `npm install` 自动安装 |
| Linux | 无额外依赖 | — |

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
