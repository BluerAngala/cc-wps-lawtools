# 合同批量处理器 - Tauri + Vue3 桌面应用设计方案

## 1. 项目概述

### 1.1 背景与目标

当前 WPS 加载项存在沙箱限制，无法直接访问本地文件系统进行大批量合同文件处理。本项目旨在开发一个独立的桌面应用程序，通过 WPS OLE/COM 自动化技术，实现对本地合同文件的批量处理。

**核心目标：**
- 批量扫描本地文件夹中的合同文件
- 通过 OLE 自动化调用 WPS 打开文档
- 执行合同审查工作流（AI 分析、信息提取、批注添加等）
- 生成处理报告和统计信息

### 1.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | **Tauri** | Rust 核心，包体积小 (~5MB)，性能优秀 |
| 前端框架 | **Vue 3** + TypeScript | 响应式 UI，组件化开发 |
| UI 组件库 | **Naive UI** | 与现有 WPS 加载项项目保持一致 |
| 样式方案 | **UnoCSS** | 原子化 CSS，与现有项目一致 |
| WPS 通信 | **OLE/COM** | Windows COM 接口调用 WPS |
| 后端逻辑 | **Rust** (Tauri Command) | 文件扫描、WPS 控制、任务调度 |

### 1.3 架构对比

```
现有方案 (WPS 加载项)                    新方案 (Tauri 桌面应用)
┌─────────────────────┐                 ┌─────────────────────────────┐
│   浏览器/WPS 沙箱    │                 │   Tauri + Vue3 桌面应用      │
│   (无法访问本地文件)  │                 │   (完整文件系统访问权限)      │
└──────────┬──────────┘                 └──────────────┬──────────────┘
           │                                           │
           ▼                                           ▼
┌─────────────────────┐                 ┌─────────────────────────────┐
│   WPS JSAPI 加载项   │                 │   Rust Backend (Tauri)      │
│   (受限的文档操作)    │                 │   - 文件扫描                 │
│                     │                 │   - 任务队列管理              │
│                     │                 │   - WPS OLE 调用             │
└─────────────────────┘                 └──────────────┬──────────────┘
                                                       │
                                                       ▼
                                          ┌─────────────────────────────┐
                                          │   WPS 文字 (Kwps.Application)│
                                          │   - 文档打开/保存            │
                                          │   - 内容读取/修改            │
                                          │   - 批注/页眉操作            │
                                          └─────────────────────────────┘
```

---

## 2. 项目结构

```
wps-batch-processor/
├── src/                          # Vue3 前端源码
│   ├── components/               # 通用组件
│   │   ├── FileList.vue          # 文件列表展示
│   │   ├── TaskQueue.vue         # 任务队列状态
│   │   ├── ProgressBar.vue       # 进度条组件
│   │   └── LogViewer.vue         # 日志查看器
│   ├── views/                    # 页面视图
│   │   ├── Dashboard.vue         # 主控制台
│   │   ├── BatchConfig.vue       # 批量处理配置
│   │   ├── Processing.vue        # 处理中页面
│   │   └── Report.vue            # 处理报告
│   ├── stores/                   # Pinia 状态管理
│   │   ├── batchStore.ts         # 批量任务状态
│   │   └── configStore.ts        # 用户配置
│   ├── composables/              # 组合式函数
│   │   ├── useWpsOle.ts          # WPS OLE 操作封装
│   │   ├── useFileScanner.ts     # 文件扫描逻辑
│   │   └── useTaskProcessor.ts   # 任务处理逻辑
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── src-tauri/                    # Rust 后端源码
│   ├── src/
│   │   ├── main.rs               # 程序入口
│   │   ├── lib.rs
│   │   ├── commands/             # Tauri Commands
│   │   │   ├── mod.rs
│   │   │   ├── file_commands.rs  # 文件操作命令
│   │   │   ├── wps_commands.rs   # WPS OLE 命令
│   │   │   └── task_commands.rs  # 任务管理命令
│   │   ├── services/             # 业务服务层
│   │   │   ├── mod.rs
│   │   │   ├── file_scanner.rs   # 文件扫描服务
│   │   │   ├── wps_ole.rs        # WPS OLE 封装
│   │   │   ├── task_scheduler.rs # 任务调度器
│   │   │   └── contract_processor.rs # 合同处理逻辑
│   │   └── models/               # 数据模型
│   │       ├── mod.rs
│   │       ├── file_item.rs
│   │       ├── task.rs
│   │       └── config.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── scripts/                      # 工具脚本
│   └── test_wps_ole.ps1          # WPS OLE 测试脚本
├── docs/                         # 文档
│   └── api.md                    # API 文档
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── uno.config.ts                 # UnoCSS 配置
└── README.md
```

---

## 3. 核心模块设计

### 3.1 WPS OLE 封装模块 (Rust)

```rust
// src-tauri/src/services/wps_ole.rs

use windows::Win32::System::Com::{CoCreateInstance, CLSCTX_LOCAL_SERVER};
use windows::Win32::System::Variant::VARIANT;

/// WPS 文字应用程序封装
pub struct WpsApplication {
    app: IDispatch,
}

impl WpsApplication {
    /// 创建 WPS 应用程序实例
    pub fn new() -> Result<Self, WpsError> {
        // 通过 COM 创建 Kwps.Application
        let app = unsafe {
            CoCreateInstance(
                &CLSID_KWPS_APPLICATION,
                None,
                CLSCTX_LOCAL_SERVER,
            )?
        };
        Ok(Self { app })
    }

    /// 设置可见性
    pub fn set_visible(&self, visible: bool) -> Result<(), WpsError> {
        // 调用 app.Visible = visible
        self.set_property("Visible", visible.into())
    }

    /// 打开文档
    pub fn open_document(&self, path: &str) -> Result<WpsDocument, WpsError> {
        let docs = self.get_property("Documents")?;
        let doc = docs.call_method("Open", &[path.into()])?;
        Ok(WpsDocument::new(doc))
    }

    /// 新建文档
    pub fn add_document(&self) -> Result<WpsDocument, WpsError> {
        let docs = self.get_property("Documents")?;
        let doc = docs.call_method("Add", &[])?;
        Ok(WpsDocument::new(doc))
    }

    /// 退出 WPS
    pub fn quit(&self) -> Result<(), WpsError> {
        self.call_method("Quit", &[])?;
        Ok(())
    }
}

/// WPS 文档封装
pub struct WpsDocument {
    doc: IDispatch,
}

impl WpsDocument {
    /// 获取文档内容文本
    pub fn get_text(&self) -> Result<String, WpsError> {
        let content = self.get_property("Content")?;
        let text = content.get_property("Text")?;
        text.to_string()
    }

    /// 写入页眉
    pub fn set_header(&self, text: &str) -> Result<(), WpsError> {
        let sections = self.get_property("Sections")?;
        let section = sections.get_item(1)?;
        let headers = section.get_property("Headers")?;
        let header = headers.get_item(1)?;
        header.set_property("Text", text.into())
    }

    /// 添加批注
    pub fn add_comment(&self, range: &Range, text: &str) -> Result<(), WpsError> {
        let comments = self.get_property("Comments")?;
        comments.call_method("Add", &[range.into(), text.into()])?;
        Ok(())
    }

    /// 保存文档
    pub fn save(&self) -> Result<(), WpsError> {
        self.call_method("Save", &[])?;
        Ok(())
    }

    /// 另存为
    pub fn save_as(&self, path: &str, format: SaveFormat) -> Result<(), WpsError> {
        self.call_method("SaveAs2", &[path.into(), (format as i32).into()])?;
        Ok(())
    }

    /// 关闭文档
    pub fn close(&self) -> Result<(), WpsError> {
        self.call_method("Close", &[])?;
        Ok(())
    }
}

/// 保存格式枚举
#[repr(i32)]
pub enum SaveFormat {
    Docx = 16,
    Doc = 0,
    Pdf = 17,
}
```

### 3.2 文件扫描服务 (Rust)

```rust
// src-tauri/src/services/file_scanner.rs

use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// 文件扫描器
pub struct FileScanner {
    extensions: Vec<String>,
    recursive: bool,
}

impl FileScanner {
    pub fn new(extensions: Vec<String>, recursive: bool) -> Self {
        Self {
            extensions,
            recursive,
        }
    }

    /// 扫描文件夹
    pub fn scan(&self, folder_path: &str) -> Result<Vec<FileItem>, ScanError> {
        let path = Path::new(folder_path);
        
        if !path.exists() {
            return Err(ScanError::PathNotFound(folder_path.to_string()));
        }

        let mut files = Vec::new();
        
        let walker = if self.recursive {
            WalkDir::new(path)
        } else {
            WalkDir::new(path).max_depth(1)
        };

        for entry in walker.into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext = ext.to_string_lossy().to_lowercase();
                    if self.extensions.iter().any(|e| e.to_lowercase() == ext) {
                        files.push(FileItem::from_path(path)?);
                    }
                }
            }
        }

        Ok(files)
    }
}

/// 文件项
#[derive(Debug, Clone, serde::Serialize)]
pub struct FileItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size: u64,
    pub modified_time: Option<String>,
}

impl FileItem {
    pub fn from_path(path: &Path) -> Result<Self, ScanError> {
        let metadata = std::fs::metadata(path)?;
        
        Ok(Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: path.file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default(),
            path: path.to_string_lossy().to_string(),
            extension: path.extension()
                .map(|e| e.to_string_lossy().to_string())
                .unwrap_or_default(),
            size: metadata.len(),
            modified_time: metadata.modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs().to_string()),
        })
    }
}
```

### 3.3 任务调度器 (Rust)

```rust
// src-tauri/src/services/task_scheduler.rs

use std::sync::Arc;
use tokio::sync::{mpsc, Mutex, RwLock};
use tokio::time::{sleep, Duration};

/// 任务状态
#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize)]
pub enum TaskStatus {
    Pending,
    Processing,
    Success,
    Failed,
    Cancelled,
}

/// 批量任务
#[derive(Debug, Clone, serde::Serialize)]
pub struct BatchTask {
    pub id: String,
    pub file_item: FileItem,
    pub status: TaskStatus,
    pub progress: f32,
    pub message: Option<String>,
    pub result: Option<ProcessResult>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

/// 处理结果
#[derive(Debug, Clone, serde::Serialize)]
pub struct ProcessResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub extracted_info: Option<serde_json::Value>,
    pub error_message: Option<String>,
}

/// 任务调度器
pub struct TaskScheduler {
    tasks: Arc<RwLock<Vec<BatchTask>>>,
    is_running: Arc<Mutex<bool>>,
    should_stop: Arc<Mutex<bool>>,
    config: Arc<RwLock<ProcessConfig>>,
    event_sender: mpsc::Sender<TaskEvent>,
}

impl TaskScheduler {
    pub fn new(event_sender: mpsc::Sender<TaskEvent>) -> Self {
        Self {
            tasks: Arc::new(RwLock::new(Vec::new())),
            is_running: Arc::new(Mutex::new(false)),
            should_stop: Arc::new(Mutex::new(false)),
            config: Arc::new(RwLock::new(ProcessConfig::default())),
            event_sender,
        }
    }

    /// 添加任务队列
    pub async fn set_tasks(&self, files: Vec<FileItem>) {
        let mut tasks = self.tasks.write().await;
        *tasks = files.into_iter().map(|f| BatchTask {
            id: uuid::Uuid::new_v4().to_string(),
            file_item: f,
            status: TaskStatus::Pending,
            progress: 0.0,
            message: None,
            result: None,
            start_time: None,
            end_time: None,
        }).collect();
    }

    /// 开始处理
    pub async fn start(&self) -> Result<(), SchedulerError> {
        let mut is_running = self.is_running.lock().await;
        if *is_running {
            return Err(SchedulerError::AlreadyRunning);
        }
        *is_running = true;
        drop(is_running);

        // 重置停止标志
        let mut should_stop = self.should_stop.lock().await;
        *should_stop = false;
        drop(should_stop);

        // 启动处理循环
        let tasks = self.tasks.clone();
        let should_stop = self.should_stop.clone();
        let config = self.config.clone();
        let event_sender = self.event_sender.clone();

        tokio::spawn(async move {
            Self::process_loop(tasks, should_stop, config, event_sender).await;
        });

        Ok(())
    }

    /// 停止处理
    pub async fn stop(&self) {
        let mut should_stop = self.should_stop.lock().await;
        *should_stop = true;
    }

    /// 处理循环
    async fn process_loop(
        tasks: Arc<RwLock<Vec<BatchTask>>>,
        should_stop: Arc<Mutex<bool>>,
        config: Arc<RwLock<ProcessConfig>>,
        event_sender: mpsc::Sender<TaskEvent>,
    ) {
        let config = config.read().await.clone();
        
        // 创建 WPS 实例
        let wps = match WpsApplication::new() {
            Ok(w) => {
                let _ = w.set_visible(config.show_wps_window);
                w
            }
            Err(e) => {
                let _ = event_sender.send(TaskEvent::Error(e.to_string())).await;
                return;
            }
        };

        let task_count = tasks.read().await.len();
        
        for i in 0..task_count {
            // 检查是否停止
            if *should_stop.lock().await {
                break;
            }

            // 获取当前任务
            let task_id = {
                let tasks = tasks.read().await;
                if i < tasks.len() {
                    tasks[i].id.clone()
                } else {
                    break;
                }
            };

            // 更新任务状态为处理中
            {
                let mut tasks = tasks.write().await;
                if let Some(task) = tasks.iter_mut().find(|t| t.id == task_id) {
                    task.status = TaskStatus::Processing;
                    task.start_time = Some(chrono::Local::now().to_rfc3339());
                }
            }

            let _ = event_sender.send(TaskEvent::TaskStarted(task_id.clone())).await;

            // 执行处理
            let result = Self::process_single_task(
                &wps,
                &tasks,
                &task_id,
                &config,
                &event_sender,
            ).await;

            // 更新任务结果
            {
                let mut tasks = tasks.write().await;
                if let Some(task) = tasks.iter_mut().find(|t| t.id == task_id) {
                    task.status = match result {
                        Ok(_) => TaskStatus::Success,
                        Err(_) => TaskStatus::Failed,
                    };
                    task.result = Some(result.unwrap_or_else(|e| ProcessResult {
                        success: false,
                        output_path: None,
                        extracted_info: None,
                        error_message: Some(e.to_string()),
                    }));
                    task.end_time = Some(chrono::Local::now().to_rfc3339());
                    task.progress = 100.0;
                }
            }

            let _ = event_sender.send(TaskEvent::TaskCompleted(task_id)).await;

            // 任务间延迟
            sleep(Duration::from_millis(config.delay_between_tasks)).await;
        }

        // 关闭 WPS
        let _ = wps.quit();

        // 标记完成
        let _ = event_sender.send(TaskEvent::AllCompleted).await;
        
        let mut is_running = tasks.read().await;
        // 注意：这里需要另一个锁来更新 is_running
    }

    /// 处理单个任务
    async fn process_single_task(
        wps: &WpsApplication,
        tasks: &Arc<RwLock<Vec<BatchTask>>>,
        task_id: &str,
        config: &ProcessConfig,
        event_sender: &mpsc::Sender<TaskEvent>,
    ) -> Result<ProcessResult, ProcessError> {
        // 获取文件路径
        let file_path = {
            let tasks = tasks.read().await;
            tasks.iter()
                .find(|t| t.id == task_id)
                .map(|t| t.file_item.path.clone())
                .ok_or(ProcessError::TaskNotFound)?
        };

        // 打开文档
        let doc = wps.open_document(&file_path)?;
        
        // 发送进度更新
        let _ = event_sender.send(TaskEvent::ProgressUpdate {
            task_id: task_id.to_string(),
            progress: 20.0,
            message: "文档已打开".to_string(),
        }).await;

        // 读取内容
        let content = doc.get_text()?;
        
        let _ = event_sender.send(TaskEvent::ProgressUpdate {
            task_id: task_id.to_string(),
            progress: 40.0,
            message: "内容已读取".to_string(),
        }).await;

        // TODO: 调用 AI 服务进行合同审查
        // let analysis_result = call_ai_service(&content).await?;

        // 模拟处理延迟
        sleep(Duration::from_millis(1000)).await;

        let _ = event_sender.send(TaskEvent::ProgressUpdate {
            task_id: task_id.to_string(),
            progress: 60.0,
            message: "AI 分析完成".to_string(),
        }).await;

        // 写入页眉（如果需要）
        if config.add_header {
            doc.set_header(&format!("合同编号: {}", task_id))?;
        }

        // 添加批注（如果需要）
        if config.add_comments {
            // doc.add_comment(...)?;
        }

        let _ = event_sender.send(TaskEvent::ProgressUpdate {
            task_id: task_id.to_string(),
            progress: 80.0,
            message: "批注已添加".to_string(),
        }).await;

        // 保存文档
        if config.save_after_process {
            doc.save()?;
        }

        doc.close()?;

        let _ = event_sender.send(TaskEvent::ProgressUpdate {
            task_id: task_id.to_string(),
            progress: 100.0,
            message: "处理完成".to_string(),
        }).await;

        Ok(ProcessResult {
            success: true,
            output_path: Some(file_path),
            extracted_info: None, // TODO: 填充 AI 分析结果
            error_message: None,
        })
    }
}

/// 处理配置
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProcessConfig {
    pub show_wps_window: bool,
    pub delay_between_tasks: u64,
    pub add_header: bool,
    pub add_comments: bool,
    pub save_after_process: bool,
    pub output_folder: Option<String>,
}

impl Default for ProcessConfig {
    fn default() -> Self {
        Self {
            show_wps_window: true,
            delay_between_tasks: 2000,
            add_header: true,
            add_comments: true,
            save_after_process: true,
            output_folder: None,
        }
    }
}

/// 任务事件
#[derive(Debug, Clone)]
pub enum TaskEvent {
    TaskStarted(String),
    TaskCompleted(String),
    ProgressUpdate { task_id: String, progress: f32, message: String },
    AllCompleted,
    Error(String),
}
```

---

## 4. Tauri Commands 设计

```rust
// src-tauri/src/commands/mod.rs

pub mod file_commands;
pub mod wps_commands;
pub mod task_commands;

// src-tauri/src/commands/file_commands.rs

use tauri::State;
use crate::services::file_scanner::{FileScanner, FileItem};
use crate::AppState;

/// 扫描文件夹
#[tauri::command]
pub async fn scan_folder(
    path: String,
    extensions: Vec<String>,
    recursive: bool,
) -> Result<Vec<FileItem>, String> {
    let scanner = FileScanner::new(extensions, recursive);
    scanner.scan(&path).map_err(|e| e.to_string())
}

/// 选择文件夹对话框
#[tauri::command]
pub async fn select_folder_dialog() -> Result<Option<String>, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    // 使用 Tauri 的对话框 API
    // 注意：需要在主线程执行
    todo!("Implement folder selection dialog")
}

// src-tauri/src/commands/wps_commands.rs

/// 测试 WPS OLE 连接
#[tauri::command]
pub async fn test_wps_connection() -> Result<WpsInfo, String> {
    let wps = WpsApplication::new().map_err(|e| e.to_string())?;
    
    Ok(WpsInfo {
        version: wps.get_version().map_err(|e| e.to_string())?,
        name: wps.get_name().map_err(|e| e.to_string())?,
    })
}

#[derive(Debug, serde::Serialize)]
pub struct WpsInfo {
    pub version: String,
    pub name: String,
}

// src-tauri/src/commands/task_commands.rs

use crate::services::task_scheduler::{TaskScheduler, BatchTask, ProcessConfig};

/// 设置任务队列
#[tauri::command]
pub async fn set_task_queue(
    state: State<'_, AppState>,
    files: Vec<FileItem>,
) -> Result<(), String> {
    let scheduler = state.task_scheduler.lock().await;
    scheduler.set_tasks(files).await;
    Ok(())
}

/// 开始批量处理
#[tauri::command]
pub async fn start_batch_processing(
    state: State<'_, AppState>,
    config: ProcessConfig,
) -> Result<(), String> {
    let scheduler = state.task_scheduler.lock().await;
    scheduler.start().await.map_err(|e| e.to_string())
}

/// 停止处理
#[tauri::command]
pub async fn stop_batch_processing(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let scheduler = state.task_scheduler.lock().await;
    scheduler.stop().await;
    Ok(())
}

/// 获取任务状态
#[tauri::command]
pub async fn get_task_status(
    state: State<'_, AppState>,
) -> Result<Vec<BatchTask>, String> {
    let scheduler = state.task_scheduler.lock().await;
    scheduler.get_tasks().await.map_err(|e| e.to_string())
}
```

---

## 5. 前端 Vue3 组件设计

### 5.1 主控制台页面

```vue
<!-- src/views/Dashboard.vue -->
<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
          WPS
        </div>
        <h1 class="text-xl font-semibold text-gray-800">合同批量处理器</h1>
      </div>
      <div class="flex items-center gap-4">
        <n-tag :type="wpsStatus.type">{{ wpsStatus.text }}</n-tag>
        <n-button @click="showSettings = true">
          <template #icon><SettingsIcon /></template>
          设置
        </n-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 flex overflow-hidden">
      <!-- 左侧：文件选择 -->
      <div class="w-1/3 bg-white border-r p-6 flex flex-col">
        <h2 class="text-lg font-medium mb-4">选择合同文件夹</h2>
        
        <n-input-group class="mb-4">
          <n-input
            v-model:value="folderPath"
            placeholder="选择或输入文件夹路径"
            readonly
          />
          <n-button type="primary" @click="selectFolder">
            浏览
          </n-button>
        </n-input-group>

        <n-form-item label="文件类型">
          <n-checkbox-group v-model:value="selectedExtensions">
            <n-checkbox value="docx">.docx</n-checkbox>
            <n-checkbox value="doc">.doc</n-checkbox>
            <n-checkbox value="wps">.wps</n-checkbox>
          </n-checkbox-group>
        </n-form-item>

        <n-form-item label="扫描选项">
          <n-checkbox v-model:checked="recursive">包含子文件夹</n-checkbox>
        </n-form-item>

        <n-button 
          type="primary" 
          size="large" 
          :disabled="!folderPath"
          :loading="scanning"
          @click="scanFiles"
          class="mt-auto"
        >
          <template #icon><SearchIcon /></template>
          扫描文件
        </n-button>
      </div>

      <!-- 中间：文件列表 -->
      <div class="w-1/3 bg-white border-r flex flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-medium">待处理文件 ({{ fileList.length }})</h3>
          <n-space>
            <n-button size="small" @click="selectAll">全选</n-button>
            <n-button size="small" @click="clearSelection">清空</n-button>
          </n-space>
        </div>
        
        <div class="flex-1 overflow-auto p-4">
          <n-empty v-if="fileList.length === 0" description="暂无文件" />
          <n-list v-else>
            <n-list-item v-for="file in fileList" :key="file.id">
              <n-thing>
                <template #header>
                  <n-checkbox v-model:checked="file.selected">
                    {{ file.name }}
                  </n-checkbox>
                </template>
                <template #description>
                  <n-text depth="3" class="text-xs">{{ file.path }}</n-text>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </div>
      </div>

      <!-- 右侧：处理配置 -->
      <div class="w-1/3 bg-white p-6 flex flex-col">
        <h2 class="text-lg font-medium mb-4">处理配置</h2>
        
        <n-form label-placement="left" label-width="auto">
          <n-form-item label="工作流">
            <n-select v-model:value="config.workflow" :options="workflowOptions" />
          </n-form-item>

          <n-form-item label="显示 WPS 窗口">
            <n-switch v-model:value="config.showWpsWindow" />
          </n-form-item>

          <n-form-item label="任务间延迟">
            <n-slider v-model:value="config.delay" :min="1000" :max="10000" :step="500" />
            <n-text depth="3" class="text-xs">{{ config.delay }}ms</n-text>
          </n-form-item>

          <n-form-item label="添加页眉">
            <n-switch v-model:value="config.addHeader" />
          </n-form-item>

          <n-form-item label="添加批注">
            <n-switch v-model:value="config.addComments" />
          </n-form-item>

          <n-form-item label="关键词配置">
            <n-dynamic-input
              v-model:value="config.keywords"
              placeholder="输入需要标注的关键词"
            />
          </n-form-item>
        </n-form>

        <n-button
          type="primary"
          size="large"
          :disabled="selectedFiles.length === 0 || processing"
          :loading="processing"
          @click="startProcessing"
          class="mt-auto"
        >
          <template #icon><PlayIcon /></template>
          开始批量处理 ({{ selectedFiles.length }})
        </n-button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import type { FileItem, ProcessConfig } from '@/types'

const router = useRouter()

// 状态
const folderPath = ref('')
const scanning = ref(false)
const fileList = ref<(FileItem & { selected: boolean })[]>([])
const selectedExtensions = ref(['docx', 'doc'])
const recursive = ref(true)
const processing = ref(false)
const wpsStatus = ref({ type: 'default' as const, text: '未连接' })

const config = ref<ProcessConfig>({
  workflow: 'standard',
  showWpsWindow: true,
  delay: 2000,
  addHeader: true,
  addComments: true,
  keywords: [],
})

const workflowOptions = [
  { label: '合同标准化处理', value: 'standard' },
  { label: '仅提取信息', value: 'extract' },
  { label: '仅添加批注', value: 'comment' },
]

// 计算属性
const selectedFiles = computed(() => 
  fileList.value.filter(f => f.selected)
)

// 方法
async function selectFolder() {
  const selected = await open({
    directory: true,
    multiple: false,
  })
  if (selected && typeof selected === 'string') {
    folderPath.value = selected
  }
}

async function scanFiles() {
  if (!folderPath.value) return
  
  scanning.value = true
  try {
    const files = await invoke<FileItem[]>('scan_folder', {
      path: folderPath.value,
      extensions: selectedExtensions.value.map(e => `.${e}`),
      recursive: recursive.value,
    })
    fileList.value = files.map(f => ({ ...f, selected: true }))
  } catch (error) {
    console.error('扫描失败:', error)
  } finally {
    scanning.value = false
  }
}

async function startProcessing() {
  if (selectedFiles.value.length === 0) return
  
  processing.value = true
  try {
    // 设置任务队列
    await invoke('set_task_queue', {
      files: selectedFiles.value,
    })
    
    // 跳转到处理页面
    router.push('/processing')
  } catch (error) {
    console.error('启动失败:', error)
    processing.value = false
  }
}

function selectAll() {
  fileList.value.forEach(f => f.selected = true)
}

function clearSelection() {
  fileList.value.forEach(f => f.selected = false)
}

// 检查 WPS 连接
async function checkWpsConnection() {
  try {
    const info = await invoke<{ version: string; name: string }>('test_wps_connection')
    wpsStatus.value = { type: 'success', text: `${info.name} ${info.version}` }
  } catch {
    wpsStatus.value = { type: 'error', text: 'WPS 未安装或不可用' }
  }
}

checkWpsConnection()
</script>
```

### 5.2 处理中页面

```vue
<!-- src/views/Processing.vue -->
<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <header class="bg-white shadow-sm px-6 py-4">
      <n-page-header title="批量处理中" @back="$router.back()" />
    </header>

    <main class="flex-1 p-6 overflow-auto">
      <!-- 总体进度 -->
      <n-card class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-medium">总体进度</h2>
            <n-text depth="3">
              已完成 {{ completedCount }} / {{ totalCount }}
            </n-text>
          </div>
          <n-space>
            <n-button @click="pauseProcessing" v-if="!paused">暂停</n-button>
            <n-button @click="resumeProcessing" v-else>继续</n-button>
            <n-button type="error" @click="stopProcessing">停止</n-button>
          </n-space>
        </div>
        <n-progress 
          type="line" 
          :percentage="overallProgress" 
          :indicator-placement="'inside'"
          :height="24"
          :border-radius="4"
        />
      </n-card>

      <!-- 任务列表 -->
      <n-card title="任务队列">
        <n-list>
          <n-list-item v-for="task in tasks" :key="task.id">
            <n-thing>
              <template #header>
                <n-space align="center">
                  <n-tag :type="getStatusType(task.status)">
                    {{ getStatusText(task.status) }}
                  </n-tag>
                  <span class="font-medium">{{ task.file_item.name }}</span>
                </n-space>
              </template>
              <template #description>
                <n-text depth="3" class="text-xs">{{ task.file_item.path }}</n-text>
                <n-text v-if="task.message" depth="2" class="text-sm mt-1">
                  {{ task.message }}
                </n-text>
              </template>
              <template #header-extra>
                <n-progress 
                  type="circle" 
                  :percentage="Math.round(task.progress)" 
                  :size="40"
                />
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </n-card>
    </main>

    <!-- 日志面板 -->
    <div class="h-48 bg-gray-900 text-green-400 font-mono text-sm p-4 overflow-auto">
      <div v-for="(log, index) in logs" :key="index" class="mb-1">
        <span class="text-gray-500">[{{ log.time }}]</span>
        <span :class="log.level">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { BatchTask, TaskStatus } from '@/types'

const tasks = ref<BatchTask[]>([])
const logs = ref<{ time: string; level: string; message: string }[]>([])
const paused = ref(false)
let unlisten: UnlistenFn | null = null

const totalCount = computed(() => tasks.value.length)
const completedCount = computed(() => 
  tasks.value.filter(t => t.status === 'Success' || t.status === 'Failed').length
)
const overallProgress = computed(() => 
  totalCount.value > 0 ? (completedCount.value / totalCount.value) * 100 : 0
)

function getStatusType(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    Pending: 'default',
    Processing: 'warning',
    Success: 'success',
    Failed: 'error',
    Cancelled: 'default',
  }
  return map[status]
}

function getStatusText(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    Pending: '待处理',
    Processing: '处理中',
    Success: '成功',
    Failed: '失败',
    Cancelled: '已取消',
  }
  return map[status]
}

async function loadTasks() {
  try {
    tasks.value = await invoke('get_task_status')
  } catch (error) {
    console.error('获取任务状态失败:', error)
  }
}

async function stopProcessing() {
  await invoke('stop_batch_processing')
}

function addLog(message: string, level = 'info') {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    level,
    message,
  })
}

onMounted(async () => {
  // 加载初始任务状态
  await loadTasks()
  
  // 监听任务事件
  unlisten = await listen('task-event', (event) => {
    const payload = event.payload as any
    
    switch (payload.type) {
      case 'TaskStarted':
        addLog(`开始处理: ${payload.taskId}`)
        break
      case 'TaskCompleted':
        addLog(`处理完成: ${payload.taskId}`)
        break
      case 'ProgressUpdate':
        const task = tasks.value.find(t => t.id === payload.taskId)
        if (task) {
          task.progress = payload.progress
          task.message = payload.message
        }
        break
      case 'AllCompleted':
        addLog('所有任务处理完成！', 'success')
        break
      case 'Error':
        addLog(`错误: ${payload.message}`, 'error')
        break
    }
    
    // 刷新任务状态
    loadTasks()
  })
  
  // 启动处理
  try {
    await invoke('start_batch_processing', {
      config: {
        showWpsWindow: true,
        delayBetweenTasks: 2000,
        addHeader: true,
        addComments: true,
        saveAfterProcess: true,
      },
    })
  } catch (error) {
    addLog(`启动失败: ${error}`, 'error')
  }
})

onUnmounted(() => {
  if (unlisten) unlisten()
})
</script>
```

---

## 6. 类型定义

```typescript
// src/types/index.ts

/** 文件项 */
export interface FileItem {
  id: string
  name: string
  path: string
  extension: string
  size: number
  modifiedTime?: string
}

/** 任务状态 */
export type TaskStatus = 'Pending' | 'Processing' | 'Success' | 'Failed' | 'Cancelled'

/** 处理结果 */
export interface ProcessResult {
  success: boolean
  outputPath?: string
  extractedInfo?: Record<string, any>
  errorMessage?: string
}

/** 批量任务 */
export interface BatchTask {
  id: string
  fileItem: FileItem
  status: TaskStatus
  progress: number
  message?: string
  result?: ProcessResult
  startTime?: string
  endTime?: string
}

/** 处理配置 */
export interface ProcessConfig {
  workflow: string
  showWpsWindow: boolean
  delay: number
  addHeader: boolean
  addComments: boolean
  keywords: string[]
}

/** WPS 信息 */
export interface WpsInfo {
  version: string
  name: string
}
```

---

## 7. 项目初始化脚本

```powershell
# scripts/init-project.ps1
# Tauri + Vue3 项目初始化脚本

Write-Host "=== 合同批量处理器 - 项目初始化 ===" -ForegroundColor Green

# 1. 检查 Node.js
Write-Host "`n[1/5] 检查 Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ 未安装 Node.js，请先安装" -ForegroundColor Red
    exit 1
}

# 2. 检查 Rust
Write-Host "`n[2/5] 检查 Rust..." -ForegroundColor Cyan
$rustVersion = rustc --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Rust 版本: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "❌ 未安装 Rust，请先安装" -ForegroundColor Red
    Write-Host "   安装指南: https://www.rust-lang.org/tools/install" -ForegroundColor Yellow
    exit 1
}

# 3. 创建项目目录
Write-Host "`n[3/5] 创建项目..." -ForegroundColor Cyan
$projectName = Read-Host "请输入项目名称 (默认: wps-batch-processor)"
if ([string]::IsNullOrWhiteSpace($projectName)) {
    $projectName = "wps-batch-processor"
}

if (Test-Path $projectName) {
    Write-Host "❌ 目录 $projectName 已存在" -ForegroundColor Red
    exit 1
}

# 4. 使用 create-tauri-app 创建项目
Write-Host "`n[4/5] 使用 create-tauri-app 创建项目..." -ForegroundColor Cyan

$template = "vanilla"
$frontend = Read-Host "选择前端框架: 1) Vue 2) React 3) Vanilla (默认: 1)"
switch ($frontend) {
    "2" { $template = "react" }
    "3" { $template = "vanilla" }
    default { $template = "vue" }
}

Write-Host "正在创建项目，使用 $template 模板..." -ForegroundColor Yellow

npm create tauri-app@latest $projectName -- --template $template

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 项目创建失败" -ForegroundColor Red
    exit 1
}

Set-Location $projectName

# 5. 安装依赖
Write-Host "`n[5/5] 安装依赖..." -ForegroundColor Cyan

# 安装前端依赖
npm install

# 安装 UI 库和工具
npm install naive-ui @unocss/preset-uno pinia vue-router
npm install -D @unocss/vite

# 安装 Tauri 插件
# (根据需要使用)

Write-Host "`n✅ 项目初始化完成！" -ForegroundColor Green
Write-Host "`n下一步:" -ForegroundColor Cyan
Write-Host "  cd $projectName" -ForegroundColor Yellow
Write-Host "  npm run tauri dev" -ForegroundColor Yellow

Write-Host "`n项目结构:" -ForegroundColor Cyan
Write-Host "  $projectName/" -ForegroundColor Gray
Write-Host "  ├── src/           # Vue 前端代码" -ForegroundColor Gray
Write-Host "  ├── src-tauri/     # Rust 后端代码" -ForegroundColor Gray
Write-Host "  └── ..." -ForegroundColor Gray
```

---

## 8. WPS OLE 测试脚本

```powershell
# scripts/test_wps_ole.ps1
# WPS OLE 自动化测试脚本

Write-Host "=== WPS OLE 自动化测试 ===" -ForegroundColor Green

try {
    Write-Host "`nStep 1: Starting WPS..." -ForegroundColor Cyan
    $wps = New-Object -ComObject "Kwps.Application"
    $wps.Visible = $true
    
    Write-Host "Step 2: Waiting for WPS init..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    
    Write-Host "Step 3: Check version..." -ForegroundColor Cyan
    $version = $wps.Version
    Write-Host "  WPS Version: $version" -ForegroundColor Gray
    
    Write-Host "Step 4: Create new doc..." -ForegroundColor Cyan
    $doc = $wps.Documents.Add()
    
    if ($doc -eq $null) {
        Write-Host "  ERROR: Create doc failed, return null" -ForegroundColor Red
    } else {
        Write-Host "  SUCCESS: Doc created" -ForegroundColor Green
        
        Write-Host "Step 5: Write content..." -ForegroundColor Cyan
        $doc.Content.Text = "OLE automation test success`n`nThis is a test document created by WPS OLE automation."
        Write-Host "  SUCCESS: Content written" -ForegroundColor Green
        
        Write-Host "Step 6: Write header..." -ForegroundColor Cyan
        $section = $doc.Sections.Item(1)
        $header = $section.Headers.Item(1)
        $header.Range.Text = "Contract No: TEST-2024-001"
        Write-Host "  SUCCESS: Header written" -ForegroundColor Green
        
        Write-Host "Step 7: Add comment..." -ForegroundColor Cyan
        $range = $doc.Range(0, 20)
        $doc.Comments.Add($range, "This is a test comment")
        Write-Host "  SUCCESS: Comment added" -ForegroundColor Green
        
        Write-Host "Step 8: Save doc..." -ForegroundColor Cyan
        $tempPath = [System.IO.Path]::GetTempPath() + "wps_ole_test.docx"
        $doc.SaveAs2($tempPath)
        Write-Host "  SUCCESS: Doc saved to: $tempPath" -ForegroundColor Green
        
        Start-Sleep -Seconds 2
        
        $doc.Close()
        Write-Host "  SUCCESS: Doc closed" -ForegroundColor Green
    }
    
    $wps.Quit()
    Write-Host "  SUCCESS: WPS quit" -ForegroundColor Green
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  TEST PASSED!" -ForegroundColor Green
    Write-Host "  WPS OLE is AVAILABLE!" -ForegroundColor Green
    Write-Host "  Can develop batch processing tool" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  TEST FAILED!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

---

## 9. 开发计划

### Phase 1: 基础框架 (Week 1)
- [ ] 初始化 Tauri + Vue3 项目
- [ ] 配置 UnoCSS + Naive UI
- [ ] 实现文件扫描功能 (Rust)
- [ ] 实现 WPS OLE 基础封装 (Rust)

### Phase 2: 核心功能 (Week 2)
- [ ] 实现任务调度器
- [ ] 实现批量处理流程
- [ ] 开发前端 Dashboard 页面
- [ ] 开发 Processing 页面

### Phase 3: 集成优化 (Week 3)
- [ ] 集成现有 AI 审查逻辑
- [ ] 实现页眉写入和批注添加
- [ ] 添加处理报告生成功能
- [ ] 错误处理和日志系统

### Phase 4: 测试发布 (Week 4)
- [ ] 全面测试各种合同文件
- [ ] 性能优化
- [ ] 打包发布

---

## 10. 注意事项

1. **WPS 版本要求**：个人版 11.1.0.9566 或更高版本支持 OLE
2. **Windows 环境**：OLE/COM 仅支持 Windows 平台
3. **进程管理**：确保正确处理 WPS 进程，避免残留
4. **错误处理**：WPS 可能因文档损坏、权限问题等导致操作失败
5. **性能考虑**：大批量处理时建议添加适当的延迟，避免系统过载

---

## 附录：相关文档

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 官方文档](https://vuejs.org/)
- [WPS 二次开发文档](https://open.wps.cn/docs/office)
- [Windows COM/OLE 编程](https://docs.microsoft.com/en-us/windows/win32/com/component-object-model--com--portal)
