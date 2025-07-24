# 陈恒律师的工具箱

## 项目简介

这是一个基于Vue开发的WPS加载项项目，集成了AI助理客服功能，为律师提供便捷的工具箱。

## 更新日志

### 2025年7月25日

- 新增-AI处理文本
- 新增-自动识别敏感信息并且脱敏
- 新增-一键重命名
- 新增-添加页眉

### 2025年7月23日

- 接入腾讯元宝AI助理客服
- 项目初始化

## 项目结构

- `src/components/` - Vue组件目录
  - `TaskPane.vue` - 任务窗格主界面
  - `Dialog.vue` - 对话框界面
  - `Root.vue` - 默认页面
  - `ribbon.js` - 功能区按钮逻辑
- `public/` - 静态资源目录
  - `ribbon.xml` - 功能区配置文件
- `manifest.xml` - 插件配置文件

## 运行逻辑

1. WPS加载插件时，会读取 `manifest.xml`配置文件
2. 根据 `ribbon.xml`配置创建功能区按钮
3. 点击功能区按钮时，调用 `ribbon.js`中对应的方法
4. 任务窗格通过Vue路由加载 `TaskPane.vue`组件
5. 任务窗格中的按钮通过 `taskpane.js`处理具体业务逻辑

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

1. 在 `src/components/TaskPane.vue`的模板中添加按钮：

   ```html
   <button style="margin: 3px" @click="onbuttonclick('newFeature')">新功能</button>
   ```
2. 在 `src/components/js/taskpane.js`的onbuttonclick函数中添加对应的case处理：

   ```javascript
   case 'newFeature': {
     // 实现具体功能逻辑
     break;
   }
   ```

### 构建和部署

1. 开发调试：`npm run dev`
2. 构建发布：`npm run build`
3. 构建后的文件在 `wps-addon-build`目录中
