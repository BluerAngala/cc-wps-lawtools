# CacheManager GetFileList 错误修复

## 问题描述
在初始化 `CacheManager` 时，出现以下错误：
```
TypeError: fs.GetFileList is not a function
```

## 根本原因
WPS FileSystem API 不支持 `GetFileList()` 方法，无法直接列出目录中的文件。

## 解决方案
采用**懒清理策略**（Lazy Cleanup）替代批量清理：

### 修改前
- 在构造函数中调用 `cleanupExpiredCache()`
- 使用 `fs.GetFileList()` 遍历所有缓存文件
- 批量删除过期缓存

### 修改后
1. **移除初始化时的批量清理**
   - 构造函数不再调用 `cleanupExpiredCache()`
   - 避免使用不存在的 `GetFileList` API

2. **实现懒清理策略**
   - 在 `get()` 方法访问缓存时自动检查有效性
   - 发现过期缓存立即删除对应文件
   - 保持代码简洁高效

3. **优化 clear() 方法**
   - 只清空内存缓存
   - 文件系统缓存依赖懒清理

## 技术优势
- ✅ 避免使用不存在的 API
- ✅ 减少初始化开销
- ✅ 按需清理，更高效
- ✅ 代码更简洁易维护

## 相关文件
- `src/services/ai/CacheManager.js`

## 测试结果
- ✅ ESLint 检查通过
- ✅ 不再出现 `GetFileList` 错误
- ✅ 缓存功能正常工作

