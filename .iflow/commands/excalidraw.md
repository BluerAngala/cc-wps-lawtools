---
description: 绘制流程图
---
## Your task

参考如下的规范，根据流程需求生成完整的excalidraw的 json 文件：

# 流程需求
{{args}}

# 复杂场景处理指引

当遇到以下复杂绘图需求时，应主动调用web-search工具获取相关信息：

## 何时使用web-search
1. **专业领域图表**：涉及特定行业、技术架构、业务流程等专业内容
2. **最新信息需求**：需要当前最新的技术栈、工具、标准流程等
3. **复杂系统设计**：微服务架构、云原生部署、数据处理管道等
4. **行业最佳实践**：需要了解当前行业标准做法、常见模式
5. **技术实现细节**：具体技术方案、工具选型、集成方式等

## 搜索策略
- 使用具体的技术关键词：如"microservices architecture diagram"、"CI/CD pipeline flow"
- 结合时间限定：添加"2024"、"latest"等时间词汇获取最新信息
- 搜索最佳实践：如"best practices"、"architecture patterns"、"workflow design"

## 信息整合
1. 从搜索结果中提取关键要素和流程步骤
2. 结合搜索到的架构模式优化图表结构
3. 参考业界标准完善节点命名和连接关系
4. 确保图表符合相关领域的专业规范

通过web-search获取的信息将帮助生成更准确、专业的流程图。

### 重要重要
如果遇到复杂的问题，你可以多次使用web-search获取不同维度的信息，保证信息收集的足够全面

# Excalidraw JSON 结构规范

## 基本结构
```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [...],
  "appState": {...},
  "files": {}
}
```

## 元素类型及必需属性

### 通用属性（所有元素必须包含）
- `id`: 唯一标识符（如 "6n7OOwjI_CTqgbqiFnEZu"）
- `type`: 元素类型（rectangle, ellipse, text, arrow等）
- `x`, `y`: 坐标位置
- `width`, `height`: 宽度和高度
- `angle`: 旋转角度（通常为0）
- `strokeColor`: 描边颜色（如 "#1e1e1e"）
- `backgroundColor`: 背景颜色（如 "#a5d8ff", "transparent"）
- `fillStyle`: 填充样式（"cross-hatch", "solid"等）
- `strokeWidth`: 描边宽度（1-4）
- `strokeStyle`: 描边样式（"solid", "dashed"等）
- `roughness`: 粗糙度（通常为1）
- `opacity`: 透明度（0-100）
- `groupIds`: 分组ID数组（通常为空[]）
- `frameId`: 框架ID（通常为null）
- `index`: 元素层级索引（如 "a6", "aB"）
- `roundness`: 圆角设置（如 {"type": 2} 或 null）
- `seed`: 随机种子数值
- `version`: 元素版本号
- `versionNonce`: 版本随机数
- `isDeleted`: 是否删除（false）
- `boundElements`: 绑定元素数组
- `updated`: 更新时间戳
- `link`: 链接（通常为null）
- `locked`: 是否锁定（false）

### 文本元素额外属性
- `text`: 文本内容
- `fontSize`: 字体大小（16-28）
- `fontFamily`: 字体系列（通常为5）
- `textAlign`: 文本对齐（"left", "center", "right"）
- `verticalAlign`: 垂直对齐（"top", "middle", "bottom"）
- `containerId`: 容器ID（文本在形状内时使用）
- `originalText`: 原始文本
- `autoResize`: 自动调整大小（true/false）
- `lineHeight`: 行高（通常为1.25）

### 箭头元素额外属性
- `points`: 箭头路径点数组
- `lastCommittedPoint`: 最后提交点（通常为null）
- `startBinding`: 起始绑定点
- `endBinding`: 结束绑定点
- `startArrowhead`: 起始箭头类型（null/"arrow"）
- `endArrowhead`: 结束箭头类型（null/"arrow"）

## 设计原则

- **层次清晰**：使⽤不同颜⾊和形状区分不同层级的信息
- **布局合理**：元素间距适当，整体布局美观
- **颜⾊搭配**：使⽤和谐的配⾊⽅案
- **图形元素**：适当使⽤矩形框、圆形、箭头等元素来组织信息
- **字体⼤⼩**：根据内容重要性设置合适的字体⼤⼩（16-28px）


## Excalidraw 图表类型整理指南
根据内容特性，选择合适的图表表达形式，以提升理解⼒与视觉吸引⼒。
- ⾃动化流程拆解
- 注册流程、⽤户路径
- 视频或课程制作流程

---
### 1. 流程图（Flowchart）
- **使⽤场景**：步骤说明、⼯作流程、任务执⾏顺序
- **做法**：⽤箭头连接各步骤，清晰表达流程⾛向
- **适合案例**：
---
### 2. 思维导图（Mind Map）
- **使⽤场景**：概念发散、主题分类、灵感捕捉
- **做法**：以中⼼为核⼼向外发散，放射状结构
- **适合案例**：
- 知识框架构建
- 提示词设计分类
- ⽂章写作思路整理
---
### 3. 层级图（Hierarchy Tree）
- **使⽤场景**：组织结构、内容分级、系统拆解
- **做法**：⾃上⽽下或⾃左⾄右构建层级节点
- **适合案例**：
- 企业架构图
- 项⽬分解结构（WBS）
- 课程章节层级整理
---
### 4. 关系图（Relationship Diagram）
- **使⽤场景**：要素之间的影响、依赖、互动关系
- **做法**：图形之间⽤连线表示关联，必要时添加箭头与说明⽂字
- **适合案例**：
- ⼯具之间的数据流关系
- 模块间协作路径
- ⽤户⻆⾊与权限关系图
---
### 5. ⾃由结构图（Freeform Layout）
- **使⽤场景**：内容零散、灵感记录、初步信息收集
- **做法**：⽆需结构限制，⾃由放置图块与箭头连接
- **适合案例**：
- 读书/⽂章随⼿笔记
- 视频⼤纲草图
- 未成形的创意草稿
---
### 6. 对⽐图（Comparison Diagram）
- **使⽤场景**：两种以上⽅案或观点的对照分析
- **做法**：常⻅结构为左右两栏或表格形式，标明⽐较维度
- **适合案例**：
- ChatGPT vs Claude
- 不同课程对⽐
- ⼯具选择指南
---
### 7. 时间线图（Timeline）
- **使⽤场景**：事件发展、项⽬进度、模型演化
- **做法**：以时间为横轴或纵轴，标出关键时间点与事件说明
- **适合案例**：
- AI 技术演变时间轴
- 项⽬开发节点
- 创作历程回顾
---
### 8. 矩阵图（Matrix Map）
- **使⽤场景**：双维度分类、任务优先级、定位分析
- **做法**：建⽴ X 与 Y 两个分类维度，在坐标平⾯中安置信息
- **适合案例**：
- 重要紧急四象限
- 产品定位矩阵
- 内容类型价值分析
---
### 9. 场景剧本图（Scenario Script）
- **使⽤场景**：⻆⾊⾏动与系统响应、⽤户路径演练
- **做法**：从⽤户⻆度出发，绘制“⻆⾊—操作—AI反应”顺序结构
- **适合案例**：
- AI ⼯具应⽤脚本
- Prompt 使⽤情境演示
- 服务体验流程设计
---
### 10. 图⽂混排笔记（Visual Notes）
- **使⽤场景**：说明性内容、教学图解、重点整理
- **做法**：组合插图、箭头、说明⽂字，以视觉导向清晰表达概念
- **适合案例**：
- 概念图解
- 技术说明图
- 课程重点摘要⻚


## 颜色推荐配置
- 蓝色系：`#a5d8ff`（浅蓝）
- 绿色系：`#b2f2bb`（浅绿）
- 黄色系：`#ffec99`（浅黄）
- 红色系：`#ffc9c9`（浅红）
- 描边色：`#1e1e1e`（深灰）

## 重要提醒
1. **必须生成完整的JSON文件**，包含所有必需属性
2. **元素ID必须唯一**，建议使用随机字符串
3. **坐标布局要合理**，避免元素重叠
4. **箭头连接要正确**，使用startBinding和endBinding
5. **文本容器绑定**，文本在形状内时设置containerId
6. **时间戳使用当前时间**，确保数据新鲜度

# 完整示例模板

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "rect1",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 80,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "cross-hatch",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a1",
      "roundness": {"type": 3},
      "seed": 1234567890,
      "version": 1,
      "versionNonce": 987654321,
      "isDeleted": false,
      "boundElements": [{"type": "text", "id": "text1"}],
      "updated": 1752222939315,
      "link": null,
      "locked": false
    },
    {
      "id": "text1", 
      "type": "text",
      "x": 180,
      "y": 130,
      "width": 40,
      "height": 35,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "cross-hatch",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a2",
      "roundness": null,
      "seed": 1234567891,
      "version": 1,
      "versionNonce": 987654322,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1752222939315,
      "link": null,
      "locked": false,
      "text": "步骤1",
      "fontSize": 28,
      "fontFamily": 5,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": "rect1",
      "originalText": "步骤1",
      "autoResize": true,
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": 20,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}

