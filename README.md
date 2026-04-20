
# 陈恒律师AI工具箱

&gt; 为律师打造的专业 WPS 加载项，集成 AI 能力、工作流引擎、合同审查等功能

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📦 项目简介

**陈恒律师AI工具箱**是一款专为律师和法律从业者设计的 WPS 文字加载项插件，集成了 AI 合同审查、风险扫描、信息脱敏、文书模板、自定义工作流等强大功能，大幅提升法律文书处理效率。

### 核心特性

- ✨ **AI 合同审查** - 智能分析合同条款，识别法律风险
- 🛡️ **风险扫描** - 批量扫描敏感信息和风险点
- 🔒 **信息脱敏** - 一键隐藏个人信息、企业机密等敏感内容
- 📄 **文书模板** - 内置 30+ 常用法律文书模板
- 🔄 **工作流引擎** - 可编排的自动化工作流，支持 AI 动作
- 🤖 **AI 助理** - 集成腾讯元器 AI 对话助手

---

## 🚀 快速开始

### 环境要求

- WPS 文字（个人版或企业版）
- Node.js &gt;= 16
- Windows 系统

### 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

### 开发调试

```bash
# 启动开发服务器和 WPS 调试
wpsjs debug

# 或仅启动开发服务器
npm run dev
```

### 构建发布

```bash
# 构建加载项
npm run build

# 打包成 WPS 加载项
wpsjs build
```

---

## 📁 功能模块

### 1. AI 助理

调用腾讯元器 AI 助手，提供专业法律咨询和文书辅助。

### 2. 合同审查

智能审查合同文档，提供法律风险分析、条款建议和修改意见。

### 3. 风险扫描

批量扫描文档，识别潜在风险点和敏感信息。

### 4. 信息脱敏

自动识别并隐藏文档中的敏感信息：
- 个人身份信息
- 手机号码、邮箱
- 企业商业机密
- 银行账户等

### 5. 文书模板

内置 30+ 常用法律文书模板，一键生成：

| 分类 | 模板 |
|------|------|
| 合同模板 | 买卖合同、借款合同、劳动合同、房屋租赁合同等 |
| 诉讼文书 | 民事起诉状、民事答辩状、上诉状、代理词等 |
| 律师函 | 催款律师函、侵权警告律师函、劳动争议律师函等 |
| 公司治理 | 公司章程、股东协议、股权转让协议、保密协议等 |
| 其他 | 授权委托书、遗嘱、离婚协议书、法律意见书等 |

### 6. 工作流

可自定义的自动化工作流引擎，支持：

- **文档操作**：读取、保存、重命名、导出 PDF、添加页眉页脚等
- **AI 动作**：合同识别、要素提取、合同审查、全局分析、生成清单等
- **批量处理**：批量关键词批注、批量修订记录等
- **其他操作**：添加水印、添加批注、文档脱敏、敏感信息扫描等

预设工作流示例：
- 合同审查完整流程
- 文档归档工作流
- 快速批注工作流

---

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | ^3.4.29 | 前端框架 |
| Vite | ^6.2.0 | 构建工具 |
| Naive UI | ^2.43.1 | UI 组件库 |
| Vue Router | ^4.4.5 | 路由管理 |
| UnoCSS | ^66.5.2 | 原子化 CSS |
| wps-jsapi | ^1.0.5 | WPS API |
| wpsjs | latest | WPS 开发工具 |
| Axios | ^1.7.2 | HTTP 客户端 |

---

## 📂 项目结构

```
.
├── public/
│   ├── images/           # 图标资源
│   ├── templates/        # 文书模板
│   │   ├── templates.json
│   │   └── *.docx        # 30+ 法律文书模板
│   ├── ribbon.xml        # WPS 功能区配置
│   └── manifest.xml      # 加载项清单
├── src/
│   ├── components/       # Vue 组件
│   │   └── common/       # 通用组件
│   ├── composables/      # Vue 组合式函数
│   ├── config/           # 配置文件
│   │   ├── constants.js
│   │   ├── prompts.js    # AI 提示词
│   │   └── sensitivePatterns.js # 敏感词配置
│   ├── router/           # 路由
│   ├── services/         # 服务层
│   │   ├── ai/           # AI 服务
│   │   ├── contract/     # 合同服务
│   │   ├── document/     # 文档服务
│   │   ├── kdocs/        # 金山文档
│   │   ├── workflow/     # 工作流引擎
│   │   │   ├── actions/  # 工作流动作
│   │   │   ├── presets.js # 预设工作流
│   │   │   └── index.js
│   │   └── wps/          # WPS 服务
│   ├── views/            # 页面组件
│   │   ├── ContractServices.vue
│   │   ├── ContractRiskScan.vue
│   │   ├── DesensitizePage.vue
│   │   ├── TemplateManager.vue
│   │   ├── WorkflowPage.vue
│   │   └── SettingsPage.vue
│   ├── App.vue
│   ├── main.js
│   └── ribbon.js         # 功能区逻辑
├── scripts/              # 工具脚本
│   ├── create-template-docs.js
│   └── template-definitions/
├── .eslintrc.cjs
├── .prettierrc.json
├── package.json
└── vite.config.js
```

---

## ⚙️ 配置说明

### 环境变量

复制 `env.example` 为 `.env` 并配置：

```env
# AI 服务配置
AI_API_KEY=your_api_key
AI_BASE_URL=your_api_url
```

### 敏感词配置

编辑 `src/config/sensitivePatterns.js` 自定义敏感信息识别规则。

### AI 提示词配置

编辑 `src/config/prompts.js` 自定义 AI 提示词。

---

## 🛠️ 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 3889） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm run lint` | ESLint 检查并修复 |
| `npm run format` | Prettier 格式化代码 |
| `npm run create-templates` | 生成模板文档 |
| `wpsjs debug` | 启动 WPS 调试 |
| `wpsjs build` | 打包 WPS 加载项 |

---

## 📖 使用指南

### 首次使用

1. 安装 WPS 文字
2. 安装本插件
3. 在 WPS 功能区找到「陈恒律师AI工具箱」标签页
4. 点击「设置」配置 AI 服务（可选）

### 合同审查流程

1. 打开合同文档
2. 点击「合同审查」
3. 选择审查模式（AI 审查/律师审查）
4. 等待分析完成
5. 查看审查结果和修改建议

### 创建自定义工作流

1. 点击「工作流」
2. 点击「新建工作流」
3. 拖拽编排动作节点
4. 配置动作参数
5. 保存并执行

---

## 🔗 相关文档

- [WPS 加载项开发文档](https://qn.cache.wpscdn.cn/encs/doc/office_v19/webhelpcontents.htm)
- [Agent 开发指南](./AGENTS.md)
- [WPS 开发最佳实践](./.kiro/steering/WPS开发最佳实践.md)

---

## 📄 许可证

MIT License

---

## 📮 联系方式

- 关于我：[飞书文档](https://lawyerch.feishu.cn/wiki/space/7467382510423506963)
- 常用导航：[yesen.cn](https://yesen.cn)

