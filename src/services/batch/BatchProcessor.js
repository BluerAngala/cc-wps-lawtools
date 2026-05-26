/**
 * 批量处理器 - 支持多文档批量执行工作流
 */

import { actionRegistry } from '../workflow/actionRegistry.js'

/**
 * 批量任务状态
 */
export const BatchTaskStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  SKIPPED: 'skipped'
}

/**
 * 批量处理器类
 */
export class BatchProcessor {
  constructor() {
    this.isRunning = false
    this.shouldStop = false
    this.currentIndex = 0
    this.tasks = []
    this.results = []
    this.onProgress = null
    this.onTaskComplete = null
    this.onComplete = null
    this.delayBetweenTasks = 2000 // 任务间延迟（毫秒）
    this.delayAfterKdocs = 3000 // 金山文档提交后额外延迟
  }

  /**
   * 扫描文件夹获取文件列表
   * @param {string} folderPath - 文件夹路径
   * @param {Object} options - 选项
   * @param {string[]} options.extensions - 文件扩展名过滤（如 ['.docx', '.doc']）
   * @param {boolean} options.recursive - 是否递归子文件夹
   * @returns {Promise<string[]>} 文件路径列表
   */
  async scanFolder(folderPath, options = {}) {
    const { extensions = ['.docx', '.doc', '.wps'], recursive = true } = options

    try {
      // 使用 WPS 的文件对话框选择文件夹
      const app = window.Application
      if (!app) {
        throw new Error('无法获取 WPS 应用程序实例')
      }

      // 打开文件夹选择对话框
      const selectedPath = folderPath || this.selectFolderDialog()
      if (!selectedPath) {
        return []
      }

      // 使用 Node.js fs 模块扫描文件夹
      const files = await this.scanDirectory(selectedPath, extensions, recursive)
      return files
    } catch (error) {
      console.error('扫描文件夹失败:', error)
      throw error
    }
  }

  /**
   * 选择文件夹对话框
   * @returns {string|null} 选择的文件夹路径
   */
  selectFolderDialog() {
    try {
      // 使用 WPS 的对话框或 Windows Shell
      const shell = new window.ActiveXObject('Shell.Application')
      const folder = shell.BrowseForFolder(0, '请选择包含合同的文件夹', 0)
      return folder ? folder.Self.Path : null
    } catch (error) {
      console.warn('无法使用 Shell 对话框:', error)
      // 降级方案：使用 input 提示用户输入路径
      const path = window.prompt('请输入合同文件夹路径:')
      return path || null
    }
  }

  /**
   * 递归扫描目录
   * @param {string} dir - 目录路径
   * @param {string[]} extensions - 文件扩展名过滤
   * @param {boolean} recursive - 是否递归
   * @returns {Promise<string[]>} 文件列表
   */
  async scanDirectory(dir, extensions, recursive) {
    // 在 WPS 环境中，我们使用 WPS 的文档打开功能来验证文件
    // 这里返回模拟数据，实际实现需要根据环境调整
    const files = []

    try {
      // 尝试使用 FileSystemObject
      const fso = new window.ActiveXObject('Scripting.FileSystemObject')
      const folder = fso.GetFolder(dir)

      // 遍历文件
      for (const file of folder.Files) {
        const ext = '.' + file.Name.split('.').pop().toLowerCase()
        if (extensions.includes(ext)) {
          files.push(file.Path)
        }
      }

      // 递归子文件夹
      if (recursive) {
        for (const subfolder of folder.SubFolders) {
          const subFiles = await this.scanDirectory(subfolder.Path, extensions, recursive)
          files.push(...subFiles)
        }
      }
    } catch (error) {
      console.warn('扫描目录失败:', error)
      // 降级：返回空数组，让调用方处理
    }

    return files
  }

  /**
   * 创建批量任务列表
   * @param {string[]} filePaths - 文件路径列表
   * @param {Object} workflowConfig - 工作流配置
   * @returns {Object[]} 任务列表
   */
  createTasks(filePaths, workflowConfig) {
    return filePaths.map((filePath, index) => ({
      id: `task_${index}_${Date.now()}`,
      index,
      filePath,
      fileName: filePath.split('\\').pop(),
      status: BatchTaskStatus.PENDING,
      workflowConfig,
      result: null,
      error: null,
      startTime: null,
      endTime: null
    }))
  }

  /**
   * 执行批量处理
   * @param {Object[]} tasks - 任务列表
   * @param {Object} options - 执行选项
   * @returns {Promise<Object>} 执行结果
   */
  async execute(tasks, options = {}) {
    if (this.isRunning) {
      throw new Error('已有批量任务正在执行')
    }

    this.isRunning = true
    this.shouldStop = false
    this.tasks = tasks
    this.results = []
    this.currentIndex = 0

    const {
      onProgress,
      onTaskComplete,
      onComplete,
      delayBetweenTasks = 2000,
      delayAfterKdocs = 3000
    } = options

    this.onProgress = onProgress
    this.onTaskComplete = onTaskComplete
    this.onComplete = onComplete
    this.delayBetweenTasks = delayBetweenTasks
    this.delayAfterKdocs = delayAfterKdocs

    const startTime = Date.now()

    try {
      for (let i = 0; i < tasks.length; i++) {
        if (this.shouldStop) {
          break
        }

        this.currentIndex = i
        const task = tasks[i]

        // 报告进度
        this.reportProgress({
          current: i + 1,
          total: tasks.length,
          stage: 'start',
          task
        })

        // 执行任务
        const result = await this.executeTask(task)
        this.results.push(result)

        // 报告任务完成
        if (this.onTaskComplete) {
          this.onTaskComplete(result)
        }

        // 任务间延迟（除了最后一个任务）
        if (i < tasks.length - 1 && !this.shouldStop) {
          await this.sleep(this.delayBetweenTasks)
        }
      }

      const endTime = Date.now()
      const summary = {
        success: !this.shouldStop,
        total: tasks.length,
        completed: this.results.filter((r) => r.status === BatchTaskStatus.SUCCESS).length,
        failed: this.results.filter((r) => r.status === BatchTaskStatus.FAILED).length,
        skipped: this.results.filter((r) => r.status === BatchTaskStatus.SKIPPED).length,
        duration: endTime - startTime,
        results: this.results
      }

      if (this.onComplete) {
        this.onComplete(summary)
      }

      return summary
    } finally {
      this.isRunning = false
    }
  }

  /**
   * 执行单个任务
   * @param {Object} task - 任务对象
   * @returns {Promise<Object>} 任务结果
   */
  async executeTask(task) {
    task.status = BatchTaskStatus.PROCESSING
    task.startTime = Date.now()

    let doc = null
    let isDocOpened = false

    try {
      const { workflowConfig, filePath } = task

      // 1. 打开文档
      this.reportProgress({
        current: this.currentIndex + 1,
        total: this.tasks.length,
        stage: 'opening',
        message: `正在打开: ${task.fileName}`,
        task
      })

      doc = await this.openDocument(filePath)
      isDocOpened = true

      // 2. 构建工作流上下文
      const context = {
        documentText: '',
        data: {},
        previousResult: null,
        batchMode: true,
        filePath,
        fileName: task.fileName
      }

      // 3. 按步骤执行工作流
      const steps = workflowConfig.steps || []
      const stepResults = []
      let hasKdocsStep = false

      for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
        if (this.shouldStop) {
          break
        }

        const step = steps[stepIndex]
        const action = actionRegistry.get(step.actionType)

        if (!action) {
          throw new Error(`未知的操作类型: ${step.actionType}`)
        }

        this.reportProgress({
          current: this.currentIndex + 1,
          total: this.tasks.length,
          stage: 'executing',
          stepIndex,
          stepName: step.name || action.name,
          message: `执行: ${step.name || action.name}`,
          task
        })

        // 执行操作
        let result
        try {
          // 如果是读取文档操作，先获取文本
          if (step.actionType === 'readDocument' || step.actionType === 'extractContract') {
            const app = window.Application
            if (app && app.ActiveDocument) {
              context.documentText = app.ActiveDocument.Content.Text
            }
          }

          result = await action.execute(step.params || {}, context)

          // 检查是否是金山文档提交步骤
          if (step.actionType === 'submitKdocs' || step.actionType === 'submitToKdocs') {
            hasKdocsStep = true
          }
        } catch (error) {
          result = {
            success: false,
            message: error.message || '执行出错'
          }
        }

        stepResults.push({
          step,
          result,
          stepIndex
        })

        // 更新上下文
        context.previousResult = result
        if (result.data) {
          Object.assign(context.data, result.data)
        }

        // 如果步骤失败，中断执行
        if (!result.success) {
          throw new Error(`步骤 "${step.name || action.name}" 失败: ${result.message}`)
        }

        // 金山文档提交后的额外延迟
        if (hasKdocsStep && stepIndex < steps.length - 1) {
          await this.sleep(this.delayAfterKdocs)
        }
      }

      // 4. 保存文档
      this.reportProgress({
        current: this.currentIndex + 1,
        total: this.tasks.length,
        stage: 'saving',
        message: `正在保存: ${task.fileName}`,
        task
      })

      await this.saveDocument(doc)

      // 5. 完成任务
      task.status = BatchTaskStatus.SUCCESS
      task.endTime = Date.now()
      task.result = {
        steps: stepResults,
        data: context.data
      }

      return task
    } catch (error) {
      task.status = BatchTaskStatus.FAILED
      task.endTime = Date.now()
      task.error = error.message || '未知错误'

      return task
    } finally {
      // 关闭文档
      if (isDocOpened && doc) {
        try {
          await this.closeDocument(doc)
        } catch (e) {
          console.warn('关闭文档失败:', e)
        }
      }
    }
  }

  /**
   * 打开文档
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文档对象
   */
  async openDocument(filePath) {
    const app = window.Application
    if (!app) {
      throw new Error('无法获取 WPS 应用程序实例')
    }

    return new Promise((resolve, reject) => {
      try {
        // 使用 WPS API 打开文档
        const doc = app.Documents.Open(filePath)
        if (!doc) {
          reject(new Error('打开文档失败'))
          return
        }
        resolve(doc)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 保存文档
   * @param {Object} doc - 文档对象
   * @returns {Promise<void>}
   */
  async saveDocument(doc) {
    if (!doc) return

    return new Promise((resolve, reject) => {
      try {
        doc.Save()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 关闭文档
   * @param {Object} doc - 文档对象
   * @returns {Promise<void>}
   */
  async closeDocument(doc) {
    if (!doc) return

    return new Promise((resolve) => {
      try {
        doc.Close()
      } catch (e) {
        // 忽略关闭错误
      }
      resolve()
    })
  }

  /**
   * 报告进度
   * @param {Object} progress - 进度信息
   */
  reportProgress(progress) {
    if (this.onProgress) {
      this.onProgress(progress)
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 停止批量处理
   */
  stop() {
    this.shouldStop = true
  }

  /**
   * 获取执行状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentIndex: this.currentIndex,
      total: this.tasks.length,
      progress: this.tasks.length > 0 ? (this.currentIndex / this.tasks.length) * 100 : 0
    }
  }
}

// 创建默认实例
export const batchProcessor = new BatchProcessor()
