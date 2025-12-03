---
inclusion: always
---

# WPS 加载项开发规范

## 项目概述
这是一个基于 Vue 3 + NativeUI + UnoCSS 的 WPS 加载项项目，专注于律师工具箱功能开发。项目采用现代化的前端技术栈，提供高效的文档处理和AI辅助功能。

## 相关文档引用
在开发过程中，请参考以下专业文档获取详细的技术指导：

- **WPS API 最佳实践**: #[[file:WPS开发最佳实践.md]] - 包含 WPS API 核心概念、常用功能实现、事件处理、数据存储等详细示例
- **WPS 官方文档**: #[[file:wps开发文档链接集合.md]] - WPS 官方开发文档链接集合，涵盖加载项开发、宏编辑器、OA助手等全面内容

> 💡 **使用建议**: 
> - 遇到 WPS API 相关问题时，优先查阅 WPS开发最佳实践.md 中的代码示例
> - 需要查找官方文档时，使用 wps开发文档链接集合.md 快速定位
> - 这两个文档会在需要时自动加载到上下文中

## 核心技术栈
- **Vue 3**：使用 Composition API，优先使用 `<script setup>` 语法
- **NativeUI (Naive UI)**：现代化 Vue 3 UI 组件库，提供丰富的组件和优秀的用户体验
- **UnoCSS**：原子化 CSS 框架，用于快速样式开发和定制
- **WPS JS API**：使用官方 API 进行文档操作
- **Vite**：构建工具，开发服务器端口 3889

## 项目开发要求
- 默认使用中文回复和注释
- 用最少的代码、最简单高效的方式实现需求
- 遵循 ESLint 和 Prettier 配置规范
- 保持代码简洁、可读性强
- 我希望你充分理解我的需求，用最少的代码、最简单高效的方式一步步实现我的需求。
- 遵循不轻易新建文件、不轻易删除代码的基本原则。
- 所有新建的说明文档，放在根目录的 md 文件夹中
- 所有新建的测试代码，放在根目录的 test 文件夹中
- 所有的脚本，放在根目录的 scripts 文件夹中。
- 最后必须检查 lint ，修复所有的 bug 才能结束！

## 目录结构
```
├── src/
│   ├── components/     # Vue 组件
│   ├── views/         # 页面组件
│   ├── services/ai/   # AI 相关服务
│   ├── utils/         # 工具函数
│   └── wps/          # WPS 相关功能
├── docs/            # 项目文档
```

## 文件命名
- Vue 组件：PascalCase（如 `ContractExtractor.vue`）
- JS/TS 文件：camelCase（如 `configManager.js`）

## Vue 组件开发
```vue
<template>
  <n-config-provider>
    <n-card title="标题" size="small">
      <n-space vertical>
        <n-button type="primary" @click="handleClick">操作按钮</n-button>
        <div class="p-4 bg-gray-50 rounded-lg">自定义内容区域</div>
      </n-space>
    </n-card>
  </n-config-provider>
</template>

<script setup>
import { ref } from 'vue'
import { NConfigProvider, NCard, NButton, NSpace } from 'naive-ui'

const data = ref([])
const handleClick = () => window.$message?.success('操作成功')
</script>
```

## WPS API 使用

> 📚 **详细参考**: 更多 WPS API 使用示例请查看 #[[file:WPS开发最佳实践.md]]

```javascript
// WPS API 调用示例
try {
  if (typeof window.Application === 'undefined') {
    window.$message?.warning('请在 WPS 环境中使用此功能')
    return
  }

  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.$message?.error('未找到活动文档')
    return
  }
  
  const text = doc.Range().Text
  console.log('文档内容:', text)
} catch (error) {
  console.error('WPS API 调用失败:', error)
  window.$message?.error('操作失败，请重试')
}
```

**常用 WPS API 场景** (详见 WPS开发最佳实践.md):
- 文档内容操作：插入文本、查找替换
- 文档格式化：段落格式、字体格式
- 文件操作：保存文档、导出PDF
- 事件处理：文档事件、任务窗格事件
- 数据存储：使用 PluginStorage

## NativeUI 组件使用
- **优先使用 NativeUI 组件**：如 `n-button`、`n-card`、`n-input`、`n-form` 等
- **按需导入组件**：避免全量导入，减少打包体积
- **使用手风琴模式**：折叠面板使用 `n-collapse` 的 `accordion` 属性
- **统一消息提示**：使用 `window.$message` 进行用户反馈

```javascript
// 推荐的导入方式
import { 
  NConfigProvider, NCard, NButton, NSpace, NCollapse, 
  NCollapseItem, NAlert, NCode, NInput, NFormItem 
} from 'naive-ui'
```

## 错误处理
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

## 开发命令
```bash
wpsjs dbug     # 开发服务器
wpsjs build    # 构建生产版本
npm lint     # 代码检查
npm format   # 代码格式化

npm update -g wpsjs #更新
npm update --save-dev wps-jsapi #更新
```

## 调试技巧
- 按 F12 打开浏览器开发者工具
- 使用 `console.log` 进行状态跟踪
- 验证 WPS API 的可用性：`typeof window.Application`
- 参考 #[[file:WPS开发最佳实践.md]] 中的调试技巧和日志记录方案

## 核心原则
1. **简洁高效**：用最少的代码实现最大的功能价值
2. **用户体验**：优先考虑用户的使用体验和界面友好性
3. **可维护性**：编写清晰、可读、易维护的代码

这些规范确保代码质量、开发效率和项目的可维护性。

---

## 📖 扩展阅读

当你需要深入了解 WPS 开发的具体实现时，可以参考：

1. **#[[file:WPS开发最佳实践.md]]** - 实战代码示例和最佳实践
   - WPS API 核心概念和对象层次结构
   - 常用功能的完整实现代码
   - 错误处理和性能优化建议
   - 调试技巧和日志记录方案
   - 部署配置说明

2. **#[[file:wps开发文档链接集合.md]]** - 官方文档快速索引
   - WPS 加载项开发完整文档
   - OA 助手场景对接指南
   - 宏编辑器开发文档
   - 多平台集成指南

> 💡 这些文档会在你需要时自动加载，无需手动查找！