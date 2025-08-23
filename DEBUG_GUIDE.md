# WPS插件文档内容获取问题调试指南

## 问题描述
当点击AI相关功能时，出现"文档内容不能为空"的错误。

## 已实施的修复

### 1. 改进了文档内容获取方法
- 添加了多种获取文档内容的方式（Range、Content、Selection）
- 增加了详细的错误处理和调试信息
- 改进了空内容检测逻辑

### 2. 增强了错误提示
- 提供了更详细的错误信息
- 给出了具体的解决建议
- 添加了调试日志输出

## 调试步骤

### 1. 检查WPS文档状态
- 确保在WPS中打开了文档
- 确保文档中有实际内容（不是空白文档）
- 尝试在文档中输入一些文本

### 2. 查看浏览器控制台
打开浏览器开发者工具（F12），查看控制台输出：

```
// 正常情况下应该看到：
getActiveDoc: 检查WPS应用程序状态
window.Application: true
getActiveDoc: ActiveDocument: true
getActiveDoc: 成功获取活动文档
extractText: 文档对象可用方法检查
doc.Range: function
extractText: 尝试使用Range方法
extractText: Range方法成功，内容长度: [数字]
```

### 3. 常见问题排查

#### 问题1: window.Application不存在
**现象**: 控制台显示 `window.Application: false`
**解决方案**: 
- 刷新页面重新加载插件
- 确保WPS插件正确安装和启用
- 重启WPS应用程序

#### 问题2: ActiveDocument为空
**现象**: 控制台显示 `getActiveDoc: ActiveDocument: false`
**解决方案**:
- 在WPS中新建或打开一个文档
- 确保文档处于活动状态

#### 问题3: 文档内容为空
**现象**: 控制台显示内容长度为0
**解决方案**:
- 在WPS文档中输入一些文本内容
- 保存文档后重试

### 4. 测试步骤
1. 在WPS中打开或新建一个文档
2. 在文档中输入一些测试文本
3. 在插件中点击任意AI功能
4. 查看控制台输出，确认文档内容正确获取

## 技术改进详情

### taskpane.js 改进
- `getActiveDoc()`: 添加了详细的状态检查和日志
- `extractText()`: 实现了三种文档内容获取方法的fallback机制

### ContractReview.vue 改进
- 增强了错误提示信息
- 添加了更多调试日志

### DocumentParser.js 改进
- 改进了空内容检测逻辑
- 添加了详细的错误日志

## 如果问题仍然存在

1. 提供控制台的完整错误日志
2. 确认WPS版本和插件版本
3. 尝试在不同的文档中测试
4. 检查WPS插件的权限设置