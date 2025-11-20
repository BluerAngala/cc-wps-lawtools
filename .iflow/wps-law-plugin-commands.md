# WPS法律AI插件开发命令规范

## 项目结构和命令

### 项目初始化和构建
```bash
# 安装依赖
pnpm install

# 启动开发服务器（监听3889端口）
wpsjs debug

# 构建生产版本
wpsjs build --exe



# 代码格式化
pnpm format

# 代码检查
pnpm lint
```

### WPSJS 开发命令
```bash
wpsjs dbug     # 开发服务器
wpsjs build    # 构建生产版本
npm lint       # 代码检查
npm format     # 代码格式化

npm update -g wpsjs #更新
npm update --save-dev wps-jsapi #更新
```

## WPS加载项开发命令

### 插件配置文件
```xml
<!-- manifest.xml - 插件清单文件 -->
<JsPlugin>
  <ApiVersion>1.0.0</ApiVersion>
  <Name>陈恒律师AI工具箱</Name>
  <Description>陈恒律师的工具箱</Description>
</JsPlugin>

<!-- ribbon.xml - 功能区配置文件 -->
<customUI xmlns="http://schemas.microsoft.com/office/2006/01/customui" onLoad="ribbon.OnAddinLoad">
    <ribbon startFromScratch="false">
        <tabs>
            <tab id="wpsAddinTab" label="陈恒律师AI工具箱">
                <!-- 功能按钮定义 -->
            </tab>
        </tabs>
    </ribbon>
</customUI>
```

### 功能区按钮开发命令
```bash
# 1. 在 ribbon.xml 中添加按钮
<button id="btnNewFeature" label="新功能" onAction="ribbon.OnAction" getImage="ribbon.GetImage" visible="true" size="large"/>

# 2. 在 src/services/wps/ribbon.js 中添加处理函数
case 'btnNewFeature':
  // 实现按钮点击逻辑
  break;

# 3. 在 src/services/wps/ribbon.js 中添加图标获取函数
case 'btnNewFeature':
  return './images/new_feature.png'
```

### WPS API使用命令
```javascript
// 检查WPS环境
if (typeof window.Application !== 'undefined') {
  // WPS环境可用
  const doc = window.Application.ActiveDocument;
  const app = window.Application;
} else {
  // 非WPS环境，用于调试
}

// 获取文档内容
const content = window.Application.ActiveDocument.Range().Text;

// 替换文档内容
const doc = window.Application.ActiveDocument;
const find = doc.Application.Selection.Find;
find.ClearFormatting();
find.Text = "原文本";
find.Replacement.ClearFormatting();
find.Replacement.Text = "新文本";
find.Execute(
  undefined, // FindText
  false,     // MatchCase
  false,     // MatchWholeWord
  false,     // MatchWildcards
  false,     // MatchSoundsLike
  false,     // MatchAllWordForms
  true,      // Forward
  1,         // Wrap
  false,     // Format
  undefined, // ReplaceWith
  2          // Replace (wdReplaceAll)
);

// 创建新文档
const newDoc = window.Application.Documents.Add();

// 保存文档
window.Application.ActiveDocument.Save();

// 保存文档到指定路径
window.Application.ActiveDocument.SaveAs2("完整路径/文件名.docx");

// 导出PDF
window.Application.ActiveDocument.ExportAsFixedFormat(
  "完整路径/文件名.pdf",  // OutputFileName
  17,  // ExportFormat (wdExportFormatPDF)
  false,  // OpenAfterExport
  0,  // OptimizeFor (wdExportOptimizeForPrint)
  1,  // Range (wdExportAllDocument)
  1,  // From
  1,  // To
  7,  // Item (wdExportDocumentContent)
  true,  // IncludeDocProps
  true,  // KeepIRM
  0,  // CreateBookmarks (wdExportCreateNoBookmarks)
  true,  // DocStructureTags
  true,  // BitmapMissingFonts
  false // UseDocumentPrintSettings
);
```

### 文件系统操作命令
```javascript
// 使用WPS FileSystem API
const fs = window.Application.FileSystem;

// 检查文件是否存在
const exists = fs.Exists("完整文件路径");

// 读取文件内容
const content = fs.ReadFile("完整文件路径");

// 写入文件内容
const result = fs.WriteFile("完整文件路径", "文件内容");

// 删除文件
const result = fs.Remove("完整文件路径");

// 创建目录
const result = fs.CreateDirectory("完整目录路径");

// 检查目录是否存在
const exists = fs.FolderExists("完整目录路径");
```

## WPS加载项生命周期

### 初始化命令
```javascript
// 在WPS加载插件时调用
function OnAddinLoad() {
  // 初始化插件
}

// 按钮点击事件
function OnAction(action) {
  switch (action) {
    case 'btnShowAI':
      // 显示AI助理
      break;
    case 'btnDesensitize':
      // 启动信息脱敏
      break;
    // 其他按钮处理
  }
}

// 获取按钮图标
function GetImage(controlId) {
  switch (controlId) {
    case 'btnShowAI':
      return './images/1.svg';
    case 'btnDesensitize':
      return './images/2.svg';
    // 其他按钮图标
  }
}
```

## 数据持久化命令

### 插件存储
```javascript
// 使用WPS插件存储
const storage = window.Application.PluginStorage;

// 保存数据
storage.setItem('key', JSON.stringify('value'));

// 读取数据
const value = JSON.parse(storage.getItem('key') || 'null');

// 删除数据
storage.removeItem('key');
```

## 加载项部署命令

### 开发调试
```bash
# 1. 启动开发服务器
pnpm dev

# 2. 在WPS中启用开发者模式
# 文件 -> 选项 -> 自定义功能区 -> 开发工具

# 3. 加载插件
# 开发工具 -> 从文件加载 -> 选择项目根目录
```

### 生产部署
```bash
# 1. 构建项目
pnpm build

# 2. 打包插件
# 构建结果在 wps-addon-build 目录
# 包含 manifest.xml、index.html、资源文件等

# 3. 部署插件
# 将构建结果复制到WPS插件目录
# 或通过WPS插件中心分发
```

## 常用WPSJS API命令

### 文档操作
```javascript
// 获取当前文档
const doc = window.Application.ActiveDocument;

// 获取文档名称和路径
const docName = doc.Name;
const docPath = doc.Path;

// 获取文档内容
const fullText = doc.Range().Text;

// 在文档中插入文本
doc.Range().InsertAfter("插入的文本");

// 获取文档中的所有段落
const paragraphs = doc.Paragraphs;

// 获取文档中的所有表格
const tables = doc.Tables;

// 获取文档中的所有图片
const inlineShapes = doc.InlineShapes;
```

### 选择和查找
```javascript
// 获取当前选择
const selection = window.Application.Selection;

// 查找和替换
const find = selection.Find;
find.ClearFormatting();
find.Text = "查找文本";
find.Replacement.ClearFormatting();
find.Replacement.Text = "替换文本";
find.Execute();
```

### 格式设置
```javascript
// 设置字体格式
selection.Font.Name = "宋体";
selection.Font.Size = 12;
selection.Font.Bold = true;

// 设置段落格式
selection.ParagraphFormat.Alignment = 1; // 居中对齐
```

## 错误处理和调试

### WPS环境检查
```javascript
// 检查WPS环境
function checkWPS() {
  if (typeof window.Application === 'undefined') {
    throw new Error('请在WPS环境中运行');
  }
  
  if (typeof window.Application.FileSystem === 'undefined') {
    throw new Error('WPS文件系统不可用');
  }
  
  const doc = window.Application.ActiveDocument;
  if (!doc) {
    throw new Error('未找到活动文档');
  }
}
```

### 调试命令
```bash
# 1. 在浏览器控制台查看日志
console.log('调试信息');

# 2. 在WPS中查看插件日志
# 开发工具 -> VBA编辑器 -> 立即窗口

# 3. 使用WPS内置调试功能
# 在代码中添加错误处理
```

## 性能优化命令

### 大文档处理
```javascript
// 分块处理大文档
function processLargeDocument(doc, chunkSize = 1000) {
  const fullText = doc.Range().Text;
  const chunks = [];
  
  for (let i = 0; i < fullText.length; i += chunkSize) {
    chunks.push(fullText.slice(i, i + chunkSize));
  }
  
  return chunks;
}

// 暂停和恢复屏幕更新以提高性能
window.Application.ScreenUpdating = false;
// 执行批量操作
window.Application.ScreenUpdating = true;
```

## 安全和权限

### 文件访问权限
```javascript
// 文件操作需要用户授权
// 使用完整路径而非相对路径
const fullPath = doc.Path ? doc.Path + "/" + doc.Name : doc.Name;

// 避免访问系统敏感目录
// 只操作文档所在目录或用户指定目录
```

## 最佳实践

### 代码组织
- 将WPS相关操作封装在services/wps目录
- 使用统一的错误处理机制
- 实现适当的加载状态提示
- 遵循WPS API的异步操作模式

### 用户体验
- 提供操作进度反馈
- 实现撤销功能支持
- 提供清晰的错误提示
- 保持WPS界面一致性

### Vue 组件开发
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

### NativeUI 组件使用
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

### 文件命名
- Vue 组件：PascalCase（如 `ContractExtractor.vue`）
- JS/TS 文件：camelCase（如 `configManager.js`）