# 陈恒律师的工具箱

## 项目简介

这是一个基于Vue 3 + Element Plus开发的WPS加载项项目，集成了先进的AI智能合同分析功能，为律师提供专业的合同审查、要素提取和文档处理工具箱。

## 更新日志

### 2025年9月30日

- 重构-引入unocss ，重构原有 css ，大幅度简化代码
- 重构-简化大部分页面的实现逻辑


### 2025年8月22日

- 新增-AI自动抽取合同信息
- 新增-自动对接金山文档特定管理表格，支持抽取合同信息后自动填写表格

- 重构-代码架构全面优化
- 重构-合并重复的WPS服务功能，创建统一的WPSActions组件
- 重构-简化AI服务架构，TaskScheduler作为统一入口
- 重构-优化组件结构，合并功能相似组件
- 重构-清理冗余配置文件和未使用依赖
- 重构-统一路由和导航逻辑，创建RouteManager管理器
- 重构-优化脱敏工具，提供简化版本
- 优化-提升代码复用性和可维护性
- 优化-减少项目复杂度和依赖体积

### 2025年7月25日

- 新增-AI处理文本
- 新增-自动识别敏感信息并且脱敏
- 新增-一键重命名
- 新增-添加页眉

### 2025年7月23日

- 接入腾讯元宝AI助理客服
- 项目初始化

## 📁 项目结构

```
陈恒律师的工具箱/
├── src/                          # 源代码目录
│   ├── components/               # Vue组件
│   │   ├── business/            # 业务组件
│   │   │   ├── TaskPane.vue     # 任务窗格主界面
│   │   │   └── ContractReview.vue # 合同审查组件
│   │   ├── common/              # 通用组件
│   │   │   ├── Dialog.vue       # 对话框组件
│   │   │   ├── StatsPanel.vue   # 统计面板（集成队列状态）
│   │   │   └── WPSActions.vue   # WPS操作组件（统一WPS功能）
│   │   └── layout/              # 布局组件
│   │       └── Root.vue         # 根组件
│   ├── services/                # 服务层
│   │   ├── ai/                  # AI服务
│   │   │   ├── TaskScheduler.js      # 任务调度器（AI服务统一入口）
│   │   │   ├── siliconflow.js       # AI API调用
│   │   │   └── promptGenerator.js   # 提示词生成器
│   │   └── wps/                 # WPS集成服务
│   │       ├── ribbon.js        # 功能区按钮逻辑
│   │       ├── dialog.js        # 对话框逻辑
│   │       ├── RouteManager.js  # 路由和任务窗格管理器
│   │       └── util.js         # WPS工具函数
│   ├── router/                  # 路由配置
│   │   └── index.js            # 路由定义
│   ├── utils/                  # 工具函数
│   │   ├── desensitize.js      # 简化版脱敏工具
│   │   ├── desensitizeAdvanced.js # 高级脱敏工具（保留）
│   │   └── kdocs.js            # 金山文档集成
│   └── assets/                 # 静态资源
├── public/                     # 公共资源
│   ├── ribbon.xml              # WPS功能区配置
│   ├── manifest.xml            # 插件清单配置
│   └── images/                 # 图片资源
└── package.json                # 项目依赖配置
```

## 🚀 运行逻辑

### 整体架构

```
WPS客户端 → 功能区按钮 → Vue组件 → AI服务 → 结果回写
```

### 详细流程

1. **插件加载阶段**
   - WPS读取 <mcfile name="manifest.xml" path="public/manifest.xml"></mcfile> 配置文件
   - 根据 <mcfile name="ribbon.xml" path="public/ribbon.xml"></mcfile> 创建功能区按钮

2. **用户交互阶段**
   - 点击功能区按钮触发 <mcsymbol name="OnAction" filename="ribbon.js" path="src/services/wps/ribbon.js" startline="1" type="function"></mcsymbol> 函数
   - 通过 <mcsymbol name="RouteManager" filename="RouteManager.js" path="src/services/wps/RouteManager.js" startline="1" type="class"></mcsymbol> 统一管理任务窗格创建
   - 加载对应的Vue组件

3. **AI处理阶段**
   - 用户选择分析类型（合同审查、要素提取等）
   - <mcsymbol name="TaskScheduler" filename="TaskScheduler.js" path="src/services/ai/TaskScheduler.js" startline="1" type="class"></mcsymbol> 作为AI服务统一入口处理任务：
     - 文档解析：智能分块处理
     - 缓存管理：避免重复处理
     - 模型选择：根据内容长度自动选择最优AI模型
     - 提示词生成：<mcsymbol name="promptGenerator" filename="promptGenerator.js" path="src/services/ai/promptGenerator.js" startline="1" type="function"></mcsymbol> 动态生成
     - API调用：<mcsymbol name="siliconflow" filename="siliconflow.js" path="src/services/ai/siliconflow.js" startline="1" type="function"></mcsymbol> 调用AI服务

4. **结果处理阶段**
   - 解析AI响应并格式化结果
   - 通过 <mcsymbol name="WPSActions" filename="WPSActions.vue" path="src/components/common/WPSActions.vue" startline="1" type="function"></mcsymbol> 统一处理WPS操作
   - 将结果回写到WPS文档，更新任务状态和统计信息

### 🎯 核心AI功能

#### 1. 智能合同要素提取
- **功能**：自动提取合同关键信息（甲方、乙方、金额、期限等）
- **技术**：动态提示词生成 + JSON格式输出
- **优势**：支持自定义提取标签，精准匹配法律需求

#### 2. AI合同预审
- **功能**：智能识别合同风险点和问题条款
- **技术**：多规则审查 + 批注/修订双模式
- **优势**：专业的法律审查逻辑，支持自定义审查规则

#### 3. 文档结构分析
- **功能**：自动提取文档标题层级结构
- **技术**：语义分析 + 格式识别
- **优势**：快速理解文档组织架构

#### 4. 关键词批注
- **功能**：识别关键术语并添加专业批注
- **技术**：关键词匹配 + 上下文分析
- **优势**：提高审查效率，减少遗漏

### ⚡ 性能优化特性

1. **智能分块处理**：自动将大文档分解为可处理块
2. **缓存机制**：相同内容直接返回缓存结果
3. **模型优化**：根据任务复杂度选择最佳AI模型
4. **并行处理**：支持多个任务同时执行
5. **错误恢复**：自动重试和故障转移机制

### 🔧 技术栈

- **前端框架**：Vue 3 + Element Plus
- **构建工具**：Vite
- **AI集成**：SiliconFlow API + 自定义提示词引擎
- **文档处理**：WPS JSAPI
- **状态管理**：Vue Reactive System
- **工具库**：Axios, Crypto-JS
- **架构特点**：统一服务入口、组件复用、路由管理

## 开发指南

### 添加新功能区按钮

1. 在 `public/ribbon.xml`中添加新的button元素：

   ```xml
   <button id="btnNewFeature" label="新功能" onAction="ribbon.OnAction" getImage="ribbon.GetImage" visible="true" size="large"/>
   ```
2. 在 `src/components/ribbon.js`的OnAction函数中添加对应的case处理：

   ```javascript
   case 'btnNewFeature':
     {
       // 实现按钮点击逻辑
     }
     break
   ```
3. 如需要自定义按钮图标，在 `src/components/ribbon.js`的GetImage函数中添加对应的图片路径：

   ```javascript
   case 'btnNewFeature':
     return './images/new_feature.png'
   ```

### 添加任务窗格新功能

1. 在 `src/components/business/TaskPane.vue`的模板中添加按钮：

   ```html
   <button style="margin: 3px" @click="onbuttonclick('newFeature')">新功能</button>
   ```
2. 在TaskPane.vue的methods中添加对应的处理逻辑：

   ```javascript
   case 'newFeature': {
     // 实现具体功能逻辑
     break;
   }
   ```
3. 如需WPS操作，可使用 `src/components/common/WPSActions.vue` 组件统一处理

### 构建和部署

1. 开发调试：`npm run dev`
2. 构建发布：`npm run build`
3. 构建后的文件在 `wps-addon-build`目录中
