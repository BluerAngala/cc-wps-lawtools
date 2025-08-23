# 项目重构计划

## 当前问题分析

### 1. 重复文件问题
- `src/backgroundjs/taskpane.js` (599行，完整实现)
- `src/components/backgroundjs/taskpane.js` (367行，不完整实现，引用错误的util.js路径)

### 2. 目录结构混乱
- backgroundjs 分散在两个位置
- 组件和业务逻辑混合
- 工具类分散

### 3. 导入路径问题
- `src/components/backgroundjs/taskpane.js` 引用 `./util.js` 但文件不存在
- 组件文件都引用 `../backgroundjs/taskpane.js`

## 新目录结构设计

```
src/
├── components/          # Vue 组件
│   ├── common/         # 通用组件
│   │   ├── ConfigForm.vue
│   │   ├── Dialog.vue
│   │   ├── QueueStatus.vue
│   │   └── StatsPanel.vue
│   ├── business/       # 业务组件
│   │   ├── ContractReview.vue
│   │   ├── RulesConfig.vue
│   │   └── TaskPane.vue
│   └── layout/         # 布局组件
│       └── Root.vue
├── services/           # 业务服务层
│   ├── wps/           # WPS 相关服务
│   │   ├── taskpane.js
│   │   ├── ribbon.js
│   │   ├── dialog.js
│   │   └── util.js
│   └── ai/            # AI 服务 (保持现有结构)
│       ├── AIServiceManager.js
│       ├── CacheManager.js
│       ├── DocumentParser.js
│       ├── IncrementalAnalyzer.js
│       ├── TaskScheduler.js
│       ├── promptGenerator.js
│       ├── siliconflow.js
│       ├── config/
│       │   └── performance-config.js
│       └── prompts/
│           └── 提取合同要素.txt
├── utils/              # 工具函数
│   ├── desensitizeAdvanced.js
│   └── kdocs.js
├── router/
│   └── index.js
├── assets/
│   ├── base.css
│   ├── logo.svg
│   └── main.css
├── App.vue
└── main.js
```

## 重构步骤

1. **分析重复功能** - 比较两个 taskpane.js 文件
2. **合并重复功能** - 保留完整的实现
3. **创建新目录结构** - 按功能分类组织文件
4. **移动文件** - 将文件移动到新位置
5. **更新导入路径** - 修复所有引用
6. **删除冗余文件** - 清理重复和无用文件
7. **测试功能** - 确保重构后功能正常

## 预期收益

- 清晰的功能分离
- 消除重复代码
- 统一的导入路径
- 更好的可维护性
- 符合 Vue 3 项目最佳实践