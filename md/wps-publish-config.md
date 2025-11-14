# WPS 加载项发布配置说明

## 概述

`wps-publish-config.json` 是项目本地的 WPS 加载项发布配置文件，用于管理你的加载项列表，避免受到 `node_modules` 中全局配置的影响。

## 配置文件结构

```json
{
  "addons": {
    "加载项名称": {
      "name": "加载项名称",
      "addonType": "wps",
      "online": "true",
      "multiUser": "false",
      "url": "https://example.com/wps-addon-build/",
      "customDomain": ""
    }
  }
}
```

### 字段说明

- **name**: 加载项名称（必须与 `package.json` 中的 `name` 一致）
- **addonType**: 加载项类型
  - `wps`: 文字
  - `et`: 电子表格
  - `wpp`: 演示
- **online**: 是否在线模式
  - `true`: 在线模式（需要部署到服务器）
  - `false`: 离线模式（打包成 .7z 文件）
- **multiUser**: 是否支持多用户
  - `true`: 支持多用户同时使用
  - `false`: 单用户模式
- **url**: 加载项 URL 地址
  - 在线模式：服务器地址，必须以 `/` 结尾
  - 离线模式：.7z 文件的完整 URL
- **version**: 版本号（仅离线模式需要）
- **customDomain**: 自定义域名（可选）

## 使用方法

### 1. 发布加载项

```bash
npm run wps:publish
```

这个命令会：
1. 读取 `wps-publish-config.json` 中的配置
2. 合并到 `wpsjs` 的配置中
3. 执行 `wpsjs publish` 发布加载项

### 2. 清理配置

```bash
npm run wps:publish:clean
```

这个命令会清理 `wpsjs` 的配置，只保留项目配置中的加载项。

### 3. 添加多个加载项

在 `wps-publish-config.json` 中添加多个加载项：

```json
{
  "addons": {
    "ch-law-ai-tools": {
      "name": "ch-law-ai-tools",
      "addonType": "wps",
      "online": "true",
      "multiUser": "false",
      "url": "https://cdn002.lawyerch.cn/public/wps/wps-addon-build/",
      "customDomain": ""
    },
    "另一个加载项": {
      "name": "另一个加载项",
      "addonType": "wps",
      "online": "true",
      "multiUser": "false",
      "url": "https://example.com/another-addon/",
      "customDomain": ""
    }
  }
}
```

## 工作流程

1. **配置管理**: 在项目根目录的 `wps-publish-config.json` 中管理所有加载项配置
2. **自动合并**: 执行 `npm run wps:publish` 时，会自动将项目配置合并到 `wpsjs` 的配置中
3. **发布**: `wpsjs publish` 会读取合并后的配置，生成 `wps-addon-publish/publish.html`
4. **清理**: 如果需要，可以执行 `npm run wps:publish:clean` 清理全局配置

## 注意事项

1. **配置文件位置**: `wps-publish-config.json` 应该提交到 Git，这样团队成员可以共享配置
2. **不要手动修改**: `wps-addon-publish/publish.html` 是自动生成的文件，不要手动修改
3. **URL 格式**: 在线模式的 URL 必须以 `/` 结尾
4. **版本控制**: 如果重新安装依赖，`node_modules/wpsjs/src/lib/publishlist.json` 可能会被重置，但项目配置不会受影响

## 示例

### 在线模式配置

```json
{
  "addons": {
    "ch-law-ai-tools": {
      "name": "ch-law-ai-tools",
      "addonType": "wps",
      "online": "true",
      "multiUser": "false",
      "url": "https://cdn002.lawyerch.cn/public/wps/wps-addon-build/",
      "customDomain": ""
    }
  }
}
```

### 离线模式配置

```json
{
  "addons": {
    "ch-law-ai-tools": {
      "name": "ch-law-ai-tools",
      "addonType": "wps",
      "online": "false",
      "multiUser": "false",
      "url": "https://cdn002.lawyerch.cn/public/wps/ch-law-ai-tools.7z",
      "version": "1.0.0",
      "customDomain": ""
    }
  }
}
```

