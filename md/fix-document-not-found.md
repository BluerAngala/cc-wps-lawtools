# 解决部署后 "Document not found" 问题

## 问题现象
插件在本地开发环境正常，但部署到服务器后，点击功能按钮创建任务窗格时显示：
```json
{"error":"Document not found"}
```

## 根本原因分析

### 1. URL 构建问题
在 `wpsUtils.js` 的 `GetAppUrl` 函数中：

```javascript
function GetAppUrl(path = '/') {
  const baseUrl = GetUrlPath()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}/index.html#${normalizedPath}`
}
```

**问题**：
- 开发环境（file:// 协议）：URL 格式正确
- 生产环境（http/https 协议）：URL 可能不正确

### 2. 服务器部署路径问题
如果你的插件不是部署在服务器根目录，而是子目录（如 `/wps-plugin/`），那么：
- ❌ 错误：`https://yourdomain.com/index.html#/template`
- ✅ 正确：`https://yourdomain.com/wps-plugin/index.html#/template`

### 3. 文件路径问题
检查服务器上的文件结构：
```
your-server/
├── index.html          ← 必须存在
├── assets/
│   ├── index-xxx.js    ← 打包后的 JS
│   └── index-xxx.css   ← 打包后的 CSS
├── manifest.xml
├── ribbon.xml
└── images/
```

## 解决方案

### 方案 1：修改 `GetAppUrl` 函数（推荐）

修改 `src/services/wps/wpsUtils.js`：

```javascript
// 构建应用URL（支持Hash路由）
function GetAppUrl(path = '/') {
  const baseUrl = GetUrlPath()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  // 获取当前协议
  const protocol = window.location.protocol
  
  if (protocol === 'file:') {
    // 本地开发环境
    return `${baseUrl}/index.html#${normalizedPath}`
  } else {
    // 生产环境（http/https）
    // 直接使用 hash 路由，不需要显式指定 index.html
    return `${baseUrl}/#${normalizedPath}`
  }
}
```

### 方案 2：检查 Vite 构建配置

确保 `vite.config.js` 配置正确：

```javascript
export default defineConfig({
  base: './',  // 使用相对路径，适合任意部署位置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
```

### 方案 3：添加调试日志

在 `ribbon.js` 的 `OnAction` 函数中添加更详细的日志：

```javascript
case 'btnTemplateManager': {
  const url = Util.GetAppUrl('/template')
  console.log('=== 创建任务窗格调试信息 ===')
  console.log('当前协议:', window.location.protocol)
  console.log('当前主机:', window.location.host)
  console.log('基础路径:', Util.GetUrlPath())
  console.log('构建的URL:', url)
  console.log('===========================')
  
  const taskPane = Util.wpsService.createTaskPane(url, 'template', { width: 850 })
  if (!taskPane) {
    alert('任务窗格创建失败，请查看控制台日志')
  }
  break
}
```

## 检查清单

### 部署前检查
- [ ] 运行 `npm run build` 或 `npx wpsjs build` 构建项目
- [ ] 检查 `dist` 目录是否包含 `index.html`
- [ ] 检查 `dist` 目录是否包含 `manifest.xml` 和 `ribbon.xml`
- [ ] 检查 `dist/assets` 目录是否包含打包后的 JS/CSS 文件

### 服务器部署检查
- [ ] 确认所有文件已正确上传到服务器
- [ ] 确认文件权限正确（可读取）
- [ ] 确认服务器支持 Hash 路由（不需要特殊配置）
- [ ] 使用浏览器直接访问插件 URL，确认页面可以加载

### WPS 插件安装检查
- [ ] manifest.xml 中的 URL 指向正确的服务器地址
- [ ] WPS 中能看到插件图标
- [ ] 点击插件图标后功能区正常显示
- [ ] 按 F12 打开开发者工具查看错误信息

## 常见错误排查

### 错误 1: "Document not found"
**可能原因**：
1. URL 路径不正确
2. index.html 文件不存在或路径错误
3. 服务器配置问题

**解决**：
1. 打开浏览器开发者工具（F12）
2. 查看控制台输出的 URL
3. 手动在浏览器中访问该 URL，看是否能正常加载
4. 如果浏览器能访问但 WPS 不能，检查 manifest.xml 配置

### 错误 2: 白屏/空白页
**可能原因**：
1. JavaScript 文件加载失败
2. 路由配置错误
3. 资源路径错误（base 配置问题）

**解决**：
1. F12 查看 Network 标签，确认所有资源都加载成功
2. 检查 Console 是否有 JavaScript 错误
3. 确认 `vite.config.js` 中 `base: './'` 配置正确

### 错误 3: 404 Not Found
**可能原因**：
1. 文件上传不完整
2. 服务器路径配置错误

**解决**：
1. 重新上传所有文件
2. 检查服务器文件列表
3. 确认 manifest.xml 中的 URL 正确

## 推荐的部署流程

### 步骤 1: 构建项目
```bash
npm run build
# 或
npx wpsjs build
```

### 步骤 2: 检查构建产物
确认 `dist` 目录包含：
- index.html
- manifest.xml
- ribbon.xml
- assets/ (包含 JS/CSS)
- images/ (图标)

### 步骤 3: 上传到服务器
将 `dist` 目录的所有内容上传到服务器

### 步骤 4: 修改 manifest.xml
确保 `<Url>` 标签指向正确的服务器地址：
```xml
<Url>https://yourdomain.com/your-path/index.html</Url>
```

### 步骤 5: 安装测试
1. 在 WPS 中安装插件（使用服务器上的 manifest.xml）
2. 打开一个文档
3. 按 F12 打开开发者工具
4. 点击插件功能按钮
5. 查看控制台日志和网络请求

## 快速修复建议

立即修改 `src/services/wps/wpsUtils.js` 的 `GetAppUrl` 函数：

```javascript
function GetAppUrl(path = '/') {
  const baseUrl = GetUrlPath()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  // 调试日志
  console.log('[GetAppUrl] baseUrl:', baseUrl)
  console.log('[GetAppUrl] path:', path)
  console.log('[GetAppUrl] protocol:', window.location.protocol)
  
  // 根据协议选择不同的 URL 格式
  if (window.location.protocol === 'file:') {
    // 本地 file:// 协议
    const url = `${baseUrl}/index.html#${normalizedPath}`
    console.log('[GetAppUrl] file protocol URL:', url)
    return url
  } else {
    // http/https 协议
    const url = `${baseUrl}/#${normalizedPath}`
    console.log('[GetAppUrl] http protocol URL:', url)
    return url
  }
}
```

重新构建并部署后，通过控制台日志就能看到实际使用的 URL，从而快速定位问题。

